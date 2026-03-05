import { getCurrentSession } from "@/server/actions/redeemCode";
import { redirect } from "next/navigation";
import { Trophy, Users, Clock, CheckCircle, Download, Share2, Lightbulb, Target } from "lucide-react";
import { calculateElapsedTime, formatTimer } from "@/lib/timer";

export default async function ResultPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData?.interview || !sessionData.testSession) {
        redirect("/");
    }

    const test = sessionData.testSession;
    const score = test.score ?? 0;
    const duration = test.submittedAt
        ? Math.floor((test.submittedAt.getTime() - test.startedAt.getTime()) / 1000)
        : calculateElapsedTime(test.startedAt);

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-[#0a0b1e] pt-24 pb-20 px-4 md:px-8">
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#0f1027]/80 backdrop-blur-md border-b border-white/5 z-40 px-6 md:px-10 flex flex-col justify-center">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                            <span className="font-bold text-lg text-white">HRD</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold tracking-tight">Portal Kandidat</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">Analitik Asesmen</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto mt-16 md:mt-24 w-full animate-fade-in flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center mb-6 border border-violet-500/30">
                    <CheckCircle className="w-12 h-12 text-violet-400" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Assessment Selesai</h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto mb-12">
                    Terima kasih telah mengikuti sesi evaluasi wawancara ini. Data Anda telah berhasil dikirim dan saat ini sedang diproses secara internal oleh tim HRD.
                </p>

                {/* Minimal Stats Card (Only Duration) */}
                <div className="card p-8 border-violet-500/20 max-w-sm w-full mx-auto">
                    <div className="flex flex-col items-center mb-2">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">Total Durasi Ujian</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-white">{formatDuration(duration).split('m')[0]}</span>
                        <span className="text-xl font-bold text-white/50">m</span>
                        <span className="text-3xl font-bold text-white ml-2">{formatDuration(duration).split('m ')[1].replace('s', '')}</span>
                        <span className="text-white/50 text-sm font-bold">s</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
