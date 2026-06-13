import { Suspense } from "react";
import type { Metadata } from "next";
import UploadStep3Page from "@/features/app-ui/v2/upload/UploadStep3Page";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Upload | Step 3",
    description: "Processing and your first space snapshot.",
};

export default function ProcessingPage() {
    return (
        <V2RouteShell>
            <Suspense fallback={null}>
                <UploadStep3Page />
            </Suspense>
        </V2RouteShell>
    );
}
