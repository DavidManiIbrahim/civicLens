import TopicCloud from "@/components/TopicCloud";
import StatsCard from "@/components/StatsCard";
import { Users, Radio, MessageSquare, TrendingUp } from "lucide-react";
import { useProfiles, useComments, useHearings } from "@/hooks/useData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect } from "react";

export default function AdminPeoplesView() {
    const [cachedUsers, setCachedUsers] = useLocalStorage<any[]>("app:users", []);
    const [cachedComments, setCachedComments] = useLocalStorage<any[]>("app:comments", []);
    const [cachedHearings, setCachedHearings] = useLocalStorage<any[]>("app:hearings", []);

    const { data: usersData } = useProfiles();
    const { data: commentsData } = useComments();
    const { data: hearingsData } = useHearings();

    useEffect(() => {
        if (usersData && usersData.length > 0) {
            if (JSON.stringify(cachedUsers) !== JSON.stringify(usersData)) {
                setCachedUsers(usersData);
            }
        }
    }, [usersData, cachedUsers, setCachedUsers]);

    useEffect(() => {
        if (commentsData && commentsData.length > 0) {
            if (JSON.stringify(cachedComments) !== JSON.stringify(commentsData)) {
                setCachedComments(commentsData);
            }
        }
    }, [commentsData, cachedComments, setCachedComments]);

    useEffect(() => {
        if (hearingsData && hearingsData.length > 0) {
            if (JSON.stringify(cachedHearings) !== JSON.stringify(hearingsData)) {
                setCachedHearings(hearingsData);
            }
        }
    }, [hearingsData, cachedHearings, setCachedHearings]);

    const users = (usersData && usersData.length > 0) ? usersData : cachedUsers;
    const comments = (commentsData && commentsData.length > 0) ? commentsData : cachedComments;
    const hearings = (hearingsData && hearingsData.length > 0) ? hearingsData : cachedHearings;

    const totalViewers = Array.isArray(hearings) ? hearings.reduce((sum, h) => sum + (h.viewers || 0), 0) : 0;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-display text-2xl font-bold text-foreground">People's View</h2>
                <p className="text-muted-foreground">Real-time public engagement data and trends.</p>
            </div>

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard icon={<Users className="h-5 w-5" />} label="Participants" value={(Array.isArray(users) ? users.length : 0).toLocaleString()} />
                <StatsCard icon={<Radio className="h-5 w-5" />} label="Total Viewers" value={totalViewers.toLocaleString()} />
                <StatsCard icon={<Users className="h-5 w-5" />} label="Citizens Reached" value={(totalViewers + (Array.isArray(users) ? users.length : 0)).toLocaleString()} />
                <StatsCard icon={<MessageSquare className="h-5 w-5" />} label="Engagement" value={`${(Array.isArray(comments) && Array.isArray(users) && comments.length > 0) ? (comments.length / Math.max(users.length, 1)).toFixed(1) : 0} avg`} />
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
    );
}
