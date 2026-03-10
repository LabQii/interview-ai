"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Video, Mic, RefreshCcw } from "lucide-react";
import { agreeToRules } from "@/server/actions/rules";
import { startInterview } from "@/server/actions/interview";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";

export default function InterviewRulesPage() {
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const showToast = useUIStore((state) => state.showToast);

    const handleStart = async () => {
        if (!agreed) return;
        setLoading(true);

        await agreeToRules("interview");

        const res = await startInterview();
        if (res.error) {
            showToast(res.error, "error");
            setLoading(false);
            return;
        }

        router.push("/interview/precheck");
    };

    const rules = [
        {
            icon: Video,
            title: "Perekaman Video AI",
            desc: "Wawancara ini menggunakan sistem perekaman video mandiri yang akan dianalisis secara otomatis oleh AI. Pastikan pencahayaan ruangan cukup terang."
        },
        {
            icon: Mic,
            title: "Kualitas Audio",
            desc: "Gunakan mikrofon yang jelas dan pastikan Anda berada di ruangan yang tenang agar sistem transkripsi dapat menangkap suara Anda dengan baik."
        },
        {
            icon: RefreshCcw,
            title: "Batas Retake (Ulang)",
            desc: "Anda memiliki maksimal 3 kesempatan untuk merekam ulang (retake) per pertanyaan. Jika kuota habis, video terakhir wajib dikumpulkan."
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-elevated max-w-2xl w-full p-8 md:p-10"
            >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <Video className="w-8 h-8 text-white/80" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Persiapan AI Interview</h1>
                <p className="text-white/60 mb-10">
                    Tahap selanjutnya adalah wawancara berbasis video. Sistem AI kami akan menilai respons perilaku dan komunikasi Anda.
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
                        Saya mengizinkan akses kamera/mikrofon dan menyetujui aturan interview.
                    </span>
                </div>

                <button
                    onClick={handleStart}
                    disabled={!agreed || loading}
                    className="btn-primary flex items-center justify-center gap-2 w-full py-4 text-lg"
                >
                    {loading ? "Membuka Kamera..." : "Masuk ke Ruang Interview"} <Video className="w-5 h-5" />
                </button>
            </motion.div>
        </div>
    );
}
