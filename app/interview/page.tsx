import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/actions/redeemCode";
import { InterviewView } from "@/components/interview/InterviewView";
import { Logo } from "@/components/Logo";
import prisma from "@/lib/prisma";

export default async function InterviewPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData?.interview) {
        redirect("/test");
    }

    if (sessionData.interview.isSubmitted) {
        redirect("/result");
    }

    // Fetch interview questions ordered by category then order
    const questions = await prisma.interviewQuestion.findMany({
        orderBy: [{ category: "asc" }, { order: "asc" }],
        select: { id: true, question: true, category: true, order: true },
    });

    // Fallback if no questions configured yet
    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-10 text-center bg-background">
                <div className="text-white/60">
                    <p className="text-xl font-bold text-white mb-2">Belum ada pertanyaan interview</p>
                    <p>Silakan hubungi tim HRD untuk informasi lebih lanjut.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="fixed top-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-md border-b border-white/5 z-40 px-6 flex items-center">
                <Logo className="w-8 h-8" textClassName="font-bold tracking-tight text-lg" />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-20 w-full">
                <InterviewView
                    questions={questions}
                    interviewId={sessionData.interview.id}
                    totalQuestions={questions.length}
                />
            </main>
        </div>
    );
}
