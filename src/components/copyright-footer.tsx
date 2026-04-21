import styles from "./copyright-footer.module.css";

type CopyrightFooterProps = {
  variant?: "site" | "invoice";
};

export function CopyrightFooter({
  variant = "site",
}: CopyrightFooterProps) {
  return (
    <footer
      className={`${styles.footer} ${variant === "invoice" ? styles.invoice : styles.site}`}
    >
      <span className={styles.line} aria-hidden="true" />
      <p>جميع الحقوق محفوظة لـ Hussein Ali Hameed</p>
    </footer>
  );
}
