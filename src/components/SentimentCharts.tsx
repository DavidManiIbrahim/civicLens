import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { useComments } from "@/hooks/useData";

export default function SentimentCharts() {
  const { data: comments = [], isLoading } = useComments();

  const { pieData, sentimentOverTime } = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    const timeGroups: Record<string, { positive: number; neutral: number; negative: number }> = {};

    comments.forEach(c => {
      if (c.sentiment === "positive") positive++;
      else if (c.sentiment === "negative") negative++;
      else neutral++;

      const date = new Date(c.created_at);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:00`;

      if (!timeGroups[timeStr]) timeGroups[timeStr] = { positive: 0, neutral: 0, negative: 0 };
      if (c.sentiment === "positive") timeGroups[timeStr].positive++;
      else if (c.sentiment === "negative") timeGroups[timeStr].negative++;
      else timeGroups[timeStr].neutral++;
    });

    const total = positive + negative + neutral;
    const resolvedPieData = total === 0 ? [] : [
      { name: "Positive", value: Math.round((positive / total) * 100), color: "hsl(142, 76%, 36%)" },
      { name: "Neutral", value: Math.round((neutral / total) * 100), color: "hsl(199, 89%, 48%)" },
      { name: "Negative", value: Math.round((negative / total) * 100), color: "hsl(0, 84%, 60%)" },
    ];

    const resolvedSentimentOverTime = Object.entries(timeGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, counts]) => {
        const t = counts.positive + counts.neutral + counts.negative;
        return {
          time,
          positive: Math.round((counts.positive / t) * 100),
          neutral: Math.round((counts.neutral / t) * 100),
          negative: Math.round((counts.negative / t) * 100),
        };
      });

    return { pieData: resolvedPieData, sentimentOverTime: resolvedSentimentOverTime };
  }, [comments]);

  if (isLoading) {
    return <div className="text-center p-4">Loading stats...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sentiment over time */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Sentiment Over Time</h3>
        {sentimentOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sentimentOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey="positive" stackId="1" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.3)" />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%, 0.3)" />
              <Area type="monotone" dataKey="negative" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%, 0.3)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground">No sentiment data available over time.</p>
        )}
      </div>

      {/* Pie breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Overall Sentiment</h3>
        {pieData.length > 0 ? (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-foreground">{d.name}</span>
                  <span className="ml-auto text-sm font-bold text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No sentiment data available.</p>
        )}
      </div>
    </div>
  );
}
