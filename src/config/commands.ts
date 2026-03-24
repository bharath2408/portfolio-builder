export interface CommandDefinition {
  id: string;
  label: string;
  shortcut?: string;
  category: "file" | "edit" | "view" | "tools" | "add" | "help";
  keywords?: string[];
}

export const COMMANDS: CommandDefinition[] = [
  // File
  { id: "save", label: "Save", shortcut: "Ctrl+S", category: "file", keywords: ["save", "persist"] },
  { id: "publish", label: "Publish", category: "file", keywords: ["publish", "deploy", "live"] },
  { id: "preview", label: "Preview", shortcut: "Ctrl+P", category: "file", keywords: ["preview", "view"] },
  { id: "export-json", label: "Export as JSON", shortcut: "Ctrl+E", category: "file", keywords: ["export", "json", "download"] },
  { id: "export-html", label: "Export as HTML", shortcut: "Ctrl+H", category: "file", keywords: ["export", "html", "download"] },
  { id: "version-history", label: "Version History", category: "file", keywords: ["version", "history", "restore", "snapshot"] },
  { id: "back-to-dashboard", label: "Back to Dashboard", category: "file", keywords: ["dashboard", "home", "back", "exit"] },

  // Edit
  { id: "undo", label: "Undo", shortcut: "Ctrl+Z", category: "edit", keywords: ["undo", "revert"] },
  { id: "redo", label: "Redo", shortcut: "Ctrl+Shift+Z", category: "edit", keywords: ["redo", "replay"] },

  // View
  { id: "toggle-left-panel", label: "Toggle Left Panel", shortcut: "Ctrl+\\", category: "view", keywords: ["left", "panel", "layers", "sidebar"] },
  { id: "toggle-right-panel", label: "Toggle Right Panel", shortcut: "Ctrl+/", category: "view", keywords: ["right", "panel", "properties"] },
  { id: "zoom-in", label: "Zoom In", shortcut: "Ctrl+=", category: "view", keywords: ["zoom", "in", "bigger"] },
  { id: "zoom-out", label: "Zoom Out", shortcut: "Ctrl+-", category: "view", keywords: ["zoom", "out", "smaller"] },
  { id: "reset-zoom", label: "Reset Zoom", shortcut: "Ctrl+0", category: "view", keywords: ["zoom", "reset", "100"] },
  { id: "fit-to-screen", label: "Fit to Screen", shortcut: "Ctrl+1", category: "view", keywords: ["fit", "screen", "auto"] },
  { id: "device-desktop", label: "Desktop View", category: "view", keywords: ["desktop", "device", "responsive"] },
  { id: "device-tablet", label: "Tablet View", category: "view", keywords: ["tablet", "device", "responsive", "ipad"] },
  { id: "device-mobile", label: "Mobile View", category: "view", keywords: ["mobile", "device", "responsive", "phone"] },

  // Tools
  { id: "show-shortcuts", label: "Keyboard Shortcuts", shortcut: "?", category: "tools", keywords: ["keyboard", "shortcuts", "keys", "help"] },

  // Add blocks
  { id: "add-heading", label: "Add Heading", category: "add", keywords: ["heading", "title", "h1", "h2"] },
  { id: "add-text", label: "Add Text", category: "add", keywords: ["text", "paragraph", "body"] },
  { id: "add-image", label: "Add Image", category: "add", keywords: ["image", "photo", "picture"] },
  { id: "add-button", label: "Add Button", category: "add", keywords: ["button", "cta", "link"] },
  { id: "add-divider", label: "Add Divider", category: "add", keywords: ["divider", "separator", "line"] },
  { id: "add-spacer", label: "Add Spacer", category: "add", keywords: ["spacer", "space", "gap"] },
  { id: "add-project_card", label: "Add Project Card", category: "add", keywords: ["project", "card", "portfolio"] },
  { id: "add-skill_bar", label: "Add Skill Bar", category: "add", keywords: ["skill", "bar", "progress"] },
  { id: "add-experience_item", label: "Add Experience", category: "add", keywords: ["experience", "work", "job", "timeline"] },
  { id: "add-contact_form", label: "Add Contact Form", category: "add", keywords: ["contact", "form", "email"] },
  { id: "add-social_links", label: "Add Social Links", category: "add", keywords: ["social", "github", "linkedin", "twitter"] },
  { id: "add-badge", label: "Add Badge", category: "add", keywords: ["badge", "tag", "label"] },
  { id: "add-stat", label: "Add Stat", category: "add", keywords: ["stat", "number", "count"] },
  { id: "add-testimonial", label: "Add Testimonial", category: "add", keywords: ["testimonial", "quote", "review"] },
  { id: "add-avatar", label: "Add Avatar", category: "add", keywords: ["avatar", "profile", "photo"] },
  { id: "add-youtube", label: "Add YouTube Video", category: "add", keywords: ["youtube", "video", "embed"] },
  { id: "add-spotify", label: "Add Spotify Embed", category: "add", keywords: ["spotify", "music", "embed"] },
  { id: "add-google_map", label: "Add Google Map", category: "add", keywords: ["map", "google", "location"] },
  { id: "add-calendly", label: "Add Calendly", category: "add", keywords: ["calendly", "schedule", "booking"] },
  { id: "add-github_contrib", label: "Add GitHub Graph", category: "add", keywords: ["github", "contributions", "graph"] },
  { id: "add-custom_html", label: "Add Custom HTML", category: "add", keywords: ["html", "code", "custom", "script"] },

  // Help
  { id: "open-docs", label: "Open Documentation", category: "help", keywords: ["docs", "documentation", "help", "manual", "guide"] },
];

export const COMMAND_CATEGORIES: Record<string, string> = {
  file: "File",
  edit: "Edit",
  view: "View",
  tools: "Tools",
  add: "Add Block",
  help: "Help",
};
