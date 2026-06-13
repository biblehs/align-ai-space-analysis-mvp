import type { ReactNode } from "react";

type LegalSectionProps = {
    children: ReactNode;
    id: string;
    title: string;
};

export default function LegalSection({
  children,
  id,
  title,
}: LegalSectionProps) {
  return (
    <section id={id} className="space-y-5 border-b border-[#e8e0d7] pb-9 last:border-b-0 last:pb-0">
      <h2
        className="text-[1.42rem] leading-[1.14] tracking-[-0.02em] text-[#38312c] sm:text-[1.68rem]"
        style={{ fontFamily: "var(--font-editorial-serif), serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-[0.94rem] leading-[1.95] text-[#645c56]">
        {children}
      </div>
    </section>
  );
}
