import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, Shield, Save, LogOut, Camera, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUpdateProfileMutation, useComments } from "@/hooks/useData";

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();
    const updateProfileMutation = useUpdateProfileMutation();
    const { data: allComments = [] } = useComments();

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setAvatarUrl(profile.avatar_url || "");
        }
    }, [profile]);

    const myComments = user ? allComments.filter(c => c.user_id === user.id) : [];
    const totalUpvotes = myComments.reduce((sum, c) => sum + (c.upvotes || 0), 0);
    const sentimentBreakdown = {
        positive: myComments.filter(c => c.sentiment === "positive").length,
        neutral: myComments.filter(c => c.sentiment === "neutral").length,
        negative: myComments.filter(c => c.sentiment === "negative").length,
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ display_name: displayName, avatar_url: avatarUrl || null })
                .eq("user_id", user.id);
            if (error) throw error;
            toast({ title: "Profile updated successfully" });
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" });
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    if (!user) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold">Please sign in</h1>
                    <p className="mt-2 text-muted-foreground">You need to be logged in to view your profile.</p>
                    <Button onClick={() => navigate("/auth")} className="mt-4">Sign In</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-3xl py-12">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar-input")?.click()}>
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-elevated overflow-hidden relative">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                profile?.display_name?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase()
                            )}
                            {/* Always visible helper icon in corner */}
                            <div className="absolute bottom-1 right-1 rounded-full bg-primary p-1 text-white shadow-sm ring-2 ring-card group-hover:scale-110 transition-transform">
                                <Camera className="h-3 w-3" />
                            </div>
                            {/* Overlay Camera Icon on Hover */}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                        </div>
                        <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 1024 * 1024) {
                                        toast({ title: "File too large", description: "Please choose an image smaller than 1MB.", variant: "destructive" });
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                        const base64 = re.target?.result as string;
                                        setAvatarUrl(base64);
                                        toast({ title: "Avatar ready", description: "Don't forget to save your changes below." });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">{profile?.display_name || "Citizen"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <span className="capitalize">{profile?.role || "user"}</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
                        <MessageSquare className="mx-auto mb-1 h-5 w-5 text-primary" />
                        <div className="text-2xl font-bold">{myComments.length}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
                        <ThumbsUp className="mx-auto mb-1 h-5 w-5 text-accent" />
                        <div className="text-2xl font-bold">{totalUpvotes}</div>
                        <div className="text-xs text-muted-foreground">Upvotes</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
                        <div className="mx-auto mb-1 h-5 w-5 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-[10px] font-bold">{sentimentBreakdown.positive}</div>
                        <div className="text-2xl font-bold">{myComments.length ? Math.round((sentimentBreakdown.positive / myComments.length) * 100) : 0}%</div>
                        <div className="text-xs text-muted-foreground">Positive</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
                        <div className="mx-auto mb-1 h-5 w-5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center text-[10px] font-bold">{sentimentBreakdown.negative}</div>
                        <div className="text-2xl font-bold">{myComments.length ? Math.round((sentimentBreakdown.negative / myComments.length) * 100) : 0}%</div>
                        <div className="text-xs text-muted-foreground">Negative</div>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Profile Details */}
                    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                            <User className="h-5 w-5 text-accent" />
                            Profile Details
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your display name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input id="email" value={user.email} disabled className="pl-10 opacity-60" />
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <Button type="submit" className="gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </form>
                    </section>

                    {/* Account Info */}
                    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                            <Calendar className="h-5 w-5 text-accent" />
                            Account Info
                        </h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Account Type</span>
                                <span className="flex items-center gap-1 font-medium capitalize">
                                    {profile?.role === 'admin' ? <Shield className="h-3 w-3 text-primary" /> : null}
                                    {profile?.role || 'User'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Joined</span>
                                <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Total Comments</span>
                                <span className="font-medium">{myComments.length}</span>
                            </div>
                        </div>
                    </section>

                    {/* Recent Comments */}
                    {myComments.length > 0 && (
                        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                            <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                                <MessageSquare className="h-5 w-5 text-accent" />
                                Recent Comments
                            </h2>
                            <div className="space-y-3">
                                {myComments.slice(0, 5).map(c => (
                                    <div key={c.id} className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-sm">{c.text}</p>
                                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.sentiment === 'positive' ? 'bg-green-500/10 text-green-600' :
                                                c.sentiment === 'negative' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>{c.sentiment || 'neutral'}</span>
                                            <span>👍 {c.upvotes || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Danger Zone */}
                    <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-bold text-destructive">Danger Zone</h2>
                        <p className="mb-4 text-sm text-muted-foreground">Once you sign out, you will need to enter your credentials again.</p>
                        <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
