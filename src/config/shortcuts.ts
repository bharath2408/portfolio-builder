export interface ShortcutDefinition {
  keys: string;
  label: string;
  category: "file" | "edit" | "view" | "tools";
}

export const SHORTCUTS: ShortcutDefinition[] = [
  // File
  { keys: "Ctrl+S", label: "Save", category: "file" },
  { keys: "Ctrl+E", label: "Export JSON", category: "file" },
  { keys: "Ctrl+H", label: "Export HTML", category: "file" },
  { keys: "Ctrl+P", label: "Preview", category: "file" },

  // Edit
  { keys: "Ctrl+Z", label: "Undo", category: "edit" },
  { keys: "Ctrl+Shift+Z", label: "Redo", category: "edit" },
  { keys: "Ctrl+C", label: "Copy block", category: "edit" },
  { keys: "Ctrl+V", label: "Paste block", category: "edit" },
  { keys: "Delete", label: "Delete block", category: "edit" },
  { keys: "Escape", label: "Deselect", category: "edit" },

  // View
  { keys: "Ctrl+\\", label: "Toggle left panel", category: "view" },
  { keys: "Ctrl+/", label: "Toggle right panel", category: "view" },
  { keys: "Ctrl+=", label: "Zoom in", category: "view" },
  { keys: "Ctrl+-", label: "Zoom out", category: "view" },
  { keys: "Ctrl+0", label: "Reset zoom", category: "view" },
  { keys: "Ctrl+1", label: "Fit to screen", category: "view" },

  // Tools
  { keys: "V", label: "Select tool", category: "tools" },
  { keys: "R", label: "Rectangle tool", category: "tools" },
  { keys: "O", label: "Circle tool", category: "tools" },
  { keys: "L", label: "Line tool", category: "tools" },
  { keys: "T", label: "Add text", category: "tools" },
  { keys: "?", label: "Show shortcuts", category: "tools" },
  { keys: "Ctrl+K", label: "Command palette", category: "tools" },
];

export const SHORTCUT_CATEGORIES: Record<string, string> = {
  file: "File",
  edit: "Edit",
  view: "View",
  tools: "Tools",
};
