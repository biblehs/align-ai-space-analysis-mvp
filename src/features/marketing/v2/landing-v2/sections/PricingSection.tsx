"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { pricingCards } from "../landing-v2.content";
import {
  pricingCardVariants,
  revealStaggerVariants,
  revealUpVariants,
} from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

type PricingSectionProps = {
  onOpenWaitlist: (email?: string, source?: string) => void;
};

export function PricingSection({ onOpenWaitlist }: PricingSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.18 },
      };

  return (
    <section id="pricing" className={styles.pricingSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.pricingHeader}
          variants={revealStaggerVariants}
          {...inViewRevealProps}
        >
          <motion.div className={styles.pricingHeaderCopy} variants={revealUpVariants}>
            <p className={styles.sectionEyebrow}>Pricing</p>
            <h2 className={styles.sectionTitleCentered}>Invest in stillness.</h2>
            <p className={styles.sectionIntro}>Simple options for curiosity, clarity, and deeper room support.</p>
          </motion.div>
          <motion.p className={styles.pricingHeaderNote} variants={revealUpVariants}>
            No subscription language, no pressure-heavy upsell. The structure is designed to feel clear,
            finite, and aligned with the emotional tone of the product.
          </motion.p>
        </motion.div>

        <p className={styles.mobileSwipeHint}>Swipe to explore</p>
        <div className={styles.mobileScrollWrap}>
          <motion.div
            className={styles.pricingGrid}
            variants={revealStaggerVariants}
            {...inViewRevealProps}
          >
            {pricingCards.map((card, index) => (
              <motion.article
                key={card.name}
                className={`${styles.pricingCard} ${card.featured ? styles.pricingFeatured : ""}`}
                custom={{ index, featured: card.featured }}
                variants={pricingCardVariants}
              >
                <span className={`${styles.pricingBadge} ${card.featured ? styles.pricingBadgeFeatured : ""}`}>
                  {card.eyebrow}
                </span>
                <h3>{card.name}</h3>
                <div className={styles.pricingPriceRow}>
                  <div className={styles.pricingPrice}>{card.price}</div>
                  <div className={styles.pricingBilling}>{card.billing}</div>
                </div>
                <p className={styles.pricingMeta}>{card.meta}</p>
                <ul className={styles.pricingList}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <Check className={styles.pricingCheck} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {card.ctaType === "waitlist" ? (
                  <button
                    type="button"
                    onClick={() => onOpenWaitlist("", card.source)}
                    className={card.featured ? styles.primaryButton : styles.ghostButton}
                  >
                    {card.ctaLabel}
                    <ArrowRight className={styles.buttonArrow} />
                  </button>
                ) : (
                  <span className={card.featured ? styles.primaryButton : styles.ghostButton}>
                    {card.ctaLabel}
                  </span>
                )}
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
