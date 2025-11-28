import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
    <div className="flex min-h-screen bg-white">
      {/* Sidebar Navigation */}
      <Sidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
