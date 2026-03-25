// src/lib/api/community-templates.ts
import { apiGet, apiPost } from "./client";

export type CommunityTemplateCategory = "DEVELOPER" | "DESIGNER" | "WRITER" | "OTHER";

export interface CommunityTemplate {
  id: string;
  portfolioId: string;
  userId: string;
  name: string;
  description: string;
  category: CommunityTemplateCategory;
  isDark: boolean;
  tags: string[];
  thumbnail: string | null;
  useCount: number;
  createdAt: string;
  user: { username: string | null; name: string | null };
  portfolio: { slug: string } | null;
}

export function getAuthorName(user: { username: string | null; name: string | null }): string {
  return user.username ?? user.name ?? "Anonymous";
}

export async function fetchCommunityTemplates(params: {
  category?: string;
  isDark?: boolean;
  tag?: string;
  sort?: "most_used" | "newest";
  search?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ templates: CommunityTemplate[]; nextCursor: string | null }> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.isDark !== undefined) query.set("isDark", String(params.isDark));
  if (params.tag) query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  return apiGet<{ templates: CommunityTemplate[]; nextCursor: string | null }>(
    `/community-templates?${query}`,
  );
}

export async function shareCommunityTemplate(data: {
  portfolioId: string;
  name: string;
  description: string;
  category: CommunityTemplateCategory;
  isDark: boolean;
  tags: string[];
}): Promise<CommunityTemplate> {
  return apiPost<CommunityTemplate>("/community-templates", data);
}

export async function cloneCommunityTemplate(id: string): Promise<{ portfolioId: string }> {
  return apiPost<{ portfolioId: string }>(`/community-templates/${id}/use`);
}
