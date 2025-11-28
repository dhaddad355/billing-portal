import { getServiceClient, STORAGE_BUCKET } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatementActions from "./statement-actions";

interface StatementPageProps {
  params: { id: string };
}

export default async function StatementPage({ params }: StatementPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const supabase = getServiceClient();

  const { data: statement, error } = await supabase
    .from("statements")
    .select(`
      *,
      persons (
        full_name,
        first_name,
        last_name,
        email_address,
        cell_phone,
        date_of_birth
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !statement) {
    notFound();
  }

  // Generate signed URL for PDF preview
  const { data: signedUrlData } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(statement.pdf_path, 3600);

  const pdfUrl = signedUrlData?.signedUrl;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "SENT":
        return <Badge variant="success">Sent</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statement Details</h1>
        {getStatusBadge(statement.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statement Info */}
        <Card>
          <CardHeader>
            <CardTitle>Statement Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Patient Name</label>
                <p className="font-medium">{statement.persons?.full_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Account Number</label>
                <p className="font-medium">{statement.account_number_suffix}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Statement Date</label>
                <p className="font-medium">{formatDate(statement.statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Amount Due</label>
                <p className="font-medium text-xl">
                  {formatCurrency(statement.patient_balance, statement.currency_code)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Statement Date</label>
                <p className="font-medium">{formatDate(statement.last_statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Pay Date</label>
                <p className="font-medium">{formatDate(statement.last_pay_date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Next Statement Date</label>
                <p className="font-medium">{formatDate(statement.next_statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="font-medium">{formatDate(statement.created_at)}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{statement.persons?.email_address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Cell Phone</label>
                  <p className="font-medium">{statement.persons?.cell_phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Short Code Info */}
            {statement.short_code && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">View Link</h4>
                <div>
                  <label className="text-sm text-gray-500">Short Code</label>
                  <p className="font-mono">{statement.short_code}</p>
                </div>
                <div className="mt-2">
                  <label className="text-sm text-gray-500">View URL</label>
                  <p className="font-mono text-sm text-blue-600">
                    https://bill.lasereyeinstitute.com/view/{statement.short_code}
                  </p>
                </div>
                <div className="mt-2">
                  <label className="text-sm text-gray-500">View Count</label>
                  <p className="font-medium">{statement.view_count}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <StatementActions
              statementId={statement.id}
              status={statement.status}
              hasEmail={!!statement.persons?.email_address}
              hasPhone={!!statement.persons?.cell_phone}
            />
          </CardContent>
        </Card>

        {/* PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle>PDF Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {pdfUrl ? (
              <div className="space-y-4">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border rounded"
                  title="Statement PDF"
                />
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <p className="text-gray-500">PDF not available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
