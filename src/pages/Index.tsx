import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import HearingCard from "@/components/HearingCard";
import StatsCard from "@/components/StatsCard";
import { Radio, Users, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "/images/PARLIAMENT-4-1-678x381.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useHearings, useComments, useAnnouncements } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/components/LandingPage";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function Index() {
  const { user, loading } = useAuth();
  const [cachedHearings, setCachedHearings] = useLocalStorage<any[]>("app:hearings", []);
  const [cachedComments, setCachedComments] = useLocalStorage<any[]>("app:comments", []);
  const [cachedAnnouncements, setCachedAnnouncements] = useLocalStorage<any[]>("app:announcements", []);

  const { data: hearingsData = [] } = useHearings();
  const { data: commentsData = [] } = useComments();
  const { data: announcementsData = [] } = useAnnouncements();

  // Unified sync effects with deep comparison to avoid infinite loops
  useEffect(() => {
    if (hearingsData && hearingsData.length > 0) {
      if (JSON.stringify(cachedHearings) !== JSON.stringify(hearingsData)) {
        setCachedHearings(hearingsData);
      }
    }
  }, [hearingsData, cachedHearings, setCachedHearings]);

  useEffect(() => {
    if (commentsData && commentsData.length > 0) {
      if (JSON.stringify(cachedComments) !== JSON.stringify(commentsData)) {
        setCachedComments(commentsData);
      }
    }
  }, [commentsData, cachedComments, setCachedComments]);

  useEffect(() => {
    if (announcementsData && announcementsData.length > 0) {
      if (JSON.stringify(cachedAnnouncements) !== JSON.stringify(announcementsData)) {
        setCachedAnnouncements(announcementsData);
      }
    }
  }, [announcementsData, cachedAnnouncements, setCachedAnnouncements]);

  // Use fresh data if available, otherwise fallback to cache
  const hearings = (hearingsData && hearingsData.length > 0) ? hearingsData : cachedHearings;
  const comments = (commentsData && commentsData.length > 0) ? commentsData : cachedComments;
  const displayAnnouncements = (announcementsData && announcementsData.length > 0) ? announcementsData : cachedAnnouncements;

  if (loading && !user) {
    return (
      <Layout>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-glow" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <LandingPage />
      </Layout>
    );
  }

  const liveCount = hearings.filter(h => h.status === "live").length;
  const totalViewers = hearings.reduce((sum, h) => sum + (h.viewers || 0), 0);

  return (
    <Layout>
      {/* Dashboard Header */}
      <section className="bg-primary text-white border-b border-border py-12">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white text-foreground md:text-4xl">Welcome back, Citizen</h1>
              <p className="text-muted-foreground mt-1">Here is what's happening in legislation today.</p>
            </div>
            <Link to="/hearing" className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 text-center">
              Enter Live Hearing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-6 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard icon={<Radio className="h-5 w-5" />} label="Live Sessions" value={String(liveCount)} />
          <StatsCard icon={<Users className="h-5 w-5" />} label="Total Viewers" value={totalViewers.toLocaleString()} />
          <StatsCard icon={<MessageSquare className="h-5 w-5" />} label="Total Hearings" value={String(hearings.length)} />
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Total Comments" value={String(comments.length)} />
        </div>
      </section>

      {/* Hearings */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">Legislative Hearings</h2>
          <span className="text-sm text-muted-foreground">{hearings.length} sessions</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {hearings.map((h) => (
            <HearingCard key={h.id} {...h} />
          ))}
        </div>
      </section>

      {/* Announcements */}
      {displayAnnouncements.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="container">
            <h2 className="mb-8 font-display text-2xl font-bold text-foreground">Latest Updates</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {displayAnnouncements.map((post) => (
                <div key={post.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">Circular</span>
                  <h3 className="mt-2 mb-3 text-lg font-bold line-clamp-1">{post.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-4">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

