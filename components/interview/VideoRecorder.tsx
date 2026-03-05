"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Video, VideoOff, Square, RefreshCcw, Send, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const MAX_RETAKE = 3;
const MAX_SECONDS = 60;

export function VideoRecorder() {
    const router = useRouter();

    // Recording state
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoStopRef = useRef<NodeJS.Timeout | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [retakeCount, setRetakeCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [aiProgressText, setAiProgressText] = useState("");
    const [aiProgressPerc, setAiProgressPerc] = useState(0);

    const AI_STEPS = [
        { text: "Mengunggah video ke server...", time: 0, prog: 10 },
        { text: "Mengekstrak audio dari rekaman...", time: 1500, prog: 30 },
        { text: "Speech-to-Text sedang memproses...", time: 3500, prog: 55 },
        { text: "AI menganalisis intonasi & kepercayaan diri...", time: 6000, prog: 75 },
        { text: "Mengevaluasi relevansi jawaban...", time: 8500, prog: 90 },
        { text: "Menyimpan hasil ke server HRD...", time: 10000, prog: 99 },
    ];

    const canRetake = retakeCount < MAX_RETAKE;

    // Effect: attach live camera stream to video element
    useEffect(() => {
        if (videoRef.current) {
            if (previewUrl) {
                // Clear live stream so src attribute works
                videoRef.current.srcObject = null;
            } else if (streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
        }
    }, [previewUrl, isRecording]);

    const stopStream = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (autoStopRef.current) clearTimeout(autoStopRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        // Don't stop tracks here — let onstop callback do it after blob is assembled
        setIsRecording(false);
    }, []);

    const handleStart = useCallback(async () => {
        setError(null);
        setPreviewUrl(null);
        setRecordedBlob(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;

            // Attach stream immediately for live preview
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Pick best supported MIME type
            const preferredTypes = [
                "video/webm;codecs=vp8,opus",
                "video/webm",
                "video/mp4",
            ];
            const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) ?? "";

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const type = mimeType ? mimeType.split(";")[0] : "video/webm";
                const blob = new Blob(chunksRef.current, { type });
                const url = URL.createObjectURL(blob);
                setRecordedBlob(blob);
                setPreviewUrl(url);
                // Stop camera tracks after blob is created
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            };

            recorder.start(500);
            setIsRecording(true);
            setRecordingSeconds(0);

            timerRef.current = setInterval(() => {
                setRecordingSeconds(s => {
                    if (s + 1 >= MAX_SECONDS) {
                        stopStream();
                        return MAX_SECONDS;
                    }
                    return s + 1;
                });
            }, 1000);

            // Auto-stop at 60s
            autoStopRef.current = setTimeout(() => stopStream(), MAX_SECONDS * 1000);
        } catch (err) {
            setError("Gagal mengakses kamera/mikrofon. Pastikan izin telah diberikan.");
            console.error(err);
        }
    }, [stopStream]);

    const handleStop = useCallback(() => {
        stopStream();
    }, [stopStream]);

    const handleRetake = useCallback(() => {
        if (!canRetake) return;
        // Stop any running stream/recording
        stopStream();
        // Revoke old preview URL to free memory
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setRecordedBlob(null);
        chunksRef.current = [];
        setRetakeCount(c => c + 1);
    }, [canRetake, previewUrl, stopStream]);

    const handleSubmit = useCallback(async () => {
        if (!previewUrl || !recordedBlob || uploading) return;
        setUploading(true);

        // Start AI progress simulation
        setAiProgressText(AI_STEPS[0].text);
        setAiProgressPerc(AI_STEPS[0].prog);
        const timers = AI_STEPS.slice(1).map(step =>
            setTimeout(() => {
                setAiProgressText(step.text);
                setAiProgressPerc(step.prog);
            }, step.time)
        );

        try {
            // Step 1: Get signed upload params from server
            const sigRes = await fetch("/api/interview/cloudinary-signature");
            if (!sigRes.ok) throw new Error("Gagal mendapatkan parameter upload");
            const { timestamp, signature, folder, cloudName, apiKey } = await sigRes.json();

            // Step 2: Upload DIRECTLY from browser to Cloudinary (no server bottleneck)
            const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
            const cloudForm = new FormData();
            cloudForm.append("file", recordedBlob, `interview.${ext}`);
            cloudForm.append("timestamp", String(timestamp));
            cloudForm.append("signature", signature);
            cloudForm.append("api_key", apiKey);
            cloudForm.append("folder", folder);

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                { method: "POST", body: cloudForm }
            );

            timers.forEach(clearTimeout);

            if (!cloudRes.ok) {
                const err = await cloudRes.json();
                throw new Error(err?.error?.message ?? "Upload Cloudinary gagal");
            }

            const cloudData = await cloudRes.json();
            const videoUrl: string = cloudData.secure_url;

            setAiProgressPerc(95);
            setAiProgressText("Menyimpan hasil ke server HRD...");

            // Step 3: Save URL to database
            const saveRes = await fetch("/api/interview/save-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl, isFinal: !canRetake }),
            });

            if (!saveRes.ok) {
                const data = await saveRes.json();
                throw new Error(data.error ?? "Gagal menyimpan data");
            }

            const data = await saveRes.json();
            setAiProgressPerc(100);
            setAiProgressText("Selesai! ✓");

            if (data.interview?.isSubmitted) {
                setTimeout(() => router.push("/result"), 600);
            } else {
                setUploading(false);
                setAiProgressText("");
                setAiProgressPerc(0);
            }
        } catch (err: any) {
            timers.forEach(clearTimeout);
            alert(err?.message ?? "Terjadi kesalahan. Coba lagi.");
            setUploading(false);
            setAiProgressText("");
            setAiProgressPerc(0);
        }
    }, [previewUrl, recordedBlob, uploading, canRetake, router]);

    const progressPct = `${(recordingSeconds / MAX_SECONDS) * 100}%`;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold mb-1">Pertanyaan Wawancara</h2>
                    <p className="text-white/60 text-sm">Rekam jawaban Anda. Maksimal 60 detik.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${retakeCount >= MAX_RETAKE ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#151730] border-white/10"}`}>
                        <RefreshCcw className="w-4 h-4" />
                        Retake: {retakeCount}/{MAX_RETAKE}
                    </div>
                    {retakeCount >= MAX_RETAKE && (
                        <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Kesempatan habis
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
                    <VideoOff className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {previewUrl ? (
                    // Preview of recorded video
                    <video
                        key={previewUrl}
                        src={previewUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // Live camera stream
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isRecording ? "opacity-100" : "opacity-40"}`}
                    />
                )}

                {/* Recording indicator */}
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-white font-bold text-sm">
                            {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:
                            {String(recordingSeconds % 60).padStart(2, "0")} / 01:00
                        </span>
                    </div>
                )}

                {/* Start overlay */}
                {!isRecording && !previewUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-3">
                        <button
                            onClick={handleStart}
                            className="bg-blue-600 hover:bg-blue-500 text-white w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 group border-4 border-white/20 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                        >
                            <Video className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </button>
                        <span className="text-white/50 text-sm font-medium">Klik untuk mulai merekam</span>
                    </div>
                )}
            </div>

            {/* Progress bar during recording */}
            {isRecording && (
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                        style={{ width: progressPct }}
                    />
                </div>
            )}

            {/* Action area */}
            <div className="flex flex-col gap-4">
                {/* AI Progress UI */}
                {uploading && (
                    <div className="w-full bg-[#0a0b1e] border border-violet-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(124,58,237,0.15)] flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-violet-300 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                                {aiProgressText}
                            </span>
                            <span className="text-white/50">{aiProgressPerc}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700 ease-out"
                                style={{ width: `${aiProgressPerc}%` }}
                            />
                        </div>
                        <p className="text-xs text-white/40 text-center uppercase tracking-widest font-bold">Mohon jangan tutup halaman ini</p>
                    </div>
                )}

                {/* Buttons */}
                {isRecording && (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold w-full justify-center transition-colors"
                    >
                        <Square className="w-5 h-5" fill="currentColor" /> Akhiri Rekaman
                    </button>
                )}

                {previewUrl && !uploading && (
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={handleRetake}
                            disabled={!canRetake}
                            className="flex-1 btn-ghost flex justify-center items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            {canRetake ? `Rekam Ulang (${MAX_RETAKE - retakeCount} tersisa)` : "Retake Habis"}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={uploading}
                            className="flex-1 btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-center items-center gap-2"
                        >
                            Simpan & Lanjut <Send className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
