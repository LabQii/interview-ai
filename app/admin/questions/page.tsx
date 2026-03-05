"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, RefreshCw, FolderOpen, Tag, Grid, FileText } from "lucide-react";

interface Question {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: string;
    duration: number;
    category: string;
    order: number;
}

export default function AdminQuestions() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Question>>({});
    const [isCreating, setIsCreating] = useState(false);

    // Category Filter States
    const [activeCategory, setActiveCategory] = useState<string>("Semua");

    // Category Manager States (Rename)
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Derived Categories from questions data
    const categories = Array.from(new Set(questions.map(q => q.category).filter(c => c && c.trim() !== "")));

    const filteredQuestions = activeCategory === "Semua"
        ? questions
        : questions.filter(q => q.category === activeCategory);

    const loadQuestions = () => {
        setLoading(true);
        fetch("/api/admin/questions")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setQuestions(data.questions);
                    // If the active category was deleted or has no questions, fallback to "Semua"
                    const currentCats = Array.from(new Set(data.questions.map((q: any) => q.category)));
                    if (activeCategory !== "Semua" && !currentCats.includes(activeCategory)) {
                        setActiveCategory("Semua");
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadQuestions();
    }, []); // eslint-disable-line

    // --- QUESTION CRUD ---

    const handleSaveQuestion = async (id?: string) => {
        const url = "/api/admin/questions";
        const method = id ? "PUT" : "POST";
        const body = id ? { id, ...editForm } : editForm;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setIsEditing(null);
                setIsCreating(false);
                setEditForm({});
                loadQuestions();
            } else {
                alert("Gagal menyimpan soal");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Yakin ingin menghapus soal ini?")) return;
        try {
            const res = await fetch("/api/admin/questions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (res.ok) loadQuestions();
        } catch (e) {
            console.error(e);
        }
    };

    const startEditQuestion = (q: Question) => {
        setIsEditing(q.id);
        setEditForm(q);
        setIsCreating(false);
    };

    const startCreateQuestion = () => {
        setIsCreating(true);
        setIsEditing(null);
        setEditForm({
            question: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correct: "A",
            duration: 60,
            category: activeCategory !== "Semua" ? activeCategory : "",
            order: questions.length + 1
        });
    };

    // --- CATEGORY CRUD ---

    const handleRenameCategory = async (oldName: string) => {
        if (!newCategoryName || newCategoryName.trim() === "" || newCategoryName === oldName) {
            setEditingCategory(null);
            return;
        }

        try {
            const res = await fetch("/api/admin/questions/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldCategory: oldName, newCategory: newCategoryName })
            });

            if (res.ok) {
                if (activeCategory === oldName) {
                    setActiveCategory(newCategoryName.toUpperCase());
                }
                setEditingCategory(null);
                setNewCategoryName("");
                loadQuestions(); // Reload to reflect changes globally
            } else {
                alert("Gagal mengubah nama kategori");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCategory = async (catName: string) => {
        if (!confirm(`Peringatan: Anda akan menghapus SELURUH soal yang berada di kategori "${catName}". Lanjutkan?`)) return;

        try {
            const res = await fetch("/api/admin/questions/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: catName })
            });

            if (res.ok) {
                if (activeCategory === catName) setActiveCategory("Semua");
                loadQuestions();
            } else {
                alert("Gagal menghapus kategori");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startRenameCategory = (catName: string) => {
        setEditingCategory(catName);
        setNewCategoryName(catName);
    };


    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Manajemen Soal</h1>
                    <p className="text-white/50 text-sm">Organisasi soal berdasarkan kategori untuk Tes Elite HRD.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={loadQuestions} className="btn-ghost p-3" title="Refresh">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={startCreateQuestion} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Tambah Soal
                    </button>
                </div>
            </div>

            {/* Top Navigation / Category Tabs */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-[#0a0b1e]/60 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#0f1027]">
                    <FolderOpen className="w-5 h-5 text-violet-400" />
                    <h3 className="font-bold text-sm tracking-wider uppercase text-white/70">Filter Kategori</h3>
                </div>

                <div className="p-6 flex flex-wrap items-center gap-3">
                    {/* "All" Category */}
                    <button
                        onClick={() => setActiveCategory("Semua")}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeCategory === "Semua"
                            ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                            : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                            }`}
                    >
                        <Grid className="w-4 h-4" /> Semua Soal
                        <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-mono ml-1">{questions.length}</span>
                    </button>

                    {/* Dynamic Categories */}
                    {categories.map((cat) => {
                        const count = questions.filter(q => q.category === cat).length;
                        const isCatActive = activeCategory === cat;
                        const isCatEditing = editingCategory === cat;

                        if (isCatEditing) {
                            return (
                                <div key={cat} className="flex items-center bg-[#0a0b1e] border border-violet-500 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory(cat)}
                                        className="bg-transparent text-sm font-bold px-4 py-2.5 outline-none w-32 md:w-40 uppercase text-violet-300"
                                    />
                                    <button onClick={() => handleRenameCategory(cat)} className="p-2.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingCategory(null)} className="p-2.5 text-red-400 hover:bg-red-500/20 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={cat} className="group relative flex items-center">
                                <button
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-5 py-2.5 rounded-l-xl font-bold text-sm transition-all flex items-center gap-2 ${isCatActive
                                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-transparent hover:border-white/10"
                                        }`}
                                >
                                    <Tag className={`w-4 h-4 ${isCatActive ? 'text-white' : 'text-violet-400'}`} /> {cat}
                                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-mono ml-1">{count}</span>
                                </button>

                                {/* CRUD Actions for Category (Rename / Delete) */}
                                <div className={`flex items-stretch rounded-r-xl border-l border-white/5 overflow-hidden transition-all duration-300 ${isCatActive ? "bg-violet-700/50" : "bg-white/5"
                                    }`}>
                                    <button
                                        onClick={() => startRenameCategory(cat)}
                                        className="p-3 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                                        title="Rename Kategori"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="p-3 text-red-400/50 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                                        title="Hapus Kategori & Semua Soalnya"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create / Edit SOAL Form */}
            {(isCreating || isEditing) && (
                <div className="card p-6 mb-8 border-violet-500/30 ring-4 ring-violet-500/10">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                                {isCreating ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </div>
                            <h3 className="font-bold text-lg">{isCreating ? "Tambah Soal Baru" : "Edit Soal"}</h3>
                        </div>
                        <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Pertanyaan</label>
                            <textarea
                                value={editForm.question || ""}
                                onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-4 min-h-[120px] focus:border-violet-500 focus:bg-[#0a0b1e]/80 transition-all outline-none"
                                placeholder="Tuliskan pertanyaan disini..."
                            />
                        </div>

                        {["A", "B", "C", "D"].map(opt => (
                            <div key={opt} className="space-y-2 relative group">
                                <label className="text-xs font-bold font-mono text-white/50 absolute top-3 left-4">Opsi {opt}</label>
                                <input
                                    type="text"
                                    value={(editForm as any)[`option${opt}`] || ""}
                                    onChange={e => setEditForm({ ...editForm, [`option${opt}`]: e.target.value })}
                                    className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-4 pt-8 pb-3 focus:border-violet-500 focus:bg-[#0a0b1e]/80 transition-all outline-none"
                                    placeholder={`Tulis jawaban opsi ${opt}`}
                                />
                            </div>
                        ))}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Kunci Jawaban</label>
                            <select
                                value={editForm.correct || "A"}
                                onChange={e => setEditForm({ ...editForm, correct: e.target.value })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none font-bold text-emerald-400 [&>option]:bg-[#0f1027]"
                            >
                                <option value="A">Jawaban A Benar</option>
                                <option value="B">Jawaban B Benar</option>
                                <option value="C">Jawaban C Benar</option>
                                <option value="D">Jawaban D Benar</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                                <span>Durasi (Detik)</span>
                                <span className="text-[10px] text-white/30 font-normal normal-case">Waktu timeout per soal</span>
                            </label>
                            <input
                                type="number"
                                value={editForm.duration || 60}
                                onChange={e => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none font-mono"
                                min="10"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                Kategori / Topik
                            </label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    value={editForm.category || ""}
                                    onChange={e => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })}
                                    className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:border-violet-500 outline-none uppercase font-bold text-violet-300 placeholder:text-white/20 placeholder:font-normal placeholder:capitalize"
                                    placeholder="Kategori / Topik"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
                        <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="btn-ghost px-6">Batal</button>
                        <button onClick={() => handleSaveQuestion(isEditing || undefined)} className="btn-primary flex items-center gap-2 px-8">
                            <Save className="w-4 h-4" /> Simpan Soal
                        </button>
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((q, idx) => (
                            <div key={q.id} className="card p-6 border-white/5 hover:border-violet-500/30 transition-all hover:bg-white/[0.03]">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex gap-4 items-start flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold shrink-0 border border-violet-500/20">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg text-white/90 mb-4 leading-relaxed">{q.question}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/60 mb-5 font-medium">
                                                <div className={`p-3 rounded-lg border ${q.correct === 'A' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/5 bg-white/5'}`}>A. {q.optionA}</div>
                                                <div className={`p-3 rounded-lg border ${q.correct === 'B' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/5 bg-white/5'}`}>B. {q.optionB}</div>
                                                <div className={`p-3 rounded-lg border ${q.correct === 'C' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/5 bg-white/5'}`}>C. {q.optionC}</div>
                                                <div className={`p-3 rounded-lg border ${q.correct === 'D' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/5 bg-white/5'}`}>D. {q.optionD}</div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-widest text-white/40 uppercase">
                                                <span className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                                                    ⏳ {q.duration}s
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-violet-500/10 text-violet-300 px-3 py-1.5 rounded-md border border-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.1)]">
                                                    <Tag className="w-3 h-3" /> {q.category || "TANPA KATEGORI"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => startEditQuestion(q)} className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-white/50 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isCreating && filteredQuestions.length === 0 && (
                            <div className="text-center p-16 border border-white/10 border-dashed rounded-3xl bg-[#0a0b1e]/50 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg text-white/50 mb-2">Belum ada soal {activeCategory !== "Semua" ? `di kategori ${activeCategory}` : 'di bank data'}</h3>
                                <p className="text-white/30 text-sm mb-6 max-w-sm mx-auto">Mulai tambahkan daftar pertanyaan untuk kandidat ujian Anda.</p>
                                <button onClick={startCreateQuestion} className="btn-primary flex items-center gap-2 px-8">
                                    <Plus className="w-4 h-4" /> Buat Soal Pertama
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
