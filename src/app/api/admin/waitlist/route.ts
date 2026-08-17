import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual waitlist control (ops only, CRON_SECRET auth).
 * GET  /api/admin/waitlist?secret=          — list pending signups
 * POST /api/admin/waitlist {username, action: "approve"|"reject"}
 */
function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const token =
    auth?.replace(/^Bearer\s+/i, "") ||
    req.nextUrl.searchParams.get("secret") ||
    "";
  return token === config.cronSecret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const pending = await prisma.user.findMany({
    where: { accessStatus: "pending" },
    select: {
      username: true,
      role: true,
      walletAddress: true,
      createdAt: true,
      lastActiveAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, pending });
}

const bodySchema = z.object({
  username: z.string().trim().min(1).max(30),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const username = parsed.data.username.replace(/^@/, "").toLowerCase();
  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  const result = await prisma.user.updateMany({
    where: { username },
    data: {
      accessStatus: status,
      ...(status === "approved" ? { role: "tipper" } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }
  const user = await prisma.user.findFirst({ where: { username } });
  if (status === "approved" && user && !user.walletAddress) {
    // Approved before wallet exists — tipSettings still needed for polling.
  }
  if (status === "approved" && user) {
    await prisma.tipSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    await prisma.balance.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  }
  return NextResponse.json({ ok: true, username, accessStatus: status });
}
