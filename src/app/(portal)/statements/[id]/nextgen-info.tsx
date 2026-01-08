"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NextGenBalances {
  totalAmountDue: number;
  badDebtAmount: number;
  amountDueInsurance: number;
  availableCredit: number;
  accountCredit: number;
}

interface NextGenInfoProps {
  statementId: string;
}

type LoadingState = "loading" | "success" | "error";

interface NextGenData {
  personId?: string;
  personNumber?: string;
  balances?: NextGenBalances;
  error?: string;
  message?: string;
}

export default function NextGenInfo({ statementId }: NextGenInfoProps) {
  const [state, setState] = useState<LoadingState>("loading");
  const [data, setData] = useState<NextGenData | null>(null);

  const fetchData = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(`/api/statements/${statementId}/nextgen-balances`);
      const result = await response.json();

      if (result.success) {
        setState("success");
        setData(result);
      } else {
        setState("error");
        setData(result);
      }
    } catch (error) {
      setState("error");
      setData({
        error: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch NextGen data",
      });
    }
  }, [statementId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getErrorMessage = () => {
    if (!data) return "Unknown error";

    switch (data.error) {
      case "PERSON_NOT_FOUND":
        return "No matching patient found in NextGen";
      case "MULTIPLE_PERSONS_FOUND":
        return data.message || "Multiple patients found - unable to determine which record to use";
      case "MISSING_PATIENT_DATA":
        return "Patient first name, last name, and date of birth are required";
      case "NEXTGEN_API_ERROR":
        return data.message || "NextGen API error";
      default:
        return data.message || "Failed to load NextGen data";
    }
  };

  if (state === "loading") {
    return (
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3">NextGen Information</h4>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading NextGen data...</span>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">NextGen Information</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            className="h-7 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">{getErrorMessage()}</span>
        </div>
      </div>
    );
  }

  const balances = data?.balances;
  if (!balances) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">NextGen Information</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
      {data?.personNumber && (
        <div className="mb-3">
          <label className="text-sm text-muted-foreground">Person Number</label>
          <p className="font-medium font-mono">{data.personNumber}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Total Amount Due</label>
          <p className="font-medium text-lg">{formatCurrency(balances.totalAmountDue, "USD")}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Amount Due Insurance</label>
          <p className="font-medium">{formatCurrency(balances.amountDueInsurance, "USD")}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Bad Debt Amount</label>
          <p className="font-medium">{formatCurrency(balances.badDebtAmount, "USD")}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Available Credit</label>
          <p className="font-medium">{formatCurrency(balances.availableCredit, "USD")}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Account Credit</label>
          <p className="font-medium">{formatCurrency(balances.accountCredit, "USD")}</p>
        </div>
      </div>
    </div>
  );
}
