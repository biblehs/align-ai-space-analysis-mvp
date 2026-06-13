import { Suspense } from "react";
import type { Metadata } from "next";
import UploadStep3Page from "@/features/app-ui/v2/upload/UploadStep3Page";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Snapshot | V2",
    description: "Your v2 processing and space snapshot experience.",
};

export default function SnapshotPage() {
    return (
        <V2RouteShell>
            <Suspense fallback={null}>
                <UploadStep3Page />
            </Suspense>
        </V2RouteShell>
    );
}
