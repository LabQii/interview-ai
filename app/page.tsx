"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Shield, Activity, Globe, ArrowRight, Lock, Command } from "lucide-react";
import { redeemCode, saveCandidateName } from "@/server/actions/redeemCode";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("code", code);

    const result = await redeemCode(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setStep(2);
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    const result = await saveCandidateName(name);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/rules/test");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
      {/* Navbar minimal */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 relative group">
          <Logo />
        </div>
      </nav>

      <main className="max-w-5xl w-full flex flex-col items-center mt-10">

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-extrabold text-center tracking-tight mb-4 mt-4"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60">
            Interview & Test AI Platform
          </span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/50 block mt-2 text-lg md:text-3xl font-medium tracking-normal">
            by Muhammad Iqbal Firmansyah
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base text-center text-white/50 max-w-2xl mb-16 font-normal tracking-wide"
        >
          AI Powered Interview and Recruitment System
        </motion.h2>

        {/* Redeem Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl card-elevated p-8 mb-24 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-2">Masukkan kode akses anda</h2>
                <p className="text-white/50 text-sm mb-6">Gunakan tanda (-) dalam kode ex: XXXX-XXXX-XXXX</p>

                <form onSubmit={handleRedeem} className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg font-mono tracking-widest focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !code}
                    className="btn-primary flex items-center justify-center gap-2 md:w-auto w-full group"
                  >
                    {loading ? "Memverifikasi..." : "Lanjut"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-2">Kode Valid!</h2>
                <p className="text-emerald-400 text-sm mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Silakan masukkan nama lengkap Anda untuk memulai sesi.
                </p>

                <form onSubmit={handleSaveName} className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-lg font-medium focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/20"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="btn-primary flex items-center justify-center gap-2 md:w-auto w-full group"
                  >
                    {loading ? "Menyimpan..." : "Mulai Tes"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-red-400 text-sm mt-3 flex items-center gap-1">
              <Shield className="w-4 h-4" /> {error}
            </p>
          )}

        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full mb-24">
          {[
            {
              icon: Shield,
              title: "Integritas Terjaga",
              desc: "Sistem pengawasan selama tes membantu memastikan peserta mengerjakan evaluasi secara mandiri dan sesuai aturan.",
            },
            {
              icon: Activity,
              title: "Analisis Hasil Tes",
              desc: "Hasil tes dan jawaban peserta dirangkum untuk membantu tim HR memahami kemampuan dan potensi kandidat.",
            },
            {
              icon: Globe,
              title: "Akses Online",
              desc: "Tes dan sesi interview dapat dilakukan secara online sehingga memudahkan proses seleksi dari berbagai lokasi.",
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="card p-8 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white/80" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </main>

      <footer className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center py-8 border-t border-white/10 mt-auto text-xs text-white/40">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Logo textClassName="font-bold text-white/80" className="w-4 h-4" />
        </div>
        <div className="mt-4 md:mt-0">
          © 2024 Labqii Tech. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
