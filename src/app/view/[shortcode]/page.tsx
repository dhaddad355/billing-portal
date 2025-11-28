import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PatientViewClient from "./patient-view-client";

interface ViewPageProps {
  params: { shortcode: string };
}

interface StatementWithPerson {
  id: string;
  short_code: string;
  statement_date: string;
  patient_balance: number;
  currency_code: string;
  status: string;
  persons: { full_name: string } | null;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const supabase = getServiceClient();

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
      persons (
        full_name
      )
    `)
    .eq("short_code", params.shortcode)
    .single();

  if (error || !data) {
    notFound();
  }

  const statement = data as unknown as StatementWithPerson;

  if (statement.status !== "SENT") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Statement Unavailable
          </h1>
          <p className="text-gray-600">
            This statement is no longer available. Please contact Laser Eye Institute
            if you have questions about your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <PatientViewClient
      shortcode={params.shortcode}
      patientName={statement.persons?.full_name || undefined}
      statementDate={statement.statement_date}
      patientBalance={statement.patient_balance}
      currencyCode={statement.currency_code}
    />
  );
}
