"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Inbox, Music, Mic, Brain, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StepStatus = "pending" | "running" | "done" | "error";

interface PipelineStep {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    status: StepStatus;
}

const INITIAL_STEPS: Omit<PipelineStep, "status">[] = [
    { id: "fetch", emoji: "📥", title: "Mengambil video dari Cloudinary", subtitle: "Menghubungkan ke server...", icon: Inbox },
    { id: "audio", emoji: "🎵", title: "Mengekstrak audio dari video", subtitle: "Memproses file video dengan ffmpeg...", icon: Music },
    { id: "stt", emoji: "🎤", title: "Speech-to-Text dengan Whisper AI", subtitle: "Mengubah suara menjadi teks...", icon: Mic },
    { id: "ai", emoji: "🧠", title: "Analisis jawaban dengan Groq AI", subtitle: "AI sedang membaca dan menganalisis jawaban...", icon: Brain },
    { id: "save", emoji: "💾", title: "Menyimpan hasil ke database", subtitle: "Menyimpan hasil analisis...", icon: Database },
];

export default function ProcessingPage() {
    const router = useRouter();
    const [steps, setSteps] = useState<PipelineStep[]>(
        INITIAL_STEPS.map(s => ({ ...s, status: "pending" }))
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        // Kick off analysis
        fetch("/api/interview/start-analysis", { method: "POST" })
            .then(r => r.json())
            .then(({ jobId, error }) => {
                if (error) { setErrorMsg(error); return; }
                // Start polling
                pollRef.current = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/interview/job-status?jobId=${jobId}`);
                        const data = await res.json();

                        if (data.stepStatuses) {
                            setSteps(prev => prev.map(s => ({
                                ...s,
                                status: data.stepStatuses[s.id] ?? s.status,
                            })));
                        }

                        if (data.state === "completed") {
                            clearInterval(pollRef.current!);
                            setTimeout(() => router.push("/result"), 800);
                        }
                        if (data.state === "failed") {
                            clearInterval(pollRef.current!);
                            setErrorMsg(data.failedReason || "Analisis gagal. Coba lagi.");
                        }
                    } catch (e) {
                        console.error("Polling error", e);
                    }
                }, 3000);
            })
            .catch(e => setErrorMsg(e.message));

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [router]);

    const allDone = steps.every(s => s.status === "done");

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-elevated p-8 flex flex-col gap-6 relative overflow-hidden"
                >
                    {/* Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-1">AI Sedang Menganalisis</h1>
                        <p className="text-white/40 text-sm">Hasil interview Anda sedang diproses secara otomatis</p>
                    </div>

                    {/* Pipeline Steps */}
                    <div className="flex flex-col gap-3">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${step.status === "done" ? "bg-emerald-500/10 border-emerald-500/20"
                                        : step.status === "running" ? "bg-white/5 border-white/10 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                                            : step.status === "error" ? "bg-red-500/10 border-red-500/20"
                                                : "bg-white/[0.02] border-white/5"
                                        }`}
                                >
                                    {/* Status icon */}
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                                        {step.status === "done" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                                        {step.status === "running" && <Loader2 className="w-6 h-6 text-white/80 animate-spin" />}
                                        {step.status === "error" && <XCircle className="w-6 h-6 text-red-400" />}
                                        {step.status === "pending" && <span className="text-lg opacity-30">{step.emoji}</span>}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate ${step.status === "done" ? "text-emerald-300" : step.status === "running" ? "text-white" : step.status === "error" ? "text-red-300" : "text-white/30"}`}>
                                            {step.title}
                                        </p>
                                        {step.status === "running" && (
                                            <p className="text-xs text-white/80 mt-0.5 animate-pulse">{step.subtitle}</p>
                                        )}
                                        {step.status === "done" && (
                                            <p className="text-xs text-emerald-400 mt-0.5">✓ Selesai</p>
                                        )}
                                    </div>

                                    {/* Step number badge for pending */}
                                    {step.status === "pending" && (
                                        <span className="text-xs font-bold text-white/20 shrink-0">{i + 1}</span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-white/20 to-white/5 rounded-full"
                                animate={{ width: `${(steps.filter(s => s.status === "done").length / steps.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <p className="text-xs text-white/30 text-center">
                            {steps.filter(s => s.status === "done").length} / {steps.length} langkah selesai
                        </p>
                    </div>

                    {/* Error state */}
                    {errorMsg && (
                        <AnimatePresence>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                <p className="font-bold mb-1">Terjadi Kesalahan</p>
                                <p className="text-red-300/70">{errorMsg}</p>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Warning footer */}
                    {!errorMsg && (
                        <p className="text-xs text-center text-white/20 leading-relaxed">
                            AI sedang menganalisis video interview Anda.<br />
                            Harap tunggu dan <strong className="text-white/30">jangan tutup halaman ini</strong>.
                        </p>
                    )}

                    {/* Done state */}
                    {allDone && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
                            <p className="text-emerald-400 font-bold">✓ Analisis selesai! Mengalihkan ke hasil...</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
