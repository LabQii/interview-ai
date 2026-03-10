"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, BookOpen, BookX, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
    answeredCount: number;
    totalCount: number;
    autoSubmitted: boolean;
}

export function TestSummaryClient({ answeredCount, totalCount, autoSubmitted }: Props) {
    const router = useRouter();
    const [isLeaving, setIsLeaving] = useState(false);
    const unansweredCount = Math.max(0, totalCount - answeredCount);

    const handleDone = () => {
        setIsLeaving(true);
        // Hard redirect to home, clearing navigation history
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card-elevated max-w-xl w-full p-8 md:p-10 text-center relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

                {/* Icon */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20"
                >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-2">Sesi Tes Selesai</h1>
                <p className="text-white/60 mb-8">
                    {autoSubmitted
                        ? "Waktu tes Anda telah habis dan jawaban otomatis dikirim."
                        : "Anda telah berhasil menyelesaikan seluruh soal."}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <BookOpen className="w-6 h-6 text-white/80" />
                        <span className="text-3xl font-bold text-white/80">{answeredCount}</span>
                        <span className="text-xs text-white/50 uppercase tracking-wider font-bold">Terjawab</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <BookX className="w-6 h-6 text-white/30" />
                        <span className="text-3xl font-bold text-white/50">{unansweredCount}</span>
                        <span className="text-xs text-white/50 uppercase tracking-wider font-bold">Belum Dijawab</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 mb-8 text-sm text-white/50 flex items-center justify-center gap-2">
                    <span>Total Soal:</span>
                    <span className="font-bold text-white/70">{totalCount}</span>
                </div>

                {/* Completion Message */}
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-8 text-sm text-white/80 leading-relaxed text-left">
                    <p className="font-bold text-emerald-400 mb-1">✓ Terima Kasih!</p>
                    <p>
                        Tes telah berhasil diselesaikan. Terima kasih telah mengikuti sesi assessment ini.
                        Informasi selanjutnya akan disampaikan melalui <strong>email atau WhatsApp</strong>.
                    </p>
                </div>

                {/* Done Button */}
                <button
                    onClick={handleDone}
                    disabled={isLeaving}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                    {isLeaving ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Mengalihkan...</>
                    ) : (
                        <>Selesai <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>

                <p className="text-xs text-white/20 mt-4">
                    Setelah menekan Selesai, Anda akan dialihkan ke halaman utama.
                </p>
            </motion.div>
        </div>
    );
}
