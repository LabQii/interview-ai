"use client";

import { useEffect } from "react";

export function usePreventBrowserNavigation() {
    useEffect(() => {
        // Push an empty state immediately when the component mounts
        // This ensures there's a forward state to "fall back" into when the user hits back.
        window.history.pushState({ locked: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // When the user clicks the back button, the browser pops the current state.
            // We forcefully push a new state instantly to keep them on the exact same page!
            window.history.pushState({ locked: true }, "", window.location.href);

            // Show a visual warning
            alert("PERINGATAN: Anda tidak diperbolehkan menggunakan tombol Kembali atau Maju pada browser selama ujian berlangsung. Soal harus dikerjakan secara berurutan.");
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Anda sedang dalam ujian, yakin ingin keluar?";
            return "Anda sedang dalam ujian, yakin ingin keluar?";
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);
}
