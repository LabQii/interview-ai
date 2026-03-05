"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/store/timerStore";
import { logTabSwitch } from "@/server/actions/tabSwitch";

const SYNC_INTERVAL_MS = 30000; // sync with server every 30 seconds

interface UseGlobalTimerProps {
    initialSeconds: number;
    onExpire: () => void;
    onTabSwitch?: (count: number, shouldAutoSubmit: boolean) => void;
    phase?: "test" | "interview";
    enabled?: boolean;
}

export function useGlobalTimer({
    initialSeconds,
    onExpire,
    onTabSwitch,
    phase = "test",
    enabled = true,
}: UseGlobalTimerProps) {
    const { globalRemaining, setGlobalRemaining, tickGlobal, globalRunning, startGlobal } =
        useTimerStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize
    useEffect(() => {
        if (enabled && initialSeconds > 0) {
            setGlobalRemaining(initialSeconds);
            startGlobal();
        }
    }, [initialSeconds, enabled]);

    // Countdown tick
    useEffect(() => {
        if (!enabled || !globalRunning) return;

        intervalRef.current = setInterval(() => {
            tickGlobal();
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [globalRunning, enabled, tickGlobal]);

    // Watch for expiry
    useEffect(() => {
        if (globalRemaining <= 0 && enabled) {
            // Prevent premature expiry: if initialSeconds > 0 but globalRemaining is 0 and we haven't even started running yet, 
            // it means we are in the first render tick before Zustand has synced the initial time.
            if (initialSeconds > 0 && globalRemaining === 0 && !globalRunning) {
                return;
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
            onExpire();
        }
    }, [globalRemaining, enabled, onExpire, initialSeconds, globalRunning]);

    // Sync with server periodically
    useEffect(() => {
        if (!enabled) return;
        syncIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch("/api/timer");
                const data = await res.json();
                if (data.remaining !== undefined) {
                    setGlobalRemaining(data.remaining);
                }
            } catch (e) {
                console.error("Timer sync error:", e);
            }
        }, SYNC_INTERVAL_MS);

        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        };
    }, [enabled]);

    // Tab visibility detection
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "hidden") {
                const result = await logTabSwitch(phase);
                if (result && "switchCount" in result) {
                    onTabSwitch?.(result.switchCount ?? 0, result.shouldAutoSubmit ?? false);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [enabled, phase, onTabSwitch]);

    return { remaining: globalRemaining };
}
