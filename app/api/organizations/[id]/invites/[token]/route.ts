import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';

type Context = {
  params: { id: string; token: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: organizationId, token } = context.params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite || invite.organizationId !== organizationId) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite' }),
        { status: 404 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invite expired' }),
        { status: 400 }
      );
    }

    const session = await getCurrentSession();
    if (!session.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
    });

    if (existingMembership) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this organization' }),
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

    await prisma.organizationInvite.delete({
      where: { token }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully joined ${invite.organization.name}`
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to accept invite' }),
      { status: 500 }
    );
  }
}

