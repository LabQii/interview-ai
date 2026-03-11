import { Queue } from "bullmq";

// No dotenv needed for Vercel/Next.js; it handles env vars automatically.
// The .env.railway fallback is only for the standalone worker, not the Next.js API.
const REDIS_URL = process.env.REDIS_URL;

// Parse URL components for BullMQ (uses its own bundled ioredis)
function parseRedisUrl(url: string | undefined) {
    if (!url) {
        throw new Error("REDIS_URL environment variable is missing. Please add it in Vercel Dashboard.");
    }
    
    try {
        const parsed = new URL(url);
        const isUpstash = parsed.hostname.includes("upstash.io");
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || "6379"),
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            tls: parsed.protocol === "rediss:" || isUpstash ? { rejectUnauthorized: false } : undefined,
            family: isUpstash ? 0 : undefined,
            maxRetriesPerRequest: null,
        };
    } catch (err: any) {
        throw new Error(`REDIS_URL is invalid: ${err.message}. Value provided: ${url}`);
    }
}

// Lazy singleton — only instantiated at runtime, not at build time
let _analysisQueue: Queue | null = null;

export function getAnalysisQueue(): Queue {
    if (!_analysisQueue) {
        const connection = parseRedisUrl(REDIS_URL);
        _analysisQueue = new Queue("interview-analysis", { connection });
    }
    return _analysisQueue;
}

// Keep backward-compatible named export as a getter alias
export const analysisQueue = {
    add: (...args: Parameters<Queue["add"]>) => getAnalysisQueue().add(...args),
};

export type AnalysisJobData = {
    userId: string;
    position: string;
    questions: Array<{
        id: string;
        question: string;
        videoUrl: string;
    }>;
};
