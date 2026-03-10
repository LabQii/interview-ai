import { create } from "zustand";

export type ToastType = "success" | "warning" | "error" | "info";

interface ToastState {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface UIStore {
    toasts: ToastState[];
    confirmModal: ConfirmState;

    // Actions
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;

    showConfirm: (
        title: string,
        message: string,
        onConfirm: () => void,
        onCancel?: () => void
    ) => void;
    closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    toasts: [],
    confirmModal: {
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    },

    showToast: (message, type = "warning", duration = 3500) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));

        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, duration);
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    showConfirm: (title, message, onConfirm, onCancel) =>
        set({
            confirmModal: {
                isOpen: true,
                title,
                message,
                onConfirm,
                onCancel,
            },
        }),

    closeConfirm: () =>
        set((state) => ({
            confirmModal: {
                ...state.confirmModal,
                isOpen: false,
            },
        })),
}));
