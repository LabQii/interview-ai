import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const questions = await prisma.interviewQuestion.findMany({
            orderBy: [{ category: "asc" }, { order: "asc" }],
        });
        return NextResponse.json({ success: true, questions });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Gagal memuat soal" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, category, hint, order } = body;
        if (!question) return NextResponse.json({ error: "Pertanyaan wajib diisi" }, { status: 400 });

        const created = await prisma.interviewQuestion.create({
            data: {
                question,
                category: category?.trim().toUpperCase() || null,
                hint: hint || null,
                order: order ?? 0,
            },
        });
        return NextResponse.json({ success: true, question: created });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Gagal membuat soal" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, question, category, hint, order } = body;
        if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

        const updated = await prisma.interviewQuestion.update({
            where: { id },
            data: {
                ...(question && { question }),
                category: category?.trim().toUpperCase() || null,
                hint: hint || null,
                ...(order !== undefined && { order }),
            },
        });
        return NextResponse.json({ success: true, question: updated });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Gagal mengubah soal" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

        await prisma.interviewQuestion.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 });
    }
}
