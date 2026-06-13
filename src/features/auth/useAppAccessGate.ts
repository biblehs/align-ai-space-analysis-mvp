"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalAuthUser, hasAuthenticatedSession } from "@/lib/auth-client";
import { getAppAuthHref } from "@/lib/navigation";

export function useAppAccessGate(redirectPath: string) {
    const router = useRouter();
    const [isAccessReady, setIsAccessReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const verifyAccess = async () => {
            if (getLocalAuthUser()) {
                if (!cancelled) {
                    setIsAccessReady(true);
                }
                return;
            }

            const authenticated = await hasAuthenticatedSession();
            if (cancelled) {
                return;
            }

            if (!authenticated) {
                router.replace(getAppAuthHref(redirectPath));
                return;
            }

            setIsAccessReady(true);
        };

        void verifyAccess();

        return () => {
            cancelled = true;
        };
    }, [redirectPath, router]);

    return isAccessReady;
}
