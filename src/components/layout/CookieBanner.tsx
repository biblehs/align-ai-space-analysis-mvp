"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_CONSENT_KEY = "align_cookie_consent";
const COOKIE_CONSENT_EVENT = "align-cookie-consent-change";

const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") {
        return () => {};
    }

    window.addEventListener("storage", callback);
    window.addEventListener(COOKIE_CONSENT_EVENT, callback);

    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
    };
};

const getSnapshot = () => {
    if (typeof window === "undefined") {
        return false;
    }

    return !window.localStorage.getItem(COOKIE_CONSENT_KEY);
};

const getServerSnapshot = () => false;

export function CookieBanner() {
    const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const acceptCookies = () => {
        window.localStorage.setItem(COOKIE_CONSENT_KEY, "true");
        window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-3 pb-safe pointer-events-none sm:p-4"
                >
                    <div className="surface-dark-gradient pointer-events-auto flex w-full max-w-4xl flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 px-5 py-4 text-background shadow-2xl sm:flex-row sm:items-center sm:px-6">
                        <p className="text-sm font-medium leading-relaxed text-background/90">
                            We use cookies to ensure you get the best experience on our website and to analyze traffic.
                            By continuing to use our site, you agree to our <a href="/privacy" className="underline font-bold hover:text-background transition-colors">Privacy Policy</a>.
                        </p>
                        <button
                            onClick={acceptCookies}
                            className="whitespace-nowrap rounded-full bg-background px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background/90 sm:shrink-0"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
