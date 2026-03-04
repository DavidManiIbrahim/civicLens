import Layout from "@/components/Layout";
import TopicCloud from "@/components/TopicCloud";
import StatsCard from "@/components/StatsCard";
import { TrendingUp, AlertTriangle, CheckCircle, Users, MessageSquare, Lightbulb, Radio } from "lucide-react";
import { useProfiles, useComments, useHearings } from "../hooks/useData";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useEffect, useState } from "react";

const sentimentBadge = {
  positive: "bg-success/10 text-success",
  neutral: "bg-info/10 text-info",
  negative: "bg-destructive/10 text-destructive",
};

export default function PeoplesView() {
  const [users, setUsers] = useLocalStorage<any[]>("app:users-cache", []);
  const [comments, setComments] = useLocalStorage<any[]>("app:comments-cache", []);
  const [hearings, setHearings] = useLocalStorage<any[]>("app:hearings-cache", []);

  const { data: usersData } = useProfiles();
  const { data: commentsData } = useComments();
  const { data: hearingsData } = useHearings();

  useEffect(() => {
    if (usersData && usersData.length > 0) setUsers(usersData);
  }, [usersData]);

  useEffect(() => {
    if (commentsData && commentsData.length > 0) setComments(commentsData);
  }, [commentsData]);

  useEffect(() => {
    if (hearingsData && hearingsData.length > 0) setHearings(hearingsData);
  }, [hearingsData]);

  const totalViewers = (hearings || []).reduce((sum, h) => sum + (h.viewers || 0), 0);

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">People's View</h1>
          <p className="mt-1 text-muted-foreground">
            Civic insight dashboard - real-time public engagement data.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard icon={<Users className="h-5 w-5" />} label="Total Participants" value={users.length.toLocaleString()} />
          <StatsCard icon={<MessageSquare className="h-5 w-5" />} label="Comments Analyzed" value={comments.length.toLocaleString()} />
          <StatsCard icon={<Radio className="h-5 w-5" />} label="Citizens Reached" value={totalViewers.toLocaleString()} />
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Engagement" value={`${comments.length > 0 ? (comments.length / Math.max(users.length, 1)).toFixed(1) : 0} avg`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Topic Cloud */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Key Themes</h3>
            <p className="mb-2 text-sm text-muted-foreground">Most discussed topics by the public</p>
            <TopicCloud />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-display text-lg font-bold text-foreground">Community Data</h3>
            <p className="text-muted-foreground">More analytics will appear here as more citizens participate in hearings.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
