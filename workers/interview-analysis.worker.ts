#!/usr/bin/env tsx
/**
 * Interview Analysis Worker
 * Run with: npx tsx workers/interview-analysis.worker.ts
 *
 * Requires:
 *  - Redis running (redis-server)
 *  - ffmpeg installed (brew install ffmpeg)
 *  - whisper installed (pip install openai-whisper)
 */

import { Worker, Job } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function parseRedisUrl(url: string | undefined) {
    if (!url) {
        throw new Error("REDIS_URL is not set. Ensure .env.railway is loaded correctly.");
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
            family: isUpstash ? 0 : undefined, // Force IPv4/IPv6 resolution for Upstash
            maxRetriesPerRequest: null, // Required by BullMQ for Upstash
        };
    } catch (err: any) { 
        throw new Error(`REDIS_URL invalid: ${err.message}`); 
    }
}

const connection = parseRedisUrl(process.env.REDIS_URL);

const STEP_IDS = ["fetch", "audio", "stt", "ai", "save"] as const;
type StepId = typeof STEP_IDS[number];

async function setStep(job: Job, step: StepId, status: "running" | "done" | "error") {
    const current = (typeof job.progress === "object" && job.progress !== null) ? job.progress as Record<string, string> : {};
    await job.updateProgress({ ...current, [step]: status });
}

function buildAnalysisPrompt(position: string, question: string, transcript: string) {
    return `Kamu adalah AI evaluator rekrutmen profesional yang berpengalaman.

Konteks:
- Posisi yang dilamar: ${position}
- Pertanyaan interview: "${question}"

Transcript jawaban kandidat:
"""${transcript}"""

Kembalikan HANYA JSON ini tanpa teks lain:

{
  "resume": "Ringkasan eksekutif 3-4 kalimat. Tulis objektif dan profesional tentang inti jawaban dan relevansi kandidat.",
  "summary": "Ringkasan 2-3 kalimat yang menangkap poin utama jawaban kandidat.",
  "highlights": [
    "Poin kuat spesifik dari jawaban",
    "Contoh konkret atau pengalaman yang disebutkan",
    "Skill atau kompetensi yang teridentifikasi"
  ],
  "weaknesses": [
    "Area yang kurang dibahas atau bisa diperdalam"
  ],
  "communication_score": 0,
  "communication_reason": "Alasan penilaian berdasarkan struktur dan kejelasan jawaban",
  "relevance_score": 0,
  "relevance_reason": "Seberapa relevan jawaban dengan pertanyaan dan posisi ${position}",
  "confidence_score": 0,
  "confidence_reason": "Berdasarkan ketegasan, kelengkapan, dan struktur kalimat dalam transcript",
  "overall_score": 0,
  "recommendation": "Sangat Direkomendasikan / Direkomendasikan / Perlu Pertimbangan / Tidak Direkomendasikan",
  "recommendation_reason": "Alasan singkat dalam 1-2 kalimat"
}

Semua skor dalam skala 1-10.
Berikan penilaian objektif dan konstruktif.
Jika transcript kosong atau tidak jelas, beri skor rendah dan catat di weaknesses.`;
}

async function downloadVideo(videoUrl: string, destPath: string) {
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
}

// Use ffmpeg from system PATH. When running locally on macOS, the custom EXEC_ENV ensures
// homebrew paths are checked. On Railway/Linux, it will just use the standard PATH.
const FFMPEG_PATH = "ffmpeg";

