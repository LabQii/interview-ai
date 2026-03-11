"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Video, VideoOff, Square, RefreshCcw, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { saveVideoDB, getVideoDB, deleteVideoDB } from "@/lib/indexeddb";

const MAX_RETAKE = 3;
const MAX_SECONDS = 60;

const AI_STEPS_CONFIG = [
    { id: "upload", label: "Mengunggah video sistem", prog: 15 },
    { id: "fetch", label: "Menyiapkan AI", prog: 30 },
    { id: "audio", label: "Ekstraksi audio", prog: 50 },
    { id: "stt", label: "Konversi ke teks (Whisper)", prog: 70 },
    { id: "ai", label: "Analisis kandidat (Groq)", prog: 90 },
    { id: "save", label: "Finalisasi hasil", prog: 100 },
];

interface VideoRecorderProps {
    /** ID of the interview question being answered (for per-question save) */
    questionId?: string;
    /** 0-based index of this question in the interview session */
    questionIndex?: number;
    /** Whether this is the last question */
    isLastQuestion?: boolean;
    /** Called after a successful save — tells the parent to advance */
    onComplete?: () => void;
}

export function VideoRecorder({
    questionId,
    questionIndex = 0,
    isLastQuestion = false,
    onComplete,
}: VideoRecorderProps) {
    const showToast = useUIStore((state) => state.showToast);

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

    const [uploading, setUploading] = useState(false);
    const [aiProgressPerc, setAiProgressPerc] = useState(0);

    const [uploadJobId, setUploadJobId] = useState<string | null>(null);
    const [jobStatuses, setJobStatuses] = useState<Record<string, string>>({});
    const [analysisDone, setAnalysisDone] = useState(false);
    const [isRestoringData, setIsRestoringData] = useState(true);

    const canRetake = retakeCount < MAX_RETAKE;

    // Restore from IndexedDB on initial load
    useEffect(() => {
        if (!questionId) return;
        let isMounted = true;

        getVideoDB(questionId).then((blob) => {
            if (isMounted && blob) {
                const url = URL.createObjectURL(blob);
                setRecordedBlob(blob);
                setPreviewUrl(url);
            }
        }).finally(() => {
            if (isMounted) setIsRestoringData(false);
        });

        return () => { isMounted = false; };
    }, [questionId]);

    // Polling effect for job status
    useEffect(() => {
        if (!uploadJobId || analysisDone) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/interview/job-status?jobId=${uploadJobId}`);
                if (!res.ok) return;
                const data = await res.json();

                const newStatuses = { upload: "done", ...data.stepStatuses };
                setJobStatuses(newStatuses);

                let currentStepIndex = 0;
                for (let i = 0; i < AI_STEPS_CONFIG.length; i++) {
                    const stepId = AI_STEPS_CONFIG[i].id;
                    const status = newStatuses[stepId];
                    if (status === "done" || status === "running") {
                        currentStepIndex = i;
                    }
                }

                const step = AI_STEPS_CONFIG[currentStepIndex];
                let perc = step.prog;
                if (newStatuses[step.id] === "running") {
                    perc = step.prog - Math.floor(step.prog * 0.1);
                }
                setAiProgressPerc(perc);

                if (data.state === "completed" || data.state === "failed") {
                    if (data.state === "completed") {
                        setJobStatuses({ ...newStatuses, save: "done" });
                        setAiProgressPerc(100);
                        setAnalysisDone(true);
                    } else {
                        setError("Gagal menganalisis video. Silakan coba lagi.");
                        setUploading(false);
                        setUploadJobId(null);
                    }
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [uploadJobId, analysisDone]);

    useEffect(() => {
        if (videoRef.current) {
            if (previewUrl) {
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

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

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
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = null;

                // Persist video securely for refresh-safety
                if (questionId) saveVideoDB(questionId, blob).catch(console.error);
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

            autoStopRef.current = setTimeout(() => stopStream(), MAX_SECONDS * 1000);
        } catch (err) {
            setError("Gagal mengakses kamera/mikrofon. Pastikan izin telah diberikan.");
            console.error(err);
        }
    }, [stopStream]);

    const handleStop = useCallback(() => {
        stopStream();
    }, [stopStream]);

    const handleRetake = useCallback(async () => {
        if (!canRetake) return;
        stopStream();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setRecordedBlob(null);
        chunksRef.current = [];
        setRetakeCount(c => c + 1);
        if (questionId) await deleteVideoDB(questionId).catch(console.error);
    }, [canRetake, previewUrl, stopStream, questionId]);

    const handleSubmit = useCallback(async () => {
        if (!previewUrl || !recordedBlob || uploading) return;
        setUploading(true);
        setAnalysisDone(false);
        setJobStatuses({ upload: "running" });
        setAiProgressPerc(AI_STEPS_CONFIG[0].prog - 5);

        try {
            // Step 1: Get signed upload params from server
            const sigRes = await fetch("/api/interview/cloudinary-signature");
            if (!sigRes.ok) throw new Error("Gagal mendapatkan parameter upload");
            const { timestamp, signature, folder, cloudName, apiKey } = await sigRes.json();

            // Step 2: Upload directly to Cloudinary from browser
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

            if (!cloudRes.ok) {
                const err = await cloudRes.json();
                throw new Error(err?.error?.message ?? "Upload Cloudinary gagal");
            }

            const cloudData = await cloudRes.json();
            const videoUrl: string = cloudData.secure_url;

            setJobStatuses({ upload: "done" });
            setAiProgressPerc(AI_STEPS_CONFIG[0].prog);

            // Step 3: Save URL to database and enqueue job
            const saveRes = await fetch("/api/interview/save-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl,
                    questionId,
                    questionIndex,
                    isFinal: isLastQuestion,
                }),
            });

            if (!saveRes.ok) {
                const data = await saveRes.json();
                throw new Error(data.error ?? "Gagal menyimpan data");
            }

            const data = await saveRes.json();

            // Clean up stored video now that it's successfully sent
            if (questionId) await deleteVideoDB(questionId).catch(console.error);

            // Step 4: If it's the last question, skip polling and complete immediately
            if (isLastQuestion) {
                setUploading(false);
                setAnalysisDone(true);
                if (onComplete) onComplete();
                return;
            }

            // Step 5: Start polling for non-final questions
            setUploadJobId(data.jobId);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
            showToast(errorMessage, "error", 5000);
            setUploading(false);
            setAiProgressPerc(0);
            setJobStatuses({});
        }
    }, [previewUrl, recordedBlob, uploading, isLastQuestion, questionId, questionIndex, showToast]);

    const progressPct = `${(recordingSeconds / MAX_SECONDS) * 100}%`;

    if (isRestoringData) {
        return (
            <div className="w-full h-80 flex flex-col items-center justify-center bg-black rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
                <span className="text-white/40 text-sm font-medium">Memulihkan rekaman sebelumnya...</span>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold mb-1">Rekam Jawaban</h2>
                    <p className="text-white/60 text-sm">Rekam jawaban Anda. Maksimal 60 detik.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${retakeCount >= MAX_RETAKE ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-elevated border-white/10"}`}>
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
                    <video
                        key={previewUrl}
                        src={previewUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
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
                            className="bg-white/10 hover:bg-white/20 text-white w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 group border-4 border-white/20 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
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
                    <div className="w-full bg-background border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm font-bold border-b border-white/5 pb-4 mb-2">
                            <span className="text-emerald-400 flex items-center gap-2">
                                {!analysisDone && <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />}
                                {analysisDone ? "Selesai Menganalisis" : "AI Sedang Menganalisis"}
                            </span>
                            <span className="text-emerald-400 font-mono text-lg">{aiProgressPerc}%</span>
                        </div>

                        {/* List of progress steps */}
                        <div className="flex flex-col gap-3">
                            {AI_STEPS_CONFIG.map((step) => {
                                const status = jobStatuses[step.id] || "pending";
                                const isDone = status === "done";
                                const isRunning = status === "running";

                                return (
                                    <div key={step.id} className={`flex items-center justify-between text-sm font-medium transition-all duration-300 ${isDone ? "text-white" : isRunning ? "text-emerald-400" : "text-white/30"}`}>
                                        <div className="flex items-center gap-3">
                                            {isDone ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : isRunning ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-white/20" />
                                            )}
                                            <span>{step.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 ease-out"
                                style={{ width: `${aiProgressPerc}%` }}
                            />
                        </div>

                        {!analysisDone ? (
                            <p className="text-xs text-emerald-500/70 text-center uppercase tracking-widest font-bold mt-2">Mohon jangan tutup halaman ini</p>
                        ) : (
                            <button
                                onClick={() => {
                                    setUploading(false);
                                    setUploadJobId(null);
                                    setAnalysisDone(false);
                                    setJobStatuses({});
                                    if (onComplete) onComplete();
                                }}
                                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLastQuestion ? "Selesai" : "Soal Selanjutnya"} <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Stop recording button */}
                {isRecording && (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold w-full justify-center transition-colors"
                    >
                        <Square className="w-5 h-5" fill="currentColor" /> Akhiri Rekaman
                    </button>
                )}

                {/* Preview actions */}
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
                            className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                        >
                            {isLastQuestion ? (
                                <>Simpan & Selesai <CheckCircle2 className="w-5 h-5" /></>
                            ) : (
                                <>Simpan & Lanjut <ChevronRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
