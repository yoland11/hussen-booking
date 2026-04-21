"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./invoice-print-shell.module.css";

type InvoicePrintShellProps = {
  children: ReactNode;
};

const PRINTABLE_HEIGHT_PX = 980;

export function InvoicePrintShell({ children }: InvoicePrintShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [printScale, setPrintScale] = useState(1);
  const [printHeight, setPrintHeight] = useState("auto");

  useEffect(() => {
    let frame = 0;

    function fitToSinglePage() {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const content = contentRef.current;

        if (!content) {
          return;
        }

        const measuredHeight = content.scrollHeight;
        const scale = Math.min(1, PRINTABLE_HEIGHT_PX / measuredHeight);

        setPrintScale(Number(scale.toFixed(3)));
        setPrintHeight(`${Math.ceil(measuredHeight * scale)}px`);
      });
    }

    fitToSinglePage();
    window.addEventListener("resize", fitToSinglePage);
    window.addEventListener("beforeprint", fitToSinglePage);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fitToSinglePage);
      window.removeEventListener("beforeprint", fitToSinglePage);
    };
  }, []);

  return (
    <div
      className={styles.shell}
      style={
        {
          "--print-scale": String(printScale),
          "--print-height": printHeight,
        } as React.CSSProperties
      }
    >
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </div>
  );
}
