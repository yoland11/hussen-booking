import { NextResponse } from "next/server";

import { getSessionCookieOptions } from "@/lib/session";

export async function POST() {
  const { name, ...cookieOptions } = getSessionCookieOptions();
  const response = NextResponse.json({
    message: "تم تسجيل الخروج.",
  });

  response.cookies.set(name, "", {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
