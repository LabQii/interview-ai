"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Save rule agreement to database
 */
export async function agreeToRules(ruleType: "test" | "interview") {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return { error: "Sesi tidak ditemukan" };

    try {
        await prisma.ruleAgreement.upsert({
            where: { userId_ruleType: { userId, ruleType } },
            create: { userId, ruleType, agreedAt: new Date() },
            update: { agreedAt: new Date() },
        });

        return { success: true };
    } catch (error) {
        console.error("Rule agreement error:", error);
        return { error: "Gagal menyimpan persetujuan" };
    }
}
