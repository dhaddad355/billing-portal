import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const days = parseInt(searchParams.get("days") || "30"); // Default to last 30 days

    const supabase = getServiceClient();

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get total count for the date range
    const { count } = await supabase
      .from("import_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDateStr);

    // Get import logs with pagination
    const { data: logs, error } = await supabase
      .from("import_logs")
      .select(`
        id,
        account_number,
        statement_id,
        person_id,
        status,
        error_message,
        ip_address,
        user_agent,
        created_at
      `)
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error("Error fetching import logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch import logs" },
        { status: 500 }
      );
    }

    // Group logs by date
    const groupedLogs: Record<string, ImportLog[]> = {};
    for (const log of logs || []) {
      const date = new Date(log.created_at).toISOString().split("T")[0];
      if (!groupedLogs[date]) {
        groupedLogs[date] = [];
      }
      groupedLogs[date].push(log);
    }

    // Convert to array sorted by date descending
    const groupedArray: GroupedImportLogs[] = Object.entries(groupedLogs)
      .map(([date, logs]) => ({
        date,
        count: logs.length,
        logs,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Get summary statistics
    const { data: summaryData } = await supabase
      .from("import_logs")
      .select("created_at, status")
      .gte("created_at", startDateStr);

    // Calculate daily counts for the summary
    const dailyCounts: Record<string, number> = {};
    for (const log of summaryData || []) {
      const date = new Date(log.created_at).toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    return NextResponse.json({
      imports: groupedArray,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      summary: {
        totalImports: count || 0,
        daysWithImports: Object.keys(dailyCounts).length,
        dailyCounts,
      },
    });
  } catch (error) {
    console.error("Error in imports API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
