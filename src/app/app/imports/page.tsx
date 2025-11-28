"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  History,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react";

interface ImportLog {
  id: string;
  account_number: string;
  statement_id: string | null;
  person_id: number | null;
  status: string;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface GroupedImportLogs {
  date: string;
  count: number;
  logs: ImportLog[];
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Summary {
  totalImports: number;
  daysWithImports: number;
  dailyCounts: Record<string, number>;
}

export default function ImportsPage() {
  const [imports, setImports] = useState<GroupedImportLogs[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [summary, setSummary] = useState<Summary>({
    totalImports: 0,
    daysWithImports: 0,
    dailyCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [daysFilter, setDaysFilter] = useState(30);

  const fetchImports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/app/imports?page=${pagination.page}&pageSize=${pagination.pageSize}&days=${daysFilter}`
      );
      if (response.ok) {
        const data = await response.json();
        setImports(data.imports);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
        setSummary(data.summary);
        // Auto-expand the first date if there are results
        if (data.imports.length > 0) {
          setExpandedDates(new Set([data.imports[0].date]));
        }
      }
    } catch (error) {
      console.error("Error fetching imports:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, daysFilter]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "SUCCESS") {
      return (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Success
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
        <XCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  };

  const dayFilterOptions = [
    { value: 7, label: "Last 7 days" },
    { value: 30, label: "Last 30 days" },
    { value: 90, label: "Last 90 days" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Imports
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalImports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last {daysFilter} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days with Imports
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.daysWithImports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active import days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Daily Imports
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.daysWithImports > 0
                ? Math.round(summary.totalImports / summary.daysWithImports)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Statements per active day
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Imports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.dailyCounts[new Date().toISOString().split("T")[0]] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Statements imported today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Import History Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                Track all API calls from the on-premise application
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={daysFilter}
                onChange={(e) => {
                  setDaysFilter(Number(e.target.value));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                {dayFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <History className="mr-2 h-4 w-4 animate-pulse" />
              Loading import history...
            </div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="mb-2 h-8 w-8" />
              <p>No imports found in the last {daysFilter} days.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {imports.map((group) => (
                  <div key={group.date} className="rounded-lg border">
                    <button
                      onClick={() => toggleDate(group.date)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{formatDate(group.date)}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-sm">
                          {group.count} statement{group.count !== 1 ? "s" : ""}
                        </Badge>
                        <span className="text-muted-foreground">
                          {expandedDates.has(group.date) ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>
                    {expandedDates.has(group.date) && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-medium">Time</TableHead>
                              <TableHead className="font-medium">Account Number</TableHead>
                              <TableHead className="font-medium">Status</TableHead>
                              <TableHead className="font-medium">IP Address</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.logs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-muted-foreground">
                                  {formatTime(log.created_at)}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {log.account_number}
                                </TableCell>
                                <TableCell>{getStatusBadge(log.status)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {log.ip_address || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {imports.reduce((acc, g) => acc + g.logs.length, 0)} of{" "}
                  {pagination.total} imports
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={pagination.pageSize}
                      onChange={(e) =>
                        setPagination((prev) => ({
                          ...prev,
                          pageSize: Number(e.target.value),
                          page: 1,
                        }))
                      }
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
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
