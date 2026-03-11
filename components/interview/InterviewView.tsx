"use client";

import { useState } from "react";
import { VideoRecorder } from "@/components/interview/VideoRecorder";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewQuestion {
    id: string;
    question: string;
    category: string | null;
    order: number;
}

interface InterviewViewProps {
    questions: InterviewQuestion[];
}



export function InterviewView({ questions }: InterviewViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    const handleQuestionComplete = () => {
        if (isLastQuestion) {
            window.location.href = "/result";
        } else {
            setCurrentIndex((i) => i + 1);
        }
    };

    // ── Question Screen ────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            {/* Question progress */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-white/20 to-white/5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
                <span className="text-xs font-bold text-white/40 shrink-0 tabular-nums">
                    {currentIndex + 1} / {totalQuestions}
                </span>
            </div>

            {/* Current question card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative p-6 md:p-10 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/[0.05] to-transparent shadow-[0_8px_32px_rgba(255,255,255,0.05)] overflow-hidden backdrop-blur-xl"
                >
                    {/* Decorative subtle top light */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                    
                    {currentQuestion.category && (
                        <span className="inline-block relative z-10 text-xs font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-5">
                            {currentQuestion.category}
                        </span>
                    )}
                    <h2 className="relative z-10 text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
                        {currentQuestion.question}
                    </h2>
                </motion.div>
            </AnimatePresence>

            {/* VideoRecorder (key forces re-mount per question so state resets) */}
            <VideoRecorder
                key={currentQuestion.id}
                questionId={currentQuestion.id}
                questionIndex={currentIndex}
                isLastQuestion={isLastQuestion}
                onComplete={handleQuestionComplete}
            />
        </div>
    );
}
