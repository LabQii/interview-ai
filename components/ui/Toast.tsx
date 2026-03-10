"use client";

import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

const getToastConfig = (type: string) => {
    switch (type) {
        case "success":
            return {
                icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
            };
        case "error":
            return {
                icon: <AlertCircle className="w-5 h-5 text-red-400" />,
                bg: "bg-red-500/10",
                border: "border-red-500/20",
            };
        case "warning":
            return {
                icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
            };
        case "info":
        default:
            return {
                icon: <Info className="w-5 h-5 text-white/80" />,
                bg: "bg-white/20/10",
                border: "border-white/20/20",
            };
    }
};

export default function ToastContainer() {
    const toasts = useUIStore((state) => state.toasts);
    const removeToast = useUIStore((state) => state.removeToast);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const config = getToastConfig(toast.type);

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border pointer-events-auto ${config.bg} ${config.border}`}
                        >
                            <div className="shrink-0 mt-0.5">{config.icon}</div>
                            <p className="text-sm font-medium text-white/90 leading-snug flex-1">
                                {toast.message}
                            </p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
