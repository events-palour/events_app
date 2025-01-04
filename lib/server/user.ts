// user.ts
import { prisma } from "@/lib/server/db";
import { v4 as uuidv4 } from "uuid";

export async function getUserFromGoogleId(googleId: string) {
  const oauthAccount = await prisma.oauthAccount.findUnique({
    where: {
      providerId_providerUserId: {
        providerId: "google",
        providerUserId: googleId
      }
    },
    include: {
      user: true
    }
  });

  return oauthAccount?.user || null;
}

export async function getUserFromGitHubId(githubId: string) {
  const oauthAccount = await prisma.oauthAccount.findUnique({
    where: {
      providerId_providerUserId: {
        providerId: "github",
        providerUserId: githubId // Now expecting a string
      }
    },
    include: {
      user: true
    }
  });

  return oauthAccount?.user || null;
}

export async function createUser(
  providerId: "google" | "github",
  providerUserId: string, // Now explicitly typed as string
  email: string,
  name: string | null,
  avatarUrl: string | null
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      oauthAccount: true
    }
  });

  if (existingUser) {
    if (!existingUser.oauthAccount || existingUser.oauthAccount.providerId !== providerId) {
      await prisma.oauthAccount.create({
        data: {
          providerId,
          providerUserId, // Will now be string
          userEmail: email,
          userName: name || email.split("@")[0],
          userAvatarURL: avatarUrl || "",
          userId: existingUser.id
        }
      });
    }
    return existingUser;
  }

  const userId = uuidv4();

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: email,
      emailVerified: true,
      profile: {
        create: {
          id: uuidv4(),
          name: name || email.split("@")[0],
          imageUrl: avatarUrl || "",
          email: email
        }
      },
      oauthAccount: {
        create: {
          providerId,
          providerUserId, // Will now be string
          userEmail: email,
          userName: name || email.split("@")[0],
          userAvatarURL: avatarUrl || ""
        }
      }
    },
    include: {
      profile: true,
      oauthAccount: true
    }
  });
  

  return user;
}