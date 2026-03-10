import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { analysisQueue } from "@/lib/queue";
import type { AnalysisJobData } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                redeemCode: true,
                interview: true,
            },
        });

        if (!user?.interview) {
            return NextResponse.json({ error: "Sesi interview tidak ditemukan" }, { status: 404 });
        }

        // Get interview questions for this user's redeem code
        const questions = await prisma.interviewQuestion.findMany({
            orderBy: [{ category: "asc" }, { order: "asc" }],
        });

        const videoUrls = user.interview.videoUrls;

        // Build per-question video mapping (sequential — video index matches question index)
        const questionVideoMap = questions.map((q, i) => ({
            id: q.id,
            question: q.question,
            videoUrl: videoUrls[i] ?? "",
        }));

        const jobData: AnalysisJobData = {
            userId,
            position: user.redeemCode?.position ?? "Kandidat",
            questions: questionVideoMap,
        };

        const job = await analysisQueue.add("analyze", jobData, {
            removeOnComplete: false,
            removeOnFail: false,
            attempts: 2,
            backoff: { type: "fixed", delay: 5000 },
        });

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (err: any) {
        console.error("Start analysis error:", err);
        return NextResponse.json({ error: err.message || "Gagal memulai analisis" }, { status: 500 });
    }
}
