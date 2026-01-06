"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronUp, Upload, FileText, Download, Lock, Unlock, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ReferralWithRelations, ReferralNoteWithUser, ReferralAttachmentWithUser, LetterTemplate, GeneratedLetterWithUser } from "@/types/database";

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

// PRIORITY_COLORS removed — not used in this file

export default function ReferralDetailPage() {
  const router = useRouter();
  const params = useParams();
  const referralId = params.id as string;

  const [referral, setReferral] = React.useState<ReferralWithRelations | null>(null);
  const [notes, setNotes] = React.useState<ReferralNoteWithUser[]>([]);
  const [attachments, setAttachments] = React.useState<ReferralAttachmentWithUser[]>([]);
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
  const [noteVisibility, setNoteVisibility] = React.useState<"public" | "private">("public");

  // File upload state
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Expandable referral notes state
  const [notesExpanded, setNotesExpanded] = React.useState(false);

  // Generate Letter state
  const [letterDialogOpen, setLetterDialogOpen] = React.useState(false);
  const [letterTemplates, setLetterTemplates] = React.useState<LetterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("");
  const [unknownVariables, setUnknownVariables] = React.useState<string[]>([]);
  const [customVariableValues, setCustomVariableValues] = React.useState<Record<string, string>>({});
  const [generatingLetter, setGeneratingLetter] = React.useState(false);
  const [generatedLetters, setGeneratedLetters] = React.useState<GeneratedLetterWithUser[]>([]);
  const [letterStep, setLetterStep] = React.useState<"select" | "variables" | "preview">("select");
  const [generatedHtml, setGeneratedHtml] = React.useState("");

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
      setAttachments(data.attachments || []);
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

  // Fetch letter templates and generated letters
  React.useEffect(() => {
    const fetchLetterData = async () => {
      try {
        const [templatesRes, lettersRes] = await Promise.all([
          fetch("/api/app/settings/letter-templates"),
          fetch(`/api/app/referrals/${referralId}/letters`),
        ]);

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setLetterTemplates((data.templates || []).filter((t: LetterTemplate) => t.is_active));
        }

        if (lettersRes.ok) {
          const data = await lettersRes.json();
          setGeneratedLetters(data.letters || []);
        }
      } catch (error) {
        console.error("Error fetching letter data:", error);
      }
    };

    if (referralId) {
      fetchLetterData();
    }
  }, [referralId]);

  const openLetterDialog = () => {
    setLetterStep("select");
    setSelectedTemplateId("");
    setUnknownVariables([]);
    setCustomVariableValues({});
    setGeneratedHtml("");
    setLetterDialogOpen(true);
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // Get template variables
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/letters`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });

      if (res.ok) {
        const data = await res.json();
        const unknownVars = data.unknown_variables || [];
        setUnknownVariables(unknownVars);
        
        // Initialize empty values for unknown variables
        const initialValues: Record<string, string> = {};
        unknownVars.forEach((v: string) => {
          initialValues[v] = "";
        });
        setCustomVariableValues(initialValues);
        
        if (unknownVars.length > 0) {
          setLetterStep("variables");
        } else {
          // No unknown variables, generate directly
          await generateLetter(templateId, {});
        }
      }
    } catch (error) {
      console.error("Error checking template variables:", error);
      alert("Failed to load template");
    }
  };

  const generateLetter = async (templateId: string, customVariables: Record<string, string>) => {
    setGeneratingLetter(true);
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          custom_variables: customVariables,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedHtml(data.html);
        setLetterStep("preview");
        
        // Refresh letters list
        const lettersRes = await fetch(`/api/app/referrals/${referralId}/letters`);
        if (lettersRes.ok) {
          const lettersData = await lettersRes.json();
          setGeneratedLetters(lettersData.letters || []);
        }
        
        // Refresh notes to show the system note
        fetchReferral();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate letter");
      }
    } catch (error) {
      console.error("Error generating letter:", error);
      alert("Failed to generate letter");
    } finally {
      setGeneratingLetter(false);
    }
  };

  const printLetter = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(generatedHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const downloadLetterHtml = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `letter-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const viewExistingLetter = async (letterId: string) => {
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/letters/${letterId}`);
      if (res.ok) {
        const data = await res.json();
        setGeneratedHtml(data.html);
        setLetterStep("preview");
        setLetterDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching letter:", error);
      alert("Failed to load letter");
    }
  };

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

  const addNote = async (visibility: "public" | "private" = "public") => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, visibility }),
      });

      if (res.ok) {
        setNewNote("");
        setNoteVisibility("public");
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/app/referrals/${referralId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchReferral();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/app/referrals/${referralId}/attachments/${attachmentId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert("Failed to download file");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
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

      <div className="space-y-4">
        {/* Patient Information - Full Width */}
        <Card>
         
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Patient</div>
                <div className="font-medium">{referral.patient_full_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date of Birth</div>
                <div className="font-medium">{formatDate(referral.patient_dob)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                {editMode ? (
                  <Input
                    value={form.patient_phone}
                    onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                    className="h-8"
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
                    className="h-8"
                  />
                ) : (
                  <div className="font-medium">{referral.patient_email || "—"}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Information - Full Width */}
        <Card>
         
          <CardContent className="space-y-6 pt-4">
            {/* First Row: Provider Details */}
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Doctor</div>
                <div className="font-medium">
                  {referral.providers?.first_name} {referral.providers?.last_name}
                </div>
                {referral.providers?.specialty && (
                  <div className="text-xs text-muted-foreground">{referral.providers.specialty}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Practice</div>
                <div className="font-medium">{referral.providers?.practices?.name || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{referral.providers?.email || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fax</div>
                <div className="font-medium">{referral.providers?.practices?.fax || "—"}</div>
              </div>
             
            </div>

            {/* Second Row: Referral Notes */}
            <div className="border-t pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-3">Referral Type <div className="font-medium text-foreground">{referral.referral_reason || "—"}</div>
                {referral.referral_reason === "Other" && referral.referral_reason_other && (
                  <div className="text-xs text-muted-foreground">{referral.referral_reason_other}</div>
                )}</div>
                



              <div className="text-sm font-medium text-muted-foreground mb-3">Referral Note</div>
              {referral.notes ? (
                <div className="relative rounded-md border bg-muted/30 p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {notesExpanded ? referral.notes : referral.notes.slice(0, 500)}
                    {!notesExpanded && referral.notes.length > 500 && (
                      <button
                        type="button"
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        className="ml-1 text-primary hover:underline"
                      >
                        more...
                      </button>
                    )}
                  </div>
                  {notesExpanded && referral.notes.length > 500 && (
                    <button
                      type="button"
                      onClick={() => setNotesExpanded(false)}
                      className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No note provided</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status - Full Width */}
        <Card>
          
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                {editMode ? (
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "OPEN" | "CLOSED" })}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Referral status"
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
                <div className="text-sm text-muted-foreground">Sub-Status</div>
                {editMode ? (
                  <select
                    value={form.sub_status}
                    onChange={(e) =>
                      setForm({ ...form, sub_status: e.target.value as "Scheduling" | "Appointment" | "Quote" | "Procedure" | "Post-Op" })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Referral sub-status"
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
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="mt-1 font-medium">{formatDate(referral.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Updated</div>
                <div className="mt-1 font-medium">{formatDate(referral.updated_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide">Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={openLetterDialog}
              disabled={letterTemplates.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Letter
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNoteVisibility("private");
                document.getElementById("note-textarea")?.focus();
              }}
            >
              <Lock className="mr-2 h-4 w-4" />
              Private Note
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNoteVisibility("public");
                document.getElementById("note-textarea")?.focus();
              }}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Public Note
            </Button>
          </div>
          {letterTemplates.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              No letter templates available. Configure templates in{" "}
              <a href="/app/settings/referrals" className="text-primary underline">
                Settings → Referrals
              </a>
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.jpeg,.jpg,.png,.gif"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload file"
          />
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide">Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Add Note Form */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={noteVisibility === "private" ? "destructive" : "secondary"}>
                {noteVisibility === "private" ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1 h-3 w-3" />
                    Public
                  </>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNoteVisibility(noteVisibility === "public" ? "private" : "public")}
              >
                Switch to {noteVisibility === "public" ? "Private" : "Public"}
              </Button>
            </div>
            <div className="flex gap-2">
              <textarea
                id="note-textarea"
                placeholder={`Add a ${noteVisibility} note... (Ctrl/Cmd+Enter to submit)`}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addNote(noteVisibility);
                  }
                }}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                onClick={() => addNote(noteVisibility)}
                disabled={!newNote.trim() || addingNote}
                className="self-start"
              >
                {addingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </div>

          {/* Activity Timeline - Merged Notes and Attachments */}
          <div className="relative">
            {notes.length === 0 && attachments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No activity yet. Add a note or upload a file above.
              </div>
            ) : (
              <>
                {/* Merge and sort notes and attachments by created_at */}
                {[
                  ...notes.map((note) => ({ type: "note" as const, data: note, created_at: note.created_at })),
                  ...attachments.map((att) => ({ type: "attachment" as const, data: att, created_at: att.created_at })),
                ]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item, index, array) => {
                    const isLast = index === array.length - 1;

                    if (item.type === "note") {
                      const note = item.data;
                      const isPrivate = note.visibility === "private";
                      const isStatusChange = note.note_type === "status_change";

                      // Color scheme based on note type
                      const circleColor = isStatusChange
                        ? "bg-blue-500"
                        : isPrivate
                        ? "bg-red-500"
                        : "bg-green-500";

                      return (
                        <div key={`note-${note.id}`} className="relative flex gap-4 pb-6">
                          {/* Vertical line */}
                          {!isLast && (
                            <div className="absolute left-[28px] top-[56px] bottom-0 w-0.5 bg-border" />
                          )}

                          {/* Icon Circle */}
                          <div className={`relative flex-shrink-0 w-14 h-14 rounded-full ${circleColor} flex items-center justify-center z-10`}>
                            {isStatusChange ? (
                              <ChevronUp className="h-6 w-6 text-white" />
                            ) : isPrivate ? (
                              <Lock className="h-6 w-6 text-white" />
                            ) : (
                              <Unlock className="h-6 w-6 text-white" />
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleString()}
                              </span>
                              {note.users && (
                                <span className="text-xs text-muted-foreground">
                                  {note.users.display_name || note.users.email}
                                </span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                          </div>
                        </div>
                      );
                    } else {
                      const attachment = item.data;
                      const fileSize = (attachment.file_size / 1024).toFixed(1);

                      return (
                        <div key={`attachment-${attachment.id}`} className="relative flex gap-4 pb-6">
                          {/* Vertical line */}
                          {!isLast && (
                            <div className="absolute left-[28px] top-[56px] bottom-0 w-0.5 bg-border" />
                          )}

                          {/* Icon Circle */}
                          <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center z-10">
                            <FileText className="h-6 w-6 text-white" />
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(attachment.created_at).toLocaleString()}
                              </span>
                              {attachment.users && (
                                <span className="text-xs text-muted-foreground">
                                  {attachment.users.display_name || attachment.users.email}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{attachment.file_name}</p>
                                <p className="text-xs text-muted-foreground">{fileSize} KB</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAttachment(attachment.id, attachment.file_name)}
                              >
                                <Download className="mr-1 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Letter Dialog */}
      <Dialog open={letterDialogOpen} onOpenChange={setLetterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {letterStep === "select" && "Generate Letter"}
              {letterStep === "variables" && "Enter Custom Values"}
              {letterStep === "preview" && "Letter Preview"}
            </DialogTitle>
            <DialogDescription>
              {letterStep === "select" && "Select a letter template to generate"}
              {letterStep === "variables" && "Please provide values for the following custom variables"}
              {letterStep === "preview" && "Your letter has been generated. You can print or download it."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Template Selection */}
          {letterStep === "select" && (
            <div className="space-y-4 py-4">
              <Label>Select Template</Label>
              <div className="space-y-2">
                {letterTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.body ? `${template.body.substring(0, 100)}...` : "No preview available"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Custom Variable Input */}
          {letterStep === "variables" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                The selected template contains custom variables that need values. Please enter the values below.
              </p>
              {unknownVariables.map((variable) => (
                <div key={variable}>
                  <Label htmlFor={`var-${variable}`}>{variable.replace(/_/g, " ")}</Label>
                  <Input
                    id={`var-${variable}`}
                    value={customVariableValues[variable] || ""}
                    onChange={(e) =>
                      setCustomVariableValues({
                        ...customVariableValues,
                        [variable]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${variable.replace(/_/g, " ").toLowerCase()}`}
                    className="mt-1"
                  />
                </div>
              ))}
              <DialogFooter>
                <Button variant="outline" onClick={() => setLetterStep("select")}>
                  Back
                </Button>
                <Button
                  onClick={() => generateLetter(selectedTemplateId, customVariableValues)}
                  disabled={generatingLetter}
                >
                  {generatingLetter ? "Generating..." : "Generate Letter"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Preview */}
          {letterStep === "preview" && (
            <div className="space-y-4 py-4">
              <div
                className="border rounded-md p-4 bg-white max-h-[50vh] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => setLetterDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={downloadLetterHtml}>
                  <Download className="mr-2 h-4 w-4" />
                  Download HTML
                </Button>
                <Button onClick={printLetter}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generated Letters Section (shown if there are any) */}
      {generatedLetters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium tracking-wide">Generated Letters</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {generatedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{letter.template_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(letter.created_at).toLocaleString()}
                        {letter.users && ` • ${letter.users.display_name || letter.users.email}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewExistingLetter(letter.id)}
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
