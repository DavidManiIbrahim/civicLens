import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchTranscript } from "https://esm.sh/youtube-transcript-plus@1.0.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractVideoId(url: string): string | null {
  const normalized = url.replace("m.youtube.com", "youtube.com");
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
  const match = normalized.match(regExp);
  if (match && match[2].trim().length === 11) return match[2].trim();
  return null;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Strategy 1: Free third-party transcript API
async function fetchViaTranscriptApi(videoId: string): Promise<Array<{ start: number; text: string }> | null> {
  try {
    const resp = await fetch(`https://youtube-transcript-api-tau-one.vercel.app/api/transcript?video_id=${videoId}&lang=en`);
    if (!resp.ok) { await resp.text(); return null; }
    const data = await resp.json();
    if (data?.transcript && Array.isArray(data.transcript) && data.transcript.length > 0) {
      return data.transcript.map((item: any) => ({
        start: item.start || item.offset / 1000 || 0,
        text: (item.text || "").trim(),
      })).filter((c: any) => c.text);
    }
    return null;
  } catch (e) {
    console.error("Transcript API error:", e);
    return null;
  }
}

// Strategy 2: InnerTube API with WEB_EMBEDDED_PLAYER client
async function fetchViaInnerTube(videoId: string): Promise<Array<{ start: number; text: string }> | null> {
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "WEB_EMBEDDED_PLAYER",
            clientVersion: "1.20240101.00.00",
            hl: "en",
          },
        },
      }),
    });
    if (!resp.ok) { await resp.text(); return null; }
    const data = await resp.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) return null;

    const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
    if (!track?.baseUrl) return null;

    const captionResp = await fetch(track.baseUrl + "&fmt=srv3");
    if (!captionResp.ok) { await captionResp.text(); return null; }
    const xml = await captionResp.text();
    if (!xml.includes("<text")) return null;

    const captionRegex = /<text[^>]*?start="([\d.]+)"[^>]*?>([\s\S]*?)<\/text>/g;
    const captions: Array<{ start: number; text: string }> = [];
    let m;
    while ((m = captionRegex.exec(xml)) !== null) {
      const text = m[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
      if (text) captions.push({ start: parseFloat(m[1]), text });
    }
    return captions.length > 0 ? captions : null;
  } catch (e) {
    console.error("InnerTube error:", e);
    return null;
  }
}

// Strategy 3: Direct timedtext API
async function fetchViaTimedText(videoId: string): Promise<Array<{ start: number; text: string }> | null> {
  for (const kind of ["", "asr"]) {
    try {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en${kind ? `&kind=${kind}` : ""}&fmt=srv3`;
      const resp = await fetch(url);
      if (!resp.ok) { await resp.text(); continue; }
      const xml = await resp.text();
      if (!xml.includes("<text")) continue;

      const captionRegex = /<text[^>]*?start="([\d.]+)"[^>]*?>([\s\S]*?)<\/text>/g;
      const captions: Array<{ start: number; text: string }> = [];
      let m;
      while ((m = captionRegex.exec(xml)) !== null) {
        const text = m[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
        if (text) captions.push({ start: parseFloat(m[1]), text });
      }
      if (captions.length > 0) return captions;
    } catch { /* next */ }
  }
  return null;
}

async function fetchCaptions(videoId: string): Promise<Array<{ start: number; text: string }>> {
  console.log(`Fetching captions for video: ${videoId}`);

  console.log("Strategy 1: Third-party transcript API...");
  let captions = await fetchViaTranscriptApi(videoId);
  if (captions?.length) { console.log(`Strategy 1 succeeded: ${captions.length} segments`); return captions; }

  console.log("Strategy 2: InnerTube API...");
  captions = await fetchViaInnerTube(videoId);
  if (captions?.length) { console.log(`Strategy 2 succeeded: ${captions.length} segments`); return captions; }

  console.log("Strategy 3: Timedtext API...");
  captions = await fetchViaTimedText(videoId);
  if (captions?.length) { console.log(`Strategy 3 succeeded: ${captions.length} segments`); return captions; }

  throw new Error("No captions found. The video may not have captions enabled, or all caption sources are unavailable. Try again later.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { hearingId, streamUrl } = await req.json();
    if (!hearingId || !streamUrl) throw new Error("hearingId and streamUrl are required");

    const videoId = extractVideoId(streamUrl);
    if (!videoId) throw new Error("Could not extract YouTube video ID from URL");

    const rawCaptions = await fetchCaptions(videoId);

    // Group into ~30s segments
    const segments: Array<{ start: number; text: string }> = [];
    let currentSegment = { start: rawCaptions[0].start, texts: [rawCaptions[0].text] };
    for (let i = 1; i < rawCaptions.length; i++) {
      const caption = rawCaptions[i];
      if (caption.start - currentSegment.start > 30) {
        segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });
        currentSegment = { start: caption.start, texts: [caption.text] };
      } else {
        currentSegment.texts.push(caption.text);
      }
    }
    segments.push({ start: currentSegment.start, text: currentSegment.texts.join(" ") });

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
