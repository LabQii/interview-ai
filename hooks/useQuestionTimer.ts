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
    // Start with full duration for SSR hydration matches
    const [remaining, setRemaining] = useState(duration);
    
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    useEffect(() => {
        if (!enabled || !questionId) return;

        const storageKey = `timer_endTime_${questionId}`;
        const now = Date.now();
        
        // 1. Determine the end time
        let endTime = parseInt(localStorage.getItem(storageKey) || "0", 10);
        
        // If no valid end time exists in storage, calculate a new one
        if (!endTime || endTime <= now) {
            endTime = now + duration * 1000;
            localStorage.setItem(storageKey, endTime.toString());
        }

        // 2. Initial calculation
        const initialRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setRemaining(initialRemaining);

        if (initialRemaining <= 0) {
            onExpireRef.current();
            return;
        }

        // 3. Tick interval
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setRemaining(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                onExpireRef.current();
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [questionId, duration, enabled]);

    // Cleanup helper (if needed globally, but usually it naturally expires)
    const clearSavedTime = () => {
        if (questionId) localStorage.removeItem(`timer_endTime_${questionId}`);
    };

    return { remaining, clearSavedTime };
}
