import { NextRequest, NextResponse } from "next/server";
import { getAnalysisQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId diperlukan" }, { status: 400 });

    try {
        const q = getAnalysisQueue();
        const job = await q.getJob(jobId);

        if (!job) {
            return NextResponse.json({ state: "unknown" });
        }

        const state = await job.getState();
        const stepStatuses: Record<string, string> = job.data?.stepStatuses ?? {};
        const progress = job.progress as any;

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
