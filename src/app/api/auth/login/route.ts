import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, clearRateLimit, getClientIdentifier, registerFailedAttempt } from "@/lib/rate-limit";
import { createSessionToken, getSessionCookieOptions } from "@/lib/session";
import { verifyAdminPin } from "@/lib/pin";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: `تم تعليق الدخول مؤقتاً. حاول بعد ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60,
          )} دقيقة.`,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || "بيانات الدخول غير صالحة.",
        },
        { status: 400 },
      );
    }

    const validPin = await verifyAdminPin(parsed.data.pin);

    if (!validPin) {
      const failure = await registerFailedAttempt(identifier);

      return NextResponse.json(
        {
          message: failure.allowed
            ? "رمز PIN غير صحيح."
            : "تم إيقاف المحاولات مؤقتاً بسبب تكرار إدخال الرمز بشكل خاطئ.",
        },
        { status: failure.allowed ? 401 : 429 },
      );
    }

    await clearRateLimit(identifier);

    const token = await createSessionToken();
    const { name, ...cookieOptions } = getSessionCookieOptions();
    const response = NextResponse.json({
      message: "تم تسجيل الدخول بنجاح.",
    });

    response.cookies.set(name, token, cookieOptions);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "حدث خطأ داخلي أثناء تسجيل الدخول.",
      },
      { status: 500 },
    );
  }
}
