"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, RefreshCw, FolderOpen, Tag, Grid, MessageSquare, Lightbulb } from "lucide-react";

interface InterviewQuestion {
    id: string;
    question: string;
    category: string | null;
    hint: string | null;
    order: number;
}

interface EditForm {
    question?: string;
    category?: string;
    hint?: string;
    order?: number;
}

export default function AdminInterviewQuestions() {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({});
    const [isCreating, setIsCreating] = useState(false);

    const [activeCategory, setActiveCategory] = useState<string>("Semua");
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    const categories = Array.from(
        new Set(questions.map(q => q.category).filter(Boolean) as string[])
    ).sort();

    const filteredQuestions = activeCategory === "Semua"
        ? questions
        : questions.filter(q => q.category === activeCategory);

    const loadQuestions = () => {
        setLoading(true);
        fetch("/api/admin/interview-questions")
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setQuestions(data.questions);
                    const cats = Array.from(new Set(data.questions.map((q: any) => q.category).filter(Boolean)));
                    if (activeCategory !== "Semua" && !cats.includes(activeCategory)) {
                        setActiveCategory("Semua");
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadQuestions(); }, []); // eslint-disable-line

    // --- Question CRUD ---
    const handleSave = async (id?: string) => {
        const url = "/api/admin/interview-questions";
        const method = id ? "PUT" : "POST";
        const body = id ? { id, ...editForm } : editForm;
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) { setIsEditing(null); setIsCreating(false); setEditForm({}); loadQuestions(); }
        else { alert("Gagal menyimpan pertanyaan"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus pertanyaan ini?")) return;
        const res = await fetch("/api/admin/interview-questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (res.ok) loadQuestions();
    };

    const startEdit = (q: InterviewQuestion) => {
        setIsEditing(q.id);
        setEditForm({ question: q.question, category: q.category ?? "", hint: q.hint ?? "", order: q.order });
        setIsCreating(false);
    };

    const startCreate = () => {
        setIsCreating(true);
        setIsEditing(null);
        setEditForm({ question: "", category: activeCategory !== "Semua" ? activeCategory : "", hint: "", order: questions.length + 1 });
    };

    // --- Category CRUD ---
    const handleRenameCategory = async (oldName: string) => {
        if (!newCategoryName || newCategoryName === oldName) { setEditingCategory(null); return; }
        const res = await fetch("/api/admin/interview-questions/categories", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldCategory: oldName, newCategory: newCategoryName }),
        });
        if (res.ok) {
            if (activeCategory === oldName) setActiveCategory(newCategoryName.toUpperCase());
            setEditingCategory(null); setNewCategoryName(""); loadQuestions();
        } else { alert("Gagal mengubah nama kategori"); }
    };

    const handleDeleteCategory = async (catName: string) => {
        if (!confirm(`Hapus SEMUA pertanyaan di kategori "${catName}"?`)) return;
        const res = await fetch("/api/admin/interview-questions/categories", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: catName }),
        });
        if (res.ok) { if (activeCategory === catName) setActiveCategory("Semua"); loadQuestions(); }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Bank Soal Interview</h1>
                    <p className="text-white/50 text-sm">Kelola pertanyaan wawancara per kategori atau posisi jabatan.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadQuestions} className="btn-ghost p-3" title="Refresh">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={startCreate} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Tambah Pertanyaan
                    </button>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-[#0a0b1e]/60 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#0f1027]">
                    <FolderOpen className="w-5 h-5 text-violet-400" />
                    <h3 className="font-bold text-sm tracking-wider uppercase text-white/70">Filter Kategori</h3>
                </div>
                <div className="p-6 flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setActiveCategory("Semua")}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeCategory === "Semua" ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"}`}
                    >
                        <Grid className="w-4 h-4" /> Semua
                        <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-mono">{questions.length}</span>
                    </button>

                    {categories.map(cat => {
                        const count = questions.filter(q => q.category === cat).length;
                        const isCatActive = activeCategory === cat;
                        if (editingCategory === cat) {
                            return (
                                <div key={cat} className="flex items-center bg-[#0a0b1e] border border-violet-500 rounded-xl overflow-hidden">
                                    <input type="text" autoFocus value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat)}
                                        className="bg-transparent text-sm font-bold px-4 py-2.5 outline-none w-36 uppercase text-violet-300"
                                    />
                                    <button onClick={() => handleRenameCategory(cat)} className="p-2.5 text-emerald-400 hover:bg-emerald-500/20"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingCategory(null)} className="p-2.5 text-red-400 hover:bg-red-500/20"><X className="w-4 h-4" /></button>
                                </div>
                            );
                        }
                        return (
                            <div key={cat} className="group flex items-center">
                                <button onClick={() => setActiveCategory(cat)}
                                    className={`px-5 py-2.5 rounded-l-xl font-bold text-sm transition-all flex items-center gap-2 ${isCatActive ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"}`}
                                >
                                    <Tag className={`w-4 h-4 ${isCatActive ? 'text-white' : 'text-violet-400'}`} /> {cat}
                                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-mono">{count}</span>
                                </button>
                                <div className={`flex items-stretch rounded-r-xl border-l border-white/5 overflow-hidden ${isCatActive ? "bg-violet-700/50" : "bg-white/5"}`}>
                                    <button onClick={() => { setEditingCategory(cat); setNewCategoryName(cat); }} className="p-3 text-white/30 hover:text-white hover:bg-white/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteCategory(cat)} className="p-3 text-red-400/50 hover:text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create / Edit Form */}
            {(isCreating || isEditing) && (
                <div className="card p-6 mb-8 border-violet-500/30 ring-4 ring-violet-500/10">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                                {isCreating ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </div>
                            <h3 className="font-bold text-lg">{isCreating ? "Tambah Pertanyaan Baru" : "Edit Pertanyaan"}</h3>
                        </div>
                        <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Pertanyaan</label>
                            <textarea value={editForm.question || ""}
                                onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-4 min-h-[100px] focus:border-violet-500 outline-none transition-all resize-none"
                                placeholder="Contoh: Ceritakan pengalaman Anda dalam mengelola tim yang berkonflik..." />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5" /> Petunjuk / Panduan Jawaban (opsional)</label>
                            <textarea value={editForm.hint || ""}
                                onChange={e => setEditForm({ ...editForm, hint: e.target.value })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-4 min-h-[80px] focus:border-violet-500 outline-none transition-all resize-none text-sm text-white/60"
                                placeholder="Hints untuk evaluator AI..." />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Kategori / Posisi</label>
                            <input type="text" value={editForm.category || ""}
                                onChange={e => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none uppercase font-bold text-violet-300 placeholder:text-white/20 placeholder:font-normal placeholder:capitalize"
                                placeholder="Kategori / Topik (contoh: LEADERSHIP)" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Urutan</label>
                            <input type="number" value={editForm.order ?? 0}
                                onChange={e => setEditForm({ ...editForm, order: parseInt(e.target.value) })}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl p-3 focus:border-violet-500 outline-none font-mono" />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-3">
                        <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="btn-ghost px-6">Batal</button>
                        <button onClick={() => handleSave(isEditing || undefined)} className="btn-primary flex items-center gap-2 px-8">
                            <Save className="w-4 h-4" /> Simpan Pertanyaan
                        </button>
                    </div>
                </div>
            )}

            {/* Question List */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />)}</div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((q, idx) => (
                            <div key={q.id} className="card p-6 border-white/5 hover:border-violet-500/30 transition-all hover:bg-white/[0.03]">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex gap-4 items-start flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold shrink-0 border border-violet-500/20 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-base text-white/90 mb-3 leading-relaxed">{q.question}</p>
                                            {q.hint && (
                                                <p className="text-sm text-white/40 italic mb-3 flex items-start gap-2">
                                                    <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-yellow-400/60 shrink-0" /> {q.hint}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-widest text-white/40 uppercase">
                                                <span className="flex items-center gap-1.5 bg-violet-500/10 text-violet-300 px-3 py-1.5 rounded-md border border-violet-500/20">
                                                    <Tag className="w-3 h-3" /> {q.category || "TANPA KATEGORI"}
                                                </span>
                                                <span className="bg-white/5 px-3 py-1.5 rounded-md border border-white/5">Urutan #{q.order}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => startEdit(q)} className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-white/50 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isCreating && filteredQuestions.length === 0 && (
                            <div className="text-center p-16 border border-white/10 border-dashed rounded-3xl bg-[#0a0b1e]/50 flex flex-col items-center justify-center">
                                <MessageSquare className="w-12 h-12 text-white/15 mb-4" />
                                <h3 className="font-bold text-lg text-white/50 mb-2">
                                    Belum ada pertanyaan {activeCategory !== "Semua" ? `di kategori ${activeCategory}` : ""}
                                </h3>
                                <p className="text-white/30 text-sm mb-6">Tambahkan pertanyaan wawancara untuk kandidat Anda.</p>
                                <button onClick={startCreate} className="btn-primary flex items-center gap-2 px-8">
                                    <Plus className="w-4 h-4" /> Tambah Pertanyaan
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
