import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { uploadVideoToCloudinary } from "@/lib/cloudinaryUpload";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const videoFile = formData.get("video") as File | null;
        const isFinal = formData.get("isFinal") === "true";

        if (!videoFile) {
            return NextResponse.json({ error: "Video tidak ditemukan" }, { status: 400 });
        }

        const interview = await prisma.interview.findUnique({ where: { userId } });
        if (!interview) {
            return NextResponse.json({ error: "Sesi interview tidak ditemukan" }, { status: 404 });
        }
        if (interview.isSubmitted) {
            return NextResponse.json({ error: "Interview sudah disubmit" }, { status: 400 });
        }

        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const attemptNumber = interview.totalRetake + 1;
        // public_id: candidate_{userId}_question_{attempt}_{timestamp}
        const publicId = `candidate_${userId}_question_${attemptNumber}_${Date.now()}`;

        const result = await uploadVideoToCloudinary(buffer, publicId);

        if ("error" in result) {
            return NextResponse.json({ error: "Gagal upload ke Cloudinary: " + result.error }, { status: 500 });
        }

        const { url } = result;
        const newVideoUrls = [...interview.videoUrls, url];
        const shouldFinalize = isFinal || attemptNumber >= interview.maxRetake;

        const updated = await prisma.interview.update({
            where: { userId },
            data: {
                totalRetake: attemptNumber,
                videoUrls: newVideoUrls,
                finalVideoUrl: shouldFinalize ? url : interview.finalVideoUrl,
                isSubmitted: shouldFinalize,
                submittedAt: shouldFinalize ? new Date() : null,
            },
        });

        return NextResponse.json({
            success: true,
            interview: updated,
            videoUrl: url,
            canRetake: !shouldFinalize && attemptNumber < interview.maxRetake,
        });
    } catch (error) {
        console.error("Interview upload error:", error);
        return NextResponse.json({ error: "Gagal menyimpan video" }, { status: 500 });
    }
}
