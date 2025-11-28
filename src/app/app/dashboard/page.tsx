"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  MoreVertical,
  GripVertical,
} from "lucide-react";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  description: string;
  subdescription: string;
}

function MetricCard({ title, value, change, changeType, description, subdescription }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`flex items-center text-xs ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
          {changeType === "positive" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="flex items-center text-sm text-gray-600">
        <span>{description}</span>
        {changeType === "positive" ? (
          <TrendingUp className="h-3 w-3 ml-1 text-gray-400" />
        ) : (
          <TrendingDown className="h-3 w-3 ml-1 text-gray-400" />
        )}
      </div>
      <div className="text-xs text-gray-400 mt-1">{subdescription}</div>
    </Card>
  );
}

// Status Badge Component for data table
function StatusBadge({ status }: { status: string }) {
  if (status === "Done") {
    return (
      <span className="inline-flex items-center text-xs text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
      In Process
    </span>
  );
}

// Section Type Badge Component
function SectionTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded border border-gray-200">
      {type}
    </span>
  );
}

// Demo data for the new dashboard layout
const demoSections = [
  { id: "1", header: "Cover page", sectionType: "Cover page", status: "In Process", target: 18, limit: 5, reviewer: "Eddie Lake" },
  { id: "2", header: "Table of contents", sectionType: "Table of contents", status: "Done", target: 29, limit: 24, reviewer: "Eddie Lake" },
  { id: "3", header: "Executive summary", sectionType: "Narrative", status: "Done", target: 10, limit: 13, reviewer: "Eddie Lake" },
  { id: "4", header: "Technical approach", sectionType: "Narrative", status: "Done", target: 27, limit: 23, reviewer: "Jamik Tashpulatov" },
  { id: "5", header: "Design", sectionType: "Narrative", status: "In Process", target: 2, limit: 16, reviewer: "Jamik Tashpulatov" },
  { id: "6", header: "Capabilities", sectionType: "Narrative", status: "In Process", target: 20, limit: 8, reviewer: "Jamik Tashpulatov" },
  { id: "7", header: "Integration with existing systems", sectionType: "Narrative", status: "In Process", target: 19, limit: 21, reviewer: "Jamik Tashpulatov" },
  { id: "8", header: "Innovation and Advantages", sectionType: "Narrative", status: "Done", target: 25, limit: 26, reviewer: null },
  { id: "9", header: "Overview of EMR's Innovative Solutions", sectionType: "Technical content", status: "Done", target: 7, limit: 23, reviewer: null },
  { id: "10", header: "Advanced Algorithms and Machine Learning", sectionType: "Narrative", status: "Done", target: 30, limit: 28, reviewer: null },
];

export default function DashboardPage() {
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 68,
    totalPages: 7,
  });
  const [activeTab, setActiveTab] = useState("outline");

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with title and Quick Create button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Documents</h1>
        <Button className="bg-gray-900 text-white hover:bg-gray-800 gap-2">
          <Plus className="h-4 w-4" />
          Quick Create
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value="$1,250.00"
            change="+12.5%"
            changeType="positive"
            description="Trending up this month"
            subdescription="Visitors for the last 6 months"
          />
          <MetricCard
            title="New Customers"
            value="1,234"
            change="-20%"
            changeType="negative"
            description="Down 20% this period"
            subdescription="Acquisition needs attention"
          />
          <MetricCard
            title="Active Accounts"
            value="45,678"
            change="+12.5%"
            changeType="positive"
            description="Strong user retention"
            subdescription="Engagement exceed targets"
          />
          <MetricCard
            title="Growth Rate"
            value="4.5%"
            change="+4.5%"
            changeType="positive"
            description="Steady performance increase"
            subdescription="Meets growth projections"
          />
        </div>

        {/* Tabs and Data Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-transparent p-0 h-auto gap-0">
              <TabsTrigger
                value="outline"
                className="px-4 py-2 data-[state=active]:bg-gray-100 rounded-lg"
              >
                Outline
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="px-4 py-2 data-[state=active]:bg-gray-100 rounded-lg"
              >
                Past Performance
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-gray-200 text-gray-600 rounded">
                  3
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="personnel"
                className="px-4 py-2 data-[state=active]:bg-gray-100 rounded-lg"
              >
                Key Personnel
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-gray-200 text-gray-600 rounded">
                  2
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="px-4 py-2 data-[state=active]:bg-gray-100 rounded-lg"
              >
                Focus Documents
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Customize Columns
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>
          </div>

          <TabsContent value="outline" className="m-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-10">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="font-medium">Header</TableHead>
                      <TableHead className="font-medium">Section Type</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium text-right">Target</TableHead>
                      <TableHead className="font-medium text-right">Limit</TableHead>
                      <TableHead className="font-medium">Reviewer</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoSections.map((section) => (
                      <TableRow key={section.id} className="hover:bg-gray-50">
                        <TableCell className="py-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </TableCell>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {section.header}
                        </TableCell>
                        <TableCell>
                          <SectionTypeBadge type={section.sectionType} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={section.status} />
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {section.target}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {section.limit}
                        </TableCell>
                        <TableCell>
                          {section.reviewer ? (
                            <span className="text-gray-900">{section.reviewer}</span>
                          ) : (
                            <Button variant="outline" size="sm" className="text-gray-500">
                              Assign reviewer
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    0 of {pagination.total} row(s) selected.
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <Select
                        value={pagination.pageSize.toString()}
                        onChange={(e) =>
                          setPagination((prev) => ({
                            ...prev,
                            pageSize: parseInt(e.target.value),
                          }))
                        }
                        className="w-16"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </Select>
                    </div>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: 1 }))
                        }
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Past Performance content will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personnel">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Key Personnel content will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Focus Documents content will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
