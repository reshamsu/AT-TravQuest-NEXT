import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseSession } from "@/lib/session";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await parseSession(cookieStore.get("session")?.value);

  if (!session) {
    redirect("/login");
  }

  const userName = session.name ?? session.email.split("@")[0];

  return (
    <DashboardShell
      userName={userName}
      role={session.role ?? "admin"}
      company={session.company ?? "default"}
      agentCode={session.agentCode}
    >
      {children}
    </DashboardShell>
  );
}
