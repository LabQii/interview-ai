"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

// The result page polls BullMQ job completion for every question in this session,
// only showing the "done" state once all jobs finish (or time out).

interface PollState {
    total: number;
    completed: number;
    failed: number;
    done: boolean;
}

async function checkAllJobs(jobIds: string[]): Promise<PollState> {
    const results = await Promise.allSettled(
        jobIds.map((id) =>
            fetch(`/api/interview/job-status?jobId=${id}`).then((r) => r.json())
        )
    );

    let completed = 0;
    let failed = 0;
    for (const r of results) {
        if (r.status === "fulfilled") {
            if (r.value.state === "completed") completed++;
            else if (r.value.state === "failed") { completed++; failed++; }
        }
    }
    return {
        total: jobIds.length,
        completed,
        failed,
        done: completed >= jobIds.length,
    };
}

export default function ResultPage() {
    const [pollState, setPollState] = useState<PollState | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(0);

    useEffect(() => {
        // Gather job IDs stored by VideoRecorder during the session
        // Keys are stored as `jobs_${interviewId}` in localStorage
        let jobIds: string[] = [];
        let foundTotal = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("jobs_")) {
                const ids: string[] = JSON.parse(localStorage.getItem(k) || "[]");
                jobIds = jobIds.concat(ids);
                foundTotal = Math.max(foundTotal, ids.length);
            }
        }

        if (foundTotal > 0) setTotalQuestions(foundTotal);

        // If no jobs in localStorage, just show completion immediately
        if (jobIds.length === 0) {
            setPollState({ total: 0, completed: 0, failed: 0, done: true });
            return;
        }

        let cancelled = false;

        const poll = async () => {
            while (!cancelled) {
                const state = await checkAllJobs(jobIds);
                if (!cancelled) setPollState(state);
                if (state.done) break;
                await new Promise((r) => setTimeout(r, 2000));
            }
        };

        poll();
        return () => { cancelled = true; };
    }, []);

    const isDone = pollState?.done ?? false;
    const completedCount = pollState?.completed ?? 0;
    const total = pollState?.total ?? totalQuestions;

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
            <header className="fixed top-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-md border-b border-white/5 z-40 px-6 md:px-10 flex items-center">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                    <Logo className="w-6 h-6" textClassName="text-sm font-bold tracking-wide" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto mt-16 md:mt-24 w-full animate-fade-in flex flex-col items-center text-center">
                {!isDone ? (
                    // ── Loading state: AI is still processing ──────────────────────
                    <>
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Menunggu Analisis AI...
                        </h1>
                        <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed text-sm">
                            Rekaman interview Anda sedang dianalisis oleh sistem AI kami. Mohon tunggu sebentar dan jangan tutup halaman ini.
                        </p>
                        {total > 0 && (
                            <div className="card p-6 border-white/10 max-w-xs w-full mx-auto">
                                <div className="text-sm text-white/40 mb-2 uppercase tracking-widest font-bold">Progress Analisis</div>
                                <div className="text-4xl font-bold text-white mb-1">
                                    {completedCount} <span className="text-white/30">/ {total}</span>
                                </div>
                                <div className="text-white/50 text-sm">pertanyaan selesai dianalisis</div>
                                <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                                        style={{ width: total > 0 ? `${(completedCount / total) * 100}%` : "0%" }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // ── Done state ──────────────────────────────────────────────────
                    <>
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <CheckCircle className="w-12 h-12 text-white/80" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Assessment Selesai</h1>
                        <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed text-sm">
                            Terima kasih telah mengikuti sesi evaluasi wawancara ini. Data Anda telah berhasil dikirim dan diproses.
                        </p>

                        {/* Question completion card (replaces duration card — Fix #7) */}
                        <div className="card p-8 border-white/10 max-w-sm w-full mx-auto">
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">
                                    Pertanyaan Selesai
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">
                                    Anda telah menyelesaikan{" "}
                                    <span className="text-emerald-400">
                                        {total > 0 ? total : completedCount}
                                    </span>{" "}
                                    dari{" "}
                                    <span className="text-white">
                                        {total > 0 ? total : completedCount}
                                    </span>{" "}
                                    soal interview dengan sukses.
                                </p>
                                <p className="text-white/40 text-sm mt-3">
                                    Hasil evaluasi akan ditinjau oleh tim HR kami.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
