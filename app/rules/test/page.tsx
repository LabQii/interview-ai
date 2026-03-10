"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, Clock, MonitorOff } from "lucide-react";
import { agreeToRules } from "@/server/actions/rules";
import { startTestSession } from "@/server/actions/testSession";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";

export default function TestRulesPage() {
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const showToast = useUIStore((state) => state.showToast);

    const handleStart = async () => {
        if (!agreed) return;
        setLoading(true);

        // 1. Agree to rules
        await agreeToRules("test");

        // 2. Start session (generates startedAt timestamp in DB)
        const sessionRes = await startTestSession();
        if (sessionRes.error) {
            showToast(sessionRes.error, "error");
            setLoading(false);
            return;
        }

        // 3. Go to test
        router.push("/test");
    };

    const rules = [
        {
            icon: Clock,
            title: "Waktu Berjalan Terus",
            desc: "Waktu tes bersifat global dan terus berjalan bahkan jika Anda menutup browser atau kehilangan koneksi. Pastikan koneksi internet stabil."
        },
        {
            icon: MonitorOff,
            title: "Dilarang Berpindah Tab",
            desc: "Sistem mendeteksi perpindahan tab atau aplikasi. Jika Anda berpindah tab lebih dari 3 kali, tes akan otomatis disubmit (Auto-Submit)."
        },
        {
            icon: AlertTriangle,
            title: "Sanksi Kecurangan",
            desc: "Segala bentuk kecurangan yang terdeteksi oleh sistem AI Proctoring kami akan berakibat pada diskualifikasi langsung."
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-elevated max-w-2xl w-full p-8 md:p-10"
            >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Panduan Keamanan Tes</h1>
                <p className="text-white/60 mb-10">
                    Harap baca dan pahami seluruh peraturan di bawah ini sebelum memulai sesi asesmen kognitif Anda.
                </p>

                <div className="space-y-6 mb-10">
                    {rules.map((rule, i) => (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10"
                        >
                            <div className="mt-1">
                                <rule.icon className="w-6 h-6 text-white/80" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">{rule.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{rule.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mb-8 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setAgreed(!agreed)}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${agreed ? "bg-white/10 border-white/20" : "bg-background border-white/20"}`}>
                        {agreed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium text-sm w-full select-none text-white/90">
                        Saya telah membaca, memahami, dan menyetujui seluruh peraturan di atas.
                    </span>
                </div>

                <button
                    onClick={handleStart}
                    disabled={!agreed || loading}
                    className="btn-primary w-full py-4 text-lg"
                >
                    {loading ? "Menyiapkan Sesi..." : "Mulai Tes Sekarang"}
                </button>
            </motion.div>
        </div>
    );
}
