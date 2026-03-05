"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-violet-600 flex items-center justify-center">
            <Command className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">HRD <span className="text-violet-400">Elite</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
          <a href="#" className="hover:text-white transition-colors">Asesmen</a>
          <a href="#" className="hover:text-white transition-colors">Solusi</a>
          <a href="#" className="hover:text-white transition-colors">Enterprise</a>
          <a href="#" className="hover:text-white transition-colors">Harga</a>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:text-white/80 transition-colors">Masuk</button>
          <button className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            Mulai Sekarang
          </button>
        </div>
      </nav>

      <main className="max-w-5xl w-full flex flex-col items-center mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 tracking-wider"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          PENGEMBANGAN SDM GENERASI BARU
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-center tracking-tight mb-6"
        >
          Optimalkan Talenta Anda <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            dengan Presisi AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-center text-white/60 max-w-2xl mb-12"
        >
          Platform asesmen revolusioner berbasis sains perilaku dan analitik tingkat lanjut untuk mengidentifikasi pemimpin masa depan.
        </motion.p>

        {/* Redeem Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl card-elevated p-8 mb-24 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-2">Siap memulai evaluasi?</h2>
                <p className="text-white/50 text-sm mb-6">Masukkan kode akses Anda.</p>

                <form onSubmit={handleRedeem} className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg font-mono tracking-widest focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-white/20"
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
                      className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl py-4 px-4 text-lg font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-white/20"
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

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="text-xs font-bold tracking-widest">DIPERCAYA OLEH</div>
            <div className="flex gap-8 font-bold text-xl font-serif">
              <span>DIPERCAYA</span>
              <span>OLEH</span>
              <span>DIPERCAYA</span>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full mb-24">
          {[
            {
              icon: Shield,
              title: "Integritas Terverifikasi",
              desc: "Sistem proctoring canggih untuk menjamin integritas data dalam setiap evaluasi.",
            },
            {
              icon: Activity,
              title: "Analitik Prediktif",
              desc: "Model AI yang menganalisis indikator perilaku untuk memprediksi potensi kepemimpinan.",
            },
            {
              icon: Globe,
              title: "Kepatuhan Global",
              desc: "Sesuai dengan standar ISO dan regulasi ketenagakerjaan internasional di berbagai negara.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="card p-8 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </main>

      <footer className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center py-8 border-t border-white/10 mt-auto text-xs text-white/40">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Command className="w-4 h-4" />
          <span className="font-bold text-white/80">HRD Elite</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">KEAMANAN</a>
          <a href="#" className="hover:text-white transition-colors">PRIVASI</a>
          <a href="#" className="hover:text-white transition-colors">KONTAK</a>
        </div>
        <div className="mt-4 md:mt-0">
          © 2024 HRD Elite Systems. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
