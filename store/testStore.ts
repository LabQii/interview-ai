import { create } from "zustand";

interface TestState {
    currentIndex: number;
    answers: Record<string, string>;
    tabSwitchCount: number;
    isSubmitted: boolean;
    questions: Array<{
        id: string;
        question: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        duration: number;
    }>;

    setQuestions: (questions: TestState["questions"]) => void;
    setAnswer: (questionId: string, answer: string) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    goToQuestion: (index: number) => void;
    incrementTabSwitch: () => void;
    setSubmitted: (val: boolean) => void;
    setInitialAnswers: (answers: Record<string, string>) => void;
}

export const useTestStore = create<TestState>((set) => ({
    currentIndex: 0,
    answers: {},
    tabSwitchCount: 0,
    isSubmitted: false,
    questions: [],

    setQuestions: (questions) => set({ questions }),
    setAnswer: (questionId, answer) =>
        set((state) => ({
            answers: { ...state.answers, [questionId]: answer },
        })),
    nextQuestion: () =>
        set((state) => ({
            currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
        })),
    prevQuestion: () =>
        set((state) => ({
            currentIndex: Math.max(state.currentIndex - 1, 0),
        })),
    goToQuestion: (index) => set({ currentIndex: index }),
    incrementTabSwitch: () =>
        set((state) => ({ tabSwitchCount: state.tabSwitchCount + 1 })),
    setSubmitted: (val) => set({ isSubmitted: val }),
    setInitialAnswers: (answers) => set({ answers }),
}));
