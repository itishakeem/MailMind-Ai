export type ThemeId = "indigo" | "ocean" | "sunset" | "forest" | "aurora";

export const THEMES: { id: ThemeId; label: string; gradient: string }[] = [
  { id: "indigo", label: "Indigo",  gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  { id: "ocean",  label: "Ocean",   gradient: "linear-gradient(135deg, #38bdf8, #0891b2)" },
  { id: "sunset", label: "Sunset",  gradient: "linear-gradient(135deg, #fb923c, #e11d48)" },
  { id: "forest", label: "Forest",  gradient: "linear-gradient(135deg, #34d399, #0891b2)" },
  { id: "aurora", label: "Aurora",  gradient: "linear-gradient(135deg, #e879f9, #8b5cf6)" },
];

export const THEME_STORAGE_KEY = "mailmind_theme";
export const DEFAULT_THEME: ThemeId = "indigo";
