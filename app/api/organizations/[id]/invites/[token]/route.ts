import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';

type Params = {
  id: string;
  token: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: organizationId, token } = params;

    // Validate invite
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite || invite.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Invalid invite' },
        { status: 404 }
      );
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite expired' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check existing membership
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

    // Create membership and delete invite
    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId,
          userId: session.user.id,
          role: 'MEMBER',
        },
      }),
      prisma.organizationInvite.delete({
        where: { token }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${invite.organization.name}`,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}