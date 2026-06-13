import type { ReactNode } from "react";

export default function LegalDraftNote({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="border-l border-[#cbbba9] pl-5 text-[0.95rem] leading-8 text-[#5c544d]">
            {children}
        </div>
    );
}
