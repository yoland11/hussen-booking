import { InvoiceView } from "@/components/invoice-view";
import { requireAdminSession } from "@/lib/auth";
import { getBookingOrThrow } from "@/lib/bookings";

export const dynamic = "force-dynamic";

type InvoicePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
};

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  await requireAdminSession();

  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const booking = await getBookingOrThrow(id);

  return <InvoiceView booking={booking} autoPrint={resolvedSearchParams.print === "1"} />;
}
