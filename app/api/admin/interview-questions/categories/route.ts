import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all distinct categories
export async function GET() {
    try {
        const rows = await prisma.interviewQuestion.findMany({
            select: { category: true },
            where: { category: { not: null } },
            distinct: ["category"],
            orderBy: { category: "asc" },
        });
        const categories = rows.map(r => r.category).filter(Boolean) as string[];
        return NextResponse.json({ success: true, categories });
    } catch (e) {
        return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
    }
}

// PUT — rename a category across all questions
export async function PUT(req: NextRequest) {
    try {
        const { oldCategory, newCategory } = await req.json();
        if (!oldCategory || !newCategory) return NextResponse.json({ error: "Nama lama dan baru wajib diisi" }, { status: 400 });

        await prisma.interviewQuestion.updateMany({
            where: { category: oldCategory },
            data: { category: newCategory.trim().toUpperCase() },
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Gagal mengubah kategori" }, { status: 500 });
    }
}

// DELETE — delete all questions in a category
export async function DELETE(req: NextRequest) {
    try {
        const { category } = await req.json();
        if (!category) return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 });

        await prisma.interviewQuestion.deleteMany({ where: { category } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
    }
}
