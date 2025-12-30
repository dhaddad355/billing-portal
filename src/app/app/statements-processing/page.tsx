"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";

interface Person {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  cell_phone: string | null;
}

interface Statement {
  id: string;
  person_id: string;
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
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleRowClick = (statementId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or button
    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="checkbox"]') ||
      target.closest('input[type="checkbox"]')
    ) {
      return;
    }
    window.location.href = `/app/statements/${statementId}`;
  };

  const fetchStatements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/app/statements?status=${statusFilter}&page=${pagination.page}&pageSize=${pagination.pageSize}`
      );
      if (response.ok) {
        const data = await response.json();
        setStatements(data.statements);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
        setSelectedRows(new Set()); // Clear selection on data change
      }
    } catch (error) {
      console.error("Error fetching statements:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

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

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === statements.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(statements.map((s) => s.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards - matching the reference design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Statements
            </CardTitle>
            <span className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5%
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Trending up this month <TrendingUp className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <span className="flex items-center text-xs text-yellow-600">
              <Clock className="mr-1 h-3 w-3" />
              Needs attention
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusFilter === "PENDING" ? pagination.total : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent Statements
            </CardTitle>
            <span className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5%
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusFilter === "SENT" ? pagination.total : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Strong delivery rate <TrendingUp className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <span className="flex items-center text-xs text-red-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              -4.5%
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusFilter === "REJECTED" ? pagination.total : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Rejection rate decreasing <TrendingDown className="ml-1 h-3 w-3" />
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
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                Customize Columns
              </Button>
              <Button size="sm">+ Add Section</Button>
            </div>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.size === statements.length && statements.length > 0}
                          onCheckedChange={toggleAllRows}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="font-medium">Patient Name</TableHead>
                      <TableHead className="font-medium">Account #</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium text-right">Amount Due</TableHead>
                      <TableHead className="font-medium">Statement Date</TableHead>
                      <TableHead className="font-medium">Reviewer</TableHead>
                      <TableHead className="font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map((statement) => (
                      <TableRow 
                        key={statement.id} 
                        className="group cursor-pointer hover:bg-gray-50"
                        data-state={selectedRows.has(statement.id) ? "selected" : undefined}
                        onClick={(e) => handleRowClick(statement.id, e)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.has(statement.id)}
                            onCheckedChange={() => toggleRow(statement.id)}
                            aria-label={`Select ${statement.persons?.full_name || "row"}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {statement.persons?.full_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {statement.account_number_suffix}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(statement.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(statement.patient_balance, statement.currency_code)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(statement.statement_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          Staff
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/app/statements/${statement.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - matching reference design */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.size} of {pagination.total} row(s) selected.
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={pagination.pageSize}
                      onChange={(e) => setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
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
