import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fetch uniquely used categories in the Question table
        const questions = await prisma.question.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        const categories = questions
            .map(q => q.category)
            .filter((c): c is string => c !== null && c.trim() !== "");

        return NextResponse.json({ success: true, categories });
    } catch (e) {
        console.error("Failed to fetch categories:", e);
        return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { oldCategory, newCategory } = await req.json();
        if (!oldCategory || !newCategory) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        await prisma.question.updateMany({
            where: { category: oldCategory },
            data: { category: newCategory.toUpperCase() }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Failed to update category:", e);
        return NextResponse.json({ error: "Gagal update kategori" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { category } = await req.json();
        if (!category) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        await prisma.question.deleteMany({
            where: { category }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Failed to delete category:", e);
        return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
    }
}
