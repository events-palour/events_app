import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';
import { type NextRequest } from 'next/server';

// Define the params type according to Next.js App Router conventions
type Params = {
  id: string;
  token: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const organizationId = params.id;
    const { token } = params;

    // Verify the invite exists and matches the organization
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

    // Get current user's session
    const session = await getCurrentSession();
    if (!session.user) {
      return NextResponse.json(
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
      return NextResponse.json(
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