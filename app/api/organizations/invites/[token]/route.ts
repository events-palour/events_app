import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';

// Update the params type to match Next.js conventions
type RouteParams = {
  params: {
    token: string;
  };
};

export async function POST(
  request: NextRequest,
  // Use the correct type for route parameters
  { params }: RouteParams
) {
  try {
    const { token } = params;
    
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });
    
    if (!invite) {
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

    const session = await getCurrentSession();
    if (!session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await prisma.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: 'MEMBER',
      },
    });

    await prisma.organizationInvite.delete({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' }, 
      { status: 500 }
    );
  }
}

