import { create } from "zustand";

interface InterviewState {
    totalRetake: number;
    maxRetake: number;
    isRecording: boolean;
    isSubmitted: boolean;
    recordedBlob: Blob | null;
    videoUrls: string[];
    recordingSeconds: number; // current recording duration

    incrementRetake: () => void;
    setRecording: (val: boolean) => void;
    setBlob: (blob: Blob | null) => void;
    setSubmitted: (val: boolean) => void;
    addVideoUrl: (url: string) => void;
    setRecordingSeconds: (s: number) => void;
    tickRecording: () => void;
    resetRecording: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
    totalRetake: 0,
    maxRetake: 3,
    isRecording: false,
    isSubmitted: false,
    recordedBlob: null,
    videoUrls: [],
    recordingSeconds: 0,

    incrementRetake: () =>
        set((state) => ({ totalRetake: state.totalRetake + 1 })),
    setRecording: (val) => set({ isRecording: val }),
    setBlob: (blob) => set({ recordedBlob: blob }),
    setSubmitted: (val) => set({ isSubmitted: val }),
    addVideoUrl: (url) =>
        set((state) => ({ videoUrls: [...state.videoUrls, url] })),
    setRecordingSeconds: (s) => set({ recordingSeconds: s }),
    tickRecording: () =>
        set((state) => ({ recordingSeconds: state.recordingSeconds + 1 })),
    resetRecording: () =>
        set({ recordedBlob: null, isRecording: false, recordingSeconds: 0 }),
}));
