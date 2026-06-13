"use client";

import { useEffect, useState } from "react";
import styles from "./landing-v2.module.css";
import { navItems } from "./landing-v2.content";
import { FaqSection } from "./sections/FaqSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { PricingSection } from "./sections/PricingSection";
import { SignalsSection } from "./sections/SignalsSection";
import { SnapshotSection } from "./sections/SnapshotSection";
import { WaitlistModal } from "@/features/marketing/waitlist/WaitlistModal";
import { PublicSiteFooter } from "@/features/marketing/v2/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/marketing/v2/PublicSiteHeader";

export default function LandingV2Page() {
  const [activeNav, setActiveNav] = useState("#how");
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSource, setWaitlistSource] = useState("landing_hero");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Align | Spatial Wellness";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const openWaitlist = (email = "", source = "landing_hero") => {
    setWaitlistEmail(email);
    setWaitlistSource(source);
    setIsWaitlistOpen(true);
  };

  return (
    <main id="top" className={styles.page}>
      <PublicSiteHeader
        activeHref={activeNav}
        navItems={navItems}
        onNavClick={(href) => {
          if (href.startsWith("#")) {
            setActiveNav(href);
          }
        }}
      />

      <HeroSection onOpenWaitlist={openWaitlist} />
      <SnapshotSection />
      <SignalsSection />
      <HowItWorksSection />
      <PricingSection onOpenWaitlist={openWaitlist} />
      <FaqSection />
      <FinalCtaSection onOpenWaitlist={openWaitlist} />
      <PublicSiteFooter />

      <WaitlistModal
        isOpen={isWaitlistOpen}
        initialEmail={waitlistEmail}
        source={waitlistSource}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </main>
  );
}
