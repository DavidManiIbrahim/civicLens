import { Link } from "react-router-dom";
import { Radio, Users, MessageSquare, TrendingUp, ArrowRight, Shield, Globe, Zap } from "lucide-react";
// import heroImage from "/images/PARLIAMENT-4-1-678x381.jpg";
import BgImage from "/images/image.png";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={BgImage} alt="Capitol building" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-civic opacity-85" />
        </div>
        <div className="container relative flex min-h-[90vh] flex-col items-center justify-center py-20 text-center">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-semibold text-accent backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Next-Gen Democracy Platform
          </div>
          <h1 className="animate-fade-up mb-6 font-display text-5xl font-black tracking-tight text-primary-foreground md:text-7xl lg:text-8xl">
            Democratizing <br />
            <span className="text-gradient-gold">Governance</span>
          </h1>
          <p className="animate-fade-up mx-auto mb-10 max-w-2xl text-xl text-primary-foreground/80 md:text-2xl" style={{ animationDelay: "0.1s" }}>
            Experience legislative hearings in real-time with AI-powered insights. Join thousands of citizens shaping future policies.
          </p>
          <div className="animate-fade-up flex flex-col justify-center gap-4 sm:flex-row" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-bold text-accent-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
            >
              Get Started for Free
              <Zap className="h-5 w-5 fill-current" />
            </Link>
            <Link
              to="/hearing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-8 py-4 text-lg font-bold text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary-foreground/20"
            >
              Watch Live Hearing
              <Radio className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-background py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">Built for Transparency</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">CivicLens bridges the gap between the government and the people through cutting-edge technology.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Real-time Access</h3>
              <p className="text-muted-foreground">Join any legislative hearing as it happens. Watch the live stream and follow AI-generated summaries instantly.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Sentiment Tracking</h3>
              <p className="text-muted-foreground">See how the public feels about specific bills. Our AI analyzes thousands of comments to gauge the national mood.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Direct Influence</h3>
              <p className="text-muted-foreground">Your voice actually matters. We deliver verified public sentiment reports directly to committee members and policymakers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container grid gap-12 text-center md:grid-cols-4">
          <div>
            <div className="text-4xl font-black md:text-5xl">500+</div>
            <div className="mt-2 text-primary-foreground/60 uppercase tracking-widest text-xs font-bold">Hearings Tracked</div>
          </div>
          <div>
            <div className="text-4xl font-black md:text-5xl">1.2M</div>
            <div className="mt-2 text-primary-foreground/60 uppercase tracking-widest text-xs font-bold">Citizens Engaged</div>
          </div>
          <div>
            <div className="text-4xl font-black md:text-5xl">98%</div>
            <div className="mt-2 text-primary-foreground/60 uppercase tracking-widest text-xs font-bold">AI Accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-black md:text-5xl">24/7</div>
            <div className="mt-2 text-primary-foreground/60 uppercase tracking-widest text-xs font-bold">Monitoring</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent py-24">
        <div className="container text-center">
          <h2 className="mb-6 text-3xl font-bold text-accent-foreground md:text-5xl">Ready to make your voice heard?</h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-accent-foreground/80">Join CivicLens today and start participating in the legislative process that shapes your tomorrow.</p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-xl font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            Create Your Profile
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
