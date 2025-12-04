"use client";

import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SignOutContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">LEI</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Sign out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out of MyLEI?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            variant="destructive"
            onClick={() => signOut({ callbackUrl })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          <Link href="/app/statements-processing" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Cancel
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SignOutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">LEI</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Sign out</CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" disabled>
              Loading...
            </Button>
          </CardContent>
        </Card>
      </main>
    }>
      <SignOutContent />
    </Suspense>
  );
}
