import Layout from "@/components/Layout";
import { useAnnouncements } from "@/hooks/useData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import { Bell, Search, Calendar, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";

export default function AnnouncementsPage() {
    const [cachedAnnouncements, setCachedAnnouncements] = useLocalStorage<any[]>("app:announcements", []);
    const { data: announcementsData } = useAnnouncements();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (announcementsData && announcementsData.length > 0) {
            if (JSON.stringify(cachedAnnouncements) !== JSON.stringify(announcementsData)) {
                setCachedAnnouncements(announcementsData);
            }
        }
    }, [announcementsData, cachedAnnouncements, setCachedAnnouncements]);

    const all = (announcementsData && announcementsData.length > 0) ? announcementsData : cachedAnnouncements;

    const filtered = all.filter((post) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return post.title?.toLowerCase().includes(q) || post.content?.toLowerCase().includes(q);
    });

    return (
        <Layout>
            {/* Hero */}
            <section className="bg-primary text-primary-foreground py-14 border-b border-border">
                <div className="container">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="font-display text-3xl font-bold md:text-4xl">Official Announcements</h1>
                            <p className="text-primary-foreground/70 mt-0.5 text-sm">
                                Circulars, policy updates, and official communications from the platform
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mt-6 relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search announcements..."
                            className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                        />
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="container py-10">
                {/* Stats bar */}
                <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>
                        {searchQuery
                            ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`
                            : `${all.length} announcement${all.length !== 1 ? "s" : ""} total`}
                    </span>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Bell className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {searchQuery ? "No results found" : "No announcements yet"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                            {searchQuery
                                ? "Try a different search term."
                                : "Check back later for official circulars and policy updates."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((post) => (
                            <AnnouncementCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </section>
        </Layout>
    );
}

function AnnouncementCard({ post }: { post: any }) {
    const [expanded, setExpanded] = useState(false);

    const dateStr = (() => {
        try {
            return format(new Date(post.created_at), "MMM d, yyyy");
        } catch {
            return "";
        }
    })();

    return (
        <div className="group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-accent/40 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent/40" />

            <div className="flex flex-col flex-1 p-6">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                        Official Circular
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                    </div>
                </div>

                {/* Title */}
                <h2 className="mb-3 text-base font-bold leading-snug text-foreground group-hover:text-accent transition-colors">
                    {post.title}
                </h2>

                {/* Body */}
                <p className={`flex-1 text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-4"}`}>
                    {post.content}
                </p>

                {/* Read more toggle */}
                {post.content?.length > 200 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-4 flex items-center gap-1 text-xs font-medium text-accent hover:underline self-start"
                    >
                        {expanded ? "Show less" : "Read more"}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                    </button>
                )}
            </div>
        </div>
    );
}
