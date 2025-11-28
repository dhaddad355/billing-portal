"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StatementActionsProps {
  statementId: string;
  status: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

export default function StatementActions({
  statementId,
  status,
  hasEmail,
  hasPhone,
}: StatementActionsProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/app/statements/${statementId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending statement:", error);
      alert("Failed to send statement");
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    if (rejecting) return;
    if (!confirm("Are you sure you want to reject this statement?")) return;
    setRejecting(true);
    try {
      const response = await fetch(`/api/app/statements/${statementId}/reject`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error rejecting statement:", error);
      alert("Failed to reject statement");
    } finally {
      setRejecting(false);
    }
  };

  if (status !== "PENDING") {
    return null;
  }

  return (
    <div className="border-t pt-4 flex gap-4">
      <Button
        variant="success"
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? "Sending..." : "Send Statement"}
      </Button>
      <Button
        variant="destructive"
        onClick={handleReject}
        disabled={rejecting}
      >
        {rejecting ? "Rejecting..." : "Reject Statement"}
      </Button>
      {!hasEmail && !hasPhone && (
        <p className="text-sm text-yellow-600 self-center">
          Warning: No email or phone number on file
        </p>
      )}
    </div>
  );
}
