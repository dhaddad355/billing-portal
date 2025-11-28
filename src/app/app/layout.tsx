import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface ExtendedSession {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/app/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={session.user}
        onSignIn={() => (window.location.href = "/api/auth/signin")}
        onSignOut={() => (window.location.href = "/api/auth/signout")}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
