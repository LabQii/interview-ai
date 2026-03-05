import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/actions/redeemCode";
import { VideoRecorder } from "@/components/interview/VideoRecorder";
import { Command } from "lucide-react";

export default async function InterviewPage() {
    const sessionData = await getCurrentSession();

    if (!sessionData?.interview) {
        redirect("/test");
    }

    if (sessionData.interview.isSubmitted) {
        redirect("/result");
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0b1e]">
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#0f1027]/80 backdrop-blur-md border-b border-white/5 z-40 px-6 flex items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Command className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-tight">HRD AI</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Interview Pro</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-20 w-full">
                <VideoRecorder />
            </main>
        </div>
    );
}
