"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { uploadVideoToSupabase } from "@/lib/supabase";

const MAX_RETAKES = 3;

/**
 * Start interview session
 */
export async function startInterview() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    try {
        const existing = await prisma.interview.findUnique({ where: { userId } });
        if (existing) return { success: true, interview: existing };

        const interview = await prisma.interview.create({
            data: { userId, startedAt: new Date() },
        });

        return { success: true, interview };
    } catch (error) {
        console.error("Start interview error:", error);
        return { error: "Gagal memulai interview" };
    }
}

/**
 * Upload video and save/retake
 */
export async function submitInterviewVideo(formData: FormData) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    const videoBlob = formData.get("video") as Blob;
    const isFinal = formData.get("isFinal") === "true";

    if (!videoBlob) return { error: "Video tidak ditemukan" };

    try {
        const interview = await prisma.interview.findUnique({ where: { userId } });
        if (!interview) return { error: "Sesi interview tidak ditemukan" };
        if (interview.isSubmitted) return { error: "Interview sudah disubmit" };
        if (interview.totalRetake >= MAX_RETAKES && !isFinal) {
            return { error: "Batas retake sudah tercapai" };
        }

        const attemptNumber = interview.totalRetake + 1;
        const { url, error: uploadError } = await uploadVideoToSupabase(
            videoBlob,
            userId,
            attemptNumber
        );

        if (uploadError || !url) {
            return { error: "Gagal upload video: " + uploadError };
        }

        const newVideoUrls = [...interview.videoUrls, url];

        // If final submit or retake limit reached
        const shouldFinalize = isFinal || attemptNumber >= MAX_RETAKES;

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

        return {
            success: true,
            interview: updated,
            canRetake: !shouldFinalize && attemptNumber < MAX_RETAKES,
            remainingRetakes: Math.max(0, MAX_RETAKES - attemptNumber),
        };
    } catch (error) {
        console.error("Submit interview video error:", error);
        return { error: "Gagal menyimpan video" };
    }
}

/**
 * Get current interview state
 */
export async function getInterviewState() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;

    return prisma.interview.findUnique({ where: { userId } });
}
