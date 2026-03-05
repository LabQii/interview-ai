"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Clock, CheckCircle2, RefreshCw, Layers } from "lucide-react";
import { formatTimer } from "@/lib/timer";

interface RedeemCode {
    id: string;
    code: string;
    duration: number;
    position: string;
    packageName: string;
    isReusable: boolean;
    isUsed: boolean;
    createdAt: string;
    _count?: { users: number };
}

export default function AdminCodes() {
    const [codes, setCodes] = useState<RedeemCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [newCode, setNewCode] = useState("");
    const [duration, setDuration] = useState(3600); // 60 mins
    const [position, setPosition] = useState("");
    const [packageName, setPackageName] = useState("Standard");
    const [isReusable, setIsReusable] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const loadCodes = () => {
        setLoading(true);
        fetch("/api/admin/codes")
            .then(res => res.json())
            .then(data => {
                if (data.success) setCodes(data.codes);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const loadCategories = () => {
        fetch("/api/admin/questions/categories")
            .then(res => res.json())
            .then(data => {
                if (data.success) setAvailableCategories(data.categories);
            })
            .catch(console.error);
    };

    useEffect(() => {
        loadCodes();
        loadCategories();
    }, []);

    const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const blocks = [];
        for (let i = 0; i < 3; i++) {
            let block = "";
            for (let j = 0; j < 4; j++) block += chars.charAt(Math.floor(Math.random() * chars.length));
            blocks.push(block);
        }
        setNewCode(blocks.join("-"));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newCode, duration, position, packageName, isReusable, categories: selectedCategories })
            });
            if (res.ok) {
                setIsCreating(false);
                setNewCode("");
                setPosition("");
                setSelectedCategories([]);
                loadCodes();
            } else {
                const data = await res.json();
                alert(data.error || "Gagal membuat kode");
            }
        } catch (err) {
            alert("Terjadi kesalahan jaringan");
        }
    };

    const handleDelete = async (id: string, codeStr: string) => {
        if (!confirm(`Hapus kode ${codeStr}?`)) return;
        try {
            const res = await fetch("/api/admin/codes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (res.ok) loadCodes();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Manajemen Kode Ujian</h1>
                    <p className="text-white/50 text-sm">Buat dan atur durasi global ujian per kode.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={loadCodes} className="btn-ghost p-3" title="Refresh">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setIsCreating(!isCreating);
                            if (!isCreating) generateRandomCode();
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Buat Kode
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="card p-6 mb-8 border-violet-500/30">
                    <h3 className="font-bold text-lg mb-6">Buat Kode Baru</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Kode Akses</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCode}
                                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                                    className="flex-1 font-mono tracking-widest bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none"
                                    placeholder="XXXX-XXXX-XXXX"
                                    required
                                />
                                <button type="button" onClick={generateRandomCode} className="btn-ghost text-xs whitespace-nowrap px-4 border border-white/10">Random</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Jabatan / Posisi</label>
                            <input
                                type="text"
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none"
                                placeholder="Misal: Frontend Developer"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase flex items-center gap-2">
                                Durasi Global (Detik) <Clock className="w-3 h-3 text-white/30" />
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value))}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none"
                                required
                                min="60"
                            />
                            <p className="text-[10px] text-white/30 tracking-widest leading-relaxed">
                                (Contoh: 3600 = 60 menit)
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white/50 uppercase">Tipe Kode</label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-white/10 rounded-xl bg-[#0a0b1e]/50 hover:border-violet-500/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isReusable}
                                    onChange={e => setIsReusable(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 text-violet-500 bg-transparent focus:ring-0 focus:ring-offset-0"
                                />
                                <div>
                                    <div className="font-bold text-sm text-white/90">Permanen (Reusable)</div>
                                    <div className="text-xs text-white/40 mt-0.5">Bisa dipakai berkali-kali oleh peserta berbeda</div>
                                </div>
                            </label>
                        </div>

                        {availableCategories.length > 0 && (
                            <div className="md:col-span-2 space-y-3 p-4 border border-white/10 rounded-xl bg-white/[0.02]">
                                <label className="text-xs font-bold text-white/50 uppercase">Filter Kategori Soal (Opsional)</label>
                                <p className="text-xs text-white/40 mb-3">Jika tidak ada yang dipilih, maka SEMUA pertanyaan di Bank Soal akan dimasukkan ke kode ini.</p>
                                <div className="flex flex-wrap gap-3">
                                    {availableCategories.map(cat => (
                                        <label key={cat} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-colors ${selectedCategories.includes(cat) ? 'bg-violet-600/20 border-violet-500 text-white' : 'border-white/10 text-white/50 hover:border-white/30'}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCategories.includes(cat)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedCategories([...selectedCategories, cat]);
                                                    else setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                                }}
                                            />
                                            <span className="text-sm font-semibold">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setIsCreating(false)} className="btn-ghost px-6">Batal</button>
                            <button type="submit" className="btn-primary" disabled={!newCode || !position}>Simpan Kode</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {codes.map(code => (
                    <div key={code.id} className="card p-6 border-white/5 hover:border-white/10 transition-colors flex flex-col relative overflow-hidden group">
                        {code.isReusable && (
                            <div className="absolute top-0 right-0 py-1 px-4 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest rounded-bl-xl border-b border-l border-emerald-500/20">
                                REUSABLE
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6 pt-2">
                            <div>
                                <h3 className="font-mono text-xl text-violet-300 tracking-wider font-bold mb-1">{code.code}</h3>
                                <p className="text-sm font-medium text-white/70">{code.position}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 text-xs text-white/50 mb-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Durasi Global</span>
                                <span className="font-mono font-bold text-white">{formatTimer(code.duration)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Digunakan Oleh</span>
                                <span className="font-bold text-white max-w-[120px] truncate" title={code.isReusable ? `${code._count?.users || 0} Kandidat` : (code._count?.users ? '1 Kandidat' : 'Belum')} >
                                    {code.isReusable ? `${code._count?.users || 0} Kand` : (code._count?.users ? '1 Kand' : 'Belum')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Status</span>
                                <span>
                                    {code.isReusable ? (
                                        <span className="text-emerald-400 font-bold">Aktif Terus</span>
                                    ) : code.isUsed ? (
                                        <span className="text-red-400 font-bold">1x Dipakai</span>
                                    ) : (
                                        <span className="text-orange-400 font-bold">Tersedia</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 flex gap-2 border-t border-white/5">
                            <button
                                onClick={() => handleDelete(code.id, code.code)}
                                className="flex-1 py-2 text-xs font-bold text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && codes.length === 0 && (
                <div className="text-center p-12 text-white/40 border border-white/5 border-dashed rounded-2xl">
                    Belum ada kode ujian.
                </div>
            )}
        </div>
    );
}
