"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, XCircle, AlertTriangle, Mail, MessageSquare, DollarSign, Bell } from "lucide-react";
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
  paymentStatus: string | null;
}

export default function StatementActions({
  statementId,
  status,
  hasEmail,
  hasPhone,
  paymentStatus,
}: StatementActionsProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

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

  const handleMarkPaid = async () => {
    if (markingPaid) return;
    if (!confirm("Are you sure you want to mark this statement as paid?")) return;
    setMarkingPaid(true);
    try {
      const response = await fetch(`/api/app/statements/${statementId}/mark-paid`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error marking statement as paid:", error);
      alert("Failed to mark statement as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSendReminder = async (sendEmail: boolean, sendSms: boolean) => {
    if (sendingReminder) return;

    setSendingReminder(true);
    setReminderDialogOpen(false);
    try {
      const response = await fetch(`/api/app/statements/${statementId}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          send_email: sendEmail,
          send_sms: sendSms,
        }),
      });
      if (response.ok) {
        router.refresh();
        alert("Reminder sent successfully");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  if (status !== "PENDING" && status !== "SENT" && status !== "ERROR") {
    return null;
  }

  const isSent = status === "SENT";
  const isError = status === "ERROR";

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
              {sending ? "Sending..." : isError ? "Retry Send" : isSent ? "Resend Statement" : "Send Statement"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isError ? "Retry Sending Statement" : isSent ? "Resend Statement" : "Send Statement"}
              </DialogTitle>
              <DialogDescription>
                {isError
                  ? "⚠️ Previous send attempt failed. Select a send method to retry."
                  : isSent 
                    ? "⚠️ This statement has already been sent. Sending again will create duplicate notifications."
                    : "Choose how you would like to send this statement to the patient."
                }
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

        {/* Send Reminder Dialog - Only for SENT statements */}
        {isSent && paymentStatus !== "Paid" && (
          <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={sendingReminder}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Bell className="mr-2 h-4 w-4" />
                {sendingReminder ? "Sending..." : "Send Reminder"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Payment Reminder</DialogTitle>
                <DialogDescription>
                  Send a reminder to the patient about their outstanding balance.
                  This will use the reminder message templates.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleSendReminder(true, false)}
                  disabled={!hasEmail}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Email Reminder</div>
                    <div className="text-sm text-muted-foreground">
                      {hasEmail ? "Send reminder via email" : "No email address on file"}
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleSendReminder(false, true)}
                  disabled={!hasPhone}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">SMS Reminder</div>
                    <div className="text-sm text-muted-foreground">
                      {hasPhone ? "Send reminder via text message" : "No phone number on file"}
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleSendReminder(true, true)}
                  disabled={!hasEmail || !hasPhone}
                >
                  <Bell className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Send Both</div>
                    <div className="text-sm text-muted-foreground">
                      {getSendBothDescription()}
                    </div>
                  </div>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {!isSent && !isError && (
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejecting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {rejecting ? "Rejecting..." : "Reject Statement"}
          </Button>
        )}
        {paymentStatus !== "Paid" && (
          <Button
            variant="outline"
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {markingPaid ? "Marking..." : "Mark as Paid"}
          </Button>
        )}
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
