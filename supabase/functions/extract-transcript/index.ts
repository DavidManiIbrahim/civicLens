import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

async function fetchCaptionXml(videoId: string): Promise<string> {
  // Fetch the YouTube page
  const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const pageHtml = await pageResp.text();

  // Try multiple patterns to find caption tracks
  let captionUrl: string | null = null;

  // Pattern 1: "captionTracks":[...]
  const p1 = pageHtml.match(/"captionTracks"\s*:\s*(\[.*?\])/s);
  if (p1) {
    try {
      const tracks = JSON.parse(p1[1]);
      const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
      if (track?.baseUrl) captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
    } catch { /* continue */ }
  }

  // Pattern 2: playerCaptionsTracklistRenderer
  if (!captionUrl) {
    const p2 = pageHtml.match(/"playerCaptionsTracklistRenderer"\s*:\s*\{.*?"captionTracks"\s*:\s*(\[.*?\])/s);
    if (p2) {
      try {
        const tracks = JSON.parse(p2[1]);
        const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
        if (track?.baseUrl) captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
      } catch { /* continue */ }
    }
  }

  // Pattern 3: Extract baseUrl directly from the page
  if (!captionUrl) {
    const p3 = pageHtml.match(/"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
    if (p3) {
      captionUrl = p3[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
    }
  }

  // Pattern 4: Try the timedtext API directly (works for many videos)
  if (!captionUrl) {
    const directUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
    const testResp = await fetch(directUrl);
    if (testResp.ok) {
      const testXml = await testResp.text();
      if (testXml.includes("<text")) return testXml;
    }
    // Try auto-generated captions
    const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`;
    const autoResp = await fetch(autoUrl);
    if (autoResp.ok) {
      const autoXml = await autoResp.text();
      if (autoXml.includes("<text")) return autoXml;
    }
  }

  if (!captionUrl) {
    throw new Error("No captions found for this video. The video may not have captions enabled, or they may be restricted.");
  }

  const captionResp = await fetch(captionUrl);
  return await captionResp.text();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { hearingId, streamUrl } = await req.json();
    if (!hearingId || !streamUrl) throw new Error("hearingId and streamUrl are required");

    const videoId = extractVideoId(streamUrl);
    if (!videoId) throw new Error("Could not extract YouTube video ID from URL");

    // Step 1: Fetch captions XML
    const captionXml = await fetchCaptionXml(videoId);

    // Parse XML captions (handles both srv1 and srv3 formats)
    const captionRegex = /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    const rawCaptions: Array<{ start: number; dur: number; text: string }> = [];
    let match;
    while ((match = captionRegex.exec(captionXml)) !== null) {
      const text = match[3]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) {
        rawCaptions.push({ start: parseFloat(match[1]), dur: parseFloat(match[2]), text });
      }
    }

    // Also try alternate attribute order
    if (rawCaptions.length === 0) {
      const altRegex = /<text[^>]*?start="([\d.]+)"[^>]*?>([\s\S]*?)<\/text>/g;
      while ((match = altRegex.exec(captionXml)) !== null) {
        const text = match[2]
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
        if (text) {
          rawCaptions.push({ start: parseFloat(match[1]), dur: 3, text });
        }
      }
    }

    if (rawCaptions.length === 0) throw new Error("No caption text found in the track");

    // Step 2: Group captions into ~30-second segments
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

    // Step 3: Use AI to identify speakers
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
Also classify each segment's sentiment as: positive, neutral, or negative.
Return the result as a JSON array.`,
          },
          {
            role: "user",
            content: `Process these raw captions into structured transcript entries:\n\n${rawTranscript}`,
          },
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
                      timestamp: { type: "string", description: "Timestamp like 0:00 or 1:23:45" },
                      speaker: { type: "string", description: "Speaker name or role" },
                      role: { type: "string", description: "Speaker's role (e.g. Chairman, Senator, Witness, General)" },
                      text: { type: "string", description: "Clean transcript text" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    },
                    required: ["timestamp", "speaker", "text", "sentiment"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["entries"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_transcript" } },
      }),
    });

    // Setup Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let entries: any[] = [];
    let aiProcessed = false;

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          entries = parsed.entries || [];
          aiProcessed = true;
        } catch { /* fallback */ }
      }
    } else {
      console.error("AI error:", aiResp.status, await aiResp.text());
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

    // Clear existing transcripts then insert
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
