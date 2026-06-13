"use client";
/* eslint-disable @next/next/no-img-element */

import { type ChangeEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  Focus,
  Image as ImageIcon,
  Layers3,
  MoonStar,
  MoveRight,
  ScanSearch,
  Sparkles,
  SunMedium,
  Waves,
  Wind,
} from "lucide-react";
import { MemberImmersiveFooter, MemberImmersiveHeader } from "@/features/app-ui/v2/shared/MemberChrome";
import { useAnalyze } from "@/hooks/useAnalyze";
import { useUpload } from "@/hooks/useUpload";
import { clearStoredPendingAccess, clearStoredSnapshot, saveStoredGoalData, saveStoredUpload } from "@/features/analysis/storage";
import { useAppAccessGate } from "@/features/auth/useAppAccessGate";
import { getAuthHeaders } from "@/lib/auth-client";
import { compressImageFile } from "@/lib/client-image";
import { appAuthHref, appUploadHref, marketingHomeHref } from "@/lib/navigation";
import { isLocalPreviewHostname } from "@/lib/routing";
import { isSupportedUploadImageFile } from "@/lib/upload-image";
import styles from "./upload-step2.module.css";
import { uploadFlowCopy } from "./upload-copy";
import {
  buildV2GoalData,
  buildV2SpaceData,
  getOrCreateV2AnalysisId,
  getOrCreateV2UploadSessionId,
  getUploadV2Intake,
  patchUploadV2Intake,
} from "./storage";

const perspectiveChips = [
  { id: "full-room", label: "Full room view" },
  { id: "main-area", label: "Main area" },
  { id: "window-light", label: "Window/light" },
];

const roomIssues = [
  { id: "cluttered", title: "Cluttered", meta: "Overwhelming items", icon: Layers3, tone: "sage" },
  { id: "heavy", title: "Heavy", meta: "Low energy flow", icon: Waves, tone: "plain" },
  { id: "visually-noisy", title: "Visually noisy", meta: "Too much to focus on", icon: ScanSearch, tone: "rose" },
  { id: "unfocused", title: "Unfocused", meta: "Lacks purpose", icon: Focus, tone: "plain" },
  { id: "draining", title: "Draining", meta: "Feeling tired here", icon: Wind, tone: "olive" },
  { id: "hard-to-relax", title: "Hard to relax in", meta: "Always on edge", icon: MoonStar, tone: "sage" },
  { id: "lacking-warmth", title: "Lacking warmth", meta: "Cold or sterile", icon: SunMedium, tone: "rose" },
  { id: "stuck", title: "Stuck or stagnant", meta: "Old energy", icon: MoveRight, tone: "olive" },
];

const changeOptions = [
  "No-cost shifts only",
  "Small changes",
  "A few affordable upgrades",
  "Open to a fuller refresh",
];

const budgetOptions = [
  "No budget right now",
  "Under $30",
  "$30-$80",
  "$80-$150",
  "Open to suggestions",
];

const supportOptions = [
  "Better rest",
  "Less visual noise",
  "More focus",
  "More warmth",
  "More emotional ease",
  "A more grounded feeling",
];

type CompressionMetrics = {
  originalFileSize: number;
  compressedFileSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
} | null;

