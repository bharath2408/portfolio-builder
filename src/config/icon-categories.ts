// ─── Icon Categories ─────────────────────────────────────────────
// Curated subsets of Lucide icons organized by use case.

export interface IconCategory {
  id: string;
  label: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: "popular",
    label: "Popular",
    icons: [
      "Github", "Linkedin", "Twitter", "Mail", "Phone", "MapPin",
      "Globe", "ArrowRight", "Star", "Heart", "Code", "Terminal",
      "Briefcase", "GraduationCap", "Award", "Zap", "Sparkles", "Rocket",
    ],
  },
  {
    id: "arrows",
    label: "Arrows",
    icons: [
      "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
      "ChevronRight", "ChevronLeft", "ChevronUp", "ChevronDown",
      "ChevronsRight", "ExternalLink", "ArrowUpRight", "MoveRight",
      "CornerDownRight",
    ],
  },
  {
    id: "development",
    label: "Development",
    icons: [
      "Code", "Code2", "Terminal", "GitBranch", "GitCommit", "GitPullRequest",
      "Database", "Server", "Cloud", "Cpu", "HardDrive", "Wifi",
      "Binary", "Braces", "FileCode", "Bug",
    ],
  },
  {
    id: "social",
    label: "Social",
    icons: [
      "Github", "Linkedin", "Twitter", "Facebook", "Instagram",
      "Youtube", "Twitch", "Figma", "Dribbble", "Chrome", "Slack",
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icons: [
      "Mail", "Phone", "MessageCircle", "MessageSquare", "Send",
      "Bell", "AtSign", "Inbox", "Voicemail",
    ],
  },
  {
    id: "media",
    label: "Media",
    icons: [
      "Image", "Camera", "Video", "Music", "Play", "Monitor",
      "Headphones", "Mic", "Film", "Tv", "Radio", "Podcast",
    ],
  },
  {
    id: "files",
    label: "Files",
    icons: [
      "File", "FileText", "Folder", "Download", "Upload",
      "Paperclip", "FileJson", "FileCode", "FolderOpen",
    ],
  },
  {
    id: "general",
    label: "General",
    icons: [
      "Home", "Search", "Settings", "User", "Heart", "Star",
      "Rocket", "Bookmark", "Clock", "Calendar", "Shield",
      "Key", "Lock", "Unlock", "Eye", "EyeOff", "Trash2", "Edit",
    ],
  },
];

/** Get recent icons from localStorage */
export function getRecentIcons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("foliocraft-recent-icons");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Add an icon to the recent icons list */
export function addRecentIcon(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentIcons().filter((n) => n !== name);
    recent.unshift(name);
    localStorage.setItem(
      "foliocraft-recent-icons",
      JSON.stringify(recent.slice(0, 10)),
    );
  } catch {
    // ignore
  }
}
