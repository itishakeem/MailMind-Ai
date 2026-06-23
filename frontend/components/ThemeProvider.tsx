"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type ThemeId, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

const MODE_STORAGE_KEY = "mailmind_mode";

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  mode: "light" | "dark";
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  mode: "light",
  toggleMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mode,  setModeState]  = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    const savedMode = (localStorage.getItem(MODE_STORAGE_KEY) ?? "light") as "light" | "dark";
    setModeState(savedMode);
    document.documentElement.setAttribute("data-mode", savedMode);
  }, []);

  function setTheme(t: ThemeId) {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
    document.documentElement.classList.add("theme-transitioning");
    document.documentElement.setAttribute("data-theme", t);
    setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 400);
  }

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setModeState(next);
    localStorage.setItem(MODE_STORAGE_KEY, next);
    document.documentElement.classList.add("theme-transitioning");
    document.documentElement.setAttribute("data-mode", next);
    setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 400);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
