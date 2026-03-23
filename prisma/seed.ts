import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Create demo user ────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash("Demo@1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@foliocraft.dev" },
    update: {},
    create: {
      email: "demo@foliocraft.dev",
      name: "Alex Chen",
      username: "alexchen",
      password: hashedPassword,
      bio: "Full-Stack Developer passionate about building beautiful web experiences.",
    },
  });

  console.log("✅ User created:", user.email);

  // ── Create portfolio ────────────────────────────────────────────

  const portfolio = await prisma.portfolio.upsert({
    where: { userId_slug: { userId: user.id, slug: "main" } },
    update: {},
    create: {
      userId: user.id,
      title: "My Portfolio",
      slug: "main",
      description: "Full-Stack Developer Portfolio",
      status: "PUBLISHED",
      isDefault: true,
    },
  });

  console.log("✅ Portfolio created:", portfolio.title);

  // ── Create theme ────────────────────────────────────────────────

  await prisma.theme.upsert({
    where: { portfolioId: portfolio.id },
    update: {},
    create: {
      portfolioId: portfolio.id,
      mode: "DARK",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#06b6d4",
      backgroundColor: "#0f172a",
      surfaceColor: "#1e293b",
      textColor: "#f8fafc",
      mutedColor: "#94a3b8",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      fontMono: "JetBrains Mono",
      borderRadius: "0.5rem",
    },
  });

  console.log("✅ Theme created");

  // ── Delete old sections ─────────────────────────────────────────

  await prisma.section.deleteMany({ where: { portfolioId: portfolio.id } });

  // ── HERO SECTION ────────────────────────────────────────────────

  const heroSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "Hero",
      sortOrder: 0,
      styles: {
        frameX: 0, frameY: 0,
        frameWidth: 1440, frameHeight: 900,
        layout: "absolute",
        backgroundColor: "#0f172a",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: heroSection.id,
        type: "text",
        sortOrder: 0,
        content: { text: "Hi, I'm" },
        styles: { x: 120, y: 240, w: 600, h: 0, fontSize: 18, fontFamily: "body", color: "primary", fontWeight: 500 },
      },
      {
        sectionId: heroSection.id,
        type: "heading",
        sortOrder: 1,
        content: { text: "Alex Chen", level: 1 },
        styles: { x: 120, y: 280, w: 800, h: 0, fontSize: 64, fontFamily: "heading", fontWeight: 800, lineHeight: 1.1 },
      },
      {
        sectionId: heroSection.id,
        type: "heading",
        sortOrder: 2,
        content: { text: "Full-Stack Developer", level: 2, highlight: "Full-Stack" },
        styles: { x: 120, y: 370, w: 700, h: 0, fontSize: 36, fontFamily: "heading", fontWeight: 700, color: "primary" },
      },
      {
        sectionId: heroSection.id,
        type: "text",
        sortOrder: 3,
        content: { text: "I build modern web applications with React, Next.js, and Node.js. Focused on clean code, great UX, and scalable architecture." },
        styles: { x: 120, y: 430, w: 560, h: 0, fontSize: 18, fontFamily: "body", lineHeight: 1.7, opacity: 0.7 },
      },
      {
        sectionId: heroSection.id,
        type: "button",
        sortOrder: 4,
        content: { text: "View My Work", url: "#projects", variant: "solid", size: "lg" },
        styles: { x: 120, y: 530, w: 200, h: 0, marginBottom: 24 },
      },
      {
        sectionId: heroSection.id,
        type: "social_links",
        sortOrder: 5,
        content: {
          links: [
            { platform: "github", url: "https://github.com", icon: "Github" },
            { platform: "linkedin", url: "https://linkedin.com", icon: "Linkedin" },
            { platform: "twitter", url: "https://x.com", icon: "Twitter" },
          ],
          variant: "outline",
        },
        styles: { x: 120, y: 590, w: 400, h: 0, display: "flex", gap: 12 },
      },
    ],
  });

  console.log("✅ Hero section + 6 blocks");

  // ── ABOUT SECTION ───────────────────────────────────────────────

  const aboutSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "About",
      sortOrder: 1,
      styles: {
        layout: "absolute",
        gap: 20,
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: "900px",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: aboutSection.id,
        type: "heading",
        sortOrder: 0,
        content: { text: "About Me", level: 2, highlight: "Me" },
        styles: { fontSize: 36, fontFamily: "heading", fontWeight: 700, marginBottom: 24 },
      },
      {
        sectionId: aboutSection.id,
        type: "text",
        sortOrder: 1,
        content: { text: "I'm a passionate developer with 4+ years of experience building production-grade web applications. I specialize in the React/Next.js ecosystem and love creating intuitive user interfaces backed by robust server-side architecture.\n\nWhen I'm not coding, you'll find me exploring new technologies, contributing to open source, or writing technical articles." },
        styles: { x: 120, y: 130, w: 700, h: 0, fontSize: 16, fontFamily: "body", lineHeight: 1.8, opacity: 0.75 },
      },
      {
        sectionId: aboutSection.id,
        type: "badge_group",
        sortOrder: 2,
        content: { badges: [{ text: "React" }, { text: "Next.js" }, { text: "TypeScript" }, { text: "Node.js" }, { text: "PostgreSQL" }, { text: "Tailwind CSS" }, { text: "AWS" }, { text: "Docker" }] },
        styles: { display: "flex", gap: 8, flexWrap: "wrap" },
      },
    ],
  });

  console.log("✅ About section + 3 blocks");

  // ── SKILLS SECTION ──────────────────────────────────────────────

  const skillsSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "Skills",
      sortOrder: 2,
      styles: {
        layout: "absolute",
        gap: 16,
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: "900px",
        backgroundColor: "#1e293b",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: skillsSection.id,
        type: "heading",
        sortOrder: 0,
        content: { text: "Skills \u0026 Technologies", level: 2, highlight: "Technologies" },
        styles: { x: 120, y: 60, w: 700, h: 0, fontSize: 36, fontFamily: "heading", fontWeight: 700 },
      },
      {
        sectionId: skillsSection.id,
        type: "skill_bar",
        sortOrder: 1,
        content: { name: "React / Next.js", level: 95, showPercentage: true },
        styles: { marginBottom: 16 },
      },
      {
        sectionId: skillsSection.id,
        type: "skill_bar",
        sortOrder: 2,
        content: { name: "TypeScript", level: 90, showPercentage: true },
        styles: { marginBottom: 16 },
      },
      {
        sectionId: skillsSection.id,
        type: "skill_bar",
        sortOrder: 3,
        content: { name: "Node.js / Express", level: 85, showPercentage: true },
        styles: { marginBottom: 16 },
      },
      {
        sectionId: skillsSection.id,
        type: "skill_bar",
        sortOrder: 4,
        content: { name: "PostgreSQL / Prisma", level: 80, showPercentage: true },
        styles: { marginBottom: 16 },
      },
      {
        sectionId: skillsSection.id,
        type: "skill_bar",
        sortOrder: 5,
        content: { name: "DevOps / CI/CD", level: 70, showPercentage: true },
        styles: { marginBottom: 8 },
      },
    ],
  });

  console.log("✅ Skills section + 6 blocks");

  // ── PROJECTS SECTION ────────────────────────────────────────────

  const projectsSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "Projects",
      sortOrder: 3,
      styles: {
        layout: "absolute",
        gap: 20,
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: "1000px",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: projectsSection.id,
        type: "heading",
        sortOrder: 0,
        content: { text: "Featured Projects", level: 2, highlight: "Projects" },
        styles: { fontSize: 36, fontFamily: "heading", fontWeight: 700, marginBottom: 24 },
      },
      {
        sectionId: projectsSection.id,
        type: "project_card",
        sortOrder: 1,
        content: {
          title: "E-Commerce Platform",
          description: "Full-featured online store with Next.js, Stripe payments, and real-time inventory management.",
          techStack: ["Next.js", "Stripe", "PostgreSQL", "Redis"],
          liveUrl: "https://example.com",
          repoUrl: "https://github.com",
          featured: true,
        },
        styles: { marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: "surface", overflow: "hidden" },
      },
      {
        sectionId: projectsSection.id,
        type: "project_card",
        sortOrder: 2,
        content: {
          title: "AI Chat Application",
          description: "Real-time chat with AI integration, WebSocket support, and message history.",
          techStack: ["React", "Node.js", "Socket.io", "OpenAI"],
          liveUrl: "https://example.com",
          repoUrl: "https://github.com",
        },
        styles: { marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: "surface", overflow: "hidden" },
      },
      {
        sectionId: projectsSection.id,
        type: "project_card",
        sortOrder: 3,
        content: {
          title: "DevOps Dashboard",
          description: "Monitoring and deployment dashboard for microservices architecture.",
          techStack: ["TypeScript", "Docker", "Grafana", "AWS"],
          repoUrl: "https://github.com",
        },
        styles: { marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: "surface", overflow: "hidden" },
      },
    ],
  });

  console.log("✅ Projects section + 4 blocks");

  // ── EXPERIENCE SECTION ──────────────────────────────────────────

  const expSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "Experience",
      sortOrder: 4,
      styles: {
        layout: "absolute",
        gap: 4,
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: "800px",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: expSection.id,
        type: "heading",
        sortOrder: 0,
        content: { text: "Work Experience", level: 2, highlight: "Experience" },
        styles: { fontSize: 36, fontFamily: "heading", fontWeight: 700, marginBottom: 32 },
      },
      {
        sectionId: expSection.id,
        type: "experience_item",
        sortOrder: 1,
        content: {
          role: "Senior Frontend Engineer",
          company: "TechCorp Inc.",
          startDate: "2022",
          current: true,
          location: "Remote",
          description: "Leading the frontend architecture migration to Next.js App Router.",
          highlights: ["Improved page load times by 40%", "Mentored 3 junior developers", "Shipped 12 features in Q4"],
        },
        styles: { marginBottom: 28, paddingLeft: 24 },
      },
      {
        sectionId: expSection.id,
        type: "experience_item",
        sortOrder: 2,
        content: {
          role: "Full-Stack Developer",
          company: "StartupXYZ",
          startDate: "2020",
          endDate: "2022",
          location: "Bangalore, India",
          description: "Built and maintained the core product platform from scratch.",
          highlights: ["Developed REST APIs serving 10K+ daily users", "Implemented CI/CD pipeline with GitHub Actions"],
        },
        styles: { marginBottom: 8, paddingLeft: 24 },
      },
    ],
  });

  console.log("✅ Experience section + 3 blocks");

  // ── CONTACT SECTION ─────────────────────────────────────────────

  const contactSection = await prisma.section.create({
    data: {
      portfolioId: portfolio.id,
      name: "Contact",
      sortOrder: 5,
      styles: {
        layout: "absolute",
        gap: 20,
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: "700px",
      },
    },
  });

  await prisma.block.createMany({
    data: [
      {
        sectionId: contactSection.id,
        type: "heading",
        sortOrder: 0,
        content: { text: "Get in Touch", level: 2, highlight: "Touch" },
        styles: { fontSize: 36, fontFamily: "heading", fontWeight: 700, marginBottom: 8 },
      },
      {
        sectionId: contactSection.id,
        type: "text",
        sortOrder: 1,
        content: { text: "Have a project in mind or want to collaborate? Feel free to reach out." },
        styles: { fontSize: 16, opacity: 0.6, marginBottom: 24 },
      },
      {
        sectionId: contactSection.id,
        type: "contact_info",
        sortOrder: 2,
        content: {
          items: [
            { type: "email", label: "Email", value: "alex@example.com", icon: "Mail" },
            { type: "location", label: "Location", value: "San Francisco, CA", icon: "MapPin" },
          ],
        },
        styles: { x: 120, y: 530, w: 200, h: 0, marginBottom: 24 },
      },
      {
        sectionId: contactSection.id,
        type: "contact_form",
        sortOrder: 3,
        content: {
          fields: [
            { name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" },
            { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
            { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Your message..." },
          ],
          submitText: "Send Message",
        },
        styles: {},
      },
    ],
  });

  console.log("✅ Contact section + 4 blocks");

  // ── Templates ───────────────────────────────────────────────────

  await prisma.template.upsert({
    where: { name: "Developer" },
    update: {
      config: {
        theme: { mode: "DARK", primaryColor: "#6366f1", secondaryColor: "#8b5cf6", accentColor: "#06b6d4", backgroundColor: "#0f172a", textColor: "#f8fafc", fontHeading: "Outfit", fontBody: "DM Sans", borderRadius: "0.5rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "80vh" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Hi, I'm a Developer", level: 1 }, styles: { fontSize: 48, fontWeight: 700, textAlign: "center", marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Full-stack developer passionate about building great products." }, styles: { fontSize: 18, textAlign: "center", opacity: 0.7, maxWidth: "600px", marginBottom: 24 } },
            { type: "social_links", sortOrder: 2, content: { links: [{ platform: "github", url: "https://github.com", icon: "Github" }, { platform: "linkedin", url: "https://linkedin.com", icon: "Linkedin" }], layout: "row", variant: "ghost" }, styles: { display: "flex", gap: 12, justifyContent: "center" } },
          ]},
          { name: "About", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "About Me", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Write about yourself, your experience, and what drives you as a developer." }, styles: { fontSize: 16, lineHeight: 1.7, opacity: 0.8 } },
          ]},
          { name: "Skills", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Skills", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 20 } },
            { type: "skill_bar", sortOrder: 1, content: { name: "JavaScript / TypeScript", level: 90, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 2, content: { name: "React / Next.js", level: 85, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 3, content: { name: "Node.js", level: 80, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 4, content: { name: "Python", level: 70, showPercentage: true }, styles: { marginBottom: 12 } },
          ]},
          { name: "Projects", sortOrder: 3, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Projects", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 20 } },
            { type: "project_card", sortOrder: 1, content: { title: "Project One", description: "A full-stack web application built with React and Node.js.", techStack: ["React", "Node.js", "PostgreSQL"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
            { type: "project_card", sortOrder: 2, content: { title: "Project Two", description: "A mobile-first progressive web app with offline support.", techStack: ["Next.js", "TypeScript", "Tailwind"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
          ]},
          { name: "Contact", sortOrder: 4, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Get In Touch", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "I'm always open to new opportunities and interesting projects." }, styles: { fontSize: 16, opacity: 0.7, marginBottom: 24 } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Your message..." }], submitText: "Send Message" }, styles: {} },
          ]},
        ],
      },
    },
    create: {
      name: "Developer",
      description: "Dark-themed portfolio for developers with skills, projects, and contact sections",
      isActive: true,
      config: {
        theme: { mode: "DARK", primaryColor: "#6366f1", secondaryColor: "#8b5cf6", accentColor: "#06b6d4", backgroundColor: "#0f172a", textColor: "#f8fafc", fontHeading: "Outfit", fontBody: "DM Sans", borderRadius: "0.5rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "80vh" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Hi, I'm a Developer", level: 1 }, styles: { fontSize: 48, fontWeight: 700, textAlign: "center", marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Full-stack developer passionate about building great products." }, styles: { fontSize: 18, textAlign: "center", opacity: 0.7, maxWidth: "600px", marginBottom: 24 } },
            { type: "social_links", sortOrder: 2, content: { links: [{ platform: "github", url: "https://github.com", icon: "Github" }, { platform: "linkedin", url: "https://linkedin.com", icon: "Linkedin" }], layout: "row", variant: "ghost" }, styles: { display: "flex", gap: 12, justifyContent: "center" } },
          ]},
          { name: "About", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "About Me", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Write about yourself, your experience, and what drives you as a developer." }, styles: { fontSize: 16, lineHeight: 1.7, opacity: 0.8 } },
          ]},
          { name: "Skills", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Skills", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 20 } },
            { type: "skill_bar", sortOrder: 1, content: { name: "JavaScript / TypeScript", level: 90, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 2, content: { name: "React / Next.js", level: 85, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 3, content: { name: "Node.js", level: 80, showPercentage: true }, styles: { marginBottom: 12 } },
            { type: "skill_bar", sortOrder: 4, content: { name: "Python", level: 70, showPercentage: true }, styles: { marginBottom: 12 } },
          ]},
          { name: "Projects", sortOrder: 3, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Projects", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 20 } },
            { type: "project_card", sortOrder: 1, content: { title: "Project One", description: "A full-stack web application built with React and Node.js.", techStack: ["React", "Node.js", "PostgreSQL"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
            { type: "project_card", sortOrder: 2, content: { title: "Project Two", description: "A mobile-first progressive web app with offline support.", techStack: ["Next.js", "TypeScript", "Tailwind"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
          ]},
          { name: "Contact", sortOrder: 4, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Get In Touch", level: 2 }, styles: { fontSize: 32, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "I'm always open to new opportunities and interesting projects." }, styles: { fontSize: 16, opacity: 0.7, marginBottom: 24 } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Your message..." }], submitText: "Send Message" }, styles: {} },
          ]},
        ],
      },
    },
  });

  await prisma.template.upsert({
    where: { name: "Designer" },
    update: {
      config: {
        theme: { mode: "DARK", primaryColor: "#f43f5e", secondaryColor: "#ec4899", accentColor: "#f97316", backgroundColor: "#18181b", textColor: "#fafafa", fontHeading: "Playfair Display", fontBody: "Inter", borderRadius: "1rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "90vh" }, blocks: [
            { type: "image", sortOrder: 0, content: { src: "", alt: "Profile photo", shape: "circle", width: 140, height: 140 }, styles: { marginBottom: 24, display: "flex", justifyContent: "center" } },
            { type: "heading", sortOrder: 1, content: { text: "Creative Designer", level: 1 }, styles: { fontSize: 52, fontWeight: 800, textAlign: "center", marginBottom: 12 } },
            { type: "text", sortOrder: 2, content: { text: "I craft beautiful digital experiences that delight users and drive results." }, styles: { fontSize: 20, textAlign: "center", opacity: 0.7, maxWidth: "550px", marginBottom: 28 } },
            { type: "social_links", sortOrder: 3, content: { links: [{ platform: "dribbble", url: "https://dribbble.com", icon: "Dribbble" }, { platform: "behance", url: "https://behance.net", icon: "Globe" }, { platform: "instagram", url: "https://instagram.com", icon: "Instagram" }], layout: "row", variant: "outline" }, styles: { display: "flex", gap: 12, justifyContent: "center" } },
          ]},
          { name: "Work", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Selected Work", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 24 } },
            { type: "project_card", sortOrder: 1, content: { title: "Brand Identity", description: "Complete brand identity redesign for a fintech startup including logo, typography, and color system.", techStack: ["Figma", "Illustrator", "After Effects"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
            { type: "project_card", sortOrder: 2, content: { title: "Mobile App UI", description: "End-to-end mobile app design for a health and wellness platform with 50+ screens.", techStack: ["Figma", "Protopie", "Lottie"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
          ]},
          { name: "Testimonials", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Kind Words", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 24 } },
            { type: "text", sortOrder: 1, content: { text: "\"An exceptional designer who truly understands user-centered design. Delivered beyond our expectations.\"" }, styles: { fontSize: 18, fontStyle: "italic", textAlign: "center", opacity: 0.8, maxWidth: "600px", marginBottom: 8 } },
            { type: "text", sortOrder: 2, content: { text: "-- Sarah M., Product Manager" }, styles: { fontSize: 14, textAlign: "center", opacity: 0.5, marginBottom: 32 } },
            { type: "text", sortOrder: 3, content: { text: "\"Incredible attention to detail and a fantastic collaborator. Would recommend to any team.\"" }, styles: { fontSize: 18, fontStyle: "italic", textAlign: "center", opacity: 0.8, maxWidth: "600px", marginBottom: 8 } },
            { type: "text", sortOrder: 4, content: { text: "-- James K., CTO" }, styles: { fontSize: 14, textAlign: "center", opacity: 0.5 } },
          ]},
          { name: "Contact", sortOrder: 3, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Let's Collaborate", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Have a project in mind? I'd love to hear about it." }, styles: { fontSize: 16, opacity: 0.7, marginBottom: 24, textAlign: "center" } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Tell me about your project..." }], submitText: "Get in Touch" }, styles: {} },
          ]},
        ],
      },
    },
    create: {
      name: "Designer",
      description: "Visual portfolio with rose accents, testimonials, and a creative layout",
      isActive: true,
      config: {
        theme: { mode: "DARK", primaryColor: "#f43f5e", secondaryColor: "#ec4899", accentColor: "#f97316", backgroundColor: "#18181b", textColor: "#fafafa", fontHeading: "Playfair Display", fontBody: "Inter", borderRadius: "1rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "90vh" }, blocks: [
            { type: "image", sortOrder: 0, content: { src: "", alt: "Profile photo", shape: "circle", width: 140, height: 140 }, styles: { marginBottom: 24, display: "flex", justifyContent: "center" } },
            { type: "heading", sortOrder: 1, content: { text: "Creative Designer", level: 1 }, styles: { fontSize: 52, fontWeight: 800, textAlign: "center", marginBottom: 12 } },
            { type: "text", sortOrder: 2, content: { text: "I craft beautiful digital experiences that delight users and drive results." }, styles: { fontSize: 20, textAlign: "center", opacity: 0.7, maxWidth: "550px", marginBottom: 28 } },
            { type: "social_links", sortOrder: 3, content: { links: [{ platform: "dribbble", url: "https://dribbble.com", icon: "Dribbble" }, { platform: "behance", url: "https://behance.net", icon: "Globe" }, { platform: "instagram", url: "https://instagram.com", icon: "Instagram" }], layout: "row", variant: "outline" }, styles: { display: "flex", gap: 12, justifyContent: "center" } },
          ]},
          { name: "Work", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Selected Work", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 24 } },
            { type: "project_card", sortOrder: 1, content: { title: "Brand Identity", description: "Complete brand identity redesign for a fintech startup including logo, typography, and color system.", techStack: ["Figma", "Illustrator", "After Effects"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
            { type: "project_card", sortOrder: 2, content: { title: "Mobile App UI", description: "End-to-end mobile app design for a health and wellness platform with 50+ screens.", techStack: ["Figma", "Protopie", "Lottie"], liveUrl: "", repoUrl: "" }, styles: { marginBottom: 16 } },
          ]},
          { name: "Testimonials", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Kind Words", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 24 } },
            { type: "text", sortOrder: 1, content: { text: "\"An exceptional designer who truly understands user-centered design. Delivered beyond our expectations.\"" }, styles: { fontSize: 18, fontStyle: "italic", textAlign: "center", opacity: 0.8, maxWidth: "600px", marginBottom: 8 } },
            { type: "text", sortOrder: 2, content: { text: "-- Sarah M., Product Manager" }, styles: { fontSize: 14, textAlign: "center", opacity: 0.5, marginBottom: 32 } },
            { type: "text", sortOrder: 3, content: { text: "\"Incredible attention to detail and a fantastic collaborator. Would recommend to any team.\"" }, styles: { fontSize: 18, fontStyle: "italic", textAlign: "center", opacity: 0.8, maxWidth: "600px", marginBottom: 8 } },
            { type: "text", sortOrder: 4, content: { text: "-- James K., CTO" }, styles: { fontSize: 14, textAlign: "center", opacity: 0.5 } },
          ]},
          { name: "Contact", sortOrder: 3, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Let's Collaborate", level: 2 }, styles: { fontSize: 36, fontWeight: 700, marginBottom: 16 } },
            { type: "text", sortOrder: 1, content: { text: "Have a project in mind? I'd love to hear about it." }, styles: { fontSize: 16, opacity: 0.7, marginBottom: 24, textAlign: "center" } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Tell me about your project..." }], submitText: "Get in Touch" }, styles: {} },
          ]},
        ],
      },
    },
  });

  await prisma.template.upsert({
    where: { name: "Minimal" },
    update: {
      config: {
        theme: { mode: "LIGHT", primaryColor: "#0f172a", secondaryColor: "#334155", accentColor: "#6366f1", backgroundColor: "#ffffff", textColor: "#0f172a", fontHeading: "Inter", fontBody: "Inter", borderRadius: "0.375rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "70vh" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Hello, I'm [Your Name]", level: 1 }, styles: { fontSize: 40, fontWeight: 600, textAlign: "center", marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "A brief introduction about who you are and what you do." }, styles: { fontSize: 16, textAlign: "center", opacity: 0.6, maxWidth: "480px", marginBottom: 20 } },
          ]},
          { name: "About", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "About", level: 2 }, styles: { fontSize: 28, fontWeight: 600, marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "Share a few sentences about your background, interests, and what you're currently working on." }, styles: { fontSize: 15, lineHeight: 1.8, opacity: 0.7 } },
          ]},
          { name: "Contact", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Contact", level: 2 }, styles: { fontSize: 28, fontWeight: 600, marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "Feel free to reach out via the form below." }, styles: { fontSize: 15, opacity: 0.6, marginBottom: 20 } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Your message..." }], submitText: "Send" }, styles: {} },
          ]},
        ],
      },
    },
    create: {
      name: "Minimal",
      description: "Clean light theme with just the essentials: hero, about, and contact",
      isActive: true,
      config: {
        theme: { mode: "LIGHT", primaryColor: "#0f172a", secondaryColor: "#334155", accentColor: "#6366f1", backgroundColor: "#ffffff", textColor: "#0f172a", fontHeading: "Inter", fontBody: "Inter", borderRadius: "0.375rem" },
        sections: [
          { name: "Hero", sortOrder: 0, styles: { layout: "centered", padding: "lg", minHeight: "70vh" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Hello, I'm [Your Name]", level: 1 }, styles: { fontSize: 40, fontWeight: 600, textAlign: "center", marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "A brief introduction about who you are and what you do." }, styles: { fontSize: 16, textAlign: "center", opacity: 0.6, maxWidth: "480px", marginBottom: 20 } },
          ]},
          { name: "About", sortOrder: 1, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "About", level: 2 }, styles: { fontSize: 28, fontWeight: 600, marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "Share a few sentences about your background, interests, and what you're currently working on." }, styles: { fontSize: 15, lineHeight: 1.8, opacity: 0.7 } },
          ]},
          { name: "Contact", sortOrder: 2, styles: { layout: "centered", padding: "lg" }, blocks: [
            { type: "heading", sortOrder: 0, content: { text: "Contact", level: 2 }, styles: { fontSize: 28, fontWeight: 600, marginBottom: 12 } },
            { type: "text", sortOrder: 1, content: { text: "Feel free to reach out via the form below." }, styles: { fontSize: 15, opacity: 0.6, marginBottom: 20 } },
            { type: "contact_form", sortOrder: 2, content: { fields: [{ name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Your message..." }], submitText: "Send" }, styles: {} },
          ]},
        ],
      },
    },
  });

  console.log("✅ Templates created");
  console.log("\n🎉 Seeding complete!");
  console.log("   Login: demo@foliocraft.dev / Demo@1234");
  console.log("   Portfolio: /portfolio/alexchen");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
