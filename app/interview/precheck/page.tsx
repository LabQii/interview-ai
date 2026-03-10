import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/actions/redeemCode";
import { PrecheckView } from "@/components/interview/PrecheckView";

export default async function InterviewPrecheckPage() {
    const sessionData = await getCurrentSession();

    // Must be logged in
    if (!sessionData) redirect("/");

    // If already done the interview, go to result
    if (sessionData.interview?.isSubmitted) redirect("/result");

    // If interview isn't started yet (no record), go to interview which will handle initialization
    // PrecheckView just needs to confirm the environment, then navigate to /interview

    return <PrecheckView />;
}
