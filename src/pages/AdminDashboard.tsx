import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
    Users,
    Radio,
    PlusCircle,
    Settings,
    TrendingUp,
    Search,
    Trash,
    LayoutDashboard,
    FileText,
    Shield,
    ShieldAlert,
    ShieldX,
    Pencil,
    RefreshCw,
    Bell,
    BarChart3,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import HearingForm from "@/components/admin/HearingForm";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import SentimentCharts from "@/components/SentimentCharts";
import {
    useHearings,
    useProfiles,
    useComments,
    useAnnouncements,
    useUpdateHearingMutation,
    useDeleteHearingMutation,
    useUpdateRoleMutation,
    useUpdateProfileMutation,
    useDeleteProfileMutation,
    useRecalculateSentimentMutation,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
} from "@/hooks/useData";

import AdminAuth from "@/components/admin/AdminAuth";
import AdminPeoplesView from "@/components/admin/AdminPeoplesView";
import AdminInsights from "@/components/admin/AdminInsights";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useEffect } from "react";

type Tab = "overview" | "hearings" | "users" | "announcements" | "peoples_view" | "insights" | "sentiment";

export default function AdminDashboard() {
    const { user, isAdmin, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [isAddingHearing, setIsAddingHearing] = useState(false);
    const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editingHearing, setEditingHearing] = useState<any>(null);
    const [editNameField, setEditNameField] = useState("");
    const { toast } = useToast();

    // Caching
    const [cachedHearings, setCachedHearings] = useLocalStorage<any[]>("app:hearings", []);
    const [cachedUsers, setCachedUsers] = useLocalStorage<any[]>("app:users", []);
    const [cachedComments, setCachedComments] = useLocalStorage<any[]>("app:comments", []);
    const [cachedAnnouncements, setCachedAnnouncements] = useLocalStorage<any[]>("app:announcements", []);

    // Queries
    const { data: hearingsData, isLoading: loadingHearings } = useHearings();
    const { data: usersData, isLoading: loadingProfiles } = useProfiles();
    const { data: commentsData } = useComments();
    const { data: announcementsData, isLoading: loadingAnnouncements } = useAnnouncements();

    useEffect(() => {
        if (hearingsData && hearingsData.length > 0) setCachedHearings(hearingsData);
    }, [hearingsData, setCachedHearings]);

    useEffect(() => {
        if (usersData && usersData.length > 0) setCachedUsers(usersData);
    }, [usersData, setCachedUsers]);

    useEffect(() => {
        if (commentsData && commentsData.length > 0) setCachedComments(commentsData);
    }, [commentsData, setCachedComments]);

    useEffect(() => {
        if (announcementsData && announcementsData.length > 0) setCachedAnnouncements(announcementsData);
    }, [announcementsData, setCachedAnnouncements]);

    // Derived values from cache or fresh data
    const hearings = (hearingsData && hearingsData.length > 0) ? hearingsData : cachedHearings;
    const users = (usersData && usersData.length > 0) ? usersData : cachedUsers;
    const comments = (commentsData && commentsData.length > 0) ? commentsData : cachedComments;
    const announcements = (announcementsData && announcementsData.length > 0) ? announcementsData : cachedAnnouncements;

    const totalViewers = (Array.isArray(hearings) ? hearings : []).reduce((sum, h) => sum + (h.viewers || 0), 0);

    // Mutations
    const updateHearingStatusMutation = useUpdateHearingMutation();
    const deleteHearingMutation = useDeleteHearingMutation();
    const updateRoleMutation = useUpdateRoleMutation();
    const updateProfileMutation = useUpdateProfileMutation();
    const deleteProfileMutation = useDeleteProfileMutation();
    const recalcSentimentMutation = useRecalculateSentimentMutation();
    const createAnnouncementMutation = useCreateAnnouncementMutation();
    const updateAnnouncementMutation = useUpdateAnnouncementMutation();
    const deleteAnnouncementMutation = useDeleteAnnouncementMutation();

    const updateHearingStatus = async (hearingId: string, newStatus: string) => {
        updateHearingStatusMutation.mutate({ id: hearingId, status: newStatus }, {
            onSuccess: () => toast({ title: "Status updated" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
    };

    const deleteHearing = async (id: string) => {
        deleteHearingMutation.mutate(id, {
            onSuccess: () => toast({ title: "Hearing deleted" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
    };

    const updateRole = async (userId: string, newRole: string) => {
        updateRoleMutation.mutate({ userId, role: newRole }, {
            onSuccess: () => toast({ title: "Role updated" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
    };

    const toggleAnnouncementPublish = async (id: string, current: boolean) => {
        updateAnnouncementMutation.mutate({ id, is_published: !current }, {
            onSuccess: () => toast({ title: current ? "Unpublished" : "Published" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
    };

    const deleteAnnouncement = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this circular?")) {
            deleteAnnouncementMutation.mutate(id, {
                onSuccess: () => toast({ title: "Post removed" }),
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
            });
        }
    };

    // Show loading while auth/profile is being fetched
    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    if (!isAdmin) {
        return <AdminAuth />;
    }

    const sidebarItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "hearings", label: "Hearings", icon: Radio },
        { id: "users", label: "Users", icon: Users },
        { id: "peoples_view", label: "People's View", icon: Users },
        { id: "sentiment", label: "Sentiment", icon: TrendingUp },
        { id: "insights", label: "Insights", icon: FileText },
        { id: "announcements", label: "Posts", icon: Bell },
    ];

    return (
        <Layout>
            <div className="flex min-h-[calc(100vh-64px)] bg-muted/30">
                {/* Sidebar */}
                <aside className="w-64 border-r border-border bg-card hidden md:block">
                    <nav className="p-4 space-y-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as Tab)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8">
                    {/* Mobile Tabs */}
                    <div className="mb-6 flex overflow-x-auto pb-2 md:hidden">
                        <div className="flex gap-2">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as Tab)}
                                    className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === item.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-card text-muted-foreground border border-border"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <span>Admin</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="capitalize">{activeTab}</span>
                            </div>
                            <h1 className="font-display text-3xl font-bold text-foreground">
                                {sidebarItems.find(i => i.id === activeTab)?.label}
                            </h1>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {activeTab === "hearings" && (
                                <>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Exporting...", description: "Hearing data is being exported to CSV." })}>
                                        <FileText className="h-4 w-4" /> Export
                                    </Button>
                                    <Button size="sm" onClick={() => setIsAddingHearing(true)} className="gap-2">
                                        <PlusCircle className="h-4 w-4" /> New Hearing
                                    </Button>
                                </>
                            )}
                            {activeTab === "announcements" && (
                                <Button size="sm" onClick={() => setIsAddingAnnouncement(true)} className="gap-2">
                                    <PlusCircle className="h-4 w-4" /> Create Post
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tab Content */}
                    {(loadingHearings || loadingProfiles || loadingAnnouncements) ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === "overview" && (
                                <div className="space-y-8">
                                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Radio className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Active Hearings</div>
                                            <div className="mt-1 text-3xl font-bold">{(Array.isArray(hearings) ? hearings : []).filter(h => h.status === 'live').length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Participants</div>
                                            <div className="mt-1 text-3xl font-bold">{(Array.isArray(users) ? users : []).length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Total Comments</div>
                                            <div className="mt-1 text-3xl font-bold">{(Array.isArray(comments) ? comments : []).length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Total Viewers</div>
                                            <div className="mt-1 text-3xl font-bold">{totalViewers.toLocaleString()}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Total Hearings</div>
                                            <div className="mt-1 text-3xl font-bold">{(Array.isArray(hearings) ? hearings : []).length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer" onClick={() => setActiveTab("announcements")}>
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                                <Bell className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Total Posts</div>
                                            <div className="mt-1 text-3xl font-bold">{(Array.isArray(announcements) ? announcements : []).length}</div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                                            <h3 className="mb-4 font-bold">Recent Hearings</h3>
                                            <div className="space-y-4">
                                                {(Array.isArray(hearings) ? hearings : []).slice(0, 4).map(h => (
                                                    <div key={h.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                                        <div>
                                                            <p className="font-medium text-sm">{h.title}</p>
                                                            <p className="text-xs text-muted-foreground">{h.committee}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${h.status === 'live' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                                                            }`}>{h.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="link" className="mt-4 px-0" onClick={() => setActiveTab("hearings")}>View all hearings</Button>
                                        </div>
                                        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                                            <h3 className="mb-4 font-bold">New Registrations</h3>
                                            <div className="space-y-4">
                                                {(Array.isArray(users) ? users : []).slice(0, 4).map(u => (
                                                    <div key={u.id} className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                                                            {u.display_name.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{u.display_name}</p>
                                                            <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="link" className="mt-4 px-0" onClick={() => setActiveTab("users")}>Manage users</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "hearings" && (
                                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                                    <div className="border-b border-border p-4 bg-muted/20">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input placeholder="Search hearings..." className="pl-10 max-w-sm" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/50">
                                                    <th className="px-6 py-4 font-semibold">Hearing Title</th>
                                                    <th className="px-6 py-4 font-semibold">Status</th>
                                                    <th className="px-6 py-4 font-semibold">Date</th>
                                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {hearings.map(h => (
                                                    <tr key={h.id} className="transition-colors hover:bg-muted/30">
                                                        <td className="px-6 py-4">
                                                            <p className="font-medium text-foreground">{h.title}</p>
                                                            <p className="text-xs text-muted-foreground">{h.committee}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select
                                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-accent outline-none"
                                                                value={h.status}
                                                                onChange={(e) => updateHearingStatus(h.id, e.target.value)}
                                                            >
                                                                <option value="upcoming">Upcoming</option>
                                                                <option value="live">Live</option>
                                                                <option value="archived">Archived</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {new Date(h.scheduled_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => setEditingHearing(h)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => deleteHearing(h.id)}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === "users" && (
                                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                                    <div className="border-b border-border p-4 bg-muted/20">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search participants by name..."
                                                className="pl-10 max-w-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/50">
                                                    <th className="px-6 py-4 font-semibold">Citizen</th>
                                                    <th className="px-6 py-4 font-semibold">Email</th>
                                                    <th className="px-6 py-4 font-semibold">Role</th>
                                                    {/* <th className="px-6 py-4 font-semibold">Comments</th> */}
                                                    <th className="px-6 py-4 font-semibold">Joined at</th>
                                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {(Array.isArray(users) ? users : [])
                                                    .filter(u => (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map(u => {
                                                        const userComments = comments.filter(c => c.user_id === u.user_id);
                                                        const totalComments = userComments.length;
                                                        const pos = userComments.filter(c => c.sentiment === 'positive').length;
                                                        const neg = userComments.filter(c => c.sentiment === 'negative').length;
                                                        const neu = userComments.filter(c => c.sentiment === 'neutral').length;
                                                        const posPct = totalComments ? Math.round((pos / totalComments) * 100) : 0;
                                                        const negPct = totalComments ? Math.round((neg / totalComments) * 100) : 0;
                                                        const neuPct = totalComments ? Math.round((neu / totalComments) * 100) : 0;
                                                        return (
                                                            <tr key={u.id} className="transition-colors hover:bg-muted/30">
                                                                <td className="px-4 sm:px-6 py-4 flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">
                                                                        {u.display_name.slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <span>{u.display_name}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-xs text-muted-foreground">
                                                                    {u.email || "-"}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                        {u.role}
                                                                    </span>
                                                                </td>
                                                                {/* <td className="px-6 py-4 text-xs"> */}
                                                                {/* {totalComments} ({posPct}%+ / {negPct}%- / {neuPct}%0) */}
                                                                {/* </td> */}
                                                                <td className="px-6 py-4 text-muted-foreground text-xs">
                                                                    {new Date(u.created_at).toLocaleString()}
                                                                </td>
                                                                <td className="px-6 py-4 text-right space-x-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            setEditingUser(u);
                                                                            setEditNameField(u.display_name || "");
                                                                        }}
                                                                        className="h-8 w-8"
                                                                        title="Edit Profile"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    {totalComments > 0 && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => recalcSentimentMutation.mutate(u.user_id, {
                                                                                onSuccess: () => toast({ title: "Sentiment refreshed" }),
                                                                                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                                                            })}
                                                                            className="h-8 w-8"
                                                                            title="Re-analyze Sentiment"
                                                                        >
                                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                    {u.role !== 'admin' ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => updateRole(u.user_id, 'admin')}
                                                                            className="h-8 w-8 text-primary"
                                                                            title="Promote to Admin"
                                                                        >
                                                                            <ShieldAlert className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    ) : (
                                                                        u.user_id !== user?.id && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={() => updateRole(u.user_id, 'user')}
                                                                                className="h-8 w-8 text-warning"
                                                                                title="Demote to User"
                                                                            >
                                                                                <ShieldX className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            if (window.confirm("Are you sure you want to delete this user?")) {
                                                                                deleteProfileMutation.mutate(u.user_id, {
                                                                                    onSuccess: () => toast({ title: "User removed" }),
                                                                                    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="h-8 w-8"
                                                                        title="Delete User"
                                                                    >
                                                                        <Trash className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === "announcements" && (
                                <div className="grid gap-6">
                                    {announcements.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border py-20 text-center">
                                            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                            <p className="mt-2 text-muted-foreground">No circulars or posts created yet.</p>
                                            <Button variant="link" onClick={() => setIsAddingAnnouncement(true)}>Create your first post</Button>
                                        </div>
                                    ) : (
                                        announcements.map(post => (
                                            <div key={post.id} className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${post.is_published ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                                            }`}>
                                                            {post.is_published ? 'Published' : 'Draft'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-2">{post.content}</p>
                                                </div>
                                                <div className="flex flex-row sm:flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingAnnouncement(post)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleAnnouncementPublish(post.id, post.is_published)}
                                                    >
                                                        {post.is_published ? 'Unpublish' : 'Publish'}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAnnouncement(post.id)}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "peoples_view" && (
                                <AdminPeoplesView />
                            )}

                            {activeTab === "sentiment" && (
                                <div className="space-y-6">
                                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Comments</p>
                                            <p className="text-2xl font-bold mt-1">{(Array.isArray(comments) ? comments : []).length}</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Positive Sentiment</p>
                                            <p className="text-2xl font-bold mt-1 text-success">{(Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'positive').length}</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Negative Sentiment</p>
                                            <p className="text-2xl font-bold mt-1 text-destructive">{(Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'negative').length}</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Neutral Sentiment</p>
                                            <p className="text-2xl font-bold mt-1 text-info">{(Array.isArray(comments) ? comments : []).filter(c => c.sentiment === 'neutral' || !c.sentiment).length}</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Registered Citizens</p>
                                            <p className="text-2xl font-bold mt-1">{(Array.isArray(users) ? users : []).length}</p>
                                        </div>
                                    </div>
                                    <SentimentCharts />
                                </div>
                            )}

                            {activeTab === "insights" && (
                                <AdminInsights />
                            )}
                        </>
                    )}
                </main>
            </div>

            {isAddingHearing && (
                <HearingForm
                    onClose={() => setIsAddingHearing(false)}
                    onSuccess={() => { setIsAddingHearing(false); toast({ title: "Hearing created" }); }}
                />
            )}

            {editingHearing && (
                <HearingForm
                    initialData={editingHearing}
                    onClose={() => setEditingHearing(null)}
                    onSuccess={() => { setEditingHearing(null); toast({ title: "Hearing updated" }); }}
                />
            )}

            {isAddingAnnouncement && (
                <AnnouncementForm
                    onClose={() => setIsAddingAnnouncement(false)}
                    onSuccess={() => { setIsAddingAnnouncement(false); toast({ title: "Post created" }); }}
                />
            )}

            {editingAnnouncement && (
                <AnnouncementForm
                    initialData={editingAnnouncement}
                    onClose={() => setEditingAnnouncement(null)}
                    onSuccess={() => { setEditingAnnouncement(null); }}
                />
            )}

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editName">Display Name</Label>
                            <Input
                                id="editName"
                                value={editNameField}
                                onChange={(e) => setEditNameField(e.target.value)}
                                placeholder="Public display name"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">User ID: {editingUser?.user_id}</p>
                            <p className="text-xs text-muted-foreground">Email: {editingUser?.email}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                updateProfileMutation.mutate({ userId: editingUser.user_id, display_name: editNameField }, {
                                    onSuccess: () => {
                                        toast({ title: "Profile updated" });
                                        setEditingUser(null);
                                    },
                                    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                });
                            }}
                            disabled={updateProfileMutation.isPending}
                        >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
