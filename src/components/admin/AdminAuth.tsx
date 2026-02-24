import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, UserPlus, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminAuth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, user, signOut } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isSignUp) {
            // Force role to admin
            const { error } = await signUp(email, password, displayName, "admin");
            if (error) {
                toast({ title: "Admin creation failed", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Admin account created", description: "You can now sign in with your admin credentials." });
                setIsSignUp(false);
            }
        } else {
            const { error } = await signIn(email, password);
            if (error) {
                toast({ title: "Login failed", description: error.message, variant: "destructive" });
            }
        }
        setLoading(false);
    };

    // If user is already logged in but reached here, they might be a "Citizen" trying to access admin
    if (user) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-card">
                    <Shield className="mx-auto h-16 w-16 text-destructive opacity-30" />
                    <h2 className="mt-6 text-2xl font-bold text-foreground">Restricted Port</h2>
                    <p className="mt-4 text-muted-foreground">
                        You are currently signed in as a <b>Citizen</b>. This terminal is reserved for authorized government administrators.
                    </p>
                    <div className="mt-8 space-y-4">
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
                            Return to Citizen Dashboard
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => { console.log("🖱️ AdminAuth Sign Out button clicked"); signOut(); }}>
                            Sign Out and Switch Account
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
                        <Shield className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Admin <span className="text-accent">Port</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isSignUp ? "Register new administrator credentials" : "Enter government credentials to proceed"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="admin-name">Admin Display Name</Label>
                            <Input
                                id="admin-name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Chief Administrator"
                                required
                                className="bg-muted/30"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Official Email</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@civiclens.gov"
                            required
                            className="bg-muted/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Secure Key</Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="pl-10 bg-muted/30"
                                minLength={8}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="h-12 w-full font-bold shadow-glow" disabled={loading}>
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        ) : isSignUp ? (
                            <><UserPlus className="mr-2 h-4 w-4" /> Initialize Admin Account</>
                        ) : (
                            <><LogIn className="mr-2 h-4 w-4" /> Secure Login</>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-medium text-accent hover:underline"
                    >
                        {isSignUp ? "Already have an admin key? Sign in" : "Authorized to initialize a new admin? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
