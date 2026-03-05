import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import HearingCard from "@/components/HearingCard";
import StatsCard from "@/components/StatsCard";
import { Radio, Users, MessageSquare, TrendingUp, ArrowRight, Bell } from "lucide-react";
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

      {/* Announcements - visible to all users */}
      {displayAnnouncements.length > 0 && (
        <section className="bg-muted/40 border-t border-border py-14">
          <div className="container">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Official Updates</h2>
                <p className="text-sm text-muted-foreground">Latest circulars and policy announcements</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {displayAnnouncements.map((post) => (
                <div key={post.id} className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-accent/40">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      Official Circular
                    </span>
                    <span className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

