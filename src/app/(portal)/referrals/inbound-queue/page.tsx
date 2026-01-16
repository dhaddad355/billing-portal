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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InboundReferral } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONVERTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function InboundQueuePage() {
  const [inboundReferrals, setInboundReferrals] = React.useState<InboundReferral[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);

  // Filters
  const [filters, setFilters] = React.useState({
    status: "PENDING", // Default to show only pending
    search: "",
  });

  const fetchInboundReferrals = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/inbound-referrals?${params}`);
      const data = await res.json();
      setInboundReferrals(data.inbound_referrals || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching inbound referrals:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  React.useEffect(() => {
    fetchInboundReferrals();
  }, [fetchInboundReferrals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInboundReferrals();
  };

  const clearFilters = () => {
    setFilters({ status: "PENDING", search: "" });
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
          <h1 className="text-2xl font-bold">Inbound Referral Queue</h1>
          <p className="text-muted-foreground">
            Review and process referrals from external sources
          </p>
        </div>
        <Link href="/referrals">
          <Button variant="outline">View All Referrals</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">Search by Patient Name</label>
              <Input
                placeholder="Patient name..."
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
                <option value="PENDING">Pending</option>
                <option value="CONVERTED">Converted</option>
                <option value="REJECTED">Rejected</option>
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
              <div className="text-muted-foreground">Loading inbound referrals...</div>
            </div>
          ) : inboundReferrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground">No inbound referrals found</div>
              {filters.status === "PENDING" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  All caught up! No pending referrals to process.
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Provider/Practice</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inboundReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="font-medium">
                          {referral.patient_full_name ||
                            `${referral.patient_first_name || ""} ${
                              referral.patient_last_name || ""
                            }`.trim() ||
                            "—"}
                        </div>
                        {referral.patient_dob && (
                          <div className="text-sm text-muted-foreground">
                            DOB: {referral.patient_dob}
                          </div>
                        )}
                        {referral.patient_phone && (
                          <div className="text-sm text-muted-foreground">
                            {referral.patient_phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {referral.provider_name && (
                            <div className="font-medium">{referral.provider_name}</div>
                          )}
                          {referral.practice_name && (
                            <div className="text-muted-foreground">
                              {referral.practice_name}
                            </div>
                          )}
                          {!referral.provider_name && !referral.practice_name && "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {referral.referral_reason || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[referral.status] || ""}>
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(referral.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/referrals/inbound-queue/${referral.id}`}>
                          <Button variant="outline" size="sm">
                            {referral.status === "PENDING" ? "Process" : "View"}
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
                    {Math.min(page * limit, total)} of {total} inbound referrals
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
