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

function parseEnv() {
  const result = envSchema.safeParse(process.env);
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
  return result.success ? result.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = parseEnv();
