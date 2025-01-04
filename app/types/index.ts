import { User, Profile, OauthAccount } from "@prisma/client";

export type UserWithProfile = User & {
  profile?: Profile | null;
  oauthAccount?: OauthAccount | null;
};

export type SessionValidationResult = 
  | { session: null; user: null }
  | { 
      session: { 
        id: string;
        userId: string;
        expiresAt: Date;
      }; 
      user: UserWithProfile;
    };