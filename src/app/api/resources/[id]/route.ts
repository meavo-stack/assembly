import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { ASSEMBLY_TOOL_CARD_ID } from "@/lib/constants";
import { getPartnerFromSession } from "@/lib/partner-session";
import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";

async function canAccessResources(): Promise<boolean> {
  const session = await auth();
  if (session?.user?.id) {
    const access = await prisma.toolCardAccess.findFirst({
      where: { userId: session.user.id, cardId: ASSEMBLY_TOOL_CARD_ID },
    });
    if (access) return true;
  }

  const partner = await getPartnerFromSession();
  return Boolean(partner?.isActive);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await canAccessResources())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource || resource.type !== ResourceType.PDF || !resource.storageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await get(resource.storageKey, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": resource.mimeType || "application/pdf",
      "Content-Disposition": `inline; filename="${(resource.fileName ?? "guide.pdf").replace(/"/g, "")}"`,
    },
  });
}
