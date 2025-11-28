import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            Laser Eye Institute
          </h1>
          <p className="text-xl text-gray-600">Billing Portal</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              This is the secure billing portal for Laser Eye Institute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">For Staff</h3>
              <p className="text-sm text-gray-600 mb-4">
                Access the staff dashboard to review and manage patient statements.
                You must sign in with your Laser Eye Institute Azure AD account.
              </p>
              <Link href="/app/dashboard">
                <Button>Staff Dashboard</Button>
              </Link>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">For Patients</h3>
              <p className="text-sm text-gray-600">
                If you received a statement link via email or text message,
                please use that link to view your statement and make a payment.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Laser Eye Institute. All rights reserved.
        </p>
      </div>
    </main>
  );
}
