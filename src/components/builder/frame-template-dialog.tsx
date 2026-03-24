"use client";

import { useState } from "react";
import {
  X,
  Layout,
  User,
  Code2,
  FolderKanban,
  Mail,
  MessageSquareQuote,
  Briefcase,
  BarChart3,
  Sparkles,
} from "lucide-react";

import type { ThemeTokens, BlockStyles } from "@/types";

// ─── Template Definition ────────────────────────────────────────

interface TemplateBlock {
  type: string;
  content: Record<string, unknown>;
  styles: Partial<BlockStyles>;
}

interface FrameTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  frameHeight: number;
  blocks: (theme: ThemeTokens) => TemplateBlock[];
}

// ─── Templates ──────────────────────────────────────────────────

const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty frame — start from scratch",
    icon: <Layout className="h-5 w-5" />,
    frameHeight: 800,
    blocks: () => [],
  },
  {
    id: "hero",
    name: "Hero",
    description: "Heading, subtitle, and CTA button",
    icon: <Sparkles className="h-5 w-5" />,
    frameHeight: 700,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "Hi, I'm Your Name", level: 1, highlight: "Your Name" },
        styles: { x: 80, y: 180, w: 800, h: 0, fontSize: 56, fontWeight: 800, color: t.textColor },
      },
      {
        type: "text",
        content: { text: "A passionate developer building modern web experiences. I craft clean, performant applications with attention to detail." },
        styles: { x: 80, y: 280, w: 700, h: 0, fontSize: 18, opacity: 0.7, color: t.mutedColor },
      },
      {
        type: "button",
        content: { label: "View My Work", linkTo: "url", url: "#", variant: "solid", size: "lg", icon: true },
        styles: { x: 80, y: 370, w: 220, h: 52, backgroundColor: t.primaryColor },
      },
    ],
  },
  {
    id: "about",
    name: "About",
    description: "Bio text with stats",
    icon: <User className="h-5 w-5" />,
    frameHeight: 700,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "About Me", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "text",
        content: { text: "Write a few paragraphs about yourself — your background, what drives you, and what you're working on. Keep it authentic and concise." },
        styles: { x: 80, y: 150, w: 700, h: 0, fontSize: 16, opacity: 0.8, color: t.mutedColor },
      },
      {
        type: "stat",
        content: { value: "5+", label: "Years Experience" },
        styles: { x: 80, y: 280, w: 180, h: 80, color: t.primaryColor },
      },
      {
        type: "stat",
        content: { value: "30+", label: "Projects Built" },
        styles: { x: 300, y: 280, w: 180, h: 80, color: t.primaryColor },
      },
      {
        type: "stat",
        content: { value: "10+", label: "Happy Clients" },
        styles: { x: 520, y: 280, w: 180, h: 80, color: t.primaryColor },
      },
    ],
  },
  {
    id: "skills",
    name: "Skills",
    description: "Skill bars with heading",
    icon: <BarChart3 className="h-5 w-5" />,
    frameHeight: 700,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "Skills & Expertise", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "skill_bar",
        content: { name: "React / Next.js", level: 90, showPercentage: true },
        styles: { x: 80, y: 170, w: 600, h: 40, color: t.primaryColor },
      },
      {
        type: "skill_bar",
        content: { name: "TypeScript", level: 85, showPercentage: true },
        styles: { x: 80, y: 230, w: 600, h: 40, color: t.primaryColor },
      },
      {
        type: "skill_bar",
        content: { name: "Node.js / Express", level: 80, showPercentage: true },
        styles: { x: 80, y: 290, w: 600, h: 40, color: t.primaryColor },
      },
      {
        type: "skill_bar",
        content: { name: "Python", level: 70, showPercentage: true },
        styles: { x: 80, y: 350, w: 600, h: 40, color: t.primaryColor },
      },
      {
        type: "skill_bar",
        content: { name: "UI/UX Design", level: 75, showPercentage: true },
        styles: { x: 80, y: 410, w: 600, h: 40, color: t.secondaryColor },
      },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project cards in a grid",
    icon: <FolderKanban className="h-5 w-5" />,
    frameHeight: 900,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "Featured Projects", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "project_card",
        content: { title: "Project One", description: "A brief description of your first project and what problem it solves.", techStack: "React, TypeScript, Tailwind" },
        styles: { x: 80, y: 170, w: 600, h: 220, backgroundColor: t.surfaceColor, borderRadius: 12, borderWidth: 1, borderColor: `${t.textColor}15` },
      },
      {
        type: "project_card",
        content: { title: "Project Two", description: "Another great project showcasing your skills and creativity.", techStack: "Next.js, Prisma, PostgreSQL" },
        styles: { x: 740, y: 170, w: 600, h: 220, backgroundColor: t.surfaceColor, borderRadius: 12, borderWidth: 1, borderColor: `${t.textColor}15` },
      },
      {
        type: "project_card",
        content: { title: "Project Three", description: "A third project demonstrating your range and technical depth.", techStack: "Python, FastAPI, Redis" },
        styles: { x: 80, y: 430, w: 600, h: 220, backgroundColor: t.surfaceColor, borderRadius: 12, borderWidth: 1, borderColor: `${t.textColor}15` },
      },
    ],
  },
  {
    id: "experience",
    name: "Experience",
    description: "Work history timeline",
    icon: <Briefcase className="h-5 w-5" />,
    frameHeight: 800,
    blocks: () => [
      {
        type: "heading",
        content: { text: "Work Experience", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "experience",
        content: { company: "Current Company", role: "Senior Developer", startDate: "2023", endDate: "Present", description: "Leading frontend architecture and mentoring junior developers.", isCurrent: true },
        styles: { x: 80, y: 170, w: 700, h: 0 },
      },
      {
        type: "experience",
        content: { company: "Previous Company", role: "Full-Stack Developer", startDate: "2021", endDate: "2023", description: "Built and maintained customer-facing web applications." },
        styles: { x: 80, y: 320, w: 700, h: 0 },
      },
      {
        type: "experience",
        content: { company: "First Job", role: "Junior Developer", startDate: "2019", endDate: "2021", description: "Started my career building internal tools and learning best practices." },
        styles: { x: 80, y: 470, w: 700, h: 0 },
      },
    ],
  },
  {
    id: "testimonials",
    name: "Testimonials",
    description: "Client quotes and feedback",
    icon: <MessageSquareQuote className="h-5 w-5" />,
    frameHeight: 600,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "What People Say", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "testimonial",
        content: { quote: "An exceptional developer who delivers quality work on time. Highly recommended!", author: "Jane Smith", role: "CEO, TechCorp" },
        styles: { x: 80, y: 180, w: 580, h: 0, backgroundColor: t.surfaceColor, borderRadius: 12, padding: 24 },
      },
      {
        type: "testimonial",
        content: { quote: "Great communication and technical skills. Transformed our product vision into reality.", author: "John Doe", role: "Product Manager" },
        styles: { x: 720, y: 180, w: 580, h: 0, backgroundColor: t.surfaceColor, borderRadius: 12, padding: 24 },
      },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    description: "Contact form with info",
    icon: <Mail className="h-5 w-5" />,
    frameHeight: 700,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "Get In Touch", level: 2 },
        styles: { x: 80, y: 80, w: 600, h: 0, fontSize: 36, fontWeight: 700 },
      },
      {
        type: "text",
        content: { text: "Have a project in mind? Let's talk about how we can work together." },
        styles: { x: 80, y: 150, w: 600, h: 0, fontSize: 16, opacity: 0.7, color: t.mutedColor },
      },
      {
        type: "contact_form",
        content: { fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "email", label: "Email", type: "email", required: true }, { name: "message", label: "Message", type: "textarea", required: true }], submitText: "Send Message" },
        styles: { x: 80, y: 230, w: 600, h: 350, backgroundColor: t.surfaceColor, borderRadius: 12, padding: 24 },
      },
      {
        type: "social_links",
        content: { links: [{ platform: "github", url: "https://github.com" }, { platform: "linkedin", url: "https://linkedin.com" }, { platform: "twitter", url: "https://twitter.com" }], layout: "row", showLabels: false },
        styles: { x: 750, y: 230, w: 300, h: 0 },
      },
    ],
  },
  {
    id: "cta",
    name: "CTA",
    description: "Call-to-action banner",
    icon: <Code2 className="h-5 w-5" />,
    frameHeight: 400,
    blocks: (t) => [
      {
        type: "heading",
        content: { text: "Ready to work together?", level: 2 },
        styles: { x: 300, y: 100, w: 840, h: 0, fontSize: 40, fontWeight: 700, textAlign: "center" },
      },
      {
        type: "text",
        content: { text: "I'm currently available for freelance projects and full-time opportunities." },
        styles: { x: 370, y: 180, w: 700, h: 0, fontSize: 16, opacity: 0.7, textAlign: "center", color: t.mutedColor },
      },
      {
        type: "button",
        content: { label: "Let's Talk", linkTo: "url", url: "mailto:hello@example.com", variant: "solid", size: "lg", icon: true },
        styles: { x: 590, y: 250, w: 260, h: 52, backgroundColor: t.primaryColor },
      },
    ],
  },
];

