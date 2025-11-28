"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

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
      <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-900">Laser Eye Institute</CardTitle>
            <CardDescription>Statement Verification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6 text-center">
              For your privacy, please verify your identity by entering your date of birth.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
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
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl text-blue-900">Laser Eye Institute</CardTitle>
          <CardDescription>Your Statement</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {patientName && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Statement for</p>
                <p className="text-xl font-semibold">{patientName}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Statement Date</p>
                <p className="font-semibold">{formatDate(statementDate)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(patientBalance, currencyCode)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full" size="lg">
                  Pay Now
                </Button>
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  Download Statement PDF
                </Button>
              </a>
            </div>

            <div className="text-center text-sm text-gray-500 border-t pt-4">
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
