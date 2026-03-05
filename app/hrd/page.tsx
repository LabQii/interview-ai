"use client";

import { useEffect, useState } from "react";
import { Users, Activity, StopCircle, RefreshCcw, Search, Clock, ShieldAlert } from "lucide-react";
import { formatTimer } from "@/lib/timer";

interface Participant {
    id: string;
    name: string | null;
    position: string;
    score: number | null;
    tabSwitchCount: number;
    isTestSubmitted: boolean;
    isInterviewSubmitted: boolean;
    remainingTime: number;
    startedAt: string | null;
}

export default function HRDDashboard() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");
    const [search, setSearch] = useState("");

    const fetchParticipants = async (currentToken: string) => {
        try {
            const res = await fetch("/api/hrd/participants", {
                headers: {
                    "x-hrd-token": currentToken
                }
            });
            if (res.ok) {
                const data = await res.json();
                setParticipants(data.participants || []);
            } else {
                if (res.status === 401) {
                    setToken(""); // Invalid token
                    localStorage.removeItem("hrd_token");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem("hrd_token");
        if (saved) {
            setToken(saved);
            document.cookie = `hrd_token=${saved}; path=/`;
            fetchParticipants(saved);
            const interval = setInterval(() => fetchParticipants(saved), 10000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const tk = fd.get("token") as string;
        localStorage.setItem("hrd_token", tk);
        document.cookie = `hrd_token=${tk}; path=/`;
        setToken(tk);
        setLoading(true);
        fetchParticipants(tk);
    };

    const forceSubmit = async (userId: string) => {
        if (!confirm("Paksa submit sesi peserta ini?")) return;
        try {
            const res = await fetch("/api/hrd/participants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hrd-token": token,
                },
                body: JSON.stringify({ userId })
            });
            if (res.ok) fetchParticipants(token);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">Memuat Dashboard...</div>;

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0b1e]">
                <div className="card-elevated p-8 max-w-md w-full border-blue-500/20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Autentikasi HRD</h1>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input
                            name="token"
                            type="password"
                            placeholder="Masukkan Secret Key HRD"
                            className="input-field"
                            required
                        />
                        <button type="submit" className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600">Akses Dashboard</button>
                    </form>
                </div>
            </div>
        );
    }

    const filtered = participants.filter(p =>
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.position && p.position.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#0a0b1e] text-white">
            {/* Header */}
            <header className="bg-[#0f1027]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold tracking-tight">HRD Command Center</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> LIVE MONITORING
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="btn-ghost py-2 px-4 text-sm flex gap-2" onClick={() => fetchParticipants(token)}><RefreshCcw className="w-4 h-4" /> Refresh</button>
                        <button className="text-red-400 hover:text-red-300 font-bold text-sm px-4" onClick={() => {
                            localStorage.removeItem("hrd_token");
                            document.cookie = "hrd_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            setToken("");
                        }}>Keluar</button>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card p-5 border-blue-500/20">
                        <h3 className="text-white/60 text-xs font-bold tracking-widest mb-1">TOTAL PESERTA</h3>
                        <span className="text-3xl font-bold flex items-baseline gap-2">{participants.length} <Users className="w-4 h-4 text-blue-400" /></span>
                    </div>
                    <div className="card p-5">
                        <h3 className="text-white/60 text-xs font-bold tracking-widest mb-1">SELESAI TES (LULUS)</h3>
                        <span className="text-3xl font-bold text-emerald-400">{participants.filter(p => p.isTestSubmitted).length}</span>
                    </div>
                    <div className="card p-5">
                        <h3 className="text-white/60 text-xs font-bold tracking-widest mb-1">INTERVIEW SELESAI</h3>
                        <span className="text-3xl font-bold text-violet-400">{participants.filter(p => p.isInterviewSubmitted).length}</span>
                    </div>
                    <div className="card p-5 border-red-500/20">
                        <h3 className="text-white/60 text-xs font-bold tracking-widest mb-1">PELANGGARAN TAB (&gt;0)</h3>
                        <span className="text-3xl font-bold text-red-400">{participants.filter(p => p.tabSwitchCount > 0).length}</span>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Cari ID Peserta atau Posisi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs text-white/50 tracking-widest border-b border-white/10">
                                <th className="p-4 font-semibold uppercase">ID Peserta</th>
                                <th className="p-4 font-semibold uppercase">Posisi</th>
                                <th className="p-4 font-semibold uppercase">Status Tes</th>
                                <th className="p-4 font-semibold uppercase text-center">Skor</th>
                                <th className="p-4 font-semibold uppercase text-center">Tab Violations</th>
                                <th className="p-4 font-semibold uppercase text-center">Status Wawancara</th>
                                <th className="p-4 font-semibold uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filtered.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="p-4 font-mono text-xs">{p.id.split('-')[0]}***</td>
                                    <td className="p-4 font-medium">{p.position}</td>
                                    <td className="p-4">
                                        {p.isTestSubmitted ? (
                                            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">SELESAI</span>
                                        ) : p.startedAt ? (
                                            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center gap-1 w-max">
                                                <Clock className="w-3 h-3" /> {formatTimer(p.remainingTime)}
                                            </span>
                                        ) : (
                                            <span className="text-white/30 text-xs font-medium">BELUM MULAI</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-bold">
                                        {p.score !== null ? p.score : '-'}
                                    </td>
                                    <td className="p-4 text-center">
                                        {p.tabSwitchCount > 0 ? (
                                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold">{p.tabSwitchCount}</span>
                                        ) : (
                                            <span className="text-white/30">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {p.isInterviewSubmitted ? (
                                            <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 text-xs font-bold">DIKUMPULKAN</span>
                                        ) : (
                                            <span className="text-white/30">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!p.isTestSubmitted && p.startedAt && (
                                            <button
                                                onClick={() => forceSubmit(p.id)}
                                                className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                title="Force Submit"
                                            >
                                                <StopCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-white/40">Tidak ada peserta ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
