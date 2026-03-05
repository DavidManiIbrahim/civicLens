import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks real-time viewer count for a hearing using Supabase Realtime Presence.
 * Each user joins the presence channel when viewing, and leaves when navigating away.
 */
export function useViewerCount(hearingId: string | undefined) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!hearingId) return;

    const channel = supabase.channel(`viewers:${hearingId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [hearingId]);

  return viewerCount;
}
