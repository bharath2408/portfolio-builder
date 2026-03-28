import type { FieldDefinition } from "@/types";

interface CollectionPreset {
  name: string;
  slug: string;
  icon: string;
  fields: FieldDefinition[];
}

export const CMS_PRESETS: CollectionPreset[] = [
  {
    name: "Blog Post",
    slug: "blog-post",
    icon: "FileText",
    fields: [
      { id: "1", name: "Title", key: "title", type: "text", required: true },
      { id: "2", name: "Slug", key: "slug", type: "text", required: true },
      { id: "3", name: "Cover Image", key: "coverImage", type: "image", required: false },
      { id: "4", name: "Excerpt", key: "excerpt", type: "text", required: false, placeholder: "Brief summary..." },
      { id: "5", name: "Body", key: "body", type: "richtext", required: true },
      { id: "6", name: "Tags", key: "tags", type: "text", required: false, placeholder: "comma-separated" },
      { id: "7", name: "Published Date", key: "publishedAt", type: "date", required: false },
    ],
  },
  {
    name: "Project",
    slug: "project",
    icon: "FolderKanban",
    fields: [
      { id: "1", name: "Title", key: "title", type: "text", required: true },
      { id: "2", name: "Slug", key: "slug", type: "text", required: true },
      { id: "3", name: "Cover Image", key: "coverImage", type: "image", required: false },
      { id: "4", name: "Description", key: "description", type: "text", required: false },
      { id: "5", name: "Body", key: "body", type: "richtext", required: false },
      { id: "6", name: "Tech Stack", key: "techStack", type: "text", required: false, placeholder: "React, Node.js, ..." },
      { id: "7", name: "Live URL", key: "liveUrl", type: "url", required: false },
      { id: "8", name: "Repo URL", key: "repoUrl", type: "url", required: false },
      { id: "9", name: "Featured", key: "featured", type: "boolean", required: false },
    ],
  },
  {
    name: "Testimonial",
    slug: "testimonial",
    icon: "MessageSquareQuote",
    fields: [
      { id: "1", name: "Quote", key: "quote", type: "text", required: true },
      { id: "2", name: "Author", key: "author", type: "text", required: true },
      { id: "3", name: "Role", key: "role", type: "text", required: false },
      { id: "4", name: "Company", key: "company", type: "text", required: false },
      { id: "5", name: "Avatar", key: "avatar", type: "image", required: false },
      { id: "6", name: "Rating", key: "rating", type: "number", required: false },
    ],
  },
  {
    name: "FAQ",
    slug: "faq",
    icon: "HelpCircle",
    fields: [
      { id: "1", name: "Question", key: "question", type: "text", required: true },
      { id: "2", name: "Answer", key: "answer", type: "richtext", required: true },
      { id: "3", name: "Category", key: "category", type: "text", required: false },
      { id: "4", name: "Sort Order", key: "sortOrder", type: "number", required: false },
    ],
  },
];
