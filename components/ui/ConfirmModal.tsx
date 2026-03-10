"use client";

import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal() {
    const { isOpen, title, message, onConfirm, onCancel } = useUIStore((state) => state.confirmModal);
    const closeConfirm = useUIStore((state) => state.closeConfirm);

    const handleConfirm = () => {
        onConfirm();
        closeConfirm();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        closeConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/10 backdrop-blur-sm z-[110]"
                        onClick={handleCancel}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                            className="w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto relative"
                        >
                            {/* Decorative Gradient Background */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-white/60 leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/5">
                                <button
                                    onClick={handleCancel}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                >
                                    Konfirmasi
                                </button>
                            </div>

                            <button
                                onClick={handleCancel}
                                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