export default function UploadStep2Page() {
  const router = useRouter();
  const isAccessReady = useAppAccessGate("/app/upload/step-2");
  const initialIntake = useMemo(() => getUploadV2Intake(), []);
  const { upload, loading: isUploading, error: uploadError } = useUpload();
  const { analyze, loading: isAnalyzing, error: analyzeError } = useAnalyze();
  const [selectedIssue, setSelectedIssue] = useState(initialIntake.issueId ?? "visually-noisy");
  const [activePerspectives, setActivePerspectives] = useState<string[]>(
    initialIntake.activePerspectives.length > 0 ? initialIntake.activePerspectives : ["full-room", "main-area", "window-light"],
  );
  const [changeLevel, setChangeLevel] = useState(initialIntake.changeLevel ?? 1);
  const [budgetLevel, setBudgetLevel] = useState(initialIntake.budgetLevel ?? 1);
  const [selectedSupport, setSelectedSupport] = useState(initialIntake.selectedSupport ?? "Less visual noise");
  const [isTuningOpen, setIsTuningOpen] = useState(initialIntake.optionalProvided);
  const [note, setNote] = useState(initialIntake.note);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialIntake.photoUrl ? [initialIntake.photoUrl] : []);
  const [analysisId] = useState<string | null>(() => initialIntake.analysisId ?? (typeof window !== "undefined" ? getOrCreateV2AnalysisId() : null));
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState<"compressed" | "server_fallback">("compressed");
  const [compressionMetrics, setCompressionMetrics] = useState<CompressionMetrics>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScrollRef = useRef(false);
  const formStartedAtRef = useRef(Date.now());
  const isLocalPreviewMode =
    typeof window !== "undefined" && isLocalPreviewHostname(window.location.hostname);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      noteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        noteInputRef.current?.focus({ preventScroll: true });
      }, 220);
      shouldAutoScrollRef.current = false;
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [selectedIssue]);

  const helperCopy = useMemo(
    () => uploadFlowCopy.step2.helperBullets,
    [],
  );

  const changeProgress = (changeLevel / (changeOptions.length - 1)) * 100;
  const budgetProgress = (budgetLevel / (budgetOptions.length - 1)) * 100;
  const isBusy = isUploading || isAnalyzing || isPreparingImage;
  const canContinue = Boolean((selectedFile || previewUrls[0] || isLocalPreviewMode) && selectedIssue && analysisId);
  const activeError = submitError || uploadError || analyzeError;

  if (!isAccessReady) {
    return <div className={styles.page} />;
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFile = event.target.files?.[0];
    if (!incomingFile) {
      return;
    }

    setSubmitError(null);
    setUploadMessage(null);
    setIsPreparingImage(true);

    try {
      const result = await compressImageFile(incomingFile);
      const previewUrl = URL.createObjectURL(result.file);

      setPreviewUrls((current) => {
        current.forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        return [previewUrl];
      });

      setSelectedFile(result.file);
      setCompressionStatus(result.mode);
      setCompressionMetrics({
        originalFileSize: result.originalSize,
        compressedFileSize: result.compressedSize,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        compressedWidth: result.compressedWidth,
        compressedHeight: result.compressedHeight,
      });
      setUploadMessage("Your photo is ready. We’ll use it together with your room notes to generate the snapshot.");
    } catch (error) {
      if (isSupportedUploadImageFile(incomingFile)) {
        const previewUrl = URL.createObjectURL(incomingFile);
        setPreviewUrls((current) => {
          current.forEach((url) => {
            if (url.startsWith("blob:")) {
              URL.revokeObjectURL(url);
            }
          });
          return [previewUrl];
        });
        setSelectedFile(incomingFile);
        setCompressionStatus("server_fallback");
        setCompressionMetrics(null);
        setUploadMessage("We’ll optimize this photo securely on the server before analysis.");
      } else {
        setSelectedFile(null);
        setCompressionMetrics(null);
        setSubmitError(
          error instanceof Error ? error.message : "This image could not be prepared for upload. Please try another photo.",
        );
      }
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    if (!canContinue) {
      setSubmitError("Please upload at least one room photo before continuing.");
      return;
    }

    setSubmitError(null);
    clearStoredSnapshot();
    clearStoredPendingAccess();

    let workingIntake = patchUploadV2Intake({
      analysisId,
      issueId: selectedIssue,
      activePerspectives,
      note,
      optionalProvided: isTuningOpen,
      changeLevel: isTuningOpen ? changeLevel : null,
      budgetLevel: isTuningOpen ? budgetLevel : null,
      selectedSupport: isTuningOpen ? selectedSupport : null,
    });

    const nextAnalysisId = workingIntake.analysisId ?? getOrCreateV2AnalysisId();

    if (selectedFile) {
      const authHeaders = await getAuthHeaders();
      const provisionalSpaceData = buildV2SpaceData(workingIntake);
      const uploadResult = await upload({
        analysisId: nextAnalysisId,
        file: selectedFile,
        spaceData: provisionalSpaceData,
        compressionStatus,
        compressionMetrics,
        headers: authHeaders,
        honeypot: "",
        startedAt: formStartedAtRef.current,
        uploadSessionId: getOrCreateV2UploadSessionId(),
      });

      if (!uploadResult.success) {
        setSubmitError(uploadResult.error);
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const photoUrl = supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/room-photos/${uploadResult.photoPath}`
        : null;

      workingIntake = patchUploadV2Intake({
        analysisId: nextAnalysisId,
        photoPath: uploadResult.photoPath,
        photoUrl,
      });
    }

    const spaceData = buildV2SpaceData(workingIntake);
    const goalData = buildV2GoalData(workingIntake);

    saveStoredUpload({
      analysisId: nextAnalysisId,
      spaceData,
    });

    saveStoredGoalData({
      analysisId: nextAnalysisId,
      goalData,
    });

    try {
      const authHeaders = await getAuthHeaders();
      await analyze({
        analysisId: nextAnalysisId,
        spaceData,
        goalData,
        headers: authHeaders,
      });
      router.push(`/app/upload/step-3?analysisId=${nextAnalysisId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "We couldn’t start the analysis. Please try again.",
      );
    }
  };

  return (
    <div className={styles.page}>
      <MemberImmersiveHeader
        brandHref={appUploadHref}
        brandName="Align"
        stepLabel="Step 2 of 3"
        secondaryLabel="Sign in"
        secondaryHref={appAuthHref}
        utilityLabel="Exit"
        utilityHref={marketingHomeHref}
      />

      <main className={styles.main}>
        <div className={styles.topRow}>
          <Link href={appUploadHref} className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to step 1</span>
          </Link>
          <div className={styles.progressHeader}>
            <span className={styles.progressText}>Step 2 of 3</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>
          <span className={styles.heroTopSpacer} aria-hidden="true" />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{uploadFlowCopy.step2.title}</h1>
          <p className={styles.heroCopy}>
            {uploadFlowCopy.step2.body}
          </p>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handlePhotoUpload}
            />

            <button
              type="button"
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <span className={styles.uploadIconShell}>
                <Camera size={28} />
              </span>
              <div className={styles.uploadCopy}>
                <h2>{isPreparingImage ? uploadFlowCopy.step2.uploadTitleBusy : uploadFlowCopy.step2.uploadTitleIdle}</h2>
                <p>
                  {uploadFlowCopy.step2.uploadBody.split("browse your files")[0]}
                  <span>browse your files</span>
                </p>
              </div>
            </button>

            <div className={styles.previewGrid}>
              {previewUrls[0] ? (
                <div className={styles.previewCard}>
                  <img src={previewUrls[0]} alt="Uploaded room preview" className={styles.previewImage} />
                </div>
              ) : (
                <div className={styles.previewPlaceholder}>
                  <ImageIcon size={20} />
                </div>
              )}
              <div className={styles.previewPlaceholder}>
                <ImageIcon size={20} />
              </div>
              <div className={styles.previewPlaceholder}>
                <ImageIcon size={20} />
              </div>
            </div>

            <div className={styles.helperPill}>
              <CheckCircle2 size={14} />
              <span>{isLocalPreviewMode ? uploadFlowCopy.step2.localHint : uploadFlowCopy.step2.readinessHint}</span>
            </div>

            {uploadMessage ? <p className={styles.statusNote}>{uploadMessage}</p> : null}
            {activeError ? <p className={styles.errorNote}>{activeError}</p> : null}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.block}>
              <p className={styles.eyebrow}>Helpful Perspectives</p>
              <div className={styles.chipRow}>
                {perspectiveChips.map((chip) => {
                  const isActive = activePerspectives.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.perspectiveChip} ${isActive ? styles.perspectiveChipActive : ""}`}
                      onClick={() =>
                        setActivePerspectives((current) =>
                          current.includes(chip.id)
                            ? current.filter((item) => item !== chip.id)
                            : [...current, chip.id],
                        )
                      }
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <ul className={styles.helperList}>
                {helperCopy.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.block}>
              <h2 className={styles.sectionTitle}>What feels most off in this space right now?</h2>
              <div className={styles.issueGrid}>
                {roomIssues.map((issue) => {
                  const isSelected = issue.id === selectedIssue;
                  const Icon = issue.icon;
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => {
                        shouldAutoScrollRef.current = true;
                        setSelectedIssue(issue.id);
                      }}
                      className={`${styles.issueCard} ${
                        isSelected ? styles.issueCardSelected : styles[`issue${issue.tone[0].toUpperCase()}${issue.tone.slice(1)}`]
                      }`}
                    >
                      <span className={styles.issueIconWrap}>
                        <Icon size={16} className={styles.issueIcon} />
                      </span>
                      <span className={styles.issueCopy}>
                        <strong>{issue.title}</strong>
                        <small>{issue.meta}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div ref={noteRef} className={styles.block}>
              <label htmlFor="space-note" className={styles.eyebrow}>
                Anything else you want Align to know?
              </label>
              <textarea
                id="space-note"
                ref={noteInputRef}
                className={styles.noteField}
                placeholder="Describe the feeling when you walk in..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className={styles.tuningRow}>
              <div className={styles.tuningToggle}>
                  <span className={styles.tuningLabel}>
                    <strong>Add optional details</strong>
                    <em>{uploadFlowCopy.step2.optionalDetails}</em>
                  </span>
                <button
                  type="button"
                  className={`${styles.tuningChevron} ${isTuningOpen ? styles.tuningChevronOpen : ""}`}
                  aria-expanded={isTuningOpen}
                  aria-controls="step2-tuning-panel"
                  onClick={() => setIsTuningOpen((current) => !current)}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {isTuningOpen ? (
                <div id="step2-tuning-panel" className={styles.tuningPanel}>
                  <div className={styles.tuningBlock}>
                    <h3>What kind of change feels realistic right now?</h3>
                    <div className={styles.sliderBlock}>
                      <div className={styles.sliderShell}>
                        <input
                          type="range"
                          min="0"
                          max={String(changeOptions.length - 1)}
                          step="1"
                          value={changeLevel}
                          onChange={(event) => setChangeLevel(Number(event.target.value))}
                          className={styles.rangeSlider}
                          aria-label="Change openness"
                          style={{ "--slider-progress": `${changeProgress}%` } as CSSProperties}
                        />
                      </div>
                      <div className={styles.sliderTicks} aria-hidden="true">
                        {changeOptions.map((option, index) => (
                          <span key={option} className={`${styles.sliderTick} ${index === changeLevel ? styles.sliderTickActive : ""}`}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.tuningBlock}>
                    <h3>What budget feels comfortable for this space?</h3>
                    <div className={styles.sliderBlock}>
                      <div className={styles.sliderShell}>
                        <input
                          type="range"
                          min="0"
                          max={String(budgetOptions.length - 1)}
                          step="1"
                          value={budgetLevel}
                          onChange={(event) => setBudgetLevel(Number(event.target.value))}
                          className={styles.rangeSlider}
                          aria-label="Budget comfort"
                          style={{ "--slider-progress": `${budgetProgress}%` } as CSSProperties}
                        />
                      </div>
                      <div className={styles.sliderTicks} aria-hidden="true">
                        {budgetOptions.map((option, index) => (
                          <span key={option} className={`${styles.sliderTick} ${index === budgetLevel ? styles.sliderTickActive : ""}`}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.tuningBlock}>
                    <h3>What would help most right now?</h3>
                    <div className={styles.tuningChipRow}>
                      {supportOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`${styles.tuningChip} ${selectedSupport === option ? styles.tuningChipSelected : ""}`}
                          onClick={() => setSelectedSupport(option)}
                          aria-pressed={selectedSupport === option}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.ctaRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleGenerateSnapshot}
                disabled={!canContinue || isBusy}
              >
                {isUploading ? "Uploading your room..." : isAnalyzing ? "Generating your snapshot..." : uploadFlowCopy.step2.cta}
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <MemberImmersiveFooter brandName="Align" supportEmail="support@alignflow.xyz" />
    </div>
  );
}
