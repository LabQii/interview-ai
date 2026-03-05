"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Command, Users, Key, LayoutDashboard, LogOut, FileText, Video } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);
        document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/admin");
    };

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/participants", label: "Peserta", icon: Users },
        { href: "/admin/questions", label: "Bank Soal", icon: FileText },
        { href: "/admin/interview-questions", label: "Soal Interview", icon: Video },
        { href: "/admin/codes", label: "Kode Ujian", icon: Key },
    ];

    return (
        <div className="min-h-screen bg-[#0a0b1e] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0f1027]/80 backdrop-blur-md border-r border-white/5 flex flex-col hidden md:flex">
                <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        <Command className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-tight leading-none text-lg">Admin</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Portal</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
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
                {/* Mobile Header */}
                <header className="h-20 border-b border-white/5 bg-[#0f1027]/50 backdrop-blur-md flex items-center justify-between px-6 md:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Command className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight">Admin Portal</span>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 p-2">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                {/* Mobile Nav */}
                <div className="flex md:hidden overflow-x-auto border-b border-white/5 bg-[#0f1027]/50 p-2 gap-2 hide-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isActive
                                    ? "bg-blue-600 text-white"
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
