import { prisma } from "./db";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User, Profile } from "@prisma/client";

interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  user?: User;
}

type UserWithProfile = User & {
  profile: Profile | null;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  
  const sessionWithUser = await prisma.session.findUnique({
    where: {
      id: sessionId
    },
    include: {
      user: {
        include: {
          profile: true,
          oauthAccount: true
        }
      }
    }
  });

  if (!sessionWithUser) {
    return { session: null, user: null };
  }

  if (Date.now() >= sessionWithUser.expiresAt.getTime()) {
    await prisma.session.delete({
      where: {
        id: sessionWithUser.id
      }
    });
    return { session: null, user: null };
  }

  // Refresh session if it's close to expiring
  if (Date.now() >= sessionWithUser.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await prisma.session.update({
      where: {
        id: sessionWithUser.id
      },
      data: {
        expiresAt: newExpiresAt
      }
    });
    sessionWithUser.expiresAt = newExpiresAt;
  }

  return {
    session: sessionWithUser,
    user: sessionWithUser.user as UserWithProfile
  };
}

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
  const token = (await cookies()).get("session")?.value ?? null;
  if (token === null) {
    return { session: null, user: null };
  }
  return await validateSessionToken(token);
});



export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: {
      id: sessionId
    }
  });
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId
    }
  });
}

export async function createSession(token: string, userId: string): Promise<SessionData> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt
    }
  });

  return session;
}

export async function setSessionTokenCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set("session", token, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt
  });
}

export async function deleteSessionTokenCookie(): Promise<void> {
  (await cookies()).set("session", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  });
}

export function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  return encodeBase32(tokenBytes).toLowerCase();
}

type SessionValidationResult = 
  | { session: SessionData; user: User }
  | { session: null; user: null };