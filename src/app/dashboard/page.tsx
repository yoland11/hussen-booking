import { DashboardClient } from "@/components/dashboard-client";
import { requireAdminSession } from "@/lib/auth";
import { getBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAdminSession();
  const bookings = await getBookings();

  return <DashboardClient initialBookings={bookings} />;
}
