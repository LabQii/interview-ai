import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq";

export const dynamic = "force-dynamic";

function buildMicPrompt(rms: number, noiseLabel: string, voiceDetected: boolean, peakRms: number) {
    // Convert raw RMS (Float32Array scale ~0.001–0.1) to amplified display scale for prompt clarity
    const displayRms = Math.min(Math.sqrt(rms) * 300, 100).toFixed(1);
    const displayPeak = Math.min(Math.sqrt(peakRms) * 300, 100).toFixed(1);

    return `Kamu adalah sistem validasi kualitas audio untuk interview online.
Data audio peserta:
- Volume rata-rata (skala 0-100): ${displayRms}
- Volume puncak (skala 0-100): ${displayPeak}
- Noise level terdeteksi: ${noiseLabel} (quiet / moderate / noisy / very_noisy)
- Suara terdeteksi saat peserta bicara: ${voiceDetected} (true/false)

Kembalikan HANYA JSON ini:

{
  "mic_working": true/false,
  "volume_adequate": true/false,
  "environment_quiet": true/false,
  "overall_passed": true/false,
  "issues": ["masalah 1", "masalah 2"],
  "suggestions": ["saran 1", "saran 2"],
  "message": "pesan singkat untuk peserta"
}

Kriteria LULUS (gunakan penilaian yang realistis dan toleran):
- Mikrofon terdeteksi dan merekam suara (voiceDetected = true ATAU volume puncak > 10)
- Volume suara cukup (volume rata-rata > 8 ATAU volume puncak > 15)
- Lingkungan diterima jika noise: quiet, moderate, ATAU noisy — hanya "very_noisy" yang gagal
- Jika voiceDetected = true, anggap mic_working = true
- environment_quiet = true selama noise bukan "very_noisy" (suara ruangan biasa, kipas angin, atau AC normal = LULUS)

Kriteria GAGAL dan saran yang sesuai:
- Mic tidak terdeteksi → "Periksa koneksi mikrofon Anda di pengaturan perangkat"
- Volume terlalu pelan → "Dekatkan mikrofon ke mulut Anda atau naikkan volume mic di pengaturan sistem"
- Noise sangat tinggi (very_noisy saja) → "Pindah ke tempat yang lebih sepi. Hindari tempat umum seperti kafe atau jalan raya"

PENTING: Jangan gagalkan peserta hanya karena suara ruangan biasa seperti kipas, AC, keyboard, atau suara latar ringan. Hanya gagalkan jika lingkungan sangat bising (very_noisy).`;
}

export async function POST(req: NextRequest) {
    try {
        const { rms, noiseLabel, voiceDetected, peakRms } = await req.json();

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: buildMicPrompt(rms ?? 0, noiseLabel ?? "unknown", voiceDetected ?? false, peakRms ?? 0) },
            ],
            response_format: { type: "json_object" },
            max_tokens: 512,
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const result = JSON.parse(raw);
        return NextResponse.json({ success: true, result });
    } catch (err: any) {
        console.error("Mic analysis error:", err);
        return NextResponse.json(
            { error: err?.message || "Gagal menganalisis mikrofon" },
            { status: 500 }
        );
    }
}
