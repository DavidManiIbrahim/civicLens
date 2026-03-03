import { useLocalStorage } from "./useLocalStorage";

export interface AppPreferences {
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  auto_sentiment_analysis: boolean;
  show_timestamps: boolean;
  compact_mode: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "system",
  notifications_enabled: true,
  auto_sentiment_analysis: true,
  show_timestamps: true,
  compact_mode: false,
};

/**
 * Hook for managing app preferences stored in localStorage
 */
export function useAppPreferences() {
  const [prefs, setPrefs] = useLocalStorage<AppPreferences>("app:preferences", DEFAULT_PREFERENCES);

  const updatePreference = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setPrefs(DEFAULT_PREFERENCES);
  };

  return { prefs, updatePreference, reset };
}
