`/**
 * Fallback mock data when Supabase is unavailable.
 * Allows the app to function in offline/demo mode.
 */

export const FALLBACK_HEARINGS = [
  {
    id: "hearing-1",
    title: "Clean Air Amendment Act - Environmental Impact Review",
    committee: "Environment & Public Works",
    description: "Hearing to examine the environmental and economic impacts of the proposed Clean Air Amendment Act.",
    stream_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "live" as const,
    scheduled_at: new Date().toISOString(),
    viewers: 12847,
    created_at: new Date().toISOString(),
  },
  {
    id: "hearing-2",
    title: "Digital Privacy Rights - Consumer Protection Standards",
    committee: "Commerce & Technology",
    description: "Review of proposed consumer data protection standards.",
    stream_url: null,
    status: "upcoming" as const,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    viewers: 0,
    created_at: new Date().toISOString(),
  },
];

export const FALLBACK_PROFILES = [
  {
    id: "profile-1",
    user_id: "user-1",
    display_name: "Demo User",
    avatar_url: null,
    role: "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const FALLBACK_COMMENTS: any[] = [];

export const FALLBACK_VOTES: any[] = [];

/**
 * Load mock session from localStorage for offline mode
 */
export function loadMockSession() {
  try {
    const stored = localStorage.getItem("app:mock-session");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save mock session to localStorage
 */
export function saveMockSession(session: any) {
  try {
    localStorage.setItem("app:mock-session", JSON.stringify(session));
  } catch (err) {
    console.warn("Could not save mock session:", err);
  }
}
