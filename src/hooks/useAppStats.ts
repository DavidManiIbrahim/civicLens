import { useLocalStorage } from "./useLocalStorage";

export interface AppStats {
  total_comments_posted: number;
  total_hearings_viewed: number;
  total_votes_cast: number;
  last_activity: number; // timestamp
}

const DEFAULT_STATS: AppStats = {
  total_comments_posted: 0,
  total_hearings_viewed: 0,
  total_votes_cast: 0,
  last_activity: 0,
};

/**
 * Hook for tracking user activity statistics locally
 */
export function useAppStats() {
  const [stats, setStats] = useLocalStorage<AppStats>("app:stats", DEFAULT_STATS);

  const recordComment = () => {
    setStats(prev => ({
      ...prev,
      total_comments_posted: prev.total_comments_posted + 1,
      last_activity: Date.now(),
    }));
  };

  const recordHearingView = () => {
    setStats(prev => ({
      ...prev,
      total_hearings_viewed: prev.total_hearings_viewed + 1,
      last_activity: Date.now(),
    }));
  };

  const recordVote = () => {
    setStats(prev => ({
      ...prev,
      total_votes_cast: prev.total_votes_cast + 1,
      last_activity: Date.now(),
    }));
  };

  const reset = () => {
    setStats(DEFAULT_STATS);
  };

  return { stats, recordComment, recordHearingView, recordVote, reset };
}
