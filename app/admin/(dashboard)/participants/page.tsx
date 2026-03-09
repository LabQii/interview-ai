import { redirect } from "next/navigation";

export default function AdminParticipantsRedirect() {
    redirect("/admin/dashboard");
}
