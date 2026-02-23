import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
    Users,
    Radio,
    PlusCircle,
    Settings,
    TrendingUp,
    Search,
    MoreVertical,
    Edit,
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

type Tab = "overview" | "hearings" | "users" | "announcements" | "analytics" | "settings";

export default function AdminDashboard() {
    const { user, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [hearings, setHearings] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAddingHearing, setIsAddingHearing] = useState(false);
    const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (isAdmin) {
            fetchHearings();
            fetchUsers();
            fetchAnnouncements();
        }
    }, [isAdmin]);

    const fetchHearings = async () => {
        const { data } = await supabase.from("hearings").select("*").order("scheduled_at", { ascending: false });
        if (data) setHearings(data);
    };

    const fetchUsers = async () => {
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (data) setUsers(data);
    };

    const fetchAnnouncements = async () => {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        if (data) setAnnouncements(data);
    };

    const updateHearingStatus = async (hearingId: string, newStatus: string) => {
        const { error } = await supabase.from("hearings").update({ status: newStatus }).eq("id", hearingId);
        if (!error) { toast({ title: "Status updated" }); fetchHearings(); }
    };

    const deleteHearing = async (id: string) => {
        const { error } = await supabase.from("hearings").delete().eq("id", id);
        if (!error) { toast({ title: "Hearing deleted" }); fetchHearings(); }
    };

    const updateRole = async (userId: string, newRole: string) => {
        const { error } = await supabase.from("profiles").update({ role: newRole }).eq("user_id", userId);
        if (!error) { toast({ title: "Role updated" }); fetchUsers(); }
    };

    const toggleAnnouncementPublish = async (id: string, current: boolean) => {
        const { error } = await supabase.from("announcements").update({ is_published: !current }).eq("id", id);
        if (!error) { toast({ title: current ? "Unpublished" : "Published" }); fetchAnnouncements(); }
    };

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (!error) { toast({ title: "Post removed" }); fetchAnnouncements(); }
    };

    if (!isAdmin) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <Shield className="mx-auto h-12 w-12 text-destructive opacity-20" />
                    <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
                    <p className="mt-2 text-muted-foreground">This area is reserved for government administrators.</p>
                </div>
            </Layout>
        );
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
                <main className="flex-1 p-8">
                    <div className="mb-8 flex items-end justify-between">
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
                        <div className="flex gap-3">
                            {activeTab === "hearings" && (
                                <div className="flex gap-3">
                                    <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Exporting...", description: "Hearing data is being exported to CSV." })}>
                                        <FileText className="h-4 w-4" /> Export
                                    </Button>
                                    <Button onClick={() => setIsAddingHearing(true)} className="gap-2">
                                        <PlusCircle className="h-4 w-4" /> New Hearing
                                    </Button>
                                </div>
                            )}
                            {activeTab === "announcements" && (
                                <Button onClick={() => setIsAddingAnnouncement(true)} className="gap-2">
                                    <PlusCircle className="h-4 w-4" /> Create Post
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tab Content */}
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
                                            <th className="px-6 py-4 font-semibold">Role</th>
                                            <th className="px-6 py-4 font-semibold">Joined at</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users
                                            .filter(u => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(u => (
                                                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">
                                                            {u.display_name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span>{u.display_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                                        {new Date(u.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {u.role !== 'admin' && (
                                                            <Button variant="outline" size="sm" onClick={() => updateRole(u.user_id, 'admin')} className="h-8 text-xs">
                                                                Promote
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
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
                </main>
            </div>

            {isAddingHearing && (
                <HearingForm
                    onClose={() => setIsAddingHearing(false)}
                    onSuccess={() => { setIsAddingHearing(false); fetchHearings(); toast({ title: "Hearing created" }); }}
                />
            )}

            {isAddingAnnouncement && (
                <AnnouncementForm
                    onClose={() => setIsAddingAnnouncement(false)}
                    onSuccess={() => { setIsAddingAnnouncement(false); fetchAnnouncements(); toast({ title: "Post created" }); }}
                />
            )}
        </Layout>
    );
}
