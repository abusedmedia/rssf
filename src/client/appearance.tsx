import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Appearance = "light" | "dark";

const STORAGE_KEY = "rssf-appearance";

function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

type AppearanceContextValue = {
  appearance: Appearance;
  toggle: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);

  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
    try {
      localStorage.setItem(STORAGE_KEY, appearance);
    } catch {
      /* ignore */
    }
  }, [appearance]);

  const value = useMemo(
    () => ({
      appearance,
      toggle: () =>
        setAppearance((current) => (current === "dark" ? "light" : "dark")),
    }),
    [appearance],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
