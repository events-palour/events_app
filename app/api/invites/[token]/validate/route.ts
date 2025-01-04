import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    return NextResponse.json({
      organizationId: invite.organizationId,
      organizationName: invite.organization.name,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 500 });
  }
}