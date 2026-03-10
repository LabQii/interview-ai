import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const participant = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                testSession: true,
                interview: true,
                redeemCode: true
            }
        });

        if (!participant) {
            return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
        }

        // Get actual test answers
        const answers = await prisma.answer.findMany({
            where: { userId: params.id },
            include: {
                question: {
                    select: {
                        question: true,
                        correct: true,
                        category: true
                    }
                }
            },
            orderBy: { answeredAt: "asc" }
        });

        // Get tab switch violations
        const violations = await prisma.tabSwitchLog.findMany({
            where: { userId: params.id },
            orderBy: { loggedAt: "desc" }
        });

        // Get AI analyses for the participant
        const analyses = await prisma.interviewAnalysis.findMany({
            where: { userId: params.id },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json({
            success: true,
            participant,
            answers,
            violations,
            analyses
        });
    } catch (e) {
        return NextResponse.json({ error: "Gagal memuat detail peserta" }, { status: 500 });
    }
}
