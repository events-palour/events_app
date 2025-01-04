import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';
import { sendInviteEmail } from '@/lib/server/email';
import { inviteMemberSchema } from '@/lib/server/organization';

interface RouteContext {
  params: { id: string }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getCurrentSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = params.id;

    // Validate request body
    const body = await req.json();
    const validatedData = inviteMemberSchema.parse(body);

    // Get organization details
    const organization = await prisma.organization.findFirst({
      where: { 
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
            role: 'ADMIN'
          }
        }
      },
      select: {
        name: true,
        logo: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check for existing invite
    const existingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        email: validatedData.email,
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invite already exists for this email' },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        email: validatedData.email,
        role: validatedData.role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedById: session.user.id,
      },
    });

    // Send invite email using user's profile name if available
    const senderName = session.user.email || 'A team member';
    
    await sendInviteEmail({
      inviteToken: token,
      toEmail: validatedData.email,
      organizationName: organization.name,
      organizationLogo: organization.logo,
      senderName,
      senderEmail: session.user.email || '',
    });

    return NextResponse.json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}