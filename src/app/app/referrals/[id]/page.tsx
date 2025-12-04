"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReferralWithRelations, ReferralNoteWithUser } from "@/types/database";

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

export default function ReferralDetailPage() {
  const router = useRouter();
  const params = useParams();
  const referralId = params.id as string;

  const [referral, setReferral] = React.useState<ReferralWithRelations | null>(null);
  const [notes, setNotes] = React.useState<ReferralNoteWithUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);

  // Edit form state
  const [form, setForm] = React.useState({
    status: "" as "OPEN" | "CLOSED",
    sub_status: "" as "Scheduling" | "Appointment" | "Quote" | "Procedure" | "Post-Op",
    priority: "" as "low" | "normal" | "high" | "urgent",
    procedure_type: "",
    procedure_location: "",
    patient_phone: "",
    patient_email: "",
  });

  // New note state
  const [newNote, setNewNote] = React.useState("");
  const [addingNote, setAddingNote] = React.useState(false);

  const fetchReferral = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/app/referrals/${referralId}`);
      if (!res.ok) {
        router.push("/app/referrals");
        return;
      }
      const data = await res.json();
      setReferral(data.referral);
      setNotes(data.notes || []);
      setForm({
        status: data.referral.status,
        sub_status: data.referral.sub_status,
        priority: data.referral.priority,
        procedure_type: data.referral.procedure_type || "",
        procedure_location: data.referral.procedure_location || "",
        patient_phone: data.referral.patient_phone || "",
        patient_email: data.referral.patient_email || "",
      });
    } catch (error) {
      console.error("Error fetching referral:", error);
    } finally {
      setLoading(false);
    }
  }, [referralId, router]);

  React.useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/app/referrals/${referralId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          sub_status: form.sub_status,
          priority: form.priority,
          procedure_type: form.procedure_type || null,
          procedure_location: form.procedure_location || null,
          patient_phone: form.patient_phone || null,
          patient_email: form.patient_email || null,
        }),
      });

      if (res.ok) {
        setEditMode(false);
        fetchReferral();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving referral:", error);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });

      if (res.ok) {
        setNewNote("");
        fetchReferral();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading referral...</div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-muted-foreground">Referral not found</div>
        <Link href="/app/referrals" className="mt-2">
          <Button variant="outline">Back to Referrals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/app/referrals" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold">
            {referral.patient_full_name}
          </h1>
          <p className="text-muted-foreground">
            Referred by {referral.providers?.first_name} {referral.providers?.last_name}
            {referral.providers?.practices?.name && ` • ${referral.providers.practices.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Edit</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {referral.patient_full_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date of Birth</div>
                <div className="font-medium">{formatDate(referral.patient_dob)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                {editMode ? (
                  <Input
                    value={form.patient_phone}
                    onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                  />
                ) : (
                  <div className="font-medium">{referral.patient_phone || "—"}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                {editMode ? (
                  <Input
                    type="email"
                    value={form.patient_email}
                    onChange={(e) => setForm({ ...form, patient_email: e.target.value })}
                  />
                ) : (
                  <div className="font-medium">{referral.patient_email || "—"}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Status */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                {editMode ? (
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "OPEN" | "CLOSED" })}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                ) : (
                  <Badge className={`mt-1 ${STATUS_COLORS[referral.status] || ""}`}>
                    {referral.status}
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sub Status</div>
                {editMode ? (
                  <select
                    value={form.sub_status}
                    onChange={(e) =>
                      setForm({ ...form, sub_status: e.target.value as "Scheduling" | "Appointment" | "Quote" | "Procedure" | "Post-Op" })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {REFERRAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge className={`mt-1 ${STATUS_COLORS[referral.sub_status] || ""}`}>
                    {referral.sub_status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Priority</div>
                {editMode ? (
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as "low" | "normal" | "high" | "urgent",
                      })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <Badge className={`mt-1 ${referral.priority ? PRIORITY_COLORS[referral.priority] : ""}`}>
                    {referral.priority || "normal"}
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="mt-1 font-medium">{formatDate(referral.created_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Procedure Info */}
        <Card>
          <CardHeader>
            <CardTitle>Procedure Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Procedure Type</div>
              {editMode ? (
                <Input
                  value={form.procedure_type}
                  onChange={(e) => setForm({ ...form, procedure_type: e.target.value })}
                />
              ) : (
                <div className="font-medium">{referral.procedure_type || "—"}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              {editMode ? (
                <Input
                  value={form.procedure_location}
                  onChange={(e) => setForm({ ...form, procedure_location: e.target.value })}
                />
              ) : (
                <div className="font-medium">{referral.procedure_location || "—"}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Provider Info */}
        <Card>
          <CardHeader>
            <CardTitle>Referring Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Provider</div>
              <div className="font-medium">
                {referral.providers?.first_name} {referral.providers?.last_name}
              </div>
              {referral.providers?.specialty && (
                <div className="text-sm text-muted-foreground">
                  {referral.providers.specialty}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Practice</div>
              <div className="font-medium">{referral.providers?.practices?.name || "—"}</div>
            </div>
            {referral.providers?.phone && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{referral.providers.phone}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Notes & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Note Form */}
          <div className="mb-6 flex gap-2">
            <Input
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
            <Button onClick={addNote} disabled={!newNote.trim() || addingNote}>
              {addingNote ? "Adding..." : "Add Note"}
            </Button>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No notes yet. Add the first note above.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-lg border p-4 ${
                    note.note_type === "system" ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={note.note_type === "system" ? "outline" : "secondary"}>
                        {note.note_type === "system" ? "System" : "Note"}
                      </Badge>
                      {note.users && (
                        <span className="text-sm font-medium">
                          {note.users.display_name || note.users.email}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(note.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
