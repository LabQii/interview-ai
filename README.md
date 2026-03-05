# HRD Elite - Sistem Tes & Interview AI

Platform asesmen revolusioner berbasis Next.js 14 App Router yang dikhususkan untuk rekrutmen. Dilengkapi dengan timer server-side (anti-cheat), proctoring deteksi perpindahan tab, dan sistem perekam video mandiri untuk AI Interview.

## Fitur Utama

- **Sistem Redeem Code:** Validasi keamanan masuk menggunakan kode unik berbatas waktu.
- **Rules Agreement:** Perlindungan rute di mana kandidat wajib menyetujui NDA/Rules sebelum mengakses tes.
- **Server-based Timer:** Waktu berjalan secara global dan divalidasi pada sisi server (bukan hanya frontend).
- **Anti Pindah Tab:** Sistem tab-switch log yang mencatat dan secara otomatis melakukan auto-submit jika melanggar batas (max 3x).
- **AI Interview:** Perekaman mandiri dengan batasan retake kuota (Maksimal 3 retake) yang terhubung ke Supabase Storage.
- **HRD Dashboard:** Pemantauan progres dan waktu kandidat secara real-time via REST/Server Action dan fitur Force Submit.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Provider:** PostgreSQL via Supabase
- **Storage:** Supabase Storage
- **Styling:** TailwindCSS + Framer Motion
- **State Management:** Zustand
- **Deployment:** Railway-ready (Dockerfile + standalone output)

## Menjalankan Aplikasi

1. Copy env.example ke .env
```sh
cp .env.example .env
```
2. Isi nilai database URL dan token rahasia HRD di `.env`.
3. Jalankan Prisma migrate untuk sinkronisasi schema:
```sh
npx prisma migrate dev
```
4. Jalankan server lokal:
```sh
npm run dev
```

## Dashboard HRD
Silakan buka halaman `/hrd` dan masukkan `HRD_SECRET_KEY` dari `.env` untuk melihat live tracking peserta.
