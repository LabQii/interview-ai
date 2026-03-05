import { formatTimer } from "@/lib/timer";
import { Clock } from "lucide-react";

interface GlobalTimerProps {
    remaining: number;
}

export function GlobalTimer({ remaining }: GlobalTimerProps) {
    const isWarning = remaining < 300; // < 5 minutes
    const format = formatTimer(remaining);

    return (
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-colors ${isWarning
                ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                : "bg-[#151730] border-white/10 text-white/90"
            }`}>
            <Clock className={`w-5 h-5 ${isWarning ? "text-red-500" : "text-violet-400"}`} />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                    Sisa Waktu
                </span>
                <span className="font-mono text-xl font-bold leading-none tracking-tight">
                    {format}
                </span>
            </div>
        </div>
    );
}
