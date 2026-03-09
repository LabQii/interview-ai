"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogIn, Command } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                // Menggunakan window.location.href agar langsung force reload ke halaman admin
                // Ini menghindari lag dari Next.js router transisi client-side
                window.location.href = "/admin/dashboard";
            } else {
                const data = await res.json();
                setError(data.error || "Login gagal");
                setLoading(false);
            }
        } catch (err) {
            setError("Terjadi kesalahan jaringan");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-10 max-w-md w-full border-blue-500/20 relative z-10"
            >
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        <Command className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold tracking-tight leading-none">Admin</span>
                        <span className="text-xs uppercase font-bold tracking-widest text-blue-400">Portal</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            className="w-full bg-[#0f1027] border border-white/10 rounded-xl py-4 px-4 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#0f1027] border border-white/10 rounded-xl py-4 px-4 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm flex items-center gap-2 mt-1">
                            <ShieldAlert className="w-4 h-4" /> {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="btn-primary flex justify-center items-center gap-2 text-lg py-4 w-full mt-2"
                    >
                        {loading ? "Memverifikasi..." : (
                            <>Masuk <LogIn className="w-5 h-5" /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
