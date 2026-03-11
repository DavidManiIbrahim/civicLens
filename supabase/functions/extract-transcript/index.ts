import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { hearingId, captions } = await req.json();
    if (!hearingId) throw new Error("hearingId is required");
    if (!captions || !Array.isArray(captions) || captions.length === 0) {
      throw new Error("captions array is required (extracted client-side)");
    }

    // Group into ~30s segments
    const segments: Array<{ start: number; text: string }> = [];
    let currentSegment = { start: captions[0].start || 0, texts: [captions[0].text] };
    for (let i = 1; i < captions.length; i++) {
      const caption = captions[i];
      const captionStart = caption.start || 0;
      if (captionStart - currentSegment.start > 30) {
        segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });
        currentSegment = { start: captionStart, texts: [caption.text] };
      } else {
        currentSegment.texts.push(caption.text);
      }
    }
    segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });

    console.log(`Processing ${captions.length} captions into ${segments.length} segments`);

    // AI processing
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rawTranscript = segments.map(s => `[${formatTimestamp(s.start)}] ${s.text}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a transcript processor for legislative hearings. Given raw YouTube captions, produce structured transcript entries.
For each segment, identify the speaker if possible (from context clues like "Chairman", "Senator", "Witness", etc). If you can't identify the speaker, use "Speaker".
Also classify each segment's sentiment as: positive, neutral, or negative.`,
          },
          { role: "user", content: `Process these raw captions into structured transcript entries:\n\n${rawTranscript}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_transcript",
            description: "Save processed transcript entries",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      timestamp: { type: "string" },
                      speaker: { type: "string" },
                      role: { type: "string" },
                      text: { type: "string" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    },
                    required: ["timestamp", "speaker", "text", "sentiment"],
                  },
                },
              },
              required: ["entries"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_transcript" } },
      }),
    });

    // Setup DB
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let entries: any[] = [];
    let aiProcessed = false;

    if (aiResp.ok) {
      try {
        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          entries = parsed.entries || [];
          aiProcessed = true;
        }
      } catch { /* fallback */ }
    } else {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
    }

    if (entries.length === 0) {
      entries = segments.map(s => ({
        timestamp: formatTimestamp(s.start),
        speaker: "Speaker",
        role: null,
        text: s.text,
        sentiment: "neutral",
      }));
    }

    // Clear and insert
    await supabase.from("transcript_entries").delete().eq("hearing_id", hearingId);

    const dbEntries = entries.map((e: any) => ({
      hearing_id: hearingId,
      speaker: e.speaker || "Speaker",
      role: e.role || null,
      timestamp: e.timestamp,
      text: e.text,
      sentiment: e.sentiment || "neutral",
    }));

    const { error: insertErr } = await supabase.from("transcript_entries").insert(dbEntries);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, count: dbEntries.length, aiProcessed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
