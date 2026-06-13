"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, MoonStar, Zap } from "lucide-react";
import { useAppAccessGate } from "@/features/auth/useAppAccessGate";
import { MemberImmersiveFooter, MemberImmersiveHeader } from "@/features/app-ui/v2/shared/MemberChrome";
import { clearStoredAnalysisFlow } from "@/features/analysis/storage";
import { appAuthHref, appUploadHref, marketingHomeHref } from "@/lib/navigation";
import styles from "./upload-step1.module.css";
import { uploadFlowCopy } from "./upload-copy";
import {
  createFreshV2AnalysisId,
  getUploadV2Intake,
  patchUploadV2Intake,
  type UploadV2IntentId,
  type UploadV2SpaceId,
} from "./storage";

const spaces = [
  {
    id: "bedroom",
    label: "Restorative",
    title: "Bedroom",
    image: "/media/upload-spaces/upload-bedroom.webp",
  },
  {
    id: "workspace",
    label: "Cognitive",
    title: "Workspace",
    image: "/media/upload-spaces/upload-workspace.webp",
  },
  {
    id: "living-room",
    label: "Communal",
    title: "Living Room",
    image: "/media/upload-spaces/upload-living-room.webp",
  },
  {
    id: "creative-studio",
    label: "Expressive",
    title: "Creative Studio",
    image: "/media/upload-spaces/upload-creative-studio.webp",
  },
];

const intentions = [
  {
    id: "sleep",
    title: "Better Sleep",
    body: "Deep restorative rest",
    icon: MoonStar,
    tone: "sage",
  },
  {
    id: "focus",
    title: "More Focus",
    body: "Cognitive clarity",
    icon: Brain,
    tone: "plain",
  },
  {
    id: "calm",
    title: "More Calm",
    body: "Emotional equilibrium",
    icon: MoonStar,
    tone: "rose",
  },
  {
    id: "vitality",
    title: "Vitality",
    body: "Energy & movement",
    icon: Zap,
    tone: "olive",
  },
];

export default function UploadStep1Page() {
  const router = useRouter();
  const isAccessReady = useAppAccessGate("/app/upload");
  const initialIntake = useMemo(() => getUploadV2Intake(), []);
  const [selectedSpace, setSelectedSpace] = useState<UploadV2SpaceId>(initialIntake.spaceId ?? "workspace");
  const [selectedIntent, setSelectedIntent] = useState<UploadV2IntentId | null>(initialIntake.intentionId);
  const supportRef = useRef<HTMLElement>(null);
  const shouldAutoScrollRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      supportRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      shouldAutoScrollRef.current = false;
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [selectedSpace]);

  const selectedSpaceTitle = useMemo(
    () => spaces.find((space) => space.id === selectedSpace)?.title ?? "Workspace",
    [selectedSpace],
  );

  if (!isAccessReady) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      <MemberImmersiveHeader
        brandHref={appUploadHref}
        brandName="Align"
        stepLabel="Step 1 of 3"
        secondaryLabel="Sign in"
        secondaryHref={appAuthHref}
        utilityLabel="Exit"
        utilityHref={marketingHomeHref}
      />

      <main id="top" className={styles.main}>
        <div className={styles.topRow}>
          <Link href={marketingHomeHref} className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to home</span>
          </Link>
          <div className={styles.progressHeader}>
            <span className={styles.progressText}>Step 1 of 3</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>
          <span className={styles.heroTopSpacer} aria-hidden="true" />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            {uploadFlowCopy.step1.title}
            <br />
            <span>{uploadFlowCopy.step1.highlight}</span>
          </h1>
          <p className={styles.heroCopy}>
            {uploadFlowCopy.step1.body}
          </p>
        </section>

        <section className={styles.spaceSection}>
          <div className={styles.spaceGrid}>
            {spaces.map((space) => {
              const isSelected = space.id === selectedSpace;
              return (
                <motion.button
                  key={space.id}
                  type="button"
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => {
                    shouldAutoScrollRef.current = true;
                    setSelectedSpace(space.id as UploadV2SpaceId);
                  }}
                  className={`${styles.spaceCard} ${isSelected ? styles.spaceCardSelected : ""}`}
                >
                  <Image
                    src={space.image}
                    alt={space.title}
                    fill
                    sizes="(max-width: 760px) 90vw, 25vw"
                    className={styles.spaceImage}
                  />
                  <div className={styles.spaceOverlay} />
                  <div className={styles.spaceContent}>
                    <span className={styles.spaceLabel}>{space.label}</span>
                    <h2 className={styles.spaceTitle}>{space.title}</h2>
                  </div>
                  <span className={`${styles.selectionBadge} ${isSelected ? styles.selectionBadgeActive : ""}`}>
                    <span className={styles.selectionDot} />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section ref={supportRef} className={styles.intentSection}>
          <p className={styles.sectionEyebrow}>{uploadFlowCopy.step1.supportEyebrow}</p>
          <h2 className={styles.intentTitle}>
            {uploadFlowCopy.step1.supportTitle}
          </h2>
          <p className={styles.intentSubtitle}>Selected environment: {selectedSpaceTitle}</p>

          <div className={styles.intentGrid}>
            {intentions.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === selectedIntent;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setSelectedIntent(item.id as UploadV2IntentId)}
                  className={`${styles.intentCard} ${
                    isSelected ? styles.intentSelected : styles[`intent${item.tone[0].toUpperCase()}${item.tone.slice(1)}`]
                  }`}
                >
                  <span className={styles.intentIconWrap}>
                    <Icon size={20} className={styles.intentIcon} />
                  </span>
                  <span className={styles.intentCopy}>
                    <strong>{item.title}</strong>
                    <small>{item.body}</small>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!selectedIntent}
              onClick={() => {
                clearStoredAnalysisFlow();
                const analysisId = createFreshV2AnalysisId();
                patchUploadV2Intake({
                  analysisId,
                  spaceId: selectedSpace,
                  intentionId: selectedIntent,
                  issueId: null,
                  note: "",
                  activePerspectives: ["full-room", "main-area", "window-light"],
                  optionalProvided: false,
                  changeLevel: null,
                  budgetLevel: null,
                  selectedSupport: null,
                  photoPath: null,
                  photoUrl: null,
                  previewUrl: null,
                });
                router.push("/app/upload/step-2");
              }}
            >
              {uploadFlowCopy.step1.cta}
              <ArrowRight size={16} />
            </button>
            <Link href={marketingHomeHref} className={styles.skipLink}>
              Skip for now
            </Link>
          </div>
        </section>
      </main>

      <MemberImmersiveFooter brandName="Align" supportEmail="support@alignflow.xyz" />
    </div>
  );
}
