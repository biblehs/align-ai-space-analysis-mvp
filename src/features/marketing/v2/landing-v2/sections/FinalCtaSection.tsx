"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { landingImages } from "../landing-v2.content";
import { finalCtaItemVariants, finalCtaVariants } from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

type FinalCtaSectionProps = {
  onOpenWaitlist: (email?: string, source?: string) => void;
};

export function FinalCtaSection({ onOpenWaitlist }: FinalCtaSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.18 },
      };

  return (
    <section className={styles.finalCtaSection}>
      <Image
        className={styles.finalCtaImage}
        src={landingImages.finalLandscape}
        alt="Soft-focus misty landscape at dawn"
        fill
        quality={72}
        sizes="100vw"
      />
      <div className={styles.finalCtaOverlay} />
      <motion.div
        className={styles.finalCtaInner}
        variants={finalCtaVariants}
        {...inViewRevealProps}
      >
        <motion.p className={styles.finalCtaEyebrow} variants={finalCtaItemVariants}>
          Begin with the room that holds your everyday life
        </motion.p>
        <motion.h2 className={styles.finalCtaTitle} variants={finalCtaItemVariants}>
          Ready to change how
          <br />
          <span>your home feels?</span>
        </motion.h2>
        <motion.p variants={finalCtaItemVariants}>
          Join early users who are transforming their spaces from places they merely live,
          into places that actively support them.
        </motion.p>
        <motion.div variants={finalCtaItemVariants}>
          <button type="button" onClick={() => onOpenWaitlist("", "landing_final_cta")} className={styles.primaryButton}>
            Analyze your first room
          </button>
          <p className={styles.finalCtaHelper}>Free during our beta period. No credit card required.</p>
        </motion.div>
      </motion.div>
    </section>
  );
}
