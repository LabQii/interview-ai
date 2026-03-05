"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

/**
 * Validate and redeem a code, create user session
 */
export async function redeemCode(formData: FormData) {
    const code = (formData.get("code") as string)?.trim().toUpperCase();

    if (!code) {
        return { error: "Kode tidak boleh kosong" };
    }

    try {
        const redeemCode = await prisma.redeemCode.findUnique({
            where: { code },
            include: { users: true },
        });

        if (!redeemCode) {
            return { error: "Kode tidak valid. Periksa kembali kode Anda." };
        }

        if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
            return { error: "Kode sudah kedaluwarsa." };
        }

        // If code is reusable (e.g. HRD8899TEST2), skip used check — always allow
        if (!redeemCode.isReusable) {
            // If code is already used, check if the current session user is the one who used it
            // (e.g. slow connection marked used but redirect failed)
            if (redeemCode.isUsed) {
                const cookieStore = await cookies();
                const existingUserId = cookieStore.get("userId")?.value;

                if (existingUserId && redeemCode.users.some(u => u.id === existingUserId)) {
                    // Same user trying again — just let them continue
                    const existingUser = redeemCode.users.find(u => u.id === existingUserId)!;
                    return { success: true, userId: existingUser.id, position: redeemCode.position };
                }

                return { error: "Kode sudah digunakan oleh peserta lain." };
            }
        }

        // Create the user with this redeem code
        const user = await prisma.user.create({
            data: {
                redeemCodeId: redeemCode.id,
            },
        });

        // Only mark as used if NOT reusable
        if (!redeemCode.isReusable) {
            await prisma.redeemCode.update({
                where: { id: redeemCode.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                },
            });
        }

        // Set userId cookie
        const cookieStore = await cookies();
        cookieStore.set("userId", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return { success: true, userId: user.id, position: redeemCode.position };
    } catch (error) {
        console.error("Redeem code error:", error);
        return { error: "Terjadi kesalahan. Coba lagi." };
    }
}

/**
 * Get current session data (server component usage)
 */
export async function getCurrentSession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;

    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            redeemCode: true,
            testSession: true,
            ruleAgreements: true,
            interview: true,
        },
    });
}

/**
 * Save candidate name after redeeming code
 */
export async function saveCandidateName(name: string) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return { error: "Sesi tidak ditemukan" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name: name.trim() }
        });
        return { success: true };
    } catch (error) {
        console.error("Save name error:", error);
        return { error: "Gagal menyimpan nama" };
    }
}
