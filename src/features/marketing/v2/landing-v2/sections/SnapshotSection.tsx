import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { landingImages } from "../landing-v2.content";
import { revealStaggerVariants, revealUpVariants } from "../landing-v2.motion";
import styles from "../landing-v2.module.css";

export function SnapshotSection() {
  const shouldReduceMotion = useReducedMotion();
  const inViewRevealProps = shouldReduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.16 },
      };

  return (
    <section id="snapshot" className={styles.layerSection}>
      <motion.div
        className={styles.sectionHeader}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        <span>The Snapshot</span>
        <motion.h2 variants={revealUpVariants}>
          A room reading that helps you sleep deeper, focus better, and feel calmer.
        </motion.h2>
        <motion.p variants={revealUpVariants}>
          Align turns one photo into a clear reading of how your space may be shaping rest, attention, and recovery — plus the first no-cost shift worth trying tonight.
        </motion.p>
      </motion.div>

      <motion.div
        className={styles.snapshotShowcase}
        variants={revealStaggerVariants}
        {...inViewRevealProps}
      >
        <motion.article className={styles.snapshotColumnCard} tabIndex={0} variants={revealUpVariants}>
          <span className={styles.snapshotMoreHint} aria-hidden="true">+</span>
          <span className={styles.snapshotColumnLabel}>Room Analysis</span>
          <div className={styles.snapshotImagePanel}>
            <Image
              src={landingImages.resultRoom}
              alt="A softly lit bedroom used as an example room reading"
              fill
              quality={72}
              sizes="(max-width: 900px) 92vw, 28vw"
              className={styles.snapshotImage}
            />
            <div className={styles.snapshotImageShade} />
            <div className={`${styles.snapshotPin} ${styles.snapshotPinOne}`}>
              <span aria-hidden="true" />
              Light Pressure
            </div>
            <div className={`${styles.snapshotPin} ${styles.snapshotPinTwo}`}>
              <span aria-hidden="true" />
              Rest Cue
            </div>
            <div className={styles.snapshotScanLine} />
          </div>
          <div className={styles.snapshotReveal}>
            <strong>Hover reading</strong>
            <p>Align maps the strongest visual signals first, then connects them to the feeling they may create in the room.</p>
          </div>
        </motion.article>

        <motion.article className={`${styles.snapshotColumnCard} ${styles.snapshotStateCard}`} tabIndex={0} variants={revealUpVariants}>
          <span className={styles.snapshotMoreHint} aria-hidden="true">+</span>
          <span className={styles.snapshotColumnLabel}>Space State</span>
          <div className={styles.snapshotStateViewport}>
            <div className={styles.snapshotStateDefault}>
              <div className={styles.snapshotStateLead}>
                <h3>What the room is quietly asking for.</h3>
                <p>A plain-language read of whether the room is already settling the body, or still holding a little more tension than rest.</p>
              </div>
              <div className={styles.snapshotStateTags}>
                <span>Quiet base</span>
                <span>Rest cues thin</span>
              </div>
            </div>

            <div className={styles.snapshotStateExpanded}>
              <strong>What changes on hover</strong>
              <p>The room state condenses into a cleaner emotional read, so you can see the pattern and the support gaps at a glance.</p>
              <div className={styles.snapshotStateTagsExpanded}>
                <span>Quiet base</span>
                <span>Rest cues thin</span>
                <span>Bare visual field</span>
              </div>
            </div>
          </div>
        </motion.article>

        <motion.article className={styles.snapshotColumnCard} tabIndex={0} variants={revealUpVariants}>
          <span className={styles.snapshotMoreHint} aria-hidden="true">+</span>
          <span className={styles.snapshotColumnLabel}>Visible Cues</span>
          <h3>The evidence behind the feeling.</h3>
          <p>Align names the room signals it can see, so the reading feels grounded instead of vague.</p>
          <ul className={styles.snapshotCueList}>
            <li>Bright glare crossing the resting sightline</li>
            <li>Clustered surfaces keeping attention active</li>
            <li>Mirror reflection adding visual movement near the bed</li>
          </ul>
          <div className={styles.snapshotReveal}>
            <strong>Next move</strong>
            <p>Each cue can become a small, zero-cost adjustment instead of a full redesign plan.</p>
          </div>
        </motion.article>
      </motion.div>
    </section>
  );
}
