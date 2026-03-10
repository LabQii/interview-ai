"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BlockNavigation() {
    const pathname = usePathname();

    useEffect(() => {
        // Run only in browser
        if (typeof window === "undefined") return;

        // Push an empty state initially to have a history entry to pop back to
        window.history.pushState(null, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // When user tries to go back/forward, push the current state again
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [pathname]);

    return null; // This component doesn't render anything visually
}
