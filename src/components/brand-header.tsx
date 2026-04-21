import Image from "next/image";
import type { ReactNode } from "react";

import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";

import styles from "./brand-header.module.css";

type BrandHeaderProps = {
  eyebrow: string;
  description?: string;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string }>;
};

export function BrandHeader({
  eyebrow,
  description,
  actions,
  stats,
}: BrandHeaderProps) {
  return (
    <header className={styles.shell}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.brandBlock}>
          <div className={styles.coin}>
            <Image
              src="/brand/hb-logo.png"
              alt="شعار حسين بيرام"
              width={260}
              height={82}
              priority
            />
          </div>

          <div className={styles.copy}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1>{BRAND_NAME}</h1>
            <p className={styles.subtitle}>{BRAND_SUBTITLE}</p>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
        </div>

        <div className={styles.metaBlock}>
          {actions ? <div className={styles.actions}>{actions}</div> : null}

          {stats?.length ? (
            <section className={styles.statsRail} aria-label="إحصاءات الحجوزات">
              <div className={styles.statsGrid}>
                {stats.map((stat) => (
                  <article key={stat.label} className={styles.statCard}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </header>
  );
}
