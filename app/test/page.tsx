import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/actions/redeemCode";
import { getUserAnswers } from "@/server/actions/answers";
import prisma from "@/lib/prisma";
import { calculateRemainingTime, isTestExpired } from "@/lib/timer";
import { TestView } from "@/components/test/TestView";

export default async function TestPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData || !sessionData.redeemCode || !sessionData.testSession) {
        redirect("/");
    }

    // Already submitted?
    if (sessionData.testSession.isSubmitted) {
        redirect("/test/summary");
    }

    // Check Expiry
    if (isTestExpired(sessionData.testSession.startedAt, sessionData.redeemCode.duration)) {
        redirect("/api/auto-submit");
    }

    // Calculate remaining time
    const remaining = calculateRemainingTime(
        sessionData.testSession.startedAt,
        sessionData.redeemCode.duration
    );

    // Fetch Questions via junction table
    const junctionRows = await prisma.$queryRaw<{ B: string }[]>`
        SELECT "B" FROM "_RedeemCodeQuestions" WHERE "A" = ${sessionData.redeemCodeId!}
    `;
    const questionIds = junctionRows.map((r: { B: string }) => r.B);

    const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        orderBy: { order: "asc" },
    });

    if (questions.length === 0) {
        return <div className="p-10 text-center text-white">Paket soal tidak ditemukan.</div>;
    }

    // Fetch previous answers
    const prevAnswers = await getUserAnswers();
    const initialAnswers: Record<string, string> = {};
    prevAnswers.forEach((a) => {
        initialAnswers[a.questionId] = a.answer;
    });

    return (
        <TestView
            questions={questions}
            initialAnswers={initialAnswers}
            globalDurationRemaining={remaining}
            tabSwitchWarnings={sessionData.testSession.tabSwitchCount}
        />
    );
}
