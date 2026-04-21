import { z } from "zod";

import { SESSION_SECRET_MIN_LENGTH } from "@/lib/constants";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_PIN_HASH: z.string().min(20),
  SESSION_SECRET: z.string().min(SESSION_SECRET_MIN_LENGTH),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_PIN_HASH: process.env.ADMIN_PIN_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
}
