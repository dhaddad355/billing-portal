"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle, Calendar, CreditCard, FileText, User, Stethoscope, CheckCircle, XCircle } from "lucide-react";

interface PatientViewClientProps {
  shortcode: string;
  patientName?: string;
  statementDate: string;
  patientBalance: number;
  currencyCode: string;
  accountNumber: string;
  paymentStatus: string | null;
}

export default function PatientViewClient({
  shortcode,
  patientName,
  statementDate,
  patientBalance,
  currencyCode,
  accountNumber,
  paymentStatus,
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
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-8" style={{ background: "linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
        <Card className="max-w-md w-full" style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)" }}>
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Image
                src="/images/logo.png"
                alt="Laser Eye Institute"
                width={64}
                height={64}
                className="rounded-xl"
              />
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

  const paymentUrl = `https://www.lasereyeinstitute.com/billpay?desc=invoice&amt=${patientBalance.toFixed(2)}&qty=1&account=${encodeURIComponent(accountNumber)}`;
  const pdfUrl = `/api/view/${shortcode}/pdf`;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8" style={{ background: "linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      <Card className="max-w-2xl w-full" style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)" }}>
        <CardHeader className="text-center border-b pb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Image
              src="/images/logo.png"
              alt="Laser Eye Institute"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Laser Eye Institute</CardTitle>
          <CardDescription className="text-base mt-1">Your Statement Details</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Patient</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{patientName || "N/A"}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Doctor</p>
                </div>
                <p className="text-lg font-bold text-gray-900">Dr. Daniel Haddad</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Statement Date</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatDate(statementDate)}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Amount Due</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(patientBalance, currencyCode)}
                </p>
              </div>
              <div className="p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  {paymentStatus === "Paid" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Status</p>
                </div>
                <p className={`text-lg font-bold ${paymentStatus === "Paid" ? "text-green-600" : "text-red-600"}`}>
                  {paymentStatus === "Paid" ? "Paid" : "Unpaid"}
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
              <p className="font-medium text-gray-700 mb-1">Need Help?</p>
              <p className="text-blue-600 font-semibold text-base">Call (248) 680-7400</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
