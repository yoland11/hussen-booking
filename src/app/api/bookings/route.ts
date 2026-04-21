import { NextRequest, NextResponse } from "next/server";

import { createBooking, getBookings } from "@/lib/bookings";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/session";
import { bookingPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function ensureAuthorized(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ message: "غير مصرح لك بالوصول." }, { status: 401 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الحجوزات." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = bookingPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الحجز غير صالحة." },
        { status: 400 },
      );
    }

    const booking = await createBooking(parsed.data);
    return NextResponse.json({ booking, message: "تم إنشاء الحجز بنجاح." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إنشاء الحجز." },
      { status: 500 },
    );
  }
}
