import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, LogIn, UserPlus } from "lucide-react";
import BgImage from "/images/image.png";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName, role);
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup successful",
          description:
            "Please goto the signin page login with your credentials.",
        });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="relative container flex min-h-[80vh] items-center justify-center py-12">
        {/* background image positioned behind everything */}
        <img
          src={BgImage}
          alt="Capitol building"
          className="absolute inset-0 h-full w-full object-cover -z-10"
        />

        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-elevated">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Landmark className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isSignUp ? "Join CivicLens" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? "Create an account to participate in civic discourse"
                : "Sign in to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            {isSignUp && (
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex gap-4">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={role === "user"}
                      onChange={() => setRole("user")}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Citizen</span>
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === "admin"}
                      onChange={() => setRole("admin")}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Administrator</span>
                  </label>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Loading..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-accent hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
