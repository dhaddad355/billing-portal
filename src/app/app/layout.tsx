import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-900">LEI</span>
                <span className="text-gray-600">Billing Portal</span>
              </Link>
            </div>

            <nav className="flex items-center gap-6">
              <Link
                href="/app/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign out
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
