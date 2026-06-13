import Link from "next/link";
import styles from "./public-site-shell.module.css";
import { LogoMark } from "@/features/app-ui/v2/shared/EditorialFlowChrome";
import { marketingFooterGroups } from "@/features/marketing/site-content";
import { marketingHomeHref } from "@/lib/navigation";

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;

export function PublicSiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrandBlock}>
          <p className={styles.footerEyebrow}>Align by Alignflow</p>
          <Link href={marketingHomeHref} className={styles.footerBrand} style={serifFont}>
            <LogoMark />
            <span>Align</span>
          </Link>
          <p className={styles.footerBrandCopy}>
            AI-powered room insights for better sleep, focus, and calm.
          </p>
          <Link href="mailto:hello@alignflow.xyz" className={styles.footerContact}>
            hello@alignflow.xyz
          </Link>
        </div>

        <div className={styles.footerGroups}>
          {marketingFooterGroups.map((group) => (
            <div key={group.title}>
              <h3 className={styles.footerGroupTitle}>{group.title}</h3>
              <ul className={styles.footerGroupList}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.footerGroupLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Alignflow. All rights reserved.</span>
        <span>Read your space. Improve your state.</span>
      </div>
    </footer>
  );
}
