"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, XCircle, AlertTriangle, Mail, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  const getSendBothDescription = () => {
    if (hasEmail && hasPhone) {
      return "Send via both email and SMS";
    }
    if (!hasEmail && !hasPhone) {
      return "No email or phone number on file";
    }
    if (!hasEmail) {
      return "No email address on file (SMS only available)";
    }
    return "No phone number on file (Email only available)";
  };

  const handleSend = async (sendEmail: boolean, sendSms: boolean) => {
    if (sending) return;
    setSending(true);
    setDialogOpen(false);
    try {
      const response = await fetch(`/api/app/statements/${statementId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          send_email: sendEmail,
          send_sms: sendSms,
        }),
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
    <div className="border-t pt-4 space-y-4">
      <div className="flex gap-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              disabled={sending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : "Send Statement"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Statement</DialogTitle>
              <DialogDescription>
                Choose how you would like to send this statement to the patient.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleSend(true, false)}
                disabled={!hasEmail}
              >
                <Mail className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Send Email Only</div>
                  <div className="text-sm text-muted-foreground">
                    {hasEmail ? "Send statement via email" : "No email address on file"}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleSend(false, true)}
                disabled={!hasPhone}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Send SMS Only</div>
                  <div className="text-sm text-muted-foreground">
                    {hasPhone ? "Send statement via text message" : "No phone number on file"}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleSend(true, true)}
                disabled={!hasEmail || !hasPhone}
              >
                <Send className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Send Both</div>
                  <div className="text-sm text-muted-foreground">
                    {getSendBothDescription()}
                  </div>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="destructive"
          onClick={handleReject}
          disabled={rejecting}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {rejecting ? "Rejecting..." : "Reject Statement"}
        </Button>
      </div>
      {!hasEmail && !hasPhone && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Warning: No email or phone number on file
        </div>
      )}
    </div>
  );
}
