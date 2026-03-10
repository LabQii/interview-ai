"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, CheckCircle2, XCircle, Loader2, User, Image, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraResult {
    face_detected: boolean;
    face_visible: boolean;
    background_appropriate: boolean;
    lighting_good: boolean;
    overall_passed: boolean;
    issues: string[];
    suggestions: string[];
    message: string;
}

interface CameraCheckProps {
    onPassed: () => void;
}

type CheckStatus = "idle" | "analyzing" | "passed" | "failed";

export function CameraCheck({ onPassed }: CameraCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [status, setStatus] = useState<CheckStatus>("idle");
    const [result, setResult] = useState<CameraResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setError(null);
        } catch (e) {
            setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    }, [startCamera]);

    const captureAndAnalyze = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setStatus("analyzing");
        setResult(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

        try {
            const res = await fetch("/api/interview/analyze-camera", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResult(data.result);
            setStatus(data.result.overall_passed ? "passed" : "failed");
            if (data.result.overall_passed) setTimeout(onPassed, 1500);
        } catch (e: any) {
            setError(e.message || "Analisis gagal. Coba lagi.");
            setStatus("idle");
        }
    }, [onPassed]);

    const handleRetry = () => {
        setStatus("idle");
        setResult(null);
        setError(null);
        if (!streamRef.current) startCamera();
    };

    const indicators = [
        { label: "Wajah Terdeteksi", key: "face_detected", icon: User },
        { label: "Wajah Terlihat Jelas", key: "face_visible", icon: Camera },
        { label: "Latar Belakang", key: "background_appropriate", icon: Image },
        { label: "Pencahayaan", key: "lighting_good", icon: Sun },
    ] as const;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Pastikan kamera Anda terlihat jelas</h2>
                <p className="text-white/50 text-sm">AI akan menganalisis tampilan kamera — wajah, pencahayaan, dan latar belakang harus sesuai standar interview profesional.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
                    <CameraOff className="w-5 h-5 shrink-0" /> {error}
                </div>
            )}

            {/* Camera Preview */}
            <div className="relative aspect-video w-full bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Center face guide */}
                {status === "idle" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-52 rounded-full border-2 border-dashed border-violet-400/40" />
                    </div>
                )}

                {status === "analyzing" && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-white/80" />
                        <p className="text-white font-bold">AI sedang menganalisis...</p>
                    </div>
                )}

                {status === "passed" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                        <p className="font-bold text-emerald-300 text-lg">Lingkungan Disetujui!</p>
                    </motion.div>
                )}
            </div>

            {/* Indicator Cards */}
            <div className="grid grid-cols-2 gap-3">
                {indicators.map(({ label, key, icon: Icon }) => {
                    const val = result ? result[key] : null;
                    return (
                        <div key={key} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${val === true ? "bg-emerald-500/10 border-emerald-500/30" : val === false ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-white/5"}`}>
                            <Icon className={`w-5 h-5 shrink-0 ${val === true ? "text-emerald-400" : val === false ? "text-red-400" : "text-white/20"}`} />
                            <div>
                                <p className="text-sm font-bold text-white/80">{label}</p>
                                <p className={`text-xs ${val === true ? "text-emerald-400" : val === false ? "text-red-400" : "text-white/30"}`}>
                                    {val === null ? "Menunggu..." : val ? "✓ OK" : "✗ Gagal"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Issues & Suggestions */}
            <AnimatePresence>
                {result && !result.overall_passed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                        <p className="font-bold text-red-400 flex items-center gap-2"><XCircle className="w-4 h-4" /> {result.message}</p>
                        {result.suggestions.length > 0 && (
                            <ul className="text-sm text-white/60 list-disc list-inside space-y-1">
                                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA */}
            <div className="flex gap-3">
                {(status === "failed") && (
                    <button onClick={handleRetry} className="btn-ghost flex items-center gap-2 px-6">
                        <RefreshCw className="w-4 h-4" /> Coba Lagi
                    </button>
                )}
                {status === "idle" && (
                    <button onClick={captureAndAnalyze} className="btn-primary flex items-center gap-2 px-8 w-full justify-center">
                        <Camera className="w-5 h-5" /> Analisis Kamera Sekarang
                    </button>
                )}
                {status === "failed" && (
                    <button onClick={captureAndAnalyze} className="btn-primary flex items-center gap-2 px-8 flex-1 justify-center">
                        <Camera className="w-5 h-5" /> Analisis Ulang
                    </button>
                )}
            </div>
        </div>
    );
}
