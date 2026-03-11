import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { analysisQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

// Called after direct browser upload to Cloudinary — saves URL to DB and queues analysis
export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    try {
        const { videoUrl, isFinal, questionId } = await req.json();

        if (!videoUrl) {
            return NextResponse.json({ error: "URL video tidak ditemukan" }, { status: 400 });
        }

        const interview = await prisma.interview.findUnique({
            where: { userId },
            include: { user: { include: { redeemCode: true } } }
        });

        if (!interview) {
            return NextResponse.json({ error: "Sesi interview tidak ditemukan" }, { status: 404 });
        }
        if (interview.isSubmitted) {
            return NextResponse.json({ error: "Interview sudah disubmit" }, { status: 400 });
        }

        // ── Duplicate submission guard (Fix #5) ───────────────────────────────
        // If an analysis record already exists for this question, prevent duplicate job
        if (questionId) {
            const existing = await prisma.interviewAnalysis.findFirst({
                where: { userId, questionId },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "Pertanyaan ini sudah dijawab sebelumnya", alreadySubmitted: true },
                    { status: 409 }
                );
            }
        }

        const newVideoUrls = [...interview.videoUrls, videoUrl];
        const shouldFinalize = isFinal === true;

        const updated = await prisma.interview.update({
            where: { userId },
            data: {
                totalRetake: interview.totalRetake + 1,
                videoUrls: newVideoUrls,
                finalVideoUrl: shouldFinalize ? videoUrl : interview.finalVideoUrl,
                isSubmitted: shouldFinalize,
                submittedAt: shouldFinalize ? new Date() : null,
            },
        });

        // Get question details to build prompt
        let questionText = "";
        if (questionId) {
            const questionData = await prisma.interviewQuestion.findUnique({ where: { id: questionId } });
            if (questionData) questionText = questionData.question;
        }

        // Queue analysis job strictly for this single question
        const position = interview.user?.redeemCode?.position ?? "Kandidat";
        const jobData = {
            userId,
            position,
            questions: [{
                id: questionId,
                question: questionText,
                videoUrl: videoUrl,
            }]
        };

        const job = await analysisQueue.add("analyze", jobData, {
            removeOnComplete: false,
            removeOnFail: false,
            attempts: 2,
            backoff: { type: "fixed", delay: 5000 },
        });

        return NextResponse.json({
            success: true,
            interview: updated,
            isFinalized: shouldFinalize,
            jobId: job.id
        });
    } catch (error) {
        console.error("Save video error:", error);
        return NextResponse.json({ error: "Gagal menyimpan data video" }, { status: 500 });
    }
}
