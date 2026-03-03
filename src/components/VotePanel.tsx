import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VotePanelProps {
  hearingId: string;
}

export default function VotePanel({ hearingId }: VotePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forCount, setForCount] = useState(0);
  const [againstCount, setAgainstCount] = useState(0);
  const [userVote, setUserVote] = useState<string | null>(null);

  useEffect(() => {
    fetchVotes();
  }, [hearingId, user]);

  const fetchVotes = async () => {
    const { data: votes } = await supabase
      .from("votes")
      .select("vote_type, user_id")
      .eq("hearing_id", hearingId as any);
    if (votes) {
      const typedVotes = votes as any[];
      setForCount(typedVotes.filter((v) => v.vote_type === "for").length);
      setAgainstCount(typedVotes.filter((v) => v.vote_type === "against").length);
      if (user) {
        const myVote = typedVotes.find((v) => v.user_id === user.id);
        setUserVote(myVote?.vote_type ?? null);
      }
    }
  };

  const handleVote = async (voteType: "for" | "against") => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to vote.", variant: "destructive" });
      return;
    }

    if (userVote === voteType) {
      await supabase.from("votes").delete().eq("hearing_id", hearingId as any).eq("user_id", user.id as any);
      setUserVote(null);
    } else if (userVote) {
      await supabase.from("votes").update({ vote_type: voteType } as any).eq("hearing_id", hearingId as any).eq("user_id", user.id as any);
      setUserVote(voteType);
    } else {
      await supabase.from("votes").insert({ hearing_id: hearingId, user_id: user.id, vote_type: voteType } as any);
      setUserVote(voteType);
    }
    fetchVotes();
  };

  const total = forCount + againstCount;
  const forPercent = total > 0 ? Math.round((forCount / total) * 100) : 50;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-3 font-display text-lg font-bold text-foreground">Vote on This Bill</h3>
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => handleVote("for")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
            userVote === "for"
              ? "border-success bg-success/10 text-success"
              : "border-border text-muted-foreground hover:border-success hover:text-success"
          }`}
        >
          <ThumbsUp className="h-5 w-5" />
          For ({forCount})
        </button>
        <button
          onClick={() => handleVote("against")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
            userVote === "against"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
          }`}
        >
          <ThumbsDown className="h-5 w-5" />
          Against ({againstCount})
        </button>
      </div>
      {total > 0 && (
        <div className="overflow-hidden rounded-full bg-muted">
          <div className="flex h-3">
            <div className="bg-success transition-all" style={{ width: `${forPercent}%` }} />
            <div className="bg-destructive transition-all" style={{ width: `${100 - forPercent}%` }} />
          </div>
        </div>
      )}
      {!user && <p className="mt-2 text-xs text-muted-foreground">Sign in to cast your vote</p>}
    </div>
  );
}