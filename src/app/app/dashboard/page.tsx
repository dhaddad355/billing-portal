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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const filterTabs = [
    { key: "PENDING", label: "Pending", count: statusFilter === "PENDING" ? pagination.total : null },
    { key: "SENT", label: "Sent", count: statusFilter === "SENT" ? pagination.total : null },
    { key: "REJECTED", label: "Rejected", count: statusFilter === "REJECTED" ? pagination.total : null },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Statements
            </CardTitle>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline mr-1 h-3 w-3" />
              Active statements this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <div className="flex items-center text-xs text-yellow-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              -20%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusFilter === "PENDING" ? pagination.total : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingDown className="inline mr-1 h-3 w-3" />
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent Statements
            </CardTitle>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusFilter === "SENT" ? pagination.total : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +4.5%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline mr-1 h-3 w-3" />
              Steady performance increase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statements Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statements</CardTitle>
              <CardDescription>Manage patient billing statements</CardDescription>
            </div>
          </div>
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 pt-4 border-b">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <FileText className="mr-2 h-4 w-4 animate-pulse" />
              Loading statements...
            </div>
          ) : statements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-8 w-8" />
              <p>No {statusFilter.toLowerCase()} statements found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">Patient Name</TableHead>
                      <TableHead className="font-medium">Account #</TableHead>
                      <TableHead className="font-medium text-right">Amount Due</TableHead>
                      <TableHead className="font-medium">Statement Date</TableHead>
                      <TableHead className="font-medium">Last Statement</TableHead>
                      <TableHead className="font-medium">Last Pay Date</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map((statement) => (
                      <TableRow key={statement.id} className="group">
                        <TableCell className="font-medium">
                          {statement.persons?.full_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {statement.account_number_suffix}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(statement.patient_balance, statement.currency_code)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(statement.statement_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(statement.last_statement_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(statement.last_pay_date)}
                        </TableCell>
                        <TableCell>{getStatusBadge(statement.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/app/statements/${statement.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {statement.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleSend(statement.id)}
                                    disabled={sendingId === statement.id}
                                    className="text-green-600"
                                  >
                                    {sendingId === statement.id ? "Sending..." : "Send Statement"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(statement.id)}
                                    disabled={rejectingId === statement.id}
                                    className="text-red-600"
                                  >
                                    {rejectingId === statement.id ? "Rejecting..." : "Reject"}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                  0 of {pagination.total} row(s) selected.
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <span className="text-sm font-medium">{pagination.pageSize}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: pagination.totalPages }))
                      }
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
