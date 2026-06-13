"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAppAccessGate } from "@/features/auth/useAppAccessGate";
import { MemberImmersiveFooter, MemberImmersiveHeader } from "@/features/app-ui/v2/shared/MemberChrome";
import { DEFAULT_BILLING_PRODUCT_KEY } from "@/lib/billing";
import { appendLocalAnalysis, getAuthHeaders, getLocalAnalyses, getLocalAuthUser, hasAuthenticatedSession, readAuthHeader } from "@/lib/auth-client";
import { trackEvent } from "@/lib/analytics-client";
import { useCheckout } from "@/hooks/useCheckout";
import { downloadNodeAsPng, shareNodeAsImage } from "@/lib/client-report-image";
import type { ComparisonSnapshotResultV2, SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import { buildComparisonSnapshotV2 } from "@/lib/align-v2/comparison-snapshot";
import {
  clearStoredAnalysisFlow,
  clearStoredPendingAccess,
  clearStoredSnapshot,
  getStoredPendingAccess,
  getStoredSnapshot,
  saveStoredPendingAccess,
  saveStoredSnapshot,
} from "@/features/analysis/storage";
import type { ReportResult } from "@/types";
import styles from "./upload-step3.module.css";
import { buildV2GoalData, getUploadV2Intake, patchUploadV2Intake, type UploadV2SpaceId } from "./storage";
import { appAccountHref, appAuthHref, appUploadHref, getAppAuthHref, marketingHomeHref } from "@/lib/navigation";
import { SnapshotExportCardV2 } from "@/features/analysis/snapshot/components/SnapshotExportCardV2";
import { SnapshotCheckoutModal } from "@/features/analysis/snapshot/components/SnapshotCheckoutModal";
import { ComparisonSnapshotSection } from "@/features/analysis/snapshot/components/ComparisonSnapshotSection";
import { SnapshotRegistrationPrompt } from "@/features/analysis/snapshot/components/SnapshotRegistrationPrompt";
import { SnapshotV2Section } from "@/features/analysis/snapshot/components/SnapshotV2Section";
import type { AnalysisHistoryItem } from "@/types";
type AnalysisPipelineState = ReportResult["pipeline"];
type ActionRequiredState = {
  code: "ROOM_TYPE_CONFIRMATION_REQUIRED";
  message: string;
  claimedRoomType: string | null;
  detectedRoomType: string | null;
};

const PROCESSING_AMBIENCE_IMAGE = "/media/fallback/room-soft.webp";

type AnalyzeStatusResponse =
  | {
      status: "processing";
      analysisId: string;
      pipeline?: AnalysisPipelineState;
    }
  | {
      status: "action_required";
      analysisId: string;
      code: "ROOM_TYPE_CONFIRMATION_REQUIRED";
      message: string;
      claimedRoomType: string | null;
      detectedRoomType: string | null;
      pipeline?: AnalysisPipelineState;
    }
  | {
      status: "completed";
      analysisId: string;
      registrationRequired: boolean;
      snapshot: SnapshotResultV2;
      pipeline?: AnalysisPipelineState;
    }
  | {
      status: "failed";
      analysisId: string;
      error: string;
      pipeline?: AnalysisPipelineState;
    };

function humanizeRoomType(roomType: string | null) {
  if (!roomType) {
    return "room";
  }

  return roomType
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toSupportedUploadSpaceId(roomType: string | null): UploadV2SpaceId | null {
  switch (roomType) {
    case "bedroom":
      return "bedroom";
    case "workspace":
      return "workspace";
    case "living_room":
    case "living-room":
      return "living-room";
    case "creative_studio":
    case "creative-studio":
      return "creative-studio";
    default:
      return null;
  }
}

function getProcessingMessage(pipeline: AnalysisPipelineState | null) {
  if (!pipeline) {
    return {
      title: "Generating your Snapshot",
      body: "We&apos;re shaping your first insight.",
      note: "Preparing",
    };
  }

  if (pipeline.status === "pending" || pipeline.stage === "snapshot_queued") {
    return {
      title: "Generating your Snapshot",
      body: "We&apos;re shaping your first insight.",
      note: "Preparing",
    };
  }

  if (pipeline.preanalysisStatus === "processing" || pipeline.stage === "preanalysis_processing") {
    return {
      title: "Generating your Snapshot",
      body: "We&apos;re shaping your first insight.",
      note: "Reading",
    };
  }

  if (pipeline.snapshotStatus === "processing" || pipeline.stage === "snapshot_processing") {
    return {
      title: "Generating your Snapshot",
      body: "We&apos;re shaping your first insight.",
      note: "Refining",
    };
  }

  return {
    title: "Generating your Snapshot",
    body: "We&apos;re shaping your first insight.",
    note: "Finalizing",
  };
}

function getProcessingProgressState(pipeline: AnalysisPipelineState | null) {
  if (!pipeline) {
      return {
      target: 18,
      phaseLabel: "Preparing",
      phaseDetail: "Securing your image.",
    };
  }

  if (pipeline.status === "pending" || pipeline.stage === "snapshot_queued") {
      return {
      target: 26,
      phaseLabel: "Preparing",
      phaseDetail: "Securing your image.",
    };
  }

  if (pipeline.preanalysisStatus === "processing" || pipeline.stage === "preanalysis_processing") {
      return {
      target: 58,
      phaseLabel: "Reading",
      phaseDetail: "Looking at light and layout.",
    };
  }

  if (pipeline.snapshotStatus === "processing" || pipeline.stage === "snapshot_processing") {
      return {
      target: 82,
      phaseLabel: "Refining",
      phaseDetail: "Shaping your first insight.",
    };
  }

  return {
    target: 90,
    phaseLabel: "Finalizing",
    phaseDetail: "Preparing the first result.",
  };
}

const processingCards = [
  {
    id: "insight",
    eyebrow: "Spatial insight",
    quote: "Small shifts in a room can change how it feels to think, rest, or reset.",
  },
  {
    id: "light",
    eyebrow: "What we’re sensing",
    quote: "We’re looking for light, layout, softness, and the places where the room still feels slightly awake.",
  },
  {
    id: "restore",
    eyebrow: "Why it matters",
    quote: "A room can look calm and still hold subtle signals that keep the body from fully settling.",
  },
];

export default function UploadStep3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoProcessing = searchParams?.get("demoProcessing") === "1";
  const accessRedirectPath = useMemo(() => {
    const requestedAnalysisId = searchParams?.get("analysisId");
    return requestedAnalysisId ? `/app/upload/step-3?analysisId=${requestedAnalysisId}` : "/app/upload/step-3";
  }, [searchParams]);
  const isAccessReady = useAppAccessGate(accessRedirectPath);
  const { checkout, loading: isCheckingOut, error: checkoutError } = useCheckout();
  const freeExportRef = useRef<HTMLDivElement>(null);
  const processingStartedAtRef = useRef(Date.now());
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phase, setPhase] = useState<"processing" | "action_required" | "snapshot" | "failed">("processing");
  const [statusIndex, setStatusIndex] = useState(0);
  const [snapshotData, setSnapshotData] = useState<SnapshotResultV2 | null>(null);
  const [comparisonSnapshot, setComparisonSnapshot] = useState<ComparisonSnapshotResultV2 | null>(null);
  const [pipelineState, setPipelineState] = useState<AnalysisPipelineState | null>(null);
  const [actionRequiredState, setActionRequiredState] = useState<ActionRequiredState | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [isExportingFree, setIsExportingFree] = useState(false);
  const [isSharingFree, setIsSharingFree] = useState(false);
  const [isResolvingMismatch, setIsResolvingMismatch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backHref, setBackHref] = useState(marketingHomeHref);
  const [backLabel, setBackLabel] = useState("Back to home");

  const intake = useMemo(() => getUploadV2Intake(), []);
  const currentGoalData = useMemo(() => buildV2GoalData(intake), [intake]);
  const localAuthUser = useMemo(() => getLocalAuthUser(), []);
  const processingMessage = useMemo(() => getProcessingMessage(pipelineState), [pipelineState]);
  const processingProgressState = useMemo(() => getProcessingProgressState(pipelineState), [pipelineState]);
  const processingCard = processingCards[statusIndex % processingCards.length];
  const [displayProgress, setDisplayProgress] = useState(12);

  const currentGoalKey = useMemo(() => {
    return currentGoalData.goal ?? snapshotData?.score.goal ?? null;
  }, [currentGoalData.goal, snapshotData?.score.goal]);

  useEffect(() => {
    if (!isAccessReady) {
      return;
    }

    if (demoProcessing) {
      setAnalysisId("demo-processing");
      setPhase("processing");
      setPipelineState({
        stage: "snapshot_queued",
        status: "pending",
        preanalysisStatus: "pending",
        snapshotStatus: "pending",
        fullReportStatus: "pending",
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      return;
    }

    const currentAnalysisId =
      searchParams?.get("analysisId") ??
      intake.analysisId ??
      getStoredPendingAccess()?.analysisId ??
      getStoredSnapshot()?.analysisId ??
      null;

    if (!currentAnalysisId) {
      router.replace("/app/upload/step-2");
      return;
    }

    setAnalysisId(currentAnalysisId);

    const storedSnapshot = getStoredSnapshot();
    if (storedSnapshot?.analysisId === currentAnalysisId) {
      const normalizedSnapshot = coerceSnapshotV2(storedSnapshot.snapshot);
      if (normalizedSnapshot) {
        setSnapshotData(normalizedSnapshot);
        setPhase("snapshot");
      }
    }
  }, [demoProcessing, intake.analysisId, isAccessReady, router, searchParams]);

  useEffect(() => {
    if (!isAccessReady) {
      return;
    }

    if (demoProcessing) {
      return;
    }

    let cancelled = false;

    const resolveBackDestination = async () => {
      if (localAuthUser) {
        if (!cancelled) {
          setBackHref(appAccountHref);
          setBackLabel("Back to account");
        }
        return;
      }

      const authenticated = await hasAuthenticatedSession();
      if (cancelled) {
        return;
      }

      if (authenticated) {
        setBackHref(appAccountHref);
        setBackLabel("Back to account");
        return;
      }

      setBackHref(marketingHomeHref);
      setBackLabel("Back to home");
    };

    void resolveBackDestination();

    return () => {
      cancelled = true;
    };
  }, [demoProcessing, isAccessReady, localAuthUser]);

  useEffect(() => {
    if (!isAccessReady) {
      return;
    }

    if (demoProcessing) {
      const rotation = window.setInterval(() => {
        setStatusIndex((current) => current + 1);
      }, 3200);

      return () => {
        window.clearInterval(rotation);
      };
    }

    if (!analysisId || phase !== "processing") {
      return;
    }

    processingStartedAtRef.current = Date.now();

    let cancelled = false;
    const rotation = window.setInterval(() => {
      setStatusIndex((current) => current + 1);
    }, 3200);

    const hydrateAccessIfAuthenticated = async (
      nextAnalysisId: string,
      nextSnapshot: SnapshotResultV2,
    ) => {
      const authHeaders = await getAuthHeaders();
      const authValue = readAuthHeader(authHeaders);

      if (!authValue) {
        setShowRegistrationPrompt(true);
        return;
      }

      const res = await fetch("/api/analysis/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ analysisId: nextAnalysisId }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            success?: boolean;
            data?: { snapshot?: SnapshotResultV2; report?: ReportResult | null };
            error?: string;
          }
        | null;

      if (cancelled) {
        return;
      }

      if (res.ok && json?.success && json.data?.snapshot) {
        const normalizedSnapshot = coerceSnapshotV2(json.data.snapshot);
        if (!normalizedSnapshot) {
          setShowRegistrationPrompt(true);
          return;
        }
        saveStoredSnapshot({
          analysisId: nextAnalysisId,
          snapshot: normalizedSnapshot,
        });
        clearStoredPendingAccess();
        setSnapshotData(normalizedSnapshot);
        setShowRegistrationPrompt(false);
        return;
      }

      setSnapshotData(nextSnapshot);
      setShowRegistrationPrompt(true);
    };

    const pollStatus = async () => {
      while (!cancelled) {
        const res = await fetch(`/api/analyze/${analysisId}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | {
              success?: boolean;
              data?: AnalyzeStatusResponse;
              error?: string;
            }
          | null;

        if (cancelled) {
          return;
        }

        if (!res.ok || !json?.success || !json.data) {
          setPhase("failed");
          setErrorMessage(json?.error || "We could not check your report status.");
          return;
        }

        if (json.data.status === "completed") {
          const normalizedSnapshot = coerceSnapshotV2(json.data.snapshot);
          if (!normalizedSnapshot) {
            setPhase("failed");
            setErrorMessage("We could not read the generated snapshot.");
            return;
          }
          setPipelineState(json.data.pipeline ?? null);
          setActionRequiredState(null);
          saveStoredSnapshot({
            analysisId,
            snapshot: normalizedSnapshot,
          });

          if (json.data.registrationRequired) {
            saveStoredPendingAccess({
              analysisId,
              requiresRegistration: true,
            });
          } else {
            clearStoredPendingAccess();
          }

          setSnapshotData(normalizedSnapshot);
          appendLocalAnalysis({
            id: analysisId,
            goal_data: currentGoalData,
            snapshot_result: normalizedSnapshot,
          });
          void trackEvent({
            eventName: "analysis_processing_completed",
            analysisId,
            eventSource: "processing-page",
            properties: {
              processingWaitMs: Date.now() - processingStartedAtRef.current,
              pipeline: json.data.pipeline ?? null,
            },
          });
          setPhase("snapshot");

          if (json.data.registrationRequired) {
            await hydrateAccessIfAuthenticated(analysisId, normalizedSnapshot);
          }

          return;
        }

        if (json.data.status === "action_required") {
          setPipelineState(json.data.pipeline ?? null);
          setActionRequiredState({
            code: json.data.code,
            message: json.data.message,
            claimedRoomType: json.data.claimedRoomType,
            detectedRoomType: json.data.detectedRoomType,
          });
          setErrorMessage(null);
          setPhase("action_required");
          return;
        }

        if (json.data.status === "failed") {
          setPipelineState(json.data.pipeline ?? null);
          setActionRequiredState(null);
          setPhase("failed");
          setErrorMessage(
            json.data.pipeline?.lastErrorMessage ||
            json.data.error ||
            "We could not generate your report this time."
          );
          return;
        }

        setPipelineState(json.data.pipeline ?? null);

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
    };

    void pollStatus();

    return () => {
      cancelled = true;
      window.clearInterval(rotation);
    };
  }, [analysisId, currentGoalData, demoProcessing, isAccessReady, phase]);

  useEffect(() => {
    if (!demoProcessing || phase !== "processing") {
      return;
    }

    const mockPipelineStates: AnalysisPipelineState[] = [
      {
        stage: "snapshot_queued",
        status: "pending",
        preanalysisStatus: "pending",
        snapshotStatus: "pending",
        fullReportStatus: "pending",
        lastErrorCode: null,
        lastErrorMessage: null,
      },
      {
        stage: "preanalysis_processing",
        status: "processing",
        preanalysisStatus: "processing",
        snapshotStatus: "pending",
        fullReportStatus: "pending",
        lastErrorCode: null,
        lastErrorMessage: null,
      },
      {
        stage: "snapshot_processing",
        status: "processing",
        preanalysisStatus: "completed",
        snapshotStatus: "processing",
        fullReportStatus: "pending",
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    ];

    let index = 0;
    setPipelineState(mockPipelineStates[index]);

    const interval = window.setInterval(() => {
      index = (index + 1) % mockPipelineStates.length;
      setPipelineState(mockPipelineStates[index]);
    }, 2800);

    return () => {
      window.clearInterval(interval);
    };
  }, [demoProcessing, phase]);

  useEffect(() => {
    if (phase !== "processing") {
      return;
    }

    const target = processingProgressState.target;
    const animation = window.setInterval(() => {
      setDisplayProgress((current) => {
        if (current === target) {
          return current;
        }

        if (current < target) {
          return Math.min(target, current + Math.max(1, Math.ceil((target - current) / 8)));
        }

        return Math.max(target, current - 1);
      });
    }, 36);

    return () => {
      window.clearInterval(animation);
    };
  }, [phase, processingProgressState.target]);

  useEffect(() => {
    if (!isAccessReady || phase !== "snapshot" || !analysisId || !snapshotData || !currentGoalKey) {
      return;
    }

    let cancelled = false;

    const mapGoalKey = (goal: string | null | undefined) => {
      if (goal === "stress") return "calm";
      if (goal === "energy") return "vitality";
      return goal ?? null;
    };

    const loadComparison = async () => {
      let analyses: AnalysisHistoryItem[] = [];
      const authHeaders = await getAuthHeaders();
      const authValue = readAuthHeader(authHeaders);

      if (authValue) {
        const res = await fetch("/api/account/analyses", {
          headers: authHeaders,
          cache: "no-store",
        });
        const json = await res.json().catch(() => null) as
          | { success?: boolean; data?: { analyses?: AnalysisHistoryItem[] } }
          | null;

        if (res.ok && json?.success && json.data?.analyses) {
          analyses = json.data.analyses;
        }
      } else {
        analyses = getLocalAnalyses();
      }

      if (cancelled) {
        return;
      }

      const previousMatch = analyses
        .filter((item) => item.id !== analysisId && mapGoalKey(item.goal_data?.goal) === currentGoalKey)
        .map((item) => ({
          id: item.id,
          created_at: item.created_at,
          snapshot: coerceSnapshotV2(item.report_result?.free.snapshot ?? item.snapshot_result ?? null),
        }))
        .filter((item): item is { id: string; created_at: string; snapshot: SnapshotResultV2 } => Boolean(item.snapshot))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!previousMatch) {
        setComparisonSnapshot(null);
        return;
      }

      const nextComparison = buildComparisonSnapshotV2({
        previousAnalysisId: previousMatch.id,
        currentAnalysisId: analysisId,
        previous: previousMatch.snapshot,
        current: snapshotData,
      });

      setComparisonSnapshot(nextComparison);
    };

    void loadComparison();

    return () => {
      cancelled = true;
    };
  }, [analysisId, currentGoalKey, isAccessReady, phase, snapshotData]);

  useEffect(() => {
    if (!isAccessReady) {
      return;
    }

    if (!analysisId || !snapshotData || phase !== "snapshot") {
      return;
    }

    const pendingAccess = getStoredPendingAccess();
    if (!pendingAccess?.requiresRegistration || pendingAccess.analysisId !== analysisId) {
      return;
    }

    let cancelled = false;

    const syncAccess = async () => {
      const authHeaders = await getAuthHeaders();
      const authValue = readAuthHeader(authHeaders);

      if (!authValue) {
        setShowRegistrationPrompt(true);
        return;
      }

      const res = await fetch("/api/analysis/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ analysisId }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            success?: boolean;
            data?: { snapshot?: SnapshotResultV2; report?: ReportResult | null };
            error?: string;
          }
        | null;

      if (cancelled) {
        return;
      }

      if (res.ok && json?.success && json.data?.snapshot) {
        const normalizedSnapshot = coerceSnapshotV2(json.data.snapshot);
        if (!normalizedSnapshot) {
          setShowRegistrationPrompt(true);
          return;
        }
        saveStoredSnapshot({
          analysisId,
          snapshot: normalizedSnapshot,
        });
        clearStoredPendingAccess();
        setSnapshotData(normalizedSnapshot);
        setShowRegistrationPrompt(false);
        return;
      }

      setShowRegistrationPrompt(true);
      setErrorMessage(json?.error || "We could not save this reading to your account.");
    };

    void syncAccess();

    return () => {
      cancelled = true;
    };
  }, [analysisId, isAccessReady, phase, snapshotData]);

  const handleContinueToSignUp = () => {
    if (!analysisId) {
      return;
    }

    router.push(getAppAuthHref(`/app/upload/step-3?analysisId=${analysisId}`));
  };

  const handleDismissRegistrationPrompt = async () => {
    clearStoredAnalysisFlow();
    setShowRegistrationPrompt(false);
  };

  const handleConfirmDetectedRoomType = async () => {
    if (!analysisId || isResolvingMismatch) {
      return;
    }

    setIsResolvingMismatch(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/analyze/${analysisId}/confirm-room-type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = (await res.json().catch(() => null)) as
        | {
            success?: boolean;
            data?: {
              status: "processing";
              roomType?: string | null;
              pipeline?: AnalysisPipelineState;
            };
            error?: string;
          }
        | null;

      if (!res.ok || !json?.success || !json.data) {
        setErrorMessage(json?.error || "We could not continue this reading yet.");
        return;
      }

      const nextSpaceId = toSupportedUploadSpaceId(json.data.roomType ?? actionRequiredState?.detectedRoomType ?? null);
      patchUploadV2Intake({
        analysisId,
        ...(nextSpaceId ? { spaceId: nextSpaceId } : {}),
      });

      setPipelineState(json.data.pipeline ?? null);
      setActionRequiredState(null);
      setPhase("processing");
    } finally {
      setIsResolvingMismatch(false);
    }
  };

  const handleUploadDifferentPhoto = () => {
    clearStoredSnapshot();
    clearStoredPendingAccess();
    patchUploadV2Intake({
      analysisId: null,
      photoPath: null,
      photoUrl: null,
      previewUrl: null,
    });
    router.push("/app/upload/step-2");
  };

  const handleUnlockFullReport = () => {
    setIsCheckoutOpen(true);
  };

  const handleCheckoutProcess = async () => {
    if (!analysisId) {
      return;
    }

    const sessionUrl = await checkout(analysisId, {
      productKey: DEFAULT_BILLING_PRODUCT_KEY,
    });

    if (sessionUrl) {
      window.location.href = sessionUrl;
    }
  };

  const handleDownloadFreeReport = async () => {
    if (!freeExportRef.current || isExportingFree) return;

    setIsExportingFree(true);
    try {
      await downloadNodeAsPng(freeExportRef.current, `align-free-report-${analysisId || "snapshot"}.png`);
    } catch (error) {
      console.error("Free report image export failed", error);
      alert("Failed to generate the free report image. Please try again.");
    } finally {
      setIsExportingFree(false);
    }
  };

  const handleShareFreeReport = async () => {
    if (!freeExportRef.current || isSharingFree) return;

    setIsSharingFree(true);
    try {
      await shareNodeAsImage(
        freeExportRef.current,
        `align-free-report-${analysisId || "snapshot"}.png`,
        "ALIGN Free Room Reading",
        "Generated with Align | Read Your Space",
      );
    } catch (error) {
      console.error("Free report image share failed", error);
      alert("Failed to share the free report image. Please try again.");
    } finally {
      setIsSharingFree(false);
    }
  };

  if (!isAccessReady) {
    return <div className={styles.page} />;
  }

  return (
    <div className={`${styles.page} ${phase === "processing" ? styles.pageProcessing : ""}`}>
      <MemberImmersiveHeader
        brandHref={appUploadHref}
        brandName="Align"
        stepLabel="Step 3 of 3"
        secondaryLabel="Sign in"
        secondaryHref={appAuthHref}
        utilityLabel="Exit"
        utilityHref={marketingHomeHref}
      />

      <main className={`${styles.main} ${phase === "processing" ? styles.mainProcessing : ""}`}>
        <div className={`${styles.topRow} ${phase === "processing" ? styles.topRowProcessing : ""}`}>
          <Link href={backHref} className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
          <div className={`${styles.progressHeader} ${phase === "processing" ? styles.progressHeaderProcessing : ""}`}>
            <span className={styles.progressText}>Step 3 of 3</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>
          <span className={styles.heroTopSpacer} aria-hidden="true" />
        </div>

        {phase === "processing" ? (
          <section className={styles.processingViewport}>
            <div className={styles.processingAura} aria-hidden="true" />
            <div className={styles.processingDecorLeft} aria-hidden="true" />
            <div className={styles.processingDecorRight} aria-hidden="true">
              <Image
                src={PROCESSING_AMBIENCE_IMAGE}
                alt=""
                fill
                sizes="(max-width: 900px) 170px, 262px"
                className={styles.processingDecorImage}
                priority
              />
            </div>

            <div className={styles.processingShell}>
              <div className={styles.processingIntro}>
                <p className={styles.processingEyebrow}>Snapshot in progress</p>
                <h1 className={styles.processingTitle}>Generating your Snapshot</h1>
                <p className={styles.processingSubtitle}>
                  We&apos;re shaping your first insight.
                </p>
              </div>

              <div className={styles.processingProgressCluster}>
                <div className={styles.processingRailWrap}>
                  <div className={styles.processingRailMeta}>
                    <span className={styles.processingRailLabel}>Progress</span>
                    <span className={styles.processingRailPercent}>{displayProgress}%</span>
                  </div>
                  <div
                    className={styles.processingRail}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={displayProgress}
                    aria-label="Snapshot processing progress"
                  >
                    <div className={styles.processingRailFill} style={{ width: `${displayProgress}%` }} />
                  </div>
                  <div className={styles.processingPhase} key={`${processingProgressState.phaseLabel}-${statusIndex % 2}`}>
                    <span className={styles.processingPhaseLabel}>{processingProgressState.phaseLabel}</span>
                    <p className={styles.processingPhaseTitle}>{statusIndex % 2 === 0 ? processingProgressState.phaseDetail : processingMessage.note}</p>
                    <p className={styles.processingPhaseDetail}>
                      Current phase
                    </p>
                  </div>
                </div>
              </div>

              <article className={styles.processingCard} key={processingCard.id}>
                <div className={styles.processingCardTop}>
                  <span className={styles.processingCardIcon} aria-hidden="true">
                    <Sparkles size={15} />
                  </span>
                  <span className={styles.processingCardEyebrow}>{processingCard.eyebrow}</span>
                </div>
                <p className={styles.processingCardQuote}>{processingCard.quote}</p>
                <div className={styles.processingCardDots} aria-hidden="true">
                  {processingCards.map((card, index) => (
                    <span
                      key={card.id}
                      className={`${styles.processingCardDot} ${index === statusIndex % processingCards.length ? styles.processingCardDotActive : ""}`}
                    />
                  ))}
                </div>
              </article>
            </div>
          </section>
        ) : null}

        {phase === "action_required" && actionRequiredState ? (
          <section className={styles.snapshotHero}>
            <p className={styles.sectionEyebrow}>One quick check</p>
            <h1 className={styles.heroTitle}>This photo looks like a {humanizeRoomType(actionRequiredState.detectedRoomType)}.</h1>
            <p className={styles.heroCopy}>
              {actionRequiredState.message}
            </p>
            <div className={styles.actionRequiredCard}>
              <p className={styles.actionRequiredMeta}>
                You selected <strong>{humanizeRoomType(actionRequiredState.claimedRoomType)}</strong>, but the uploaded image reads more clearly as{" "}
                <strong>{humanizeRoomType(actionRequiredState.detectedRoomType)}</strong>.
              </p>
              <div className={styles.actionRequiredActions}>
                {actionRequiredState.detectedRoomType ? (
                  <button
                    type="button"
                    className={styles.primaryActionButton}
                    onClick={handleConfirmDetectedRoomType}
                    disabled={isResolvingMismatch}
                  >
                    {isResolvingMismatch ? "Continuing..." : `Analyze as ${humanizeRoomType(actionRequiredState.detectedRoomType)}`}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  onClick={handleUploadDifferentPhoto}
                  disabled={isResolvingMismatch}
                >
                  Upload a different photo
                </button>
              </div>
              {errorMessage ? <p className={styles.errorNoteCentered}>{errorMessage}</p> : null}
            </div>
          </section>
        ) : null}

        {phase === "failed" ? (
            <section className={styles.snapshotHero}>
            <p className={styles.sectionEyebrow}>Analysis interrupted</p>
            <h1 className={styles.heroTitle}>We couldn&apos;t finish this reading.</h1>
            <p className={styles.heroCopy}>
              {errorMessage ?? pipelineState?.lastErrorMessage ?? "Please go back and try uploading again."}
            </p>
            <div className={styles.actionRequiredActions}>
              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={handleUploadDifferentPhoto}
              >
                Upload a clearer photo
              </button>
            </div>
          </section>
        ) : null}

        {phase === "snapshot" && snapshotData ? (
          <div className={styles.legacySnapshotWrap}>
            <SnapshotV2Section
              snapshot={snapshotData}
              isExporting={isExportingFree}
              isSharing={isSharingFree}
              onDownload={handleDownloadFreeReport}
              onShare={handleShareFreeReport}
              onUnlock={handleUnlockFullReport}
              isUpgrading={isCheckingOut}
            />
            {comparisonSnapshot ? (
              <ComparisonSnapshotSection comparison={comparisonSnapshot} />
            ) : null}
            {checkoutError ? <p className={styles.errorNoteCentered}>{checkoutError}</p> : null}
            {errorMessage && !showRegistrationPrompt ? <p className={styles.errorNoteCentered}>{errorMessage}</p> : null}
          </div>
        ) : null}
      </main>

      {phase === "snapshot" && snapshotData ? (
        <SnapshotExportCardV2
          exportRef={freeExportRef}
          snapshot={snapshotData}
        />
      ) : null}

      <SnapshotCheckoutModal
        isOpen={isCheckoutOpen}
        isCheckingOut={isCheckingOut}
        onClose={() => setIsCheckoutOpen(false)}
        onCheckout={handleCheckoutProcess}
      />

      <SnapshotRegistrationPrompt
        isOpen={phase === "snapshot" && showRegistrationPrompt}
        isClosing={false}
        onClose={handleDismissRegistrationPrompt}
        onContinue={handleContinueToSignUp}
        caution="If you continue without signing in, this result will stay available only in the current session and will not appear in your saved account history."
      />

      <MemberImmersiveFooter brandName="Align" supportEmail="support@alignflow.xyz" />
    </div>
  );
}
