import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";

export const dynamic = "force-dynamic";

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
    } catch { return { host: "127.0.0.1", port: 6379, maxRetriesPerRequest: null }; }
}

export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId diperlukan" }, { status: 400 });

    try {
        const q = new Queue("interview-analysis", { connection: parseRedisUrl(process.env.REDIS_URL || "redis://localhost:6379") });
        const job = await q.getJob(jobId);

        if (!job) {
            await q.close();
            return NextResponse.json({ state: "unknown" });
        }

        const state = await job.getState();
        const stepStatuses: Record<string, string> = job.data?.stepStatuses ?? {};
        const progress = job.progress as any;

        // Ensure we close the queue connection after we are done getting data
        await q.close();

        // Merge progress data if available
        const merged = typeof progress === "object" && progress !== null
            ? { ...stepStatuses, ...progress }
            : stepStatuses;

        return NextResponse.json({
            state,
            stepStatuses: merged,
            failedReason: job.failedReason,
        });
    } catch (err: any) {
        console.error("Job status error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
