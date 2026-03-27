import type { PortfolioWithRelations } from "@/types";

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    date: string;
    description: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    techStack: string[];
    url?: string;
  }>;
  skills: Array<{
    name: string;
    level: number;
  }>;
  technologies: string[];
}

export function extractResumeData(
  portfolio: PortfolioWithRelations,
  user: { name?: string | null; email?: string | null; bio?: string | null }
): ResumeData {
  const data: ResumeData = {
    name: user.name ?? "Your Name",
    title: user.bio ?? "",
    email: user.email ?? "",
    experience: [],
    projects: [],
    skills: [],
    technologies: [],
  };

  for (const section of portfolio.sections) {
    for (const block of section.blocks) {
      const content = block.content as Record<string, unknown>;

      switch (block.type) {
        case "contact_info": {
          // ContactInfoContent uses items: Array<{type, label, value}>
          const items = Array.isArray(content.items) ? content.items : [];
          for (const item of items) {
            const it = item as Record<string, unknown>;
            const type = String(it.type ?? "");
            const value = String(it.value ?? "");
            if (!value) continue;
            switch (type) {
              case "email":
                data.email = value;
                break;
              case "phone":
                data.phone = value;
                break;
              case "location":
                data.location = value;
                break;
              case "website":
                data.website = value;
                break;
            }
          }
          // Also handle flat fields for flexibility
          if (content.email) data.email = String(content.email);
          if (content.phone) data.phone = String(content.phone);
          if (content.location) data.location = String(content.location);
          if (content.website) data.website = String(content.website);
          if (content.linkedin) data.linkedin = String(content.linkedin);
          if (content.github) data.github = String(content.github);
          break;
        }
        case "experience_item": {
          // ExperienceItemContent uses role, startDate, endDate, current
          const startDate = String(content.startDate ?? content.date ?? "");
          const endDate = content.current
            ? "Present"
            : String(content.endDate ?? "");
          const date =
            startDate && endDate
              ? `${startDate} - ${endDate}`
              : String(content.date ?? content.period ?? startDate);
          data.experience.push({
            title: String(content.role ?? content.title ?? ""),
            company: String(content.company ?? ""),
            date,
            description: String(content.description ?? ""),
          });
          break;
        }
        case "project_card": {
          const techStack = Array.isArray(content.techStack)
            ? (content.techStack as string[])
            : typeof content.techStack === "string"
              ? (content.techStack as string)
                  .split(",")
                  .map((s: string) => s.trim())
              : [];
          data.projects.push({
            title: String(content.title ?? ""),
            description: String(content.description ?? ""),
            techStack,
            url:
              (content.liveUrl as string) ??
              (content.repoUrl as string) ??
              undefined,
          });
          break;
        }
        case "skill_bar": {
          data.skills.push({
            name: String(content.name ?? ""),
            level: Number(content.level ?? 50),
          });
          break;
        }
        case "skill_grid": {
          // SkillGridContent uses skills array
          const items = Array.isArray(content.skills)
            ? content.skills
            : Array.isArray(content.items)
              ? content.items
              : [];
          for (const item of items) {
            const it = item as Record<string, unknown>;
            data.skills.push({
              name: String(it.name ?? ""),
              level: Number(it.level ?? 50),
            });
          }
          break;
        }
        case "badge_group": {
          // BadgeGroupContent uses badges array
          const badges = Array.isArray(content.badges)
            ? content.badges
            : Array.isArray(content.items)
              ? content.items
              : [];
          for (const badge of badges) {
            const b =
              typeof badge === "string"
                ? badge
                : String(
                    (badge as Record<string, unknown>).text ?? badge
                  );
            if (b) data.technologies.push(b);
          }
          break;
        }
        case "badge": {
          const text = String(content.text ?? "");
          if (text) data.technologies.push(text);
          break;
        }
        case "social_links": {
          // SocialLinksContent uses links array with platform + url
          const links = Array.isArray(content.links) ? content.links : [];
          for (const link of links) {
            const l = link as Record<string, unknown>;
            const platform = String(l.platform ?? "").toLowerCase();
            const url = String(l.url ?? "");
            if (!url) continue;
            if (platform.includes("linkedin")) data.linkedin = url;
            else if (platform.includes("github")) data.github = url;
            else if (platform.includes("website") || platform.includes("web"))
              data.website = url;
          }
          break;
        }
        case "text": {
          // Use first text block as summary if not yet set
          if (!data.summary && content.text) {
            const text = String(content.text);
            if (text.length > 30) data.summary = text;
          }
          break;
        }
      }
    }
  }

  return data;
}
