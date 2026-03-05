import { create } from "zustand";

interface TimerState {
    // Global test timer
    globalRemaining: number;
    globalRunning: boolean;

    // Per-question timer
    questionRemaining: number;
    questionRunning: boolean;
    questionDuration: number;

    // Per-question time persistence — saves remaining seconds per questionId
    questionTimerMap: Record<string, number>;

    // Global timer actions
    setGlobalRemaining: (seconds: number) => void;
    startGlobal: () => void;
    stopGlobal: () => void;
    tickGlobal: () => void;

    // Question timer actions
    setQuestionTimer: (duration: number) => void;
    startQuestion: () => void;
    stopQuestion: () => void;
    tickQuestion: () => void;
    resetQuestion: (duration: number) => void;

    // Persist remaining time for a specific question
    saveQuestionTime: (questionId: string, remaining: number) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
    globalRemaining: 0,
    globalRunning: false,
    questionRemaining: 0,
    questionRunning: false,
    questionDuration: 60,
    questionTimerMap: {},

    setGlobalRemaining: (seconds) => set({ globalRemaining: seconds }),
    startGlobal: () => set({ globalRunning: true }),
    stopGlobal: () => set({ globalRunning: false }),
    tickGlobal: () =>
        set((state) => ({
            globalRemaining: Math.max(0, state.globalRemaining - 1),
        })),

    setQuestionTimer: (duration) =>
        set({ questionRemaining: duration, questionDuration: duration }),
    startQuestion: () => set({ questionRunning: true }),
    stopQuestion: () => set({ questionRunning: false }),
    tickQuestion: () =>
        set((state) => ({
            questionRemaining: Math.max(0, state.questionRemaining - 1),
        })),
    resetQuestion: (duration) =>
        set({ questionRemaining: duration, questionDuration: duration, questionRunning: false }),

    saveQuestionTime: (questionId, remaining) =>
        set((state) => ({
            questionTimerMap: { ...state.questionTimerMap, [questionId]: remaining },
        })),
}));
