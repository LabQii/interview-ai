import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Middleware should protect this route

export async function GET() {
    try {
        const codes = await prisma.redeemCode.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        return NextResponse.json({ success: true, codes });
    } catch (e) {
        return NextResponse.json({ error: "Gagal memuat kode" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // Basic validation
        if (!data.code || !data.duration || !data.position) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        const newCode = await prisma.redeemCode.create({
            data: {
                code: data.code.toUpperCase(),
                duration: parseInt(data.duration),
                position: data.position,
                packageName: data.packageName || "Standard",
                isReusable: !!data.isReusable,
                isUsed: false
            }
        });

        // Link questions to this new code based on selected categories
        try {
            const categories: string[] = data.categories || [];

            const targetQuestions = await prisma.question.findMany({
                where: categories.length > 0 ? { category: { in: categories } } : undefined,
                select: { id: true }
            });

            if (targetQuestions.length > 0) {
                await prisma.redeemCodeQuestions.createMany({
                    data: targetQuestions.map(q => ({
                        A: newCode.id,
                        B: q.id
                    })),
                    skipDuplicates: true
                });
            }
        } catch (linkErr) {
            console.error("Link questions error:", linkErr);
        }

        return NextResponse.json({ success: true, code: newCode });
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: "Kode sudah ada" }, { status: 400 });
        }
        return NextResponse.json({ error: "Gagal membuat kode" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

        await prisma.redeemCode.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Gagal menghapus kode" }, { status: 500 });
    }
}
