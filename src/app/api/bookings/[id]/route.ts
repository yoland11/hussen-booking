import { NextRequest, NextResponse } from "next/server";

import { deleteBooking, getBookingById, updateBooking } from "@/lib/bookings";
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

type BookingRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: BookingRouteProps) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    return NextResponse.json({ message: "الحجز غير موجود." }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(request: NextRequest, { params }: BookingRouteProps) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = bookingPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الحجز غير صالحة." },
        { status: 400 },
      );
    }

    const booking = await updateBooking(id, parsed.data);
    return NextResponse.json({ booking, message: "تم تحديث الحجز بنجاح." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الحجز." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: BookingRouteProps) {
  const unauthorized = await ensureAuthorized(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id } = await params;
    await deleteBooking(id);
    return NextResponse.json({ message: "تم حذف الحجز بنجاح." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الحجز." },
      { status: 500 },
    );
  }
}