// Env that ensures Homebrew is in PATH for ffmpeg when running locally on macOS
const EXEC_ENV = {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`,
};

async function extractAudio(videoPath: string, audioPath: string) {
    await execAsync(`${FFMPEG_PATH} -y -i "${videoPath}" -ar 16000 -ac 1 "${audioPath}"`, { env: EXEC_ENV });
}

async function transcribeAudio(audioPath: string): Promise<string> {
    const { createReadStream } = await import("fs");
    const transcription = await groq.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: "whisper-large-v3-turbo",
        language: "id", // Bahasa Indonesia
        response_format: "text",
    });
    return transcription as unknown as string; // The Groq SDK returns a string when response_format is "text", though types say otherwise
}

async function analyzeWithGroq(position: string, question: string, transcript: string) {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildAnalysisPrompt(position, question, transcript) }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
    });
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
}

const worker = new Worker(
    "interview-analysis",
    async (job: Job) => {
        const { userId, position, questions } = job.data;
        console.log(`[Worker] Starting job ${job.id} for user ${userId}`);

        // Step 1 — Fetch
        await setStep(job, "fetch", "running");
        console.log("[Worker] Step: fetch");
        // (videos are already on Cloudinary — we just prepare)
        await new Promise(r => setTimeout(r, 500));
        await setStep(job, "fetch", "done");

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.videoUrl) continue;

            const tmpDir = os.tmpdir();
            const videoPath = path.join(tmpDir, `interview_${userId}_q${i}.webm`);
            const audioPath = path.join(tmpDir, `interview_${userId}_q${i}.wav`);

            try {
                // Step 2 — Download + extract audio
                if (i === 0) await setStep(job, "audio", "running");
                console.log(`[Worker] Downloading video for question ${i + 1}`);
                await downloadVideo(q.videoUrl, videoPath);
                await extractAudio(videoPath, audioPath);
                await unlink(videoPath).catch(() => { });
                if (i === questions.length - 1) await setStep(job, "audio", "done");

                // Step 3 — Whisper STT
                if (i === 0) await setStep(job, "stt", "running");
                console.log(`[Worker] Transcribing question ${i + 1}`);
                let transcript = "";
                try {
                    transcript = await transcribeAudio(audioPath);
                } catch (whisperErr) {
                    console.warn("[Worker] Whisper failed, using empty transcript:", whisperErr);
                }
                await unlink(audioPath).catch(() => { });
                if (i === questions.length - 1) await setStep(job, "stt", "done");

                // Step 4 — Groq analysis
                if (i === 0) await setStep(job, "ai", "running");
                console.log(`[Worker] Analyzing with Groq for question ${i + 1}`);
                const analysis = await analyzeWithGroq(position, q.question, transcript || "(tidak ada transkrip)");

                // Step 5 — Save to DB
                if (i === 0) await setStep(job, "save", "running");
                await prisma.interviewAnalysis.create({
                    data: {
                        userId,
                        questionId: q.id,
                        videoUrl: q.videoUrl,
                        transcript,
                        aiResume: analysis.resume,
                        aiSummary: analysis.summary,
                        aiHighlights: analysis.highlights ?? [],
                        aiWeaknesses: analysis.weaknesses ?? [],
                        communicationScore: analysis.communication_score,
                        relevanceScore: analysis.relevance_score,
                        confidenceScore: analysis.confidence_score,
                        overallScore: analysis.overall_score,
                        recommendation: analysis.recommendation,
                        recommendationReason: analysis.recommendation_reason,
                        status: "completed",
                    },
                });
                console.log(`[Worker] Saved analysis for question ${i + 1}`);

                if (i === questions.length - 1) {
                    await setStep(job, "ai", "done");
                    await setStep(job, "save", "done");
                }
            } catch (err) {
                console.error(`[Worker] Error processing question ${i + 1}:`, err);
                await unlink(videoPath).catch(() => { });
                await unlink(audioPath).catch(() => { });
                // Mark current step as error
                await setStep(job, "ai", "error");
                throw err;
            }
        }

        console.log(`[Worker] Job ${job.id} completed.`);
    },
    {
        connection,
        concurrency: 2,
    }
);

worker.on("completed", (job) => console.log(`[Worker] ✓ Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message));

console.log("[Worker] 🚀 Interview Analysis Worker started. Waiting for jobs...");
