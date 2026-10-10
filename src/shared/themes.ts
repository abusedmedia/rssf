export const FORM_THEMES = ["paper", "night", "signal"] as const;

export type FormTheme = (typeof FORM_THEMES)[number];

export const FORM_THEME_LABELS: Record<FormTheme, string> = {
  paper: "Paper",
  night: "Night",
  signal: "Signal",
};

export function isFormTheme(value: unknown): value is FormTheme {
  return value === "paper" || value === "night" || value === "signal";
}

export function normalizeFormTheme(value: unknown): FormTheme {
  return isFormTheme(value) ? value : "paper";
}
