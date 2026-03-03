import Layout from "@/components/Layout";
import TranscriptPanel from "@/components/TranscriptPanel";
import CommentPanel from "@/components/CommentPanel";
import VotePanel from "@/components/VotePanel";
import CaptionSummary from "@/components/CaptionSummary";
import { Radio, Users, Clock, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const MOCK_TRANSCRIPT_TEXT = `Good morning. We're convening today to discuss the proposed Clean Air Amendment Act. Our research shows a 23% reduction in particulate matter is achievable within 5 years. The health benefits alone would save an estimated $4.2 billion annually. What about the economic impact on small manufacturers? We recommend a phased implementation with tax incentives for small businesses. While we support cleaner air goals, the timeline is unrealistic. Our members need at minimum 8 years.`;

export default function HearingPage() {
  const [hearing, setHearing] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<Array<{ id: string; title: string; timestamp: number }>>("app:recently-viewed-hearings", []);

  useEffect(() => {
    supabase
      .from("hearings")
      .select("*")
      .eq("status", "live" as any)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setHearing(d);
          setRecentlyViewed(prev => {
            const filtered = prev.filter(h => h.id !== d.id);
            return [{ id: d.id, title: d.title, timestamp: Date.now() }, ...filtered].slice(0, 10);
          });
        }
      });
  }, []);

  const hearingId = hearing?.id || "";

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              LIVE NOW
            </span>
            <span className="text-sm text-muted-foreground">{hearing?.committee || "Environment & Public Works Committee"}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {hearing?.title || "Clean Air Amendment Act - Environmental Impact Review"}
          </h1>
          <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {hearing?.viewers?.toLocaleString() || "12,847"} watching
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Started 1h 45m ago
            </span>
            <button className="flex items-center gap-1.5 text-accent hover:underline">
              <Download className="h-4 w-4" />
              Download Transcript
            </button>
          </div>
        </div>

        {/* Video + panels */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video */}
            <div className="aspect-video overflow-hidden rounded-xl bg-primary">
              {hearing?.stream_url ? (
                <iframe
                  src={hearing.stream_url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Live Stream"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <Radio className="mx-auto mb-3 h-12 w-12 animate-pulse-slow opacity-60" />
                    <p className="text-lg font-semibold">Live Stream</p>
                    <p className="text-sm opacity-70">Hearing in progress - stream placeholder</p>
                  </div>
                </div>
              )}
            </div>

            {/* Caption Summary */}
            <CaptionSummary transcriptText={MOCK_TRANSCRIPT_TEXT} />

            {/* Vote */}
            {hearingId && <VotePanel hearingId={hearingId} />}

            {/* Transcript - Boxed with internal scroll */}
            <div className="h-[400px] lg:h-[600px] overflow-hidden rounded-xl border border-border">
              <TranscriptPanel />
            </div>
          </div>

          {/* Sidebar - Comments */}
          <div className="lg:col-span-1">
            {hearingId ? (
              <div className="h-[500px] lg:h-[calc(100vh-250px)] lg:sticky lg:top-24">
                <CommentPanel hearingId={hearingId} />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Loading comments...
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
