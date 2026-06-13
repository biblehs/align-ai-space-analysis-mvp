import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { howSteps } from "../landing-v2.content";
import { revealStaggerVariants, revealUpVariants } from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.16 },
      };

  return (
    <section id="how" className={styles.howSection}>
      <motion.div
        className={styles.howIntro}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        <span>How Align works</span>
        <motion.h2 variants={revealUpVariants}>The Ritual Path</motion.h2>
        <motion.p variants={revealUpVariants}>Three slow, intentional transitions from room photo to room reading.</motion.p>
      </motion.div>
      <motion.div
        className={styles.howGrid}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        {howSteps.map((step, index) => {
          const toneClass =
            step.tone === "sage"
              ? styles.howCardSage
              : step.tone === "clay"
                ? styles.howCardClay
                : styles.howCardSand;

          return (
            <motion.article key={step.title} className={`${styles.howCard} ${toneClass}`} variants={revealUpVariants}>
              <div className={styles.howIcon}>
                <span>{index + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.image ? (
                <div className={styles.howImageWrap}>
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    quality={72}
                    sizes="(max-width: 760px) 86vw, 30vw"
                    className={styles.howImage}
                  />
                </div>
              ) : null}
              {step.scoreLabel && step.scoreValue ? (
                <div className={styles.howMetric}>
                  <div>
                    <small>{step.scoreLabel}</small>
                    <strong>{step.scoreValue}</strong>
                  </div>
                  {step.scoreMeta ? <span>{step.scoreMeta}</span> : null}
                </div>
              ) : null}
              {step.tags ? (
                <div className={styles.howTags}>
                  {step.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
              {step.outputs ? (
                <div className={styles.howOutputs}>
                  {step.outputs.map((output) => (
                    <span key={output}>{output}</span>
                  ))}
                </div>
              ) : null}
              {step.note ? <div className={styles.howNote}>{step.note}</div> : null}
              {step.progress ? (
                <div className={styles.progressPanel}>
                  <span>Analyzing visible cues</span>
                  <div>
                    <i />
                  </div>
                </div>
              ) : null}
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
