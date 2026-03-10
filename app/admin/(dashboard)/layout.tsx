"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Key, LayoutDashboard, LogOut, FileText, Video } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.href = "/admin/login";
        } catch (error) {
            console.error("Gagal logout:", error);
            setIsLoggingOut(false);
        }
    };

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/participants", label: "Peserta", icon: Users },
        { href: "/admin/questions", label: "Bank Soal", icon: FileText },
        { href: "/admin/interview-questions", label: "Soal Interview", icon: Video },
        { href: "/admin/codes", label: "Kode Ujian", icon: Key },
    ];

    return (
        <div className="min-h-screen bg-background text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card/80 backdrop-blur-md border-r border-white/5 flex flex-col hidden md:flex">
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <Logo textClassName="text-sm font-bold" />
                </div>

                <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                    ? "bg-white/10 text-white shadow-md"
                                    : "text-white/50 hover:bg-white/5 hover:text-white/90"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        {isLoggingOut ? "Keluar..." : "Keluar Sesi"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="h-20 border-b border-white/5 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 md:hidden">
                    <Logo className="w-6 h-6" textClassName="text-sm font-bold" />
                    <button onClick={handleLogout} className="text-red-400 p-2">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                {/* Mobile Nav */}
                <div className="flex md:hidden overflow-x-auto border-b border-white/5 bg-card/50 p-2 gap-2 hide-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 bg-white/5"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
