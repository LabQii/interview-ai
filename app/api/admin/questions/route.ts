import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            orderBy: { order: "asc" }
        });
        return NextResponse.json({ success: true, questions });
    } catch (e) {
        return NextResponse.json({ error: "Gagal memuat soal" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        if (!data.question || !data.optionA || !data.optionB || !data.optionC || !data.optionD || !data.correct || !data.duration) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        const newQ = await prisma.question.create({
            data: {
                question: data.question,
                optionA: data.optionA,
                optionB: data.optionB,
                optionC: data.optionC,
                optionD: data.optionD,
                correct: data.correct,
                duration: parseInt(data.duration),
                category: data.category || "General",
                order: parseInt(data.order) || 0
            }
        });

        // Auto-link this question to the permanent test code if it exists
        try {
            const permCode = await prisma.redeemCode.findUnique({ where: { code: "HRD8899TEST2" } });
            if (permCode) {
                await prisma.$executeRaw`
                    INSERT INTO "_RedeemCodeQuestions" ("A", "B") VALUES (${permCode.id}, ${newQ.id}) ON CONFLICT DO NOTHING
                `;
            }
        } catch (linkErr) {
            console.error("Auto-link error:", linkErr);
        }

        return NextResponse.json({ success: true, question: newQ });
    } catch (e) {
        console.error("Create question err:", e);
        return NextResponse.json({ error: "Gagal membuat soal" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const data = await req.json();
        const { id, ...updateData } = data;

        if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

        if (updateData.duration) updateData.duration = parseInt(updateData.duration);
        if (updateData.order) updateData.order = parseInt(updateData.order);

        const updatedQ = await prisma.question.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, question: updatedQ });
    } catch (e) {
        return NextResponse.json({ error: "Gagal update soal" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 });
    }
}
