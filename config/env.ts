// config/env.ts
/**
 * Centralized, Zod-validated environment configuration.
 * Import `env` anywhere to get typed, validated env vars.
 * Throws at startup if required variables are missing.
 */
import { z } from "zod/v4";

// ── Schema ──────────────────────────────────────────────

const envSchema = z.object({
  // Appwrite — required
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.url(),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_PROJECT_ID is required"),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_DATABASE_ID is required"),

  // Appwrite — server-only (only required at runtime in API routes)
  APPWRITE_API_KEY: z.string().min(1, "APPWRITE_API_KEY is required").optional(),

  // Appwrite — optional bucket IDs (fall back to defaults)
  NEXT_PUBLIC_APPWRITE_BUCKET_ID: z.string().optional().default(""),
  NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID: z.string().optional().default("event-images"),
  NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID: z.string().optional().default("gallery-images"),
  NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID: z.string().optional().default("blog"),

  // Admin emails (comma-separated, optional — labels are primary)
  ADMIN_EMAILS: z.string().optional().default(""),
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional().default(""),

  // Resend email
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

// ── Parse & export ──────────────────────────────────────

// Next.js inlines `process.env.NEXT_PUBLIC_*` via literal string replacement
// at build time. Passing `process.env` as an object does NOT work on the
// client because the object is empty — each variable must be referenced by
// its full name so the bundler can inline it.
const rawEnv = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  NEXT_PUBLIC_APPWRITE_BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
  NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID: process.env.NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID,
  NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID: process.env.NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID,
  NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};

function parseEnv() {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`❌ Invalid environment variables:\n${formatted}`);
    // In development, throw to block startup. In production, log and continue
    // so partial functionality still works.
    if (process.env.NODE_ENV === "development") {
      throw new Error(`Missing or invalid environment variables:\n${formatted}`);
    }
  }
  return result.success ? result.data : (rawEnv as unknown as z.infer<typeof envSchema>);
}

export const env = parseEnv();
