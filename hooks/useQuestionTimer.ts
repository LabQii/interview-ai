"use client";

import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/timerStore";

interface UseQuestionTimerProps {
    duration: number;
    questionId: string;
    onExpire: () => void;
    enabled?: boolean;
}

export function useQuestionTimer({
    duration,
    questionId,
    onExpire,
    enabled = true,
}: UseQuestionTimerProps) {
    const { questionTimerMap, saveQuestionTime } = useTimerStore();

    // Default to duration initially to prevent hydration mismatch flashes, 
    // it will be immediately corrected by the effect.
    const [remaining, setRemaining] = useState(duration);

    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    const remainingRef = useRef(remaining);
    remainingRef.current = remaining;

    useEffect(() => {
        if (!enabled || !questionId) return;

        // Restore saved time or start fresh
        const savedTime = questionTimerMap[questionId];
        const initialTime = (savedTime !== undefined && savedTime > 0) ? savedTime : duration;

        setRemaining(initialTime);
        remainingRef.current = initialTime;

        if (initialTime <= 0) {
            onExpireRef.current();
            return;
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(interval);
                    onExpireRef.current();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            // Save time when leaving this question
            saveQuestionTime(questionId, remainingRef.current);
        };
    }, [questionId, duration, enabled]); // Only re-run when question changes

    return { remaining };
}
