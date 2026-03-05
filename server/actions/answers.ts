"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Save a single answer — auto-save on every selection
 */
export async function saveAnswer(questionId: string, answer: string) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    try {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });
        if (!question) return { error: "Soal tidak ditemukan" };

        const isCorrect = question.correct === answer;

        await prisma.answer.upsert({
            where: { userId_questionId: { userId, questionId } },
            create: {
                userId,
                questionId,
                answer,
                isCorrect,
                answeredAt: new Date(),
            },
            update: {
                answer,
                isCorrect,
                answeredAt: new Date(),
            },
        });

        // Update answered count in session
        const answerCount = await prisma.answer.count({ where: { userId } });
        await prisma.testSession.update({
            where: { userId },
            data: { answeredQuestions: answerCount },
        });

        return { success: true };
    } catch (error) {
        console.error("Save answer error:", error);
        return { error: "Gagal menyimpan jawaban" };
    }
}

/**
 * Get all answers for current user
 */
export async function getUserAnswers() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return [];

    return prisma.answer.findMany({ where: { userId } });
}
