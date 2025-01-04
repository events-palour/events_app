import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';

interface RouteParams {
  id: string;
  token: string;
}

export interface RouteContext {
  params: RouteParams;
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const organizationId = context.params.id;
    const { token } = context.params;

    // Verify the invite exists and matches the organization
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite || invite.organizationId !== organizationId) {
      return Response.json(
        { error: 'Invalid invite' },
        { status: 404 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return Response.json(
        { error: 'Invite expired' },
        { status: 400 }
      );
    }

    // Get current user's session
    const session = await getCurrentSession();
    if (!session.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
    });

    if (existingMembership) {
      return Response.json(
        { error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    // Create new membership
    await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: session.user.id,
        role: 'MEMBER',
      },
    });

    // Delete the used invite
    await prisma.organizationInvite.delete({
      where: { token },
    });

    return Response.json({
      success: true,
      message: `Successfully joined ${invite.organization.name}`,
    });
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return Response.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}

