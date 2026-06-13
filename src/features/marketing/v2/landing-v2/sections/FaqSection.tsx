"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faqs } from "../landing-v2.content";
import { revealStaggerVariants, revealUpVariants } from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

export function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.18 },
      };

  return (
    <section className={styles.faqSection}>
      <div className={styles.containerFaq}>
        <motion.div
          className={styles.sectionHeaderCentered}
          variants={revealStaggerVariants}
          {...inViewRevealProps}
        >
          <motion.p className={styles.sectionEyebrow} variants={revealUpVariants}>
            FAQ
          </motion.p>
          <motion.h2 className={styles.sectionTitleCentered} variants={revealUpVariants}>
            Common <span>Questions</span>
          </motion.h2>
          <motion.p className={styles.sectionIntro} variants={revealUpVariants}>
            A few quick answers before you upload a room. The goal is to keep the process light, readable, and easy to trust.
          </motion.p>
        </motion.div>

        <motion.div
          className={styles.faqList}
          variants={revealStaggerVariants}
          {...inViewRevealProps}
        >
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <motion.div
                key={faq.q}
                className={styles.faqItem}
                custom={index}
                variants={revealUpVariants}
              >
                <button
                  type="button"
                  className={styles.faqButton}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`} />
                </button>
                <div className={`${styles.faqPanel} ${isOpen ? styles.faqPanelOpen : ""}`}>
                  <p>{faq.a}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
