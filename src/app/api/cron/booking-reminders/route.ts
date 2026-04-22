import { NextRequest, NextResponse } from "next/server";

import { sendDueReminderPushes } from "@/lib/web-push";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "غير مصرح لهذا الطلب." }, { status: 401 });
  }

  try {
    const summary = await sendDueReminderPushes();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إرسال إشعارات الحجوزات." },
      { status: 500 },
    );
  }
}
