import { getCurrentSession } from "@/server/actions/redeemCode";
import { Clock, CheckCircle } from "lucide-react";
import { calculateElapsedTime } from "@/lib/timer";
import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";

export default async function ResultPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData?.interview || !sessionData?.testSession) {
        redirect("/");
    }

    const test = sessionData.testSession;
    const duration = test?.submittedAt && test?.startedAt
        ? Math.floor((test.submittedAt.getTime() - test.startedAt.getTime()) / 1000)
        : test?.startedAt ? calculateElapsedTime(test.startedAt) : 0;

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
            <header className="fixed top-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-md border-b border-white/5 z-40 px-6 md:px-10 flex items-center">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                    <Logo className="w-6 h-6" textClassName="text-sm font-bold tracking-wide" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto mt-16 md:mt-24 w-full animate-fade-in flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <CheckCircle className="w-12 h-12 text-white/80" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Assessment Selesai</h1>
                <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed text-sm">
                    Terima kasih telah mengikuti sesi evaluasi wawancara ini. Data Anda telah berhasil dikirim dan saat ini sedang diproses secara internal.
                </p>

                {/* Minimal Stats Card (Only Duration) */}
                <div className="card p-8 border-white/10 max-w-sm w-full mx-auto">
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
