import Layout from "@/components/Layout";
import SentimentCharts from "@/components/SentimentCharts";
import { useComments } from "@/hooks/useData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect } from "react";

export default function SentimentDashboard() {
  const [cachedComments, setCachedComments] = useLocalStorage<any[]>("app:comments", []);
  const { data: commentsData } = useComments();

  useEffect(() => {
    if (commentsData && commentsData.length > 0) {
      if (JSON.stringify(cachedComments) !== JSON.stringify(commentsData)) {
        setCachedComments(commentsData);
      }
    }
  }, [commentsData, cachedComments, setCachedComments]);

  const comments = (commentsData && commentsData.length > 0) ? commentsData : cachedComments;
  const total = (Array.isArray(comments) ? comments : []).length;
  const pos = (Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'positive').length;
  const neg = (Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'negative').length;
  const neu = (Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'neutral' || !c.sentiment).length;

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Sentiment Analysis</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered analysis of public engagement and legislative sentiment.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Engagement</p>
            <p className="text-2xl font-bold mt-1">{total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-success">Positive</p>
            <p className="text-2xl font-bold mt-1">{pos}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-info">Neutral</p>
            <p className="text-2xl font-bold mt-1">{neu}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-destructive">Negative</p>
            <p className="text-2xl font-bold mt-1">{neg}</p>
          </div>
        </div>

        <SentimentCharts />
      </div>
    </Layout>
  );
}
