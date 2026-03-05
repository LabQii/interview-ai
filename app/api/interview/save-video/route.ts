import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Called after direct browser upload to Cloudinary — just saves the URL to DB
export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    try {
        const { videoUrl, isFinal } = await req.json();

        if (!videoUrl) {
            return NextResponse.json({ error: "URL video tidak ditemukan" }, { status: 400 });
        }

        const interview = await prisma.interview.findUnique({ where: { userId } });
        if (!interview) {
            return NextResponse.json({ error: "Sesi interview tidak ditemukan" }, { status: 404 });
        }
        if (interview.isSubmitted) {
            return NextResponse.json({ error: "Interview sudah disubmit" }, { status: 400 });
        }

        const attemptNumber = interview.totalRetake + 1;
        const newVideoUrls = [...interview.videoUrls, videoUrl];
        const shouldFinalize = isFinal || attemptNumber >= interview.maxRetake;

        const updated = await prisma.interview.update({
            where: { userId },
            data: {
                totalRetake: attemptNumber,
                videoUrls: newVideoUrls,
                finalVideoUrl: shouldFinalize ? videoUrl : interview.finalVideoUrl,
                isSubmitted: shouldFinalize,
                submittedAt: shouldFinalize ? new Date() : null,
            },
        });

        return NextResponse.json({
            success: true,
            interview: updated,
            canRetake: !shouldFinalize && attemptNumber < interview.maxRetake,
        });
    } catch (error) {
        console.error("Save video error:", error);
        return NextResponse.json({ error: "Gagal menyimpan data video" }, { status: 500 });
    }
}
