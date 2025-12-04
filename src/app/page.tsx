import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">LEI</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Laser Eye Institute
          </h1>
          <p className="text-xl text-muted-foreground">MyLEI Portal</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              This is the secure portal for Laser Eye Institute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LogIn className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">For Staff</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access the staff dashboard to review and manage patient statements.
                    You must sign in with your Laser Eye Institute Azure AD account.
                  </p>
                  <Link href="/app/statements-processing">
                    <Button>
                      Staff Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">For Patients</h3>
                  <p className="text-sm text-muted-foreground">
                    If you received a statement link via email or text message,
                    please use that link to view your statement and make a payment.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Laser Eye Institute. All rights reserved.
        </p>
      </div>
    </main>
  );
}
