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
  const [comments, setComments] = useState<Comment[]>([]);
  const [draftedComments, setDraftedComments] = useLocalStorage<Record<string, string>>("app:comment-drafts", {});
  const [newComment, setNewComment] = useState(draftedComments[hearingId] || "");
  const [sending, setSending] = useState(false);
  const [hasDraft, setHasDraft] = useState(!!draftedComments[hearingId]);
  const { recordComment } = useAppStats();

  useEffect(() => {
    setNewComment(draftedComments[hearingId] || "");
    setHasDraft(!!draftedComments[hearingId]);
    
    fetchComments();

    const channel = supabase
      .channel("comments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `hearing_id=eq.${hearingId}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hearingId, draftedComments]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("hearing_id", hearingId as any)
      .order("created_at", { ascending: false });
    if (data) {
      setComments(data as any);
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
      const { data } = await supabase.functions.invoke("analyze-sentiment", {
        body: { text: newComment, type: "sentiment" },
      });
      if (data?.sentiment) sentiment = data.sentiment;
    } catch { }

    const { error } = await supabase.from("comments").insert({
      hearing_id: hearingId,
      user_id: user.id,
      text: newComment,
      sentiment,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      const updated = { ...draftedComments };
      delete updated[hearingId];
      setDraftedComments(updated);
      setHasDraft(false);
      recordComment();
      toast({ title: "Comment posted", description: "Your comment has been shared." });
    }
    setSending(false);
  };

  const sentimentBadge: Record<string, string> = {
    positive: "bg-success/10 text-success",
    neutral: "bg-info/10 text-info",
    negative: "bg-destructive/10 text-destructive",
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
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />
                {c.upvotes || 0}
              </span>
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