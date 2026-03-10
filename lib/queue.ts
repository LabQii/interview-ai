import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Parse URL components for BullMQ (uses its own bundled ioredis)
function parseRedisUrl(url: string) {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || "127.0.0.1",
            port: parseInt(parsed.port || "6379"),
            password: parsed.password || undefined,
        };
    } catch {
        return { host: "127.0.0.1", port: 6379 };
    }
}

const connection = parseRedisUrl(REDIS_URL);

// The main analysis queue
export const analysisQueue = new Queue("interview-analysis", { connection });

export type AnalysisJobData = {
    userId: string;
    position: string;
    questions: Array<{
        id: string;
        question: string;
        videoUrl: string;
    }>;
};
