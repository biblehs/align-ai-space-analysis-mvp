"use client";

import { useEffect, useState } from "react";
import AppBackLink from "@/components/app-shell/AppBackLink";
import { hasAuthenticatedSession } from "@/lib/auth-client";
import { appAccountPath, getAppAuthHref } from "@/lib/navigation";

const AUTH_HREF = getAppAuthHref(appAccountPath);

export default function AppAccountBackLink() {
    const [href, setHref] = useState(AUTH_HREF);

    useEffect(() => {
        let cancelled = false;

        const resolveHref = async () => {
            if (!cancelled) {
                setHref((await hasAuthenticatedSession()) ? appAccountPath : AUTH_HREF);
            }
        };

        void resolveHref();

        return () => {
            cancelled = true;
        };
    }, []);

    return <AppBackLink href={href} label="Back to Account" />;
}
