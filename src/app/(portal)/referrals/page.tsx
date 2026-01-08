"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReferralWithRelations } from "@/types/database";

const REFERRAL_STATUSES = [
  "Scheduling",
  "Appointment",
  "Quote",
  "Procedure",
  "Post-Op",
];

const STATUS_COLORS: Record<string, string> = {
  Scheduling: "bg-yellow-100 text-yellow-800",
  Appointment: "bg-blue-100 text-blue-800",
  Quote: "bg-purple-100 text-purple-800",
  Procedure: "bg-green-100 text-green-800",
  "Post-Op": "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export default function ViewReferralsPage() {
  const [referrals, setReferrals] = React.useState<ReferralWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);

  // Filters
  const [filters, setFilters] = React.useState({
    status: "",
    open_status: "",
    search: "",
  });

  const fetchReferrals = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.open_status) params.append("open_status", filters.open_status);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/referrals?${params}`);
      const data = await res.json();
      setReferrals(data.referrals || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  React.useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReferrals();
  };

  const clearFilters = () => {
    setFilters({ status: "", open_status: "", search: "" });
    setPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-muted-foreground">
            View and manage all patient referrals
          </p>
        </div>
        <Link href="/app/referrals/add">
          <Button>Add Referral</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">Search</label>
              <Input
                placeholder="Patient name, provider, procedure..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                {REFERRAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="mb-1 block text-sm font-medium">Open/Closed</label>
              <select
                value={filters.open_status}
                onChange={(e) => {
                  setFilters({ ...filters, open_status: e.target.value });
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <Button type="submit">Search</Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading referrals...</div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground">No referrals found</div>
              <Link href="/app/referrals/add" className="mt-2">
                <Button variant="outline">Add your first referral</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="font-medium">
                          {referral.patient_first_name} {referral.patient_last_name}
                        </div>
                        {referral.patient_dob && (
                          <div className="text-sm text-muted-foreground">
                            DOB: {formatDate(referral.patient_dob)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          {referral.providers?.first_name}{" "}
                          {referral.providers?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {referral.providers?.practices?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {referral.procedure_type || "—"}
                        {referral.procedure_location && (
                          <div className="text-sm text-muted-foreground">
                            {referral.procedure_location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={STATUS_COLORS[referral.status] || ""}
                            variant="secondary"
                          >
                            {referral.status}
                          </Badge>
                          <Badge
                            variant={
                              referral.open_status === "OPEN"
                                ? "default"
                                : "outline"
                            }
                            className="w-fit"
                          >
                            {referral.open_status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={referral.priority ? PRIORITY_COLORS[referral.priority] : ""}
                          variant="secondary"
                        >
                          {referral.priority || "normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(referral.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/app/referrals/${referral.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, total)} of {total} referrals
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
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
