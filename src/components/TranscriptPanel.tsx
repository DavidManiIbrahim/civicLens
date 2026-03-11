import { ThumbsUp, Clock, User, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranscripts } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TranscriptEntry {
  id: string;
  speaker: string;
  role: string | null;
  timestamp: string;
  text: string;
  sentiment: string | null;
}

const sentimentColors: Record<string, string> = {
  positive: "border-l-success",
  neutral: "border-l-info",
  negative: "border-l-destructive",
};

interface TranscriptPanelProps {
  hearingId?: string;
  streamUrl?: string;
}

function extractVideoId(url: string): string | null {
  const normalized = url.replace("m.youtube.com", "youtube.com");
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
  const match = normalized.match(regExp);
  if (match && match[2].trim().length === 11) return match[2].trim();
  return null;
}

async function fetchCaptionsClientSide(videoId: string): Promise<Array<{ start: number; text: string }>> {
  // Fetch the YouTube watch page from the browser (no CAPTCHA for real users)
  const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  if (!resp.ok) throw new Error("Failed to load YouTube page");
  const html = await resp.text();

  // Extract ytInitialPlayerResponse
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script)/s);
  if (!match) throw new Error("Could not find player data on page");

  const playerData = JSON.parse(match[1]);
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) throw new Error("No captions available for this video");

  const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
  if (!track?.baseUrl) throw new Error("No caption track URL found");

  const captionResp = await fetch(track.baseUrl + "&fmt=srv3");
  if (!captionResp.ok) throw new Error("Failed to fetch captions");
  const xml = await captionResp.text();

  const captionRegex = /<text[^>]*?start="([\d.]+)"[^>]*?>([\s\S]*?)<\/text>/g;
  const captions: Array<{ start: number; text: string }> = [];
  let m;
  while ((m = captionRegex.exec(xml)) !== null) {
    const text = m[2]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
    if (text) captions.push({ start: parseFloat(m[1]), text });
  }

  if (captions.length === 0) throw new Error("No caption text found in track");
  return captions;
}

export default function TranscriptPanel({ hearingId, streamUrl }: TranscriptPanelProps) {
  const { data: initialTranscripts = [] } = useTranscripts(hearingId);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialTranscripts.length > 0) {
      setEntries(initialTranscripts as any);
    }
  }, [initialTranscripts]);

  useEffect(() => {
    if (!hearingId) return;

    const channel = supabase
      .channel("transcript-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transcript_entries",
          filter: `hearing_id=eq.${hearingId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as TranscriptEntry]);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [hearingId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleGenerateTranscript = async () => {
    if (!hearingId || !streamUrl) return;
    setGenerating(true);
    setStatusMsg("Extracting captions from YouTube...");

    try {
      const videoId = extractVideoId(streamUrl);
      if (!videoId) throw new Error("Invalid YouTube URL");

      // Step 1: Extract captions client-side (browser isn't blocked by YouTube)
      const captions = await fetchCaptionsClientSide(videoId);
      setStatusMsg(`Got ${captions.length} captions. Processing with AI...`);

      // Step 2: Send captions to edge function for AI processing & storage
      const { data, error } = await supabase.functions.invoke("extract-transcript", {
        body: { hearingId, captions },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Transcript Generated",
        description: `${data.count} entries extracted${data.aiProcessed ? " with AI speaker detection" : ""}.`,
      });

      // Refetch
      const { data: fresh } = await supabase
        .from("transcript_entries")
        .select("*")
        .eq("hearing_id", hearingId as any)
        .order("created_at", { ascending: true });
      if (fresh) setEntries(fresh as any);
    } catch (e: any) {
      console.error("Generate transcript error:", e);
      toast({
        title: "Error",
        description: e.message || "Failed to generate transcript",
        variant: "destructive",
      });
    }
    setGenerating(false);
    setStatusMsg("");
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-lg font-bold text-foreground">Live Transcript</h3>
        <div className="flex items-center gap-2">
          {streamUrl && entries.length === 0 && (
            <Button size="sm" variant="outline" onClick={handleGenerateTranscript} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              {generating ? "Extracting..." : "AI Transcript"}
            </Button>
          )}
          {entries.length > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              {entries.length} entries
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-20 px-4">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {generating ? (
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground animate-pulse" />
              )}
            </div>
            {generating ? (
              <>
                <p className="text-sm font-medium text-foreground">{statusMsg || "Processing..."}</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-60">AI is processing captions and identifying speakers. This may take a moment.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">No transcript entries yet.</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-60">
                  {streamUrl
                    ? 'Click "AI Transcript" above to extract captions from the YouTube video.'
                    : "The AI transcription engine will start processing once the audio feed becomes active."}
                </p>
              </>
            )}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 ${sentimentColors[entry.sentiment || "neutral"] || sentimentColors.neutral}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">{entry.speaker}</span>
                    {entry.role && <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{entry.role}</span>}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {entry.timestamp}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{entry.text}</p>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && streamUrl && (
        <div className="border-t border-border px-4 py-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleGenerateTranscript} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
