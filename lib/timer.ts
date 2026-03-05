/**
 * Server-side timer logic
 * All timer calculations are server-based to prevent client manipulation
 */

/**
 * Calculate remaining seconds for global test timer
 * Based on startedAt stored in database + duration from redeem code
 */
export function calculateRemainingTime(
    startedAt: Date,
    durationSeconds: number
): number {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const remaining = durationSeconds - elapsed;
    return Math.max(0, remaining);
}

/**
 * Check if test session has expired
 */
export function isTestExpired(
    startedAt: Date,
    durationSeconds: number
): boolean {
    return calculateRemainingTime(startedAt, durationSeconds) <= 0;
}

/**
 * Format seconds to MM:SS display format
 */
export function formatTimer(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Calculate elapsed seconds since a given date
 */
export function calculateElapsedTime(startedAt: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - startedAt.getTime()) / 1000);
}

/**
 * Get the server timestamp – used as source of truth
 */
export function getServerTimestamp(): Date {
    return new Date();
}
