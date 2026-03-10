import React from "react";

export function Logo({ className = "w-8 h-8", textClassName = "text-xl font-bold" }: { className?: string, textClassName?: string }) {
    return (
        <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-white ${className}`}>
                <path d="M50 10 L85 50 L50 90 L15 50 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="currentColor" />
            </svg>
            <span className={`tracking-tight ${textClassName}`}>Labqii Tech</span>
        </div>
    );
}
