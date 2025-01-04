import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const organizationSchema = z.object({
  orgName: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logo: z.string().optional().nullable() // Changed to accept base64 string
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER"])
});

export const inviteMembersSchema = z.array(inviteMemberSchema);

export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type InviteMemberData = z.infer<typeof inviteMemberSchema>;

// Utility function to validate file before conversion
export const validateFile = (file: File): boolean => {
  if (!file) return false;
  if (file.size > MAX_FILE_SIZE) return false;
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return false;
  return true;
};

// Utility function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};