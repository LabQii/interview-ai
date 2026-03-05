"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const MAX_TAB_SWITCHES = 3;

/**
 * Log a tab switch event and check if auto-submit is required
 */
export async function logTabSwitch(phase: "test" | "interview") {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    try {
        // Log the switch
        await prisma.tabSwitchLog.create({
            data: { userId, phase },
        });

        // Update session counter
        const session = await prisma.testSession.update({
            where: { userId },
            data: { tabSwitchCount: { increment: 1 } },
        });

        const shouldAutoSubmit = session.tabSwitchCount >= MAX_TAB_SWITCHES;

        return {
            success: true,
            switchCount: session.tabSwitchCount,
            shouldAutoSubmit,
            remainingWarnings: Math.max(0, MAX_TAB_SWITCHES - session.tabSwitchCount),
        };
    } catch (error) {
        console.error("Tab switch log error:", error);
        return { error: "Gagal mencatat perpindahan tab" };
    }
}

/**
 * Get current tab switch count for user
 */
export async function getTabSwitchCount() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return 0;

    const session = await prisma.testSession.findUnique({
        where: { userId },
        select: { tabSwitchCount: true },
    });

    return session?.tabSwitchCount ?? 0;
}
