import { useState, useEffect } from "react";
import { ThumbsUp, MessageSquare, Send, User, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAppStats } from "@/hooks/useAppStats";

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  hearing_timestamp: string | null;
  upvotes: number | null;
  sentiment: string | null;
  profile?: { display_name: string | null };
}

interface CommentPanelProps {
  hearingId: string;
}

export default function CommentPanel({ hearingId }: CommentPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentCache, setCommentCache] = useLocalStorage<Record<string, Comment[]>>("app:comments-cache", {});
  const [comments, setComments] = useState<Comment[]>(commentCache[hearingId] || []);
  const [draftedComments, setDraftedComments] = useLocalStorage<Record<string, string>>("app:comment-drafts", {});
  const [newComment, setNewComment] = useState(draftedComments[hearingId] || "");
  const [sending, setSending] = useState(false);
  const [hasDraft, setHasDraft] = useState(!!draftedComments[hearingId]);
  const { recordComment } = useAppStats();

  useEffect(() => {
    setNewComment(draftedComments[hearingId] || "");
    setHasDraft(!!draftedComments[hearingId]);

    // Initial load from local cache if we have it
    if (commentCache[hearingId]) {
      setComments(commentCache[hearingId]);
    }

    fetchComments();

    const channel = supabase
      .channel(`comments-${hearingId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `hearing_id=eq.${hearingId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hearingId]);

  const fetchComments = async () => {
    // 1. Fetch comments first
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("hearing_id", hearingId as any)
      .order("created_at", { ascending: false });

    if (commentsData) {
      // 2. Batch fetch and map names to avoid complicated joins that can fail
      const uniqueUserIds = [...new Set((commentsData as any[]).map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", uniqueUserIds as any[]);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(p => { profileMap[p.user_id] = p.display_name; });

      const formatted = (commentsData as any[]).map(c => ({
        ...c,
        profile: { display_name: profileMap[c.user_id] || "Anonymous" }
      }));

      setComments(formatted);
      setCommentCache(prev => ({ ...prev, [hearingId]: formatted }));
    }
  };

  const handleSend = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to comment.", variant: "destructive" });
      return;
    }
    setSending(true);

    let sentiment = "neutral";
    try {
      const response = await supabase.functions.invoke("analyze-sentiment", {
        body: { text: newComment, type: "sentiment" },
      });

      const { data, error } = response;
      if (error) {
        console.error("Sentiment service error:", error);
      } else if (data?.sentiment) {
        sentiment = data.sentiment;
        console.log("AI Sentiment Result:", sentiment, data.confidence);
      }
    } catch (e) {
      console.error("Exception during sentiment analysis:", e);
    }

    // Optimistic Update
    const optimisticComment: Comment = {
      id: `temp-${Math.random().toString(36).substring(2, 9)}`,
      user_id: user.id || "",
      text: newComment,
      created_at: new Date().toISOString(),
      hearing_timestamp: null,
      upvotes: 0,
      sentiment,
      profile: { display_name: (user as any)?.user_metadata?.display_name || user.email?.split("@")[0] || "You" }
    };

    // Add to state immediately
    setComments(prev => [optimisticComment, ...prev]);

    if (!hearingId) {
      toast({ title: "Error", description: "Missing hearing context.", variant: "destructive" });
      setSending(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      hearing_id: hearingId,
      user_id: user.id,
      text: newComment,
      sentiment,
    } as any);

    if (error) {
      // Revert optimistic update on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      const updated = { ...draftedComments };
      delete updated[hearingId];
      setDraftedComments(updated);
      setHasDraft(false);
      recordComment();

      // Refetch immediately so the user sees their comment without waiting for realtime
      await fetchComments();

      toast({ title: "Comment posted", description: "Your comment has been shared." });
    }
    setSending(false);
  };

  const sentimentBadge: Record<string, string> = {
    positive: "bg-success/10 text-success",
    neutral: "bg-info/10 text-info",
    negative: "bg-destructive/10 text-destructive",
  };

  const [likedComments, setLikedComments] = useLocalStorage<string[]>("app:liked-comments", []);

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like comments.", variant: "destructive" });
      return;
    }

    const isLiked = likedComments.includes(commentId);
    if (isLiked) return; // For now, only allow one like per comment per device

    // Optimistic Update
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c
    ));
    setLikedComments(prev => [...prev, commentId]);

    const commentToUpdate = comments.find(c => c.id === commentId);
    const { error } = await supabase
      .from("comments")
      .update({ upvotes: (commentToUpdate?.upvotes || 0) + 1 } as any)
      .eq("id", commentId as any);

    if (error) {
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, upvotes: (c.upvotes || 0) - 1 } : c
      ));
      setLikedComments(prev => prev.filter(id => id !== commentId));
      toast({ title: "Error", description: "Could not like comment.", variant: "destructive" });
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-lg font-bold text-foreground">Public Comments</h3>
        <span className="text-xs text-muted-foreground">{comments.length} comments</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{c.profile?.display_name || "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
              {c.sentiment && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${sentimentBadge[c.sentiment] || sentimentBadge.neutral}`}>
                  {c.sentiment}
                </span>
              )}
            </div>
            <p className="mb-2 text-sm leading-relaxed text-foreground/90">{c.text}</p>
            <div className="flex items-center gap-4">
              {c.hearing_timestamp && (
                <span className="flex items-center gap-1 text-xs text-info">
                  <MessageSquare className="h-3 w-3" />
                  @{c.hearing_timestamp}
                </span>
              )}
              <button
                onClick={() => handleLike(c.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${likedComments.includes(c.id)
                  ? "text-accent font-bold"
                  : "text-muted-foreground hover:text-accent"
                  }`}
              >
                <ThumbsUp className={`h-3 w-3 ${likedComments.includes(c.id) ? "fill-current" : ""}`} />
                {c.upvotes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 space-y-2">
        {hasDraft && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3" />
            <span>Draft saved. Continue where you left off.</span>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => {
              const val = e.target.value;
              setNewComment(val);
              const updated = { ...draftedComments };
              if (val.trim()) {
                updated[hearingId] = val;
              } else {
                delete updated[hearingId];
              }
              setDraftedComments(updated);
              setHasDraft(!!updated[hearingId]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={user ? "Share your thoughts..." : "Sign in to comment..."}
            disabled={!user || sending}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!user || sending || !newComment.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}