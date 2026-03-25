import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  portfolioId: z.string().cuid(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  category: z.enum(["DEVELOPER", "DESIGNER", "WRITER", "OTHER"]),
  isDark: z.boolean(),
  tags: z
    .array(z.string().max(20).regex(/^[a-z0-9-]+$/))
    .max(5)
    .default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { portfolioId, name, description, category, isDark, tags } = parsed.data;

  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: session.user.id },
    select: { status: true, ogImageUrl: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 403 });
  }

  if (portfolio.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Portfolio must be published first" },
      { status: 400 }
    );
  }

  const template = await db.communityTemplate.upsert({
    where: { portfolioId },
    create: {
      portfolioId,
      userId: session.user.id,
      name,
      description,
      category,
      isDark,
      tags,
      thumbnail: portfolio.ogImageUrl ?? null,
    },
    update: { name, description, category, isDark, tags, thumbnail: portfolio.ogImageUrl ?? null },
  });

  return NextResponse.json(template, { status: 200 });
}
