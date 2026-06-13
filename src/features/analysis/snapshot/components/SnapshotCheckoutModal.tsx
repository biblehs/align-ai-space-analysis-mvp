"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

type SnapshotCheckoutModalProps = {
    isOpen: boolean;
    isCheckingOut: boolean;
    onClose: () => void;
    onCheckout: () => void;
};

export function SnapshotCheckoutModal({
    isOpen,
    isCheckingOut,
    onClose,
    onCheckout,
}: SnapshotCheckoutModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 px-0 backdrop-blur-md sm:items-center sm:px-4"
                >
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative z-10 w-full overflow-hidden rounded-t-[2.5rem] border border-border bg-card p-6 pb-10 shadow-2xl sm:max-w-sm sm:rounded-[2rem] sm:p-8 sm:pb-8"
                    >
                        <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-secondary sm:hidden" />
                        <div className="absolute top-0 inset-x-0 h-1 bg-foreground" />

                        <div className="mt-4 mb-8 flex items-center justify-between sm:mt-0">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Checkout</h2>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-8 rounded-[1.5rem] border border-border bg-secondary p-5">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="font-bold text-foreground">Full Space Report</span>
                                <span className="text-lg font-bold text-foreground">$9.00</span>
                            </div>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                One-Time Payment
                            </p>
                        </div>

                        <div className="mb-8 space-y-3 opacity-40">
                            <div className="h-12 w-full animate-pulse rounded-xl bg-secondary" />
                            <div className="h-12 w-full animate-pulse rounded-xl bg-secondary" />
                            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <ShieldCheck className="h-4 w-4" /> Secure checkout powered by Creem
                            </div>
                        </div>

                        <button
                            onClick={onCheckout}
                            disabled={isCheckingOut}
                            className="w-full rounded-full bg-foreground py-4 text-lg font-bold text-background shadow-xl transition-transform hover:scale-[1.02] disabled:opacity-50"
                        >
                            {isCheckingOut ? "Connecting to secure payment..." : "Pay $9.00"}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
