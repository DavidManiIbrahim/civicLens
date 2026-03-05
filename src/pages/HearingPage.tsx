import Layout from "@/components/Layout";
import TranscriptPanel from "@/components/TranscriptPanel";
import CommentPanel from "@/components/CommentPanel";
import VotePanel from "@/components/VotePanel";
import CaptionSummary from "@/components/CaptionSummary";
import { Radio, Users, Clock, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useViewerCount } from "@/hooks/useViewerCount";


export default function HearingPage() {
  const { id } = useParams();
  const [hearing, setHearing] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<Array<{ id: string; title: string; timestamp: number }>>("app:recently-viewed-hearings", []);

  useEffect(() => {
    const query = supabase.from("hearings").select("*");

    if (id) {
      query.eq("id", id as any);
    } else {
      query.eq("status", "live" as any).limit(1);
    }

    query.single().then(({ data }) => {
      if (data) {
        const d = data as any;
        setHearing(d);
        setRecentlyViewed(prev => {
          const filtered = prev.filter(h => h.id !== d.id);
          return [{ id: d.id, title: d.title, timestamp: Date.now() }, ...filtered].slice(0, 10);
        });
      }
    });
  }, [id]);

  const hearingId = id || hearing?.id || "";
  const liveViewers = useViewerCount(hearingId || undefined);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // First, normalize m.youtube.com to youtube.com
    let normalizedUrl = url.replace("m.youtube.com", "youtube.com");

    // Standard ID extraction for various youtube formats (watch, embed, live, shorts, etc)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/|shorts\/)([^#\&\?]*).*/;
    const match = normalizedUrl.match(regExp);

    if (match && match[2].trim().length === 11) {
      return `https://www.youtube.com/embed/${match[2].trim()}`;
    }

    // Fallback for cases where it's already an embed link but might have extra params
    if (normalizedUrl.includes("youtube.com/embed/")) {
      return normalizedUrl;
    }

    return normalizedUrl;
  };

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
            {hearing?.title || "Hearing in Progress"}
          </h1>
          <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {liveViewers > 0 ? liveViewers.toLocaleString() : (hearing?.viewers?.toLocaleString() || "0")} watching
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Started recently
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
                  src={getEmbedUrl(hearing.stream_url)}
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
            <CaptionSummary transcriptText={hearing?.transcript || ""} />

            {/* Vote */}
            {hearingId && <VotePanel hearingId={hearingId} />}

            {/* Transcript - Boxed with internal scroll */}
            <div className="h-[400px] lg:h-[600px] overflow-hidden rounded-xl border border-border">
              <TranscriptPanel hearingId={hearingId} />
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
