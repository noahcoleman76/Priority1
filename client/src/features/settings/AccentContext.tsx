import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ACCENT_STORAGE_KEY = "priority1_accent";

export type AccentPreset = {
  id: string;
  name: string;
  colors: {
    accent: string;
    accentStrong: string;
    accentSoft: string;
    accentBorder: string;
    accentText: string;
    pageStart: string;
    pageMid: string;
  };
};

export const accentPresets: AccentPreset[] = [
  {
    id: "orange",
    name: "Clementine",
    colors: {
      accent: "#c2410c",
      accentStrong: "#9a3412",
      accentSoft: "#ffedd5",
      accentBorder: "#fed7aa",
      accentText: "#7c2d12",
      pageStart: "#fff7ed",
      pageMid: "#fffaf5"
    }
  },
  {
    id: "blue",
    name: "Harbor",
    colors: {
      accent: "#2563eb",
      accentStrong: "#1d4ed8",
      accentSoft: "#dbeafe",
      accentBorder: "#bfdbfe",
      accentText: "#1e3a8a",
      pageStart: "#eff6ff",
      pageMid: "#f8fbff"
    }
  },
  {
    id: "green",
    name: "Sage",
    colors: {
      accent: "#2f855a",
      accentStrong: "#276749",
      accentSoft: "#dcfce7",
      accentBorder: "#bbf7d0",
      accentText: "#14532d",
      pageStart: "#f0fdf4",
      pageMid: "#fbfefc"
    }
  },
  {
    id: "rose",
    name: "Rosewood",
    colors: {
      accent: "#be123c",
      accentStrong: "#9f1239",
      accentSoft: "#ffe4e6",
      accentBorder: "#fecdd3",
      accentText: "#881337",
      pageStart: "#fff1f2",
      pageMid: "#fff8f8"
    }
  },
  {
    id: "violet",
    name: "Iris",
    colors: {
      accent: "#7c3aed",
      accentStrong: "#6d28d9",
      accentSoft: "#ede9fe",
      accentBorder: "#ddd6fe",
      accentText: "#4c1d95",
      pageStart: "#f5f3ff",
      pageMid: "#fbfaff"
    }
  },
  {
    id: "teal",
    name: "Lagoon",
    colors: {
      accent: "#0f766e",
      accentStrong: "#115e59",
      accentSoft: "#ccfbf1",
      accentBorder: "#99f6e4",
      accentText: "#134e4a",
      pageStart: "#f0fdfa",
      pageMid: "#fbfffd"
    }
  }
];

type AccentContextValue = {
  accentId: string;
  setAccentId: (accentId: string) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

const getPreset = (accentId: string) =>
  accentPresets.find((preset) => preset.id === accentId) ?? accentPresets[0];

export const AccentProvider = ({ children }: { children: React.ReactNode }) => {
  const [accentId, setAccentIdState] = useState(
    () => localStorage.getItem(ACCENT_STORAGE_KEY) ?? accentPresets[0].id
  );

  useEffect(() => {
    const preset = getPreset(accentId);
    const root = document.documentElement;
    root.style.setProperty("--accent", preset.colors.accent);
    root.style.setProperty("--accent-strong", preset.colors.accentStrong);
    root.style.setProperty("--accent-soft", preset.colors.accentSoft);
    root.style.setProperty("--accent-border", preset.colors.accentBorder);
    root.style.setProperty("--accent-text", preset.colors.accentText);
    root.style.setProperty("--page-start", preset.colors.pageStart);
    root.style.setProperty("--page-mid", preset.colors.pageMid);
  }, [accentId]);

  const setAccentId = (nextAccentId: string) => {
    localStorage.setItem(ACCENT_STORAGE_KEY, nextAccentId);
    setAccentIdState(nextAccentId);
  };

  const value = useMemo(() => ({ accentId, setAccentId }), [accentId]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
};

export const useAccent = () => {
  const context = useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent must be used inside AccentProvider");
  }
  return context;
};
