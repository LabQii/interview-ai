"use client";

import { useRef, useState, useCallback } from "react";
import { useInterviewStore } from "@/store/interviewStore";

const MAX_RECORDING_SECONDS = 60;

export function useVideoRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        isRecording,
        setRecording,
        setBlob,
        tickRecording,
        setRecordingSeconds,
        recordingSeconds,
        resetRecording,
        totalRetake,
        maxRetake,
    } = useInterviewStore();

    const startRecording = useCallback(async (onAutoStop?: () => void) => {
        setError(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            streamRef.current = stream;

            // Find best supported mimeType (important for Safari/iOS compatibility)
            const types = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm",
                "video/mp4;codecs=avc1",
                "video/mp4"
            ];

            let selectedType = "";
            for (const t of types) {
                if (MediaRecorder.isTypeSupported(t)) {
                    selectedType = t;
                    break;
                }
            }

            const recorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const mime = selectedType ? selectedType.split(';')[0] : "video/webm";
                const blob = new Blob(chunksRef.current, { type: mime });
                setBlob(blob);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                stream.getTracks().forEach((t) => t.stop());
            };

            recorder.start(1000); // collect chunks every 1 second
            setRecording(true);
            setRecordingSeconds(0);

            // Auto-stop after 60 seconds
            timerRef.current = setInterval(() => {
                tickRecording();
            }, 1000);

            setTimeout(() => {
                stopRecording();
                onAutoStop?.();
            }, MAX_RECORDING_SECONDS * 1000);
        } catch (err) {
            setError("Gagal mengakses kamera/mikrofon. Pastikan izin telah diberikan.");
            console.error("Recording error:", err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current?.state !== "inactive") {
            mediaRecorderRef.current?.stop();
        }
        setRecording(false);
    }, []);

    const cancelRecording = useCallback(() => {
        stopRecording();
        resetRecording();
        setPreviewUrl(null);
        chunksRef.current = [];
    }, [stopRecording, resetRecording]);

    const canRetake = totalRetake < maxRetake;

    return {
        isRecording,
        previewUrl,
        recordingSeconds,
        error,
        canRetake,
        totalRetake,
        maxRetake,
        startRecording,
        stopRecording,
        cancelRecording,
        streamRef,
    };
}
