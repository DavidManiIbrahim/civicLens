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
    Bell,
    BarChart3,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import HearingForm from "@/components/admin/HearingForm";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import SentimentCharts from "@/components/SentimentCharts";
import {
    useHearings,
    useProfiles,
    useComments,
    useUpdateHearingMutation,
    useDeleteHearingMutation,
    useUpdateRoleMutation,
    useUpdateProfileMutation,
    useDeleteProfileMutation,
    useRecalculateSentimentMutation,
} from "@/hooks/useData";

type Tab = "overview" | "hearings" | "users" | "announcements" | "analytics" | "settings";


import AdminAuth from "@/components/admin/AdminAuth";

export default function AdminDashboard() {
    const { user, isAdmin, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [isAddingHearing, setIsAddingHearing] = useState(false);
    const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    // Queries
    const { data: hearings = [], isLoading: loadingHearings } = useHearings();
    const { data: users = [], isLoading: loadingProfiles } = useProfiles();
    const announcements: any[] = [];
    const loadingAnnouncements = false;
    const { data: comments = [] } = useComments();

    // Mutations
    const updateHearingStatusMutation = useUpdateHearingMutation();
    const deleteHearingMutation = useDeleteHearingMutation();
    const updateRoleMutation = useUpdateRoleMutation();
    const updateProfileMutation = useUpdateProfileMutation();
    const deleteProfileMutation = useDeleteProfileMutation();
    const recalcSentimentMutation = useRecalculateSentimentMutation();
    // Announcement mutations placeholder (table not yet created)
    const updateAnnouncementMutation = { mutate: (_a: any, _b?: any) => {} } as any;
    const deleteAnnouncementMutation = { mutate: (_a: any, _b?: any) => {} } as any;

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
        deleteAnnouncementMutation.mutate(id, {
            onSuccess: () => toast({ title: "Post removed" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
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
        { id: "announcements", label: "Posts", icon: Bell },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "settings", label: "Settings", icon: Settings },
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

                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Radio className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Active Hearings</div>
                                            <div className="mt-1 text-3xl font-bold">{hearings.filter(h => h.status === 'live').length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Civil Participants</div>
                                            <div className="mt-1 text-3xl font-bold">{users.length}</div>
                                        </div>
                                        <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">Platform Health</div>
                                            <div className="mt-1 text-3xl font-bold">94%</div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                                            <h3 className="mb-4 font-bold">Recent Hearings</h3>
                                            <div className="space-y-4">
                                                {hearings.slice(0, 4).map(h => (
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
                                                {users.slice(0, 4).map(u => (
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
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                onClick={() => deleteHearing(h.id)}
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
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
                                                    <th className="px-6 py-4 font-semibold">Comments</th>
                                                    <th className="px-6 py-4 font-semibold">Joined at</th>
                                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {users
                                                    .filter(u => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">
                                                                    {u.display_name.slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <span>{u.display_name}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                                {u.users?.email || "-"}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                                    }`}>
                                                                    {u.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs">
                                                                {totalComments} ({posPct}%+ / {negPct}%- / {neuPct}%0)
                                                            </td>
                                                            <td className="px-6 py-4 text-muted-foreground text-xs">
                                                                {new Date(u.created_at).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-right space-x-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const name = prompt("Enter new display name", u.display_name);
                                                                        if (name && name !== u.display_name) {
                                                                            updateProfileMutation.mutate({ userId: u.user_id, display_name: name }, {
                                                                                onSuccess: () => toast({ title: "Name updated" }),
                                                                                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="h-8 text-xs"
                                                                >
                                                                    Edit
                                                                </Button>
                                                                {totalComments > 0 && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => recalcSentimentMutation.mutate(u.user_id, {
                                                                            onSuccess: () => toast({ title: "Sentiment refreshed" }),
                                                                            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                                                        })}
                                                                        className="h-8 text-xs"
                                                                    >
                                                                        Re‑analyze
                                                                    </Button>
                                                                )}
                                                                {u.role !== 'admin' && (
                                                                    <Button variant="outline" size="sm" onClick={() => updateRole(u.user_id, 'admin')} className="h-8 text-xs">
                                                                        Promote
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => deleteProfileMutation.mutate(u.user_id, {
                                                                        onSuccess: () => toast({ title: "User removed" }),
                                                                        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                                                                    })}
                                                                    className="h-8 text-xs"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    )})}
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
                                            <div key={post.id} className="rounded-xl border border-border bg-card p-6 shadow-card flex gap-6">
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
                                                <div className="flex flex-col gap-2">
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

                            {activeTab === "analytics" && (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Comment Intensity</p>
                                            <p className="text-2xl font-bold mt-1">4.2/min</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Vote Delta</p>
                                            <p className="text-2xl font-bold mt-1">+12.4</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sentiment Bias</p>
                                            <p className="text-2xl font-bold mt-1 text-success">Positive</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card p-4">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Region Hotspot</p>
                                            <p className="text-2xl font-bold mt-1">Lagos Central</p>
                                        </div>
                                    </div>
                                    <SentimentCharts />
                                </div>
                            )}

                            {activeTab === "settings" && (
                                <div className="max-w-2xl rounded-xl border border-border bg-card p-8 shadow-card">
                                    <h3 className="text-lg font-bold mb-4">Platform Configuration</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Public Participation</p>
                                                <p className="text-sm text-muted-foreground">Allow non-verified users to comment on hearings.</p>
                                            </div>
                                            <div className="h-5 w-10 rounded-full bg-accent p-0.5"><div className="h-4 w-4 rounded-full bg-white translate-x-5" /></div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">AI Sentiment Analysis</p>
                                                <p className="text-sm text-muted-foreground">Automatically process public comments using Gemini.</p>
                                            </div>
                                            <div className="h-5 w-10 rounded-full bg-accent p-0.5"><div className="h-4 w-4 rounded-full bg-white translate-x-5" /></div>
                                        </div>
                                        <div className="pt-4 border-t border-border">
                                            <Button variant="destructive" className="w-full">Maintenance Mode</Button>
                                        </div>
                                    </div>
                                </div>
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

            {isAddingAnnouncement && (
                <AnnouncementForm
                    onClose={() => setIsAddingAnnouncement(false)}
                    onSuccess={() => { setIsAddingAnnouncement(false); toast({ title: "Post created" }); }}
                />
            )}
        </Layout>
    );
}
