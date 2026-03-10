"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Activity, Clock, ShieldAlert, CheckCircle2, XCircle, FileVideo } from "lucide-react";
import Link from "next/link";
import { formatTimer } from "@/lib/timer";

export default function ParticipantDetail() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/participants/${params.id}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [params.id]);

    if (loading) return <div className="p-8 animate-pulse text-white/50">Memuat detail peserta...</div>;
    if (!data?.participant) return <div className="p-8 text-red-400">Peserta tidak ditemukan.</div>;

    const { participant, answers, violations, analyses } = data;
    const test = participant.testSession;
    const interview = participant.interview;
    const code = test?.redeemCode || participant.redeemCode?.code || "-";
    const pos = test?.position || participant.redeemCode?.position || "-";

    // Calculate correct ratio
    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const totalAnswered = answers.length;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto pb-24">
            <button
                onClick={() => router.push('/admin/participants')}
                className="btn-ghost flex items-center gap-2 mb-8 text-sm px-4"
            >
                <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            {/* Profile Header */}
            <div className="card-elevated p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden text-left border-white/20/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="w-20 h-20 bg-white/20/10 border border-white/20/20 rounded-2xl flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-white/80" />
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-1">{participant.name || <span className="text-white/50 italic">Anonim</span>}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/60 text-sm">
                        <span className="flex items-center gap-2 mt-2">
                            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-blue-300">{code}</span>
                        </span>
                        <span className="flex items-center gap-2 mt-2">
                            Posisi: <strong className="text-white bg-white/5 px-2 py-0.5 rounded">{pos}</strong>
                        </span>
                        <span className="mt-2 text-xs">ID: {participant.id}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Test Results */}
                <div className="card p-6 border-white/10">
                    <h3 className="text-white/60 text-xs font-bold tracking-widest mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-white/80" /> HASIL UJIAN TERTULIS
                    </h3>

                    {test ? (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <span className="text-5xl font-bold mb-1">{test.score ?? '-'}</span>
                                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">Skor Akhir</span>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-bold mb-2">
                                        {test.isSubmitted ? (
                                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selesai</span>
                                        ) : test.startedAt ? (
                                            <span className="text-white/80 flex items-center gap-1"><Activity className="w-3 h-3" /> Sedang Berlangsung</span>
                                        ) : (
                                            <span className="text-white/40">Belum Mulai</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-white/50">
                                        <span className="text-emerald-400 font-bold">{correctCount} Benar</span> / {totalAnswered} Dijawab
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                    <span className="text-white/50 text-sm">Waktu Mulai</span>
                                    <span className="font-mono text-sm">{new Date(test.startedAt).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                    <span className="text-white/50 text-sm">Pelanggaran Pindah Tab</span>
                                    <span className={`font-bold text-sm ${test.tabSwitchCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {test.tabSwitchCount} kali
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">Auto-Submit</span>
                                    <span className={`font-bold text-sm ${test.autoSubmitted ? 'text-orange-400' : 'text-white/30'}`}>
                                        {test.autoSubmitted ? 'Ya (Kehabisan Waktu/Pelanggaran)' : 'Tidak'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-white/30 border border-white/5 border-dashed rounded-xl">
                            Belum ada sesi tes
                        </div>
                    )}
                </div>

                {/* Interview Results */}
                <div className="card p-6 border-white/10">
                    <h3 className="text-white/60 text-xs font-bold tracking-widest mb-6 flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-white/80" /> HASIL WAWANCARA AI
                    </h3>

                    {interview ? (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <span className="text-5xl font-bold mb-1">{interview.aiScore ? interview.aiScore.toFixed(1) : '-'}</span>
                                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">AI Score</span>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-bold mb-2">
                                        {interview.isSubmitted ? (
                                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selesai</span>
                                        ) : interview.startedAt ? (
                                            <span className="text-white/80 flex items-center gap-1"><Activity className="w-3 h-3" /> Diproses</span>
                                        ) : (
                                            <span className="text-white/40">Belum Dinilai</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                    <span className="text-white/50 text-sm">Waktu Mulai</span>
                                    <span className="font-mono text-sm">{interview.startedAt ? new Date(interview.startedAt).toLocaleString('id-ID') : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">Retake Log</span>
                                    <span className="font-bold text-sm text-white/80">
                                        {interview.totalRetake}/{interview.maxRetake}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-white/30 border border-white/5 border-dashed rounded-xl h-full flex items-center justify-center">
                            Belum ada sesi wawancara
                        </div>
                    )}
                </div>
            </div>

            {/* Rincian Analisis Per Soal - Moved outside grid for better UX */}
            {analyses && analyses.length > 0 && (
                <div className="card p-6 mb-8">
                    <h3 className="text-white/60 text-xs font-bold tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-white/80" /> RINCIAN ANALISIS WAWANCARA PER SOAL
                    </h3>

                    <div className="space-y-6">
                        {analyses.map((analysis: any, idx: number) => (
                            <div key={analysis.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-white/40 font-bold mb-1">SOAL {idx + 1}</span>
                                        <a href={analysis.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-bold transition-colors">
                                            <FileVideo className="w-4 h-4" /> Buka Video Jawaban
                                        </a>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 min-w-[70px]">
                                            <span className="text-xs text-white/50 mb-1">Komunikasi</span>
                                            <span className="text-lg font-bold text-white/80">{analysis.communicationScore || '-'}</span>
                                        </div>
                                        <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 min-w-[70px]">
                                            <span className="text-xs text-white/50 mb-1">Relevansi</span>
                                            <span className="text-lg font-bold text-white/80">{analysis.relevanceScore || '-'}</span>
                                        </div>
                                        <div className="flex flex-col items-center bg-white/10 border border-white/20 rounded-lg p-2 min-w-[70px]">
                                            <span className="text-xs text-white/90 mb-1">Bobot</span>
                                            <span className="text-lg font-bold text-white">{analysis.overallScore || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-white/5">
                                    {analysis.aiResume && (
                                        <div>
                                            <h5 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Resume Jawaban</h5>
                                            <p className="text-sm text-white/80 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                                {analysis.aiResume}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.aiHighlights && analysis.aiHighlights.length > 0 && (
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                                <h5 className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest mb-2">Poin Positif</h5>
                                                <ul className="text-sm text-white/80 space-y-1.5 pl-4 list-disc marker:text-emerald-500/50">
                                                    {analysis.aiHighlights.map((hl: string, i: number) => <li key={i}>{hl}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {analysis.aiWeaknesses && analysis.aiWeaknesses.length > 0 && (
                                            <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
                                                <h5 className="text-xs font-bold text-orange-500/80 uppercase tracking-widest mb-2">Area Perbaikan</h5>
                                                <ul className="text-sm text-white/80 space-y-1.5 pl-4 list-disc marker:text-orange-500/50">
                                                    {analysis.aiWeaknesses.map((wk: string, i: number) => <li key={i}>{wk}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {analysis.recommendation && (
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-2 flex flex-col gap-1">
                                            <h5 className="text-sm font-bold text-white/90">Rekomendasi AI: {analysis.recommendation}</h5>
                                            <p className="text-sm text-white/60">{analysis.recommendationReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Answers Detail Log */}
            <div className="card p-6">
                <h3 className="text-white/60 text-xs font-bold tracking-widest mb-6 border-b border-white/5 pb-4">LOG JAWABAN PESERTA</h3>

                {answers.length > 0 ? (
                    <div className="space-y-4">
                        {answers.map((ans: any, i: number) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/50">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-white/90 mb-2 leading-relaxed">{ans.question?.question || 'Soal telah dihapus'}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                        <span className="text-white/50">Jawaban: <strong className="text-white bg-white/10 px-2 py-0.5 rounded ml-1">{ans.answer}</strong></span>
                                        {ans.isCorrect ? (
                                            <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" /> Benar</span>
                                        ) : (
                                            <span className="text-red-400 flex items-center gap-1 font-bold"><XCircle className="w-3 h-3" /> Salah (Kunci: {ans.question?.correct})</span>
                                        )}
                                        <span className="text-white/30 ms-auto">{new Date(ans.answeredAt).toLocaleTimeString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white/40 text-sm italic text-center py-8">Belum ada soal yang dijawab.</p>
                )}
            </div>

        </div>
    );
}
