import { Queue } from "bullmq";

import * as dotenv from "dotenv";

dotenv.config();
if (!process.env.REDIS_URL) {
    dotenv.config({ path: ".env.railway" });
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Parse URL components for BullMQ (uses its own bundled ioredis)
function parseRedisUrl(url: string) {
    try {
        const parsed = new URL(url);
        const isUpstash = parsed.hostname.includes("upstash.io");
        return {
            host: parsed.hostname || "127.0.0.1",
            port: parseInt(parsed.port || "6379"),
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            tls: parsed.protocol === "rediss:" || isUpstash ? { rejectUnauthorized: false } : undefined,
            family: isUpstash ? 0 : undefined,
            maxRetriesPerRequest: null,
        };
    } catch {
        return { host: "127.0.0.1", port: 6379, maxRetriesPerRequest: null };
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
