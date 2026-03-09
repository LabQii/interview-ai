"use client";

import { useEffect, useState } from "react";
import { Users, Search, ChevronRight, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { formatTimer } from "@/lib/timer";

export default function AdminDashboard() {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/admin/participants")
            .then(res => res.json())
            .then(data => {
                if (data.success) setParticipants(data.participants);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = participants.filter(p =>
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.testSession?.redeemCode?.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div className="p-8 animate-pulse text-white/50">Memuat data peserta...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
                    <p className="text-white/50 text-sm">Monitoring hasil ujian dan wawancara kandidat.</p>
                </div>

                <div className="flex gap-4">
                    <div className="card px-5 py-3 flex flex-col items-center min-w-[120px]">
                        <span className="text-2xl font-bold text-blue-400">{participants.length}</span>
                        <span className="text-[10px] font-bold tracking-widest text-white/40">TOTAL KANDIDAT</span>
                    </div>
                </div>
            </div>

            <div className="card p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" /> Daftar Peserta
                    </h2>

                    <div className="relative w-full md:w-auto min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Cari nama atau kode ujian..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white/5 text-xs text-white/50 tracking-widest border-b border-white/10">
                                <th className="p-4 font-semibold uppercase">Nama</th>
                                <th className="p-4 font-semibold uppercase">Kode Ujian</th>
                                <th className="p-4 font-semibold uppercase">Posisi</th>
                                <th className="p-4 font-semibold uppercase text-center">Skor Ujian</th>
                                <th className="p-4 font-semibold uppercase text-center">AI Score</th>
                                <th className="p-4 font-semibold uppercase text-right">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filtered.map(p => {
                                const testScore = p.testSession?.score;
                                const aiScore = p.interview?.aiScore;
                                const code = p.testSession?.redeemCode || p.redeemCode?.code || "-";
                                const pos = p.testSession?.position || p.redeemCode?.position || "-";

                                return (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 font-medium text-white">{p.name || <span className="text-white/30 italic">Anonim ({p.id.split('-')[0]})</span>}</td>
                                        <td className="p-4 font-mono text-blue-300">{code}</td>
                                        <td className="p-4 text-white/70">{pos}</td>
                                        <td className="p-4 text-center">
                                            {testScore !== undefined && testScore !== null ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${testScore >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {testScore}
                                                </span>
                                            ) : p.testSession?.startedAt ? (
                                                <span className="text-white/30 text-xs">Sedang Mengerjakan</span>
                                            ) : (
                                                <span className="text-white/30 text-xs">Belum Mulai</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {aiScore !== undefined && aiScore !== null ? (
                                                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 text-xs font-bold">{aiScore.toFixed(1)}</span>
                                            ) : (
                                                <span className="text-white/30">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/admin/participants/${p.id}`}
                                                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                Lihat <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/40 border-b border-white/5">
                                        Tidak ada peserta yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
