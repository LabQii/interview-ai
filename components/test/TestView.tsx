"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalTimer } from "@/hooks/useGlobalTimer";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { usePreventBrowserNavigation } from "@/hooks/usePreventBrowserNavigation";
import { useTestStore } from "@/store/testStore";
import { saveAnswer } from "@/server/actions/answers";
import { submitTest } from "@/server/actions/testSession";
import { GlobalTimer } from "@/components/timer/GlobalTimer";
import { ShieldAlert, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    duration: number;
}

interface TestViewProps {
    questions: Question[];
    initialAnswers: Record<string, string>;
    globalDurationRemaining: number;
    tabSwitchWarnings: number;
}

export function TestView({
    questions,
    initialAnswers,
    globalDurationRemaining,
    tabSwitchWarnings
}: TestViewProps) {
    const router = useRouter();
    const [warnings, setWarnings] = useState(tabSwitchWarnings);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        currentIndex,
        answers,
        setQuestions,
        setInitialAnswers,
        setAnswer,
        nextQuestion,
        goToQuestion
    } = useTestStore();

    // Prevent Browser Forward/Back Navigation
    usePreventBrowserNavigation();

    useEffect(() => {
        setQuestions(questions);
        setInitialAnswers(initialAnswers);
    }, [questions, initialAnswers, setQuestions, setInitialAnswers]);

    const currentQ = questions[currentIndex];

    // Global Timer
    const { remaining: globalRemaining } = useGlobalTimer({
        initialSeconds: globalDurationRemaining,
        phase: "test",
        onExpire: async () => {
            await submitTest();
            router.push("/test/summary");
        },
        onTabSwitch: (count, autoSubmit) => {
            setWarnings(count);
            if (autoSubmit) {
                alert("Batas perpindahan tab terlampaui. Tes otomatis diselesaikan.");
                submitTest().then(() => router.push("/test/summary"));
            } else {
                alert(`PERINGATAN: Anda dilarang berpindah tab. Sisa peringatan: ${3 - count}`);
            }
        }
    });

    // Question Timer — auto-advance when expired
    const { remaining: questionRemaining } = useQuestionTimer({
        duration: currentQ?.duration || 60,
        questionId: currentQ?.id,
        enabled: !!currentQ,
        onExpire: () => {
            if (currentIndex < questions.length - 1) {
                nextQuestion();
            } else {
                submitTest().then(() => router.push("/test/summary"));
            }
        }
    });

    const handleSelectOption = async (opt: string) => {
        if (!currentQ) return;
        setAnswer(currentQ.id, opt);
        await saveAnswer(currentQ.id, opt);
    };

    const handleSubmit = async () => {
        if (!answers[currentQ.id] || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await submitTest();
            router.push("/test/summary");
        } catch (e) {
            console.error("Submit error", e);
            setIsSubmitting(false);
        }
    };

    if (!currentQ) return <div className="min-h-screen flex items-center justify-center text-white">Memuat soal...</div>;

    // Navigation panel logic: only allow going to answered questions OR the very next unanswered
    const maxReachable = questions.reduce((max, q, i) => {
        return answers[q.id] ? Math.max(max, i + 1) : max;
    }, 0);

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0b1e]">
            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#0f1027]/80 backdrop-blur-md border-b border-white/5 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-5 h-5 ${warnings > 0 ? "text-red-500" : "text-violet-500"}`} />
                        <span className="text-sm font-semibold tracking-wide text-white/50">
                            HRD TERMINAL <span className="text-white/20 ml-2">v4.2.0</span>
                        </span>
                    </div>
                    {warnings > 0 && (
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold animate-pulse">
                            Peringatan Tab: {warnings}/3
                        </div>
                    )}
                </div>
                <GlobalTimer remaining={globalRemaining} />
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full pt-28 pb-20 px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Content (Question Box) */}
                <div className="col-span-1 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-bold tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                            PERTANYAAN {currentIndex + 1}/{questions.length}
                        </h2>
                    </div>

                    <div className="card-elevated p-8 mb-6 min-h-[400px] flex flex-col relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] text-[180px] font-bold text-white/[0.02] leading-none select-none pointer-events-none">
                            ?
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQ.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex flex-col"
                            >
                                <h3 className="text-2xl md:text-3xl font-bold leading-snug mb-10 w-[90%]">
                                    {currentQ.question}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 mt-auto">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const isSelected = answers[currentQ.id] === opt;
                                        const val = currentQ[`option${opt}` as keyof Question] as string;

                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleSelectOption(opt)}
                                                className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${isSelected
                                                    ? "bg-violet-600/20 border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                                                    : "bg-[#0a0b1e]/50 border-white/5 hover:bg-white/[0.03] hover:border-white/20"
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-violet-400 bg-violet-400/20" : "border-white/20"
                                                    }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-violet-400 rounded-full" />}
                                                </div>
                                                <span className="text-lg text-white/90">{val}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons — NO Previous */}
                    <div className="flex items-center justify-end">
                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!answers[currentQ.id] || isSubmitting}
                                className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                                ) : (
                                    <>Selesai & Lanjut Interview <CheckCircle2 className="w-5 h-5" /></>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={nextQuestion}
                                disabled={!answers[currentQ.id]}
                                className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="col-span-1 flex flex-col gap-6">
                    {/* Question Timer */}
                    <div className="card-elevated p-6 flex flex-col items-center justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="58" fill="none" className="stroke-white/5" strokeWidth="8" />
                                <circle cx="64" cy="64" r="58" fill="none" className="stroke-violet-500 transition-all duration-1000 ease-linear" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * (questionRemaining / (currentQ?.duration || 60)))} />
                            </svg>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold">{questionRemaining}</span>
                                <span className="text-[10px] font-bold tracking-widest text-white/40">DETIK</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-white mb-1">Timer Pertanyaan</span>
                            <span className="text-xs text-white/40">Otomatis berlanjut jika habis</span>
                        </div>
                    </div>

                    {/* Question Navigation Panel */}
                    <div className="card p-6">
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-violet-500 rounded-sm" /> Navigasi Soal
                        </h4>
                        <p className="text-xs text-white/30 mb-4">Soal dikerjakan secara berurutan</p>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentIndex === idx;

                                return (
                                    <div
                                        key={q.id}
                                        title={isAnswered ? "Sudah dijawab" : isCurrent ? "Soal saat ini" : "Belum terjawab"}
                                        className={`h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${isCurrent
                                            ? "bg-white text-black ring-2 ring-white ring-offset-2 ring-offset-[#0a0b1e]"
                                            : isAnswered
                                                ? "bg-violet-600/80 text-white"
                                                : "bg-white/5 text-white/20 border border-white/5 opacity-50"
                                            }`}
                                    >
                                        {idx + 1}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
