"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Person {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  cell_phone: string | null;
}

interface Statement {
  id: string;
  person_id: number;
  statement_date: string;
  account_number_suffix: number;
  patient_balance: number;
  currency_code: string;
  last_statement_date: string | null;
  last_pay_date: string | null;
  short_code: string | null;
  view_count: number;
  status: string;
  created_at: string;
  sent_at: string | null;
  persons: Person;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function DashboardPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchStatements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/app/statements?status=${statusFilter}&page=${pagination.page}`
      );
      if (response.ok) {
        const data = await response.json();
        setStatements(data.statements);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching statements:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  const handleSend = async (id: string) => {
    if (sendingId) return;
    setSendingId(id);
    try {
      const response = await fetch(`/api/app/statements/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        fetchStatements();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending statement:", error);
      alert("Failed to send statement");
    } finally {
      setSendingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (rejectingId) return;
    if (!confirm("Are you sure you want to reject this statement?")) return;
    setRejectingId(id);
    try {
      const response = await fetch(`/api/app/statements/${id}/reject`, {
        method: "POST",
      });
      if (response.ok) {
        fetchStatements();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error rejecting statement:", error);
      alert("Failed to reject statement");
    } finally {
      setRejectingId(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Statement Dashboard</h1>
      </div>

      {/* Status Filter */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["PENDING", "SENT", "REJECTED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(status);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {statusFilter} Statements ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : statements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No {statusFilter.toLowerCase()} statements found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead>Statement Date</TableHead>
                    <TableHead>Last Statement</TableHead>
                    <TableHead>Last Pay Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">
                        {statement.persons?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{statement.account_number_suffix}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(statement.patient_balance, statement.currency_code)}
                      </TableCell>
                      <TableCell>{formatDate(statement.statement_date)}</TableCell>
                      <TableCell>{formatDate(statement.last_statement_date)}</TableCell>
                      <TableCell>{formatDate(statement.last_pay_date)}</TableCell>
                      <TableCell>{formatDate(statement.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(statement.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/app/statements/${statement.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {statement.status === "PENDING" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSend(statement.id)}
                                disabled={sendingId === statement.id}
                              >
                                {sendingId === statement.id ? "Sending..." : "Send"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(statement.id)}
                                disabled={rejectingId === statement.id}
                              >
                                {rejectingId === statement.id ? "..." : "Reject"}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
