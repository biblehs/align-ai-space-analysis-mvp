import type { Metadata } from "next";
import UploadStep2Page from "@/features/app-ui/v2/upload/UploadStep2Page";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Upload | Step 2",
    description: "Upload your room and add the context that shapes your reading.",
};

export default function MemberUploadStep2Route() {
    return (
        <V2RouteShell>
            <UploadStep2Page />
        </V2RouteShell>
    );
}
