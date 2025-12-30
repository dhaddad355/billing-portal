import { getServiceClient, STORAGE_BUCKET } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatementActions from "./statement-actions";
import { Clock, CheckCircle2, XCircle, ExternalLink, ArrowLeft, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

interface StatementPageProps {
  params: Promise<{ id: string }>;
}

export default async function StatementPage({ params }: StatementPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;

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
    .eq("id", id)
    .single();

  if (error || !statement) {
    notFound();
  }

  // Fetch messages sent for this statement
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("statement_id", id)
    .order("created_at", { ascending: false });

  // Generate signed URL for PDF preview
  const { data: signedUrlData } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(statement.pdf_path, 3600);

  const pdfUrl = signedUrlData?.signedUrl;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "ERROR":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/statements-processing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Statements
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Statement Details</h1>
        </div>
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
                <label className="text-sm text-muted-foreground">Patient Name</label>
                <p className="font-medium">{statement.persons?.full_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Account Number</label>
                <p className="font-medium">{statement.account_number_suffix}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statement Date</label>
                <p className="font-medium">{formatDate(statement.statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Amount Due</label>
                <p className="font-medium text-xl text-primary">
                  {formatCurrency(statement.patient_balance, statement.currency_code)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Statement Date</label>
                <p className="font-medium">{formatDate(statement.last_statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Pay Date</label>
                <p className="font-medium">{formatDate(statement.last_pay_date)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Next Statement Date</label>
                <p className="font-medium">{formatDate(statement.next_statement_date)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="font-medium">{formatDate(statement.created_at)}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{statement.persons?.email_address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cell Phone</label>
                  <p className="font-medium">{statement.persons?.cell_phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Short Code Info */}
            {statement.short_code && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">View Link</h4>
                <div>
                  <label className="text-sm text-muted-foreground">Short Code</label>
                  <p className="font-mono">{statement.short_code}</p>
                </div>
                <div className="mt-2">
                  <label className="text-sm text-muted-foreground">View URL</label>
                  <p className="font-mono text-sm text-primary">
                    https://bill.lasereyeinstitute.com/view/{statement.short_code}
                  </p>
                </div>
                <div className="mt-2">
                  <label className="text-sm text-muted-foreground">View Count</label>
                  <p className="font-medium">{statement.view_count}</p>
                </div>
              </div>
            )}

            {/* Send History */}
            {statement.sent_at && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Send History</h4>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">Sent At</label>
                  <p className="font-medium">{formatDate(statement.sent_at)}</p>
                </div>
                {messages && messages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Messages Sent</label>
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          {msg.channel === "EMAIL" ? (
                            <Mail className="h-4 w-4 text-blue-600" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium">{msg.channel}</span>
                          <span className="text-muted-foreground">to {msg.to_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={msg.status === "SENT" ? "outline" : msg.status === "FAILED" ? "destructive" : "secondary"}
                            className={msg.status === "SENT" ? "text-green-700 border-green-300 bg-green-50" : ""}
                          >
                            {msg.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.sent_at || msg.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <StatementActions
              statementId={statement.id}
              status={statement.status}
              hasEmail={!!statement.persons?.email_address}
              hasPhone={!!statement.persons?.cell_phone}
              sentAt={statement.sent_at}
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
                  className="w-full h-[600px] border rounded-md"
                  title="Statement PDF"
                />
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <p className="text-muted-foreground">PDF not available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
