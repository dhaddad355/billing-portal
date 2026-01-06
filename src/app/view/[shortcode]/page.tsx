import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PatientViewClient from "./patient-view-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ViewPageProps {
  params: Promise<{ shortcode: string }>;
}

interface StatementWithPerson {
  id: string;
  short_code: string;
  statement_date: string;
  patient_balance: number;
  currency_code: string;
  status: string;
  account_number_full: string;
  persons: { full_name: string; date_of_birth: string | null } | null;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const supabase = getServiceClient();
  const { shortcode } = await params;

  // Fetch statement by shortcode (minimal data for privacy)
  const { data, error } = await supabase
    .from("statements")
    .select(`
      id,
      short_code,
      statement_date,
      patient_balance,
      currency_code,
      status,
      account_number_full,
      persons (
        full_name,
        date_of_birth
      )
    `)
    .eq("short_code", shortcode)
    .single();

  if (error || !data) {
    notFound();
  }

  const statement = data as unknown as StatementWithPerson;

  if (statement.status !== "SENT") {
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
            <CardDescription>MyLEI Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Statement Unavailable</h2>
              <p className="text-muted-foreground">
                This statement is no longer available. Please contact Laser Eye Institute
                if you have questions about your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <PatientViewClient
      shortcode={shortcode}
      patientName={statement.persons?.full_name || undefined}
      statementDate={statement.statement_date}
      patientBalance={statement.patient_balance}
      currencyCode={statement.currency_code}
      accountNumber={statement.account_number_full}
    />
  );
}
