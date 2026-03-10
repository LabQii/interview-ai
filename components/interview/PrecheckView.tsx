"use client";

import { useState } from "react";
import { CameraCheck } from "./CameraCheck";
import { MicCheck } from "./MicCheck";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "../Logo";

type Stage = "camera" | "mic" | "ready";

const STAGES: { key: Stage; label: string; icon: React.ElementType }[] = [
    { key: "camera", label: "Kamera", icon: Camera },
    { key: "mic", label: "Mikrofon", icon: Mic },
    { key: "ready", label: "Mulai", icon: CheckCircle2 },
];

export function PrecheckView() {
    const [stage, setStage] = useState<Stage>("camera");
    const [cameraPassed, setCameraPassed] = useState(false);
    const [micPassed, setMicPassed] = useState(false);
    const router = useRouter();

    const currentStageIndex = STAGES.findIndex(s => s.key === stage);

    const handleStartInterview = () => {
        router.push("/interview");
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-b border-white/5">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <Logo className="w-6 h-6" textClassName="text-sm font-bold tracking-wide" />
                </div>
            </header>

            {/* Step Indicator */}
            <div className="pt-20 pb-0">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-0">
                        {STAGES.map((s, i) => {
                            const isDone = STAGES.findIndex(x => x.key === stage) > i;
                            const isCurrent = s.key === stage;
                            const Icon = s.icon;
                            return (
                                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCurrent ? "bg-white/10 border-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.4)]" : isDone ? "bg-emerald-600 border-emerald-400" : "bg-white/5 border-white/10"}`}>
                                            {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-white/20"}`} />}
                                        </div>
                                        <span className={`text-xs font-bold ${isCurrent ? "text-white/90" : isDone ? "text-emerald-300" : "text-white/20"}`}>{s.label}</span>
                                    </div>
                                    {i < STAGES.length - 1 && (
                                        <div className={`flex-1 h-px mx-2 mb-4 transition-all ${isDone ? "bg-emerald-500/50" : "bg-white/5"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-start justify-center px-4 pb-16">
                <div className="w-full max-w-2xl">
                    <div className="card-elevated p-8">
                        <AnimatePresence mode="wait">
                            {stage === "camera" && (
                                <motion.div key="camera" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <CameraCheck onPassed={() => { setCameraPassed(true); setStage("mic"); }} />
                                </motion.div>
                            )}
                            {stage === "mic" && (
                                <motion.div key="mic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <MicCheck onPassed={() => { setMicPassed(true); setStage("ready"); }} />
                                </motion.div>
                            )}
                            {stage === "ready" && (
                                <motion.div key="ready" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-6 py-6 text-center">
                                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Semua Pengujian Lulus!</h2>
                                        <p className="text-white/50">Kamera dan mikrofon Anda siap digunakan. Pastikan Anda berada di tempat yang tenang dan memiliki koneksi internet yang stabil sebelum memulai.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                            <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-white">Kamera</p>
                                                <p className="text-xs text-emerald-400">✓ Disetujui</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                            <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-white">Mikrofon</p>
                                                <p className="text-xs text-emerald-400">✓ Disetujui</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300/80 text-left w-full">
                                        ⚠️ <strong>Penting:</strong> Setelah interview dimulai, jangan berpindah tab atau menutup halaman. Aktivitas mencurigakan akan tercatat.
                                    </div>

                                    <button onClick={handleStartInterview} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group">
                                        Saya Siap, Mulai Interview
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