// ─── Dialog Component ───────────────────────────────────────────

interface FrameTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: FrameTemplate) => void;
  theme: ThemeTokens;
}

export function FrameTemplateDialog({ open, onClose, onSelect, theme }: FrameTemplateDialogProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-xl border shadow-2xl"
        style={{
          backgroundColor: "var(--b-surface, #1e293b)",
          borderColor: "var(--b-border, #334155)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--b-border, #334155)" }}
        >
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: "var(--b-text, #f8fafc)" }}>
              Add Frame
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--b-text-3, #94a3b8)" }}>
              Choose a template or start blank
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: "var(--b-text-3, #94a3b8)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-3 gap-3 p-5">
          {FRAME_TEMPLATES.map((tmpl) => {
            const isHovered = hoveredId === tmpl.id;
            const blockCount = tmpl.blocks(theme).length;
            return (
              <button
                key={tmpl.id}
                onClick={() => onSelect(tmpl)}
                onMouseEnter={() => setHoveredId(tmpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group flex flex-col items-center rounded-lg border p-4 text-left transition-all"
                style={{
                  borderColor: isHovered ? theme.primaryColor : "var(--b-border, #334155)",
                  backgroundColor: isHovered ? `${theme.primaryColor}10` : "transparent",
                }}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                  style={{
                    backgroundColor: isHovered ? `${theme.primaryColor}20` : "var(--b-bg, #0f172a)",
                    color: isHovered ? theme.primaryColor : "var(--b-text-3, #94a3b8)",
                  }}
                >
                  {tmpl.icon}
                </div>
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--b-text, #f8fafc)" }}
                >
                  {tmpl.name}
                </span>
                <span
                  className="mt-0.5 text-center text-[10px] leading-tight"
                  style={{ color: "var(--b-text-4, #64748b)" }}
                >
                  {tmpl.description}
                </span>
                {blockCount > 0 && (
                  <span
                    className="mt-2 rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                  >
                    {blockCount} blocks
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { FRAME_TEMPLATES };
export type { FrameTemplate, TemplateBlock };
