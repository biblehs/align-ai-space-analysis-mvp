import type { ReactNode } from "react";
import { Noto_Serif, Plus_Jakarta_Sans } from "next/font/google";

const notoSerif = Noto_Serif({
    subsets: ["latin"],
    variable: "--font-editorial-serif",
    display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-editorial-body",
    display: "swap",
});

type V2RouteShellProps = {
    children: ReactNode;
};

export function V2RouteShell({ children }: V2RouteShellProps) {
    return <div className={`${notoSerif.variable} ${plusJakarta.variable}`}>{children}</div>;
}
