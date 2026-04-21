"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CopyrightFooter } from "@/components/copyright-footer";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";

import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setIsError(true);
        setFeedback(payload?.message || "تعذر تسجيل الدخول حالياً.");
        return;
      }

      setIsError(false);
      setFeedback(payload?.message || "تم تسجيل الدخول بنجاح.");
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>بوابة الإدارة</span>
          <h1 className={styles.brandTitle}>{BRAND_NAME}</h1>
          <p className={styles.brandSubtitle}>{BRAND_SUBTITLE}</p>

          <div className={styles.logoFrame}>
            <Image
              src="/brand/hb-logo.png"
              alt="شعار حسين بيرام"
              width={260}
              height={82}
              className={styles.logo}
              priority
            />
          </div>
        </section>

        <section className={styles.formShell}>
          <div className={styles.sectionHead}>
            <h2>تسجيل دخول الإدارة</h2>
          </div>

          {feedback && (
            <div className={`${styles.notice} ${isError ? styles.error : styles.success}`}>
              {feedback}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>رمز PIN</span>
              <input
                type="password"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="أدخل رمز الإدارة"
                disabled={isPending}
              />
            </label>

            <button className={styles.primaryButton} disabled={isPending}>
              {isPending ? "جارٍ التحقق..." : "دخول لوحة الحجوزات"}
            </button>
          </form>
        </section>

        <CopyrightFooter />
      </div>
    </main>
  );
}