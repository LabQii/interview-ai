import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq";

export const dynamic = "force-dynamic";

const CAMERA_PROMPT = `Kamu adalah sistem validasi lingkungan interview profesional.
Analisis gambar dari kamera dan kembalikan HANYA JSON ini:

{
  "face_detected": true/false,
  "face_visible": true/false,
  "background_appropriate": true/false,
  "lighting_good": true/false,
  "overall_passed": true/false,
  "issues": ["masalah 1", "masalah 2"],
  "suggestions": ["saran 1", "saran 2"],
  "message": "pesan singkat untuk peserta"
}

Kriteria LULUS:
- Wajah terdeteksi dan terlihat jelas di kamera
- Background tidak berantakan, tidak ada orang lain, tidak ada konten tidak pantas
- Pencahayaan cukup untuk wajah terlihat

Kriteria GAGAL dan saran yang sesuai:
- Wajah tidak terlihat → "Pastikan wajah Anda berada di depan kamera"
- Background berantakan → "Cari tempat yang lebih rapi atau gunakan virtual background"
- Ada orang lain di background → "Pastikan Anda berada di ruangan yang privat"
- Terlalu gelap → "Cari tempat dengan pencahayaan lebih baik atau nyalakan lampu"`;

export async function POST(req: NextRequest) {
    try {
        const { imageBase64 } = await req.json();
        if (!imageBase64) {
            return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: CAMERA_PROMPT },
                        {
                            type: "image_url",
                            image_url: { url: imageBase64 },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 512,
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const result = JSON.parse(raw);
        return NextResponse.json({ success: true, result });
    } catch (err: any) {
        console.error("Camera analysis error:", err);
        return NextResponse.json(
            { error: err?.message || "Gagal menganalisis kamera" },
            { status: 500 }
        );
    }
}
