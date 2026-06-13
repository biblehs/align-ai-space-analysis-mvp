"use client";

import Link from "next/link";
import styles from "./public-site-shell.module.css";
import { LogoMark } from "@/features/app-ui/v2/shared/EditorialFlowChrome";
import {
  appAuthHref,
  appUploadEntryHref,
  marketingAboutHref,
  marketingHomeHref,
} from "@/lib/navigation";

export type PublicHeaderNavItem = {
  href: string;
  label: string;
};

export const publicSiteNavItems: PublicHeaderNavItem[] = [
  { href: `${marketingHomeHref}#wellness`, label: "How it works" },
  { href: `${marketingHomeHref}#editorial`, label: "Theory" },
  { href: `${marketingHomeHref}#pricing`, label: "Pricing" },
  { href: marketingAboutHref, label: "About" },
];

type PublicSiteHeaderProps = {
  activeHref?: string;
  navItems: PublicHeaderNavItem[];
  onNavClick?: (href: string) => void;
};

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;

export function PublicSiteHeader({
  activeHref,
  navItems,
  onNavClick,
}: PublicSiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href={marketingHomeHref} className={styles.logo} style={serifFont}>
          <LogoMark />
          <span>Align</span>
        </Link>

        <nav className={styles.navLinks}>
          {navItems.map((item) => {
            const isActive = item.href === activeHref;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onNavClick?.(item.href)}
                className={isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                style={serifFont}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.navActions}>
          <Link href={appAuthHref} className={styles.navSecondaryLink} style={serifFont}>
            Sign in
          </Link>
          <Link href={appUploadEntryHref} className={styles.navCta}>
            Begin Reading
          </Link>
        </div>
      </div>
    </header>
  );
}
