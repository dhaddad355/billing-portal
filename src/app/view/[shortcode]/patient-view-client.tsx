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
  patientDob?: string;
  statementDate: string;
  patientBalance: number;
  currencyCode: string;
}

export default function PatientViewClient({
  shortcode,
  patientName,
  patientDob,
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
            setError("Please enter a valid date in MMDDYYYY format (e.g., 01012019).");
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
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-slate-50">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
                <span className="text-base font-bold">LEI</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Laser Eye Institute</CardTitle>
            <CardDescription className="text-base mt-1">Statement Verification</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-muted-foreground mb-6 text-center leading-relaxed">
              For your privacy and security, please verify your identity by entering your date of birth.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dob"
                    type="tel"
                    inputMode="numeric"
                    placeholder="MMDDYYYY"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="pl-10"
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enter as 8 digits (e.g., 01012019)</p>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all" disabled={verifying}>
                {verifying ? "Verifying..." : "Continue to Statement"}
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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-slate-50">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
              <span className="text-base font-bold">LEI</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Laser Eye Institute</CardTitle>
          <CardDescription className="text-base mt-1">Your Statement Details</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          <div className="space-y-8">
            {patientName && (
              <div className="text-center pb-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Patient</p>
                <p className="text-2xl font-bold text-gray-900">{patientName}</p>
                {patientDob && (
                  <p className="text-sm text-muted-foreground mt-1">
                    DOB: {formatDate(patientDob)}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Statement Date</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatDate(statementDate)}</p>
              </div>
              <div className="p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-blue-700" />
                  <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Amount Due</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(patientBalance, currencyCode)}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all" size="lg">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay Now Online
                </Button>
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-all">
                  <FileText className="mr-2 h-5 w-5" />
                  View Statement PDF
                </Button>
              </a>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t-2 pt-6 mt-2">
              <p className="font-medium text-gray-700 mb-1">Questions about your statement?</p>
              <p className="text-blue-600 font-semibold text-base">Call (248) 557-1010</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
