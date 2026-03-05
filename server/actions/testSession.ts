"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Start a test session — creates a TestSession record with startedAt
 */
export async function startTestSession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { redeemCode: true },
        });

        if (!user || !user.redeemCode) {
            return { error: "Kode redeem tidak ditemukan" };
        }

        // Get questions for this redeem code
        // Fetch question IDs linked to this redeem code via the junction table
        const junctionRows = await prisma.$queryRaw<{ B: string }[]>`
            SELECT "B" FROM "_RedeemCodeQuestions" WHERE "A" = ${user.redeemCode.id}
        `;
        const questionIds = junctionRows.map((r: { B: string }) => r.B);

        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            orderBy: { order: "asc" },
        });

        // Upsert test session — don't reset startedAt if already exists
        const existing = await prisma.testSession.findUnique({
            where: { userId },
        });

        if (existing) {
            return {
                success: true,
                session: existing,
                questions,
                duration: user.redeemCode.duration,
            };
        }

        const session = await prisma.testSession.create({
            data: {
                userId,
                redeemCode: user.redeemCode.code,
                position: user.redeemCode.position,
                startedAt: new Date(),
                totalQuestions: questions.length,
            },
        });

        return {
            success: true,
            session,
            questions,
            duration: user.redeemCode.duration,
        };
    } catch (error) {
        console.error("Start test session error:", error);
        return { error: "Gagal memulai sesi tes" };
    }
}

/**
 * Get server-side remaining time for a user
 */
export async function getServerRemainingTime() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { remaining: 0, error: "Sesi tidak ditemukan" };

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { redeemCode: true, testSession: true },
    });

    if (!user?.testSession || !user.redeemCode) {
        return { remaining: 0, error: "Sesi tidak ditemukan" };
    }

    const { calculateRemainingTime } = await import("@/lib/timer");
    const remaining = calculateRemainingTime(
        user.testSession.startedAt,
        user.redeemCode.duration
    );

    return { remaining, error: null };
}

/**
 * Submit the entire test (called on timer expiry or completion)
 */
export async function submitTest(userId?: string) {
    const cookieStore = await cookies();
    const uid = userId || cookieStore.get("userId")?.value;
    if (!uid) return { error: "Sesi tidak ditemukan" };

    try {
        const session = await prisma.testSession.findUnique({
            where: { userId: uid },
        });

        if (!session) return { error: "Sesi tidak ditemukan" };
        if (session.isSubmitted) return { success: true, alreadySubmitted: true };

        // Calculate score
        const answers = await prisma.answer.findMany({ where: { userId: uid } });
        const correct = answers.filter((a) => a.isCorrect === true).length;
        const score = Math.round((correct / Math.max(session.totalQuestions, 1)) * 100);

        await prisma.testSession.update({
            where: { userId: uid },
            data: {
                isSubmitted: true,
                submittedAt: new Date(),
                answeredQuestions: answers.length,
                score,
            },
        });

        return { success: true, score };
    } catch (error) {
        console.error("Submit test error:", error);
        return { error: "Gagal submit tes" };
    }
}
