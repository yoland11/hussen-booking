import "server-only";

import type { NextRequest } from "next/server";

import {
  LOGIN_LOCK_MINUTES,
  LOGIN_WINDOW_MINUTES,
  MAX_LOGIN_ATTEMPTS,
} from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
};

function windowExpired(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  return updated + LOGIN_WINDOW_MINUTES * 60 * 1000 < Date.now();
}

export function getClientIdentifier(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_login_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      allowed: true,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS,
    };
  }

  if (data.locked_until && new Date(data.locked_until).getTime() > Date.now()) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 1000),
        1,
      ),
      attemptsRemaining: 0,
    };
  }

  if (windowExpired(data.updated_at)) {
    await supabase
      .from("admin_login_rate_limits")
      .upsert({
        identifier,
        attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return {
      allowed: true,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: Math.max(MAX_LOGIN_ATTEMPTS - data.attempts, 0),
  };
}

export async function registerFailedAttempt(identifier: string): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_login_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();
  const attempts = !data || windowExpired(data.updated_at) ? 1 : data.attempts + 1;
  const lockedUntil =
    attempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
      : null;

  const { error: upsertError } = await supabase.from("admin_login_rate_limits").upsert({
    identifier,
    attempts,
    locked_until: lockedUntil,
    updated_at: now.toISOString(),
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  if (lockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: LOGIN_LOCK_MINUTES * 60,
      attemptsRemaining: 0,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: Math.max(MAX_LOGIN_ATTEMPTS - attempts, 0),
  };
}

export async function clearRateLimit(identifier: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("admin_login_rate_limits")
    .delete()
    .eq("identifier", identifier);

  if (error) {
    throw new Error(error.message);
  }
}
