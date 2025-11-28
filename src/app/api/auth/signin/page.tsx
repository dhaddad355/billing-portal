"use client";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <Avatar name="LEI" className="h-12 w-12" />
          <h1 className="text-2xl font-bold">Sign in to Billing Portal</h1>
          <p className="text-muted-foreground text-sm mb-4 text-center">
            Use your organization account to access the dashboard.
          </p>
          <Separator className="my-4" />
          <Button
            className="w-full"
            size="lg"
            onClick={() => (window.location.href = "/api/auth/signin/azure-ad")}
          >
            Sign in with Azure AD
          </Button>
        </div>
      </Card>
    </div>
  );
}