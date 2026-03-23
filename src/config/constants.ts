export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Foliocraft";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type SectionType = "HERO" | "ABOUT" | "SKILLS" | "PROJECTS" | "EXPERIENCE" | "CONTACT" | "CUSTOM";

export const SECTION_LABELS: Record<SectionType, string> = {
  HERO: "Hero",
  ABOUT: "About Me",
  SKILLS: "Skills",
  PROJECTS: "Projects",
  EXPERIENCE: "Experience",
  CONTACT: "Contact",
  CUSTOM: "Custom Section",
};

export const SECTION_ICONS: Record<SectionType, string> = {
  HERO: "Sparkles",
  ABOUT: "User",
  SKILLS: "Wrench",
  PROJECTS: "FolderKanban",
  EXPERIENCE: "Briefcase",
  CONTACT: "Mail",
  CUSTOM: "LayoutGrid",
};

export const DEFAULT_SECTIONS: SectionType[] = [
  "HERO",
  "ABOUT",
  "SKILLS",
  "PROJECTS",
  "EXPERIENCE",
  "CONTACT",
];

export const FONT_OPTIONS = [
  { label: "Outfit", value: "Outfit" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Sora", value: "Sora" },
  { label: "Manrope", value: "Manrope" },
  { label: "Cabinet Grotesk", value: "Cabinet Grotesk" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Poppins", value: "Poppins" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "Inter", value: "Inter" },
  { label: "JetBrains Mono", value: "JetBrains Mono" },
] as const;

export const COLOR_PRESETS = [
  { name: "Indigo", primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4" },
  { name: "Emerald", primary: "#10b981", secondary: "#059669", accent: "#f59e0b" },
  { name: "Rose", primary: "#f43f5e", secondary: "#e11d48", accent: "#8b5cf6" },
  { name: "Amber", primary: "#f59e0b", secondary: "#d97706", accent: "#3b82f6" },
  { name: "Sky", primary: "#0ea5e9", secondary: "#0284c7", accent: "#f43f5e" },
  { name: "Slate", primary: "#64748b", secondary: "#475569", accent: "#6366f1" },
] as const;

export const SOCIAL_PLATFORMS = [
  { id: "github", label: "GitHub", icon: "Github", urlPrefix: "https://github.com/" },
  { id: "linkedin", label: "LinkedIn", icon: "Linkedin", urlPrefix: "https://linkedin.com/in/" },
  { id: "twitter", label: "Twitter/X", icon: "Twitter", urlPrefix: "https://x.com/" },
  { id: "dribbble", label: "Dribbble", icon: "Dribbble", urlPrefix: "https://dribbble.com/" },
  { id: "website", label: "Website", icon: "Globe", urlPrefix: "" },
] as const;

export const MAX_PORTFOLIOS_PER_USER = 5;
export const MAX_SECTIONS_PER_PORTFOLIO = 15;
export const MAX_PROJECTS_PER_SECTION = 20;
