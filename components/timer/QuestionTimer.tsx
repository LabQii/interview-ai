import { Clock } from "lucide-react";

interface QuestionTimerProps {
    remaining: number;
    total: number;
}

export function QuestionTimer({ remaining, total }: QuestionTimerProps) {
    const percentage = Math.max(0, Math.min(100, (remaining / total) * 100));
    const isWarning = remaining <= 10; // last 10 seconds warning

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-white/60 font-medium">
                    <Clock className="w-4 h-4" />
                    Waktu Soal
                </span>
                <span className={`font-mono font-bold ${isWarning ? "text-red-400 animate-pulse" : "text-violet-400"}`}>
                    {remaining} detik
                </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${isWarning ? "bg-red-500" : "bg-violet-500"}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
