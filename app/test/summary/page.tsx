import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/actions/redeemCode";
import { CheckCircle2, ArrowRight, BookOpen, BookX } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function TestSummaryPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData || !sessionData.testSession) {
        redirect("/");
    }

    // Force submit if they somehow got here without submitting
    if (!sessionData.testSession.isSubmitted) {
        const { submitTest } = await import("@/server/actions/testSession");
        await submitTest(sessionData.id);
        redirect("/test/summary");
    }

    // Get accurate counts directly from DB
    const userId = sessionData.id;

    // Total questions for this user's redeem code
    const junctionRows = await prisma.$queryRaw<{ B: string }[]>`
        SELECT "B" FROM "_RedeemCodeQuestions" WHERE "A" = ${sessionData.redeemCodeId!}
    `;
    const totalQuestions = junctionRows.length;

    // Answered count from actual Answer records
    const answeredQuestions = await prisma.answer.count({ where: { userId } });
    const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0b1e]">
            <div className="card-elevated max-w-xl w-full p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Sesi Tes Selesai</h1>
                <p className="text-white/60 mb-8">
                    {sessionData.testSession.autoSubmitted
                        ? "Waktu tes Anda telah habis."
                        : "Anda telah menyelesaikan seluruh soal."}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <BookOpen className="w-6 h-6 text-violet-400" />
                        <span className="text-3xl font-bold text-violet-400">{answeredQuestions}</span>
                        <span className="text-xs text-white/50 uppercase tracking-wider font-bold">Terjawab</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <BookX className="w-6 h-6 text-white/30" />
                        <span className="text-3xl font-bold text-white/50">{unansweredQuestions}</span>
                        <span className="text-xs text-white/50 uppercase tracking-wider font-bold">Belum Dijawab</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 mb-8 text-sm text-white/50 flex items-center justify-center gap-2">
                    <span>Total Soal:</span>
                    <span className="font-bold text-white/70">{totalQuestions}</span>
                </div>

                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-8 text-sm text-white/80">
                    Tahap selanjutnya adalah <strong>AI Video Interview</strong>. Pastikan kamera dan mikrofon Anda berfungsi dengan baik.
                </div>

                <Link
                    href="/rules/interview"
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group"
                >
                    Lanjut ke Persiapan Interview
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
