import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; token: string } }
) {
  try {
    const { id: organizationId, token } = params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite || invite.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    const session = await getCurrentSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: session.user.id,
        role: 'MEMBER',
      },
    });

    await prisma.organizationInvite.delete({ where: { token } });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${invite.organization.name}`,
    });
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}

