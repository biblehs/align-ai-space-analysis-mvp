import { motion, useReducedMotion } from "framer-motion";
import { Layers, Moon, SunMedium } from "lucide-react";
import { signalCards } from "../landing-v2.content";
import { revealStaggerVariants, revealUpVariants } from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

const signalIcons = [SunMedium, Layers, Moon] as const;

export function SignalsSection() {
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.16 },
      };

  return (
    <section id="signals" className={styles.signalsSection}>
      <motion.div
        className={styles.signalsHeader}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        <span>Small Signals</span>
        <motion.h2 variants={revealUpVariants}>
          Sometimes a room looks fine — and
          <br />
          still feels hard to be in.
        </motion.h2>
        <motion.p variants={revealUpVariants}>Align keeps the explanation gentle: light, attention, and recovery cues can shape how a room feels without making the space wrong.</motion.p>
      </motion.div>
      <motion.div
        className={styles.signalGrid}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        {signalCards.map((card, index) => {
          const SignalIcon = signalIcons[index] ?? SunMedium;
          return (
          <motion.article key={card.title} className={styles.signalCard} variants={revealUpVariants}>
            <div className={styles.signalImageWrap}>
              <SignalIcon aria-hidden="true" className={styles.signalIcon} />
            </div>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
