"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Mic, MicOff, RefreshCw, CheckCircle2, XCircle, Loader2, Volume2, Wind, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MicResult {
    mic_working: boolean;
    volume_adequate: boolean;
    environment_quiet: boolean;
    overall_passed: boolean;
    issues: string[];
    suggestions: string[];
    message: string;
}

interface MicCheckProps {
    onPassed: () => void;
}

type CheckStatus = "idle" | "recording" | "analyzing" | "passed" | "failed";

/**
 * Compute RMS from Float32Array and return a 0–100 scale value.
 * We apply sqrt amplification to make low-level sounds more visible.
 */
function computeRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    // Amplify: typical speech RMS is ~0.01–0.1, map to 0–100 visually
    // Use a non-linear (sqrt) scale so quiet sounds are still visible
    return Math.min(Math.sqrt(rms) * 300, 100);
}

function noiseLabel(rms: number): string {
    // These thresholds use the amplified 0–100 scale from computeRMS.
    // Typical ambient room noise = 5–25, normal speech = 30–60.
    // Only flag "very_noisy" for truly disruptive noise (>80).
    if (rms < 10) return "quiet";
    if (rms < 40) return "moderate";
    if (rms < 70) return "noisy";
    return "very_noisy";
}

export function MicCheck({ onPassed }: MicCheckProps) {
    const [status, setStatus] = useState<CheckStatus>("idle");
    const [result, setResult] = useState<MicResult | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [liveRms, setLiveRms] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const rafRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
    const rmsValuesRef = useRef<number[]>([]);
    const smoothedRmsRef = useRef(0);

    // Clean up animation frame on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const analyzeAudio = useCallback(async () => {
        setStatus("recording");
        setResult(null);
        setError(null);
        setCountdown(3);
        setLiveRms(0);
        rmsValuesRef.current = [];
        smoothedRmsRef.current = 0;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,   // disable to avoid gain reduction
                    noiseSuppression: false,   // disable so raw signal is captured
                    autoGainControl: false,    // disable browser AGC for accurate reading
                    sampleRate: 44100,
                },
            });

            const audioCtx = new AudioContext({ sampleRate: 44100 });
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();

            // Smaller fftSize = faster response, 256 gives ~5ms update
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5; // some smoothing but still fast

            source.connect(analyser);
            analyserRef.current = analyser;

            const buffer = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
            bufferRef.current = buffer;

            const startTime = Date.now();
            const DURATION_MS = 3000;

            // Real-time loop using requestAnimationFrame for immediate response
            const loop = () => {
                if (!analyserRef.current || !bufferRef.current) return;

                analyserRef.current.getFloatTimeDomainData(bufferRef.current);
                const rawRms = computeRMS(bufferRef.current);

                // Exponential moving average for smooth but fast UI
                smoothedRmsRef.current = smoothedRmsRef.current * 0.7 + rawRms * 0.3;
                setLiveRms(smoothedRmsRef.current);

                // Collect raw RMS for final analysis (before smoothing)
                rmsValuesRef.current.push(rawRms);

                const elapsed = Date.now() - startTime;
                const remaining = Math.ceil((DURATION_MS - elapsed) / 1000);
                setCountdown(Math.max(0, remaining));

                if (elapsed < DURATION_MS) {
                    rafRef.current = requestAnimationFrame(loop);
                }
            };

            rafRef.current = requestAnimationFrame(loop);

            // Wait for full 3 seconds
            await new Promise(r => setTimeout(r, DURATION_MS + 50));

            // Cleanup
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            stream.getTracks().forEach(t => t.stop());
            audioCtx.close();
            analyserRef.current = null;

            // Calculate average RMS from collected samples
            const samples = rmsValuesRef.current;
            const avgRms = samples.length > 0
                ? samples.reduce((a, b) => a + b, 0) / samples.length
                : 0;

            // Also use the peak RMS (top 10% average) for more accurate assessment
            const sorted = [...samples].sort((a, b) => b - a);
            const top10 = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.1)));
            const peakRms = top10.reduce((a, b) => a + b, 0) / top10.length;

            // Use peak for voice detection (more reliable)
            const voiceDetected = peakRms > 8;
            const noise = noiseLabel(avgRms);

            setStatus("analyzing");

            // Send raw-scale values (before sqrt amplification) for backend
            const rawAvgRms = samples.length > 0
                ? samples.reduce((a, b) => a + b, 0) / samples.length
                : 0;

            const res = await fetch("/api/interview/analyze-mic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rms: rawAvgRms,
                    noiseLabel: noise,
                    voiceDetected,
                    peakRms,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data.result);
            setStatus(data.result.overall_passed ? "passed" : "failed");
            if (data.result.overall_passed) setTimeout(onPassed, 1500);
        } catch (e: any) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            analyserRef.current = null;
            setError(e.message || "Gagal mengakses mikrofon.");
            setStatus("idle");
        }
    }, [onPassed]);

    const handleRetry = () => {
        setStatus("idle");
        setResult(null);
        setError(null);
        setLiveRms(0);
    };

    const indicators = [
        { label: "Mikrofon Aktif", key: "mic_working", icon: Mic },
        { label: "Volume Cukup", key: "volume_adequate", icon: Volume2 },
        { label: "Lingkungan Tenang", key: "environment_quiet", icon: Wind },
    ] as const;

    // Map liveRms (0–100) to percentage for the bar
    const barPercent = Math.min(liveRms, 100);

    // Color based on volume level
    const barColor =
        barPercent < 15 ? "from-gray-500 to-gray-400" :
            barPercent < 40 ? "from-emerald-500 to-teal-400" :
                barPercent < 75 ? "from-emerald-500 to-blue-500" :
                    "from-yellow-500 to-orange-400";

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Uji Coba Mikrofon</h2>
                <p className="text-white/50 text-sm">Sistem akan merekam suara selama 3 detik untuk menganalisis kualitas audio dan tingkat kebisingan lingkungan Anda.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
                    <MicOff className="w-5 h-5 shrink-0" /> {error}
                </div>
            )}

            {/* Visual feedback */}
            <div className="card-elevated p-8 flex flex-col items-center gap-4">
                {status === "idle" && (
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Mic className="w-8 h-8 text-white/20" />
                    </div>
                )}

                {status === "recording" && (
                    <>
                        {/* Animated mic pulse that scales with volume */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            {/* Outer pulse ring - scales with liveRms */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-red-500/20"
                                animate={{ scale: 1 + barPercent / 200 }}
                                transition={{ duration: 0.05 }}
                            />
                            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "1s" }} />
                            <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center z-10">
                                <Mic className="w-8 h-8 text-red-400" />
                            </div>
                        </div>
                        <p className="font-bold text-red-400">Merekam... {countdown}s</p>

                        {/* Live volume bar - real-time, instant response */}
                        <div className="w-full space-y-2">
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden relative">
                                <motion.div
                                    className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                                    style={{ width: `${barPercent}%` }}
                                    transition={{ duration: 0 }} // instant - no transition delay
                                />
                                {/* Tick marks */}
                                <div className="absolute inset-0 flex justify-around items-center pointer-events-none">
                                    {[25, 50, 75].map(p => (
                                        <div key={p} className="w-px h-2 bg-white/10" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-white/20">
                                <span>Hening</span>
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {barPercent < 5
                                        ? "Tidak terdeteksi"
                                        : barPercent < 20
                                            ? "Lemah"
                                            : barPercent < 50
                                                ? "Baik ✓"
                                                : "Kuat"}
                                </span>
                                <span>Keras</span>
                            </div>
                        </div>
                        <p className="text-xs text-white/30 flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Bicara beberapa kata untuk pengujian
                        </p>
                    </>
                )}

                {status === "analyzing" && (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-white/80" />
                        <p className="font-bold text-white/90">AI sedang menganalisis kualitas audio...</p>
                    </div>
                )}

                {status === "passed" && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                        <p className="font-bold text-emerald-300 text-lg">Audio Disetujui!</p>
                    </motion.div>
                )}
            </div>

            {/* Indicator Cards */}
            {result && (
                <div className="grid grid-cols-3 gap-3">
                    {indicators.map(({ label, key, icon: Icon }) => {
                        const val = result[key];
                        return (
                            <div key={key} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${val ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                                <Icon className={`w-5 h-5 ${val ? "text-emerald-400" : "text-red-400"}`} />
                                <p className="text-xs font-bold text-center text-white/70">{label}</p>
                                <p className={`text-xs font-bold ${val ? "text-emerald-400" : "text-red-400"}`}>{val ? "✓ OK" : "✗ Gagal"}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Issues */}
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
            {status === "idle" && (
                <button onClick={analyzeAudio} className="btn-primary flex items-center gap-2 w-full justify-center px-8 py-4">
                    <Mic className="w-5 h-5" /> Mulai Uji Mikrofon (3 detik)
                </button>
            )}
            {status === "failed" && (
                <div className="flex gap-3">
                    <button onClick={handleRetry} className="btn-ghost flex items-center gap-2 px-6"><RefreshCw className="w-4 h-4" /> Coba Lagi</button>
                    <button onClick={analyzeAudio} className="btn-primary flex items-center gap-2 flex-1 justify-center"><Mic className="w-5 h-5" /> Uji Ulang</button>
                </div>
            )}
        </div>
    );
}
