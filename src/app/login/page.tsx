import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
