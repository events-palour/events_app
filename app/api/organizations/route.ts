import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { organizationSchema } from "@/lib/server/organization";
import { getCurrentSession } from "@/lib/server/session";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = organizationSchema.parse(body);

    const organization = await prisma.organization.create({
      data: {
        name: validatedData.orgName,
        description: validatedData.description,
        website: validatedData.website || null,
        logo: validatedData.logo || null,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          }
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
