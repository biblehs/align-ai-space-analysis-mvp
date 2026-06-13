"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  heroPrismImage,
  heroThirdLinePhrases,
  heroThirdLineStyles,
} from "../landing-v2.content";
import {
  easeOutExpo,
  heroActionVariants,
  heroContentVariants,
  heroItemVariants,
} from "../landing-v2.motion";
import styles from "../landing-v2.module.css";
import { trackEvent } from "@/lib/analytics-client";
import { isValidWaitlistEmail, normalizeWaitlistEmail } from "@/lib/waitlist";

type HeroSectionProps = {
  onOpenWaitlist: (email?: string, source?: string) => void;
};

export function HeroSection({ onOpenWaitlist }: HeroSectionProps) {
  const [heroEmail, setHeroEmail] = useState("");
  const [heroError, setHeroError] = useState<string | null>(null);
  const [activeHeroPhraseIndex, setActiveHeroPhraseIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const heroEntranceProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  const handleHeroSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeWaitlistEmail(heroEmail);

    if (!isValidWaitlistEmail(normalized)) {
      setHeroError("Please enter a valid email address.");
      return;
    }

    setHeroError(null);
    await trackEvent({
      eventName: "hero_email_submitted",
      eventSource: "landing_hero_reference",
      properties: { source: "landing_hero_reference" },
    });
    onOpenWaitlist(normalized, "landing_hero_reference");
  };

  useEffect(() => {
    if (shouldReduceMotion) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroPhraseIndex((current) => (current + 1) % heroThirdLinePhrases.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [shouldReduceMotion]);

  return (
    <section className={styles.hero}>
      <div className={styles.heroVisual} aria-hidden="true">
        <Image
          src={heroPrismImage}
          alt=""
          fill
          priority
          quality={74}
          sizes="100vw"
          className={styles.heroVisualImage}
        />
        <div className={styles.heroVisualOverlay} />
      </div>

      <motion.div
        className={styles.heroInner}
        variants={heroContentVariants}
        {...heroEntranceProps}
      >
        <div className={styles.heroGrid}>
          <div className={styles.heroPanel}>
            <motion.p className={styles.heroEyebrow} variants={heroItemVariants}>
              AI room reading for sleep, focus & calm
            </motion.p>
            <motion.h1 className={styles.heroMobileTitle} variants={heroItemVariants}>
              <span className={styles.heroMobileTitlePlain}>A gentler way to</span>
              <span className={styles.heroMobileTitlePlain}>improve how your</span>
              <span className={styles.heroMobileDynamicLine}>
                <span className={styles.heroMobileDynamicSizer}>room settles.</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={heroThirdLinePhrases[activeHeroPhraseIndex]}
                    className={`${styles.heroMobileDynamicCurrent} ${styles[heroThirdLineStyles[activeHeroPhraseIndex].toneClass]} ${heroThirdLineStyles[activeHeroPhraseIndex].italic ? styles.heroTitleDynamicItalic : ""}`}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, y: -6 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 1.08,
                      ease: easeOutExpo,
                    }}
                  >
                    {heroThirdLinePhrases[activeHeroPhraseIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>
            <motion.h1 className={styles.heroTitle} variants={heroItemVariants}>
              <span className={styles.heroTitleLine}>A gentler way to</span>
              <span className={styles.heroTitleLine}>improve how your</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleDynamicLine}`}>
                <span className={styles.heroTitleDynamicSizer}>room settles.</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={heroThirdLinePhrases[activeHeroPhraseIndex]}
                    className={`${styles.heroTitleDynamicCurrent} ${styles[heroThirdLineStyles[activeHeroPhraseIndex].toneClass]} ${heroThirdLineStyles[activeHeroPhraseIndex].italic ? styles.heroTitleDynamicItalic : ""}`}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, y: -6 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 1.08,
                      ease: easeOutExpo,
                    }}
                  >
                    {heroThirdLinePhrases[activeHeroPhraseIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>
            <motion.p
              className={styles.heroCopy}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.92, ease: easeOutExpo }}
            >
              Upload one photo of your room and get personalized suggestions
              to support better sleep, focus, and calm — without redesigning
              everything.
            </motion.p>
            <motion.div
              className={styles.heroActions}
              variants={heroActionVariants}
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
            >
              <form className={styles.heroSignup} onSubmit={handleHeroSubmit}>
                <input
                  type="email"
                  value={heroEmail}
                  onChange={(event) => {
                    setHeroEmail(event.target.value);
                    if (heroError) {
                      setHeroError(null);
                    }
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  aria-label="Email"
                  className={styles.heroInput}
                />
                <button type="submit" className={styles.heroSubmit}>
                  Get Early Access
                </button>
              </form>
            </motion.div>
            <motion.p
              className={styles.heroHelper}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.82, ease: easeOutExpo }}
            >
              Restorative living starts with an invitation.
            </motion.p>
            {heroError ? <p className={styles.heroError}>{heroError}</p> : null}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
