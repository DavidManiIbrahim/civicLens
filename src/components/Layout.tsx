import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Users,
  FileText,
  Menu,
  X,
  Landmark,
  LogIn,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hearing", label: "Live Hearing", icon: Radio },
  { to: "/sentiment", label: "Sentiment", icon: BarChart3 },
  { to: "/peoples-view", label: "People's View", icon: Users },
  { to: "/insights", label: "Insights", icon: FileText },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) {
      // For visitors, only show specific public-facing links
      return item.to === "/hearing";
    }
    // For logged in users, show all (or could filter further if needed)
    return true;
  });

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Landmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              CivicLens
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {filteredNavItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${location.pathname === "/admin"
                  ? "bg-primary text-primary-foreground"
                  : "text-accent hover:bg-accent/10"
                  }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Auth + Live indicator */}
          <div className="hidden items-center gap-3 md:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
            <span className="text-sm font-medium text-destructive">LIVE</span>

            {user ? (
              <div className="ml-2 flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent transition-transform hover:scale-110"
                >
                  <User className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => { console.log("🖱️ Desktop Sign Out button clicked"); signOut(); }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="ml-2 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="border-t border-border bg-card p-4 md:hidden">
            {filteredNavItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${location.pathname === "/admin"
                  ? "bg-primary text-primary-foreground"
                  : "text-accent hover:bg-accent/10"
                  }`}
              >
                <Shield className="h-4 w-4" />
                Admin Console
              </Link>
            )}
            {user ? (
              <button
                onClick={() => { console.log("🖱️ Mobile Sign Out button clicked"); signOut(); setMobileOpen(false); }}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-lg bg-accent px-3 py-3 text-sm font-semibold text-accent-foreground"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </nav>
        )}
      </header>

      <main>{children}</main>
    </div >
  );
}
