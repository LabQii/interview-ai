import { Queue } from "bullmq";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.railway" });

function parseRedisUrl(url: string) {
    const parsed = new URL(url);
    const isUpstash = parsed.hostname.includes("upstash.io");
    return {
        host: parsed.hostname,
        port: parseInt(parsed.port || "6379"),
        password: parsed.password || undefined,
        username: parsed.username || undefined,
        tls: isUpstash ? { rejectUnauthorized: false } : undefined,
        family: isUpstash ? 0 : undefined,
    };
}

const connection = parseRedisUrl(process.env.REDIS_URL || "");
console.log("Connecting to:", connection.host);

const q = new Queue("interview-analysis", { connection });

async function check() {
    const waiting = await q.getWaitingCount();
    const active = await q.getActiveCount();
    const delayed = await q.getDelayedCount();
    const failed = await q.getFailedCount();
    
    console.log(`Queue Stats - Waiting: ${waiting}, Active: ${active}, Delayed: ${delayed}, Failed: ${failed}`);
    
    const jobs = await q.getWaiting();
    if (jobs.length > 0) {
        console.log("First Waiting Job Data:", jobs[0].id, jobs[0].name);
    }
    
    await q.close();
}

check().catch(console.error);
