import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/session";
import { removePushSubscription, upsertPushSubscription } from "@/lib/web-push";

export const runtime = "nodejs";

async function ensureAuthorized(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ message: "غير مصرح لك بالوصول." }, { status: 401 });
  }

  return null;
}

function parseSubscription(body: unknown) {
  if (
    !body ||
    typeof body !== "object" ||
    !("endpoint" in body) ||
    !("keys" in body) ||
    typeof body.endpoint !== "string" ||
    !body.endpoint ||
    typeof body.keys !== "object" ||
    body.keys === null ||
    !("p256dh" in body.keys) ||
    !("auth" in body.keys) ||
    typeof body.keys.p256dh !== "string" ||
    typeof body.keys.auth !== "string"
  ) {
    return null;
  }

  return {
    endpoint: body.endpoint,
    keys: {
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  };
}

export async function POST(request: NextRequest) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const subscription = parseSubscription(body);

    if (!subscription) {
      return NextResponse.json({ message: "بيانات الاشتراك غير صالحة." }, { status: 400 });
    }

    await upsertPushSubscription(subscription, request.headers.get("user-agent"));

    return NextResponse.json({ message: "تم تفعيل إشعارات النظام بنجاح." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ اشتراك الإشعارات." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || !("endpoint" in body) || typeof body.endpoint !== "string") {
      return NextResponse.json({ message: "بيانات الاشتراك غير صالحة." }, { status: 400 });
    }

    await removePushSubscription(body.endpoint);
    return NextResponse.json({ message: "تم إيقاف إشعارات النظام." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إيقاف اشتراك الإشعارات." },
      { status: 500 },
    );
  }
}
