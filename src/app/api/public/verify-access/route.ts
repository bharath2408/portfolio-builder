import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { portfolioId, password } = await request.json();

    if (!portfolioId || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      select: { accessPassword: true },
    });

    if (!portfolio?.accessPassword || portfolio.accessPassword !== password) {
      return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(`portfolio-access-${portfolioId}`, "granted", {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[POST /api/public/verify-access]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
