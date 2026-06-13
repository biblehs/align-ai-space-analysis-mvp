import type { Metadata } from "next";
import UploadStep1Page from "@/features/app-ui/v2/upload/UploadStep1Page";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Upload | Step 1",
    description: "Choose your room and intention before building your space reading.",
};

export default function MemberUploadStep1Route() {
    return (
        <V2RouteShell>
            <UploadStep1Page />
        </V2RouteShell>
    );
}
