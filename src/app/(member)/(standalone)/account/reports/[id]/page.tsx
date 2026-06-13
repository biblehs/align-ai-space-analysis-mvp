import { Suspense } from "react";
import AccountReportPage from "@/features/auth/AccountReportPage";
import { ReportLoadingState } from "@/features/analysis/reporting/ReportLoadingState";

export default async function AccountReportRoute({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<ReportLoadingState message="Loading your saved report..." maxWidth="max-w-4xl" />}>
            <AccountReportPage analysisId={id} />
        </Suspense>
    );
}
