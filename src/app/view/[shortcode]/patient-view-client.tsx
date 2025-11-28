"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle, Calendar, CreditCard, FileText } from "lucide-react";

interface PatientViewClientProps {
  shortcode: string;
  patientName?: string;
  statementDate: string;
  patientBalance: number;
  currencyCode: string;
}

export default function PatientViewClient({
  shortcode,
  patientName,
  statementDate,
  patientBalance,
  currencyCode,
}: PatientViewClientProps) {
  const [verified, setVerified] = useState(false);
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) {
      setError("Please enter your date of birth");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/view/verify-dob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_code: shortcode,
          dob,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
      } else {
        switch (data.error) {
          case "DOB_MISMATCH":
            setError("The date of birth you entered does not match our records. Please try again.");
            break;
          case "INVALID_DOB_FORMAT":
            setError("Please enter a valid date in MM/DD/YYYY format.");
            break;
          case "INVALID_CODE":
            setError("This statement link is invalid or has expired.");
            break;
          default:
            setError("An error occurred. Please try again.");
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (!verified) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">LEI</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Laser Eye Institute</CardTitle>
            <CardDescription>Statement Verification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6 text-center">
              For your privacy, please verify your identity by entering your date of birth.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dob"
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? "Verifying..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const paymentUrl = `https://www.lasereyeinstitute.com/online-payment?a=${patientBalance.toFixed(2)}`;
  const pdfUrl = `/api/view/${shortcode}/pdf`;

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">LEI</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Laser Eye Institute</CardTitle>
          <CardDescription>Your Statement</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {patientName && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Statement for</p>
                <p className="text-xl font-semibold">{patientName}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Statement Date</p>
                <p className="font-semibold">{formatDate(statementDate)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-primary/5">
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(patientBalance, currencyCode)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Statement PDF
                </Button>
              </a>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>
                Questions about your statement?<br />
                Contact Laser Eye Institute at (248) 557-1010
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
