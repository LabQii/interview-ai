import React from "react";

export function Logo({ className = "w-8 h-8", textClassName = "text-xl font-bold" }: { className?: string, textClassName?: string }) {
    return (
        <div className="flex items-center gap-2">
            <img 
                src="/icon.png" 
                alt="Logo" 
                className={`${className} rounded-lg object-contain shadow-sm`}
            />
            <span className={`tracking-tight ${textClassName}`}>Labqii Tech</span>
        </div>
    );
}
