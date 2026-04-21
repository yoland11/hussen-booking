import bcrypt from "bcryptjs";

import { getServerEnv } from "@/lib/env";

export async function verifyAdminPin(pin: string) {
  const { ADMIN_PIN_HASH } = getServerEnv();
  return bcrypt.compare(String(pin).trim(), ADMIN_PIN_HASH);
}