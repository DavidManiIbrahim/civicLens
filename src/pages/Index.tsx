import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import HearingCard from "@/components/HearingCard";
import StatsCard from "@/components/StatsCard";
import { Radio, Users, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "/images/PARLIAMENT-4-1-678x381.jpg";
// import heroImage from "/image.png";
// import heroImage from "@/assets/hero-capitol.jpg";
import { supabase } from "@/integrations/supabase/client";

import { useHearings, useAnnouncements } from "@/hooks/useData";

export default function Index() {
  const { data: hearings = [] } = useHearings();
  const { data: announcements = [] } = useAnnouncements(true);

  const liveCount = hearings.filter(h => h.status === "live").length;
  const totalViewers = hearings.reduce((sum, h) => sum + (h.viewers || 0), 0);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Capitol building" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-civic opacity-80" />
        </div>
        <div className="container relative py-20 text-center">
          <h1 className="animate-fade-up mb-4 font-display text-4xl font-black tracking-tight text-primary-foreground md:text-6xl">
            Your Voice in <span className="text-gradient-gold">Legislation</span>
          </h1>
          <p className="animate-fade-up mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80" style={{ animationDelay: "0.1s" }}>
            AI-powered civic engagement platform. Watch live hearings, share your opinion, and see how public sentiment shapes policy.
          </p>
          <div className="animate-fade-up flex justify-center gap-4" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/hearing"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-transform hover:scale-105"
            >
              <Radio className="h-4 w-4" />
              Watch Live
            </Link>
            <Link
              to="/peoples-view"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              People's View
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard icon={<Radio className="h-5 w-5" />} label="Live Sessions" value={String(liveCount)} />
          <StatsCard icon={<Users className="h-5 w-5" />} label="Total Viewers" value={totalViewers.toLocaleString()} />
          <StatsCard icon={<MessageSquare className="h-5 w-5" />} label="Hearings" value={String(hearings.length)} />
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Engagement Rate" value="78%" change="+5% this month" positive />
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
      {announcements.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="container">
            <h2 className="mb-8 font-display text-2xl font-bold text-foreground">Latest Updates</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {announcements.map((post) => (
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
