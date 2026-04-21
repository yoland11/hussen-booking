import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let adminClient: SupabaseClient<Database> | undefined;

export function getSupabaseAdmin() {
  if (adminClient) {
    return adminClient;
  }

  const env = getServerEnv();

  adminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
