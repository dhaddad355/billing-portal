"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileText, Eye } from "lucide-react";
import type { LetterTemplate, LetterSettings } from "@/types/database";

// Sanitize HTML for safe rendering
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'u', 'em', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'hr', 'a'],
    ALLOWED_ATTR: ['style', 'href', 'target', 'class'],
  });
};

export default function ReferralSettingsPage() {
  const [templates, setTemplates] = React.useState<LetterTemplate[]>([]);
  const [settings, setSettings] = React.useState<LetterSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<LetterTemplate | null>(null);
  const [templateForm, setTemplateForm] = React.useState({
    name: "",
    body: "",
    is_active: true,
  });
  const [savingTemplate, setSavingTemplate] = React.useState(false);

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [settingsForm, setSettingsForm] = React.useState({
    header_html: "",
    footer_html: "",
  });
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState("");

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState<LetterTemplate | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [templatesRes, settingsRes] = await Promise.all([
        fetch("/api/settings/letter-templates"),
        fetch("/api/settings/letter-settings"),
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
        setSettingsForm({
          header_html: data.settings?.header_html || "",
          footer_html: data.settings?.footer_html || "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openNewTemplateDialog = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", body: "", is_active: true });
    setTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: LetterTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      body: template.body,
      is_active: template.is_active,
    });
    setTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return;

    setSavingTemplate(true);
    try {
      const url = editingTemplate
        ? `/api/settings/letter-templates/${editingTemplate.id}`
        : "/api/settings/letter-templates";
      
      const res = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });

      if (res.ok) {
        setTemplateDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const confirmDeleteTemplate = (template: LetterTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const deleteTemplate = async () => {
    if (!templateToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/settings/letter-templates/${templateToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings/letter-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      if (res.ok) {
        setSettingsDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const previewTemplate = (template: LetterTemplate) => {
    const fullHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">
          <strong>Header:</strong>
          ${settings?.header_html || "<em>No header configured</em>"}
        </div>
        <div style="min-height: 200px;">
          <strong>Body:</strong><br/>
          ${template.body || "<em>No body content</em>"}
        </div>
        <div style="border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
          <strong>Footer:</strong>
          ${settings?.footer_html || "<em>No footer configured</em>"}
        </div>
      </div>
    `;
    setPreviewContent(fullHtml);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Settings</h1>
        <p className="text-muted-foreground">
          Manage letter templates, header/footer settings, and referral workflow preferences
        </p>
      </div>

      {/* Letter Header/Footer Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Letter Header & Footer</CardTitle>
            <CardDescription>
              Configure the shared header and footer that appears on all letter templates
            </CardDescription>
          </div>
          <Button onClick={() => setSettingsDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Header Preview</Label>
              <div
                className="mt-2 rounded-md border bg-muted/30 p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings?.header_html || "<em>No header configured</em>") }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Footer Preview</Label>
              <div
                className="mt-2 rounded-md border bg-muted/30 p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings?.footer_html || "<em>No footer configured</em>") }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letter Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Letter Templates</CardTitle>
            <CardDescription>
              Create and manage letter templates with merge variables like {"{{Patient_First_Name}}"}
            </CardDescription>
          </div>
          <Button onClick={openNewTemplateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No letter templates yet</p>
              <p className="text-sm">Create your first template to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.body ? `${template.body.substring(0, 100)}...` : "No content"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditTemplateDialog(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Merge Variables</CardTitle>
          <CardDescription>
            Use these variables in your letter templates. They will be automatically replaced with actual data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">Patient Information</Label>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code className="rounded bg-muted px-1">{"{{Patient_First_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Patient_Last_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Patient_Full_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Patient_DOB}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Patient_Phone}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Patient_Email}}"}</code></li>
              </ul>
            </div>
            <div>
              <Label className="text-sm font-medium">Provider Information</Label>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code className="rounded bg-muted px-1">{"{{Provider_Full_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Provider_First_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Provider_Last_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Provider_Degree}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Provider_Email}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Provider_Phone}}"}</code></li>
              </ul>
            </div>
            <div>
              <Label className="text-sm font-medium">Practice & Other</Label>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code className="rounded bg-muted px-1">{"{{Practice_Name}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Practice_Phone}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Practice_Fax}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Referral_Reason}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Referral_Notes}}"}</code></li>
                <li><code className="rounded bg-muted px-1">{"{{Current_Date}}"}</code></li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>Custom Variables:</strong> You can also use custom variables like <code className="rounded bg-muted px-1">{"{{Pentacam_K_Value}}"}</code>. 
            Users will be prompted to enter values for any unknown variables when generating a letter.
          </p>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>
              Create a letter template with merge variables. Use {"{{Variable_Name}}"} syntax for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Post-Operative Report"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-body">Letter Body</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Supports HTML formatting: &lt;p&gt;, &lt;strong&gt;, &lt;u&gt;, &lt;br&gt;
              </p>
              <textarea
                id="template-body"
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Dear {{Provider_Full_Name}},

We are pleased to inform you that {{Patient_Full_Name}} has successfully completed their procedure.

<p><strong>Procedure Date:</strong> {{Current_Date}}</p>

Thank you for your referral."
                rows={12}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="template-active"
                checked={templateForm.is_active}
                onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="template-active">Active (available for selection)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={savingTemplate || !templateForm.name.trim()}>
              {savingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Header & Footer</DialogTitle>
            <DialogDescription>
              Configure the header and footer that appears on all generated letters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="header-html">Header HTML</Label>
              <textarea
                id="header-html"
                value={settingsForm.header_html}
                onChange={(e) => setSettingsForm({ ...settingsForm, header_html: e.target.value })}
                placeholder='<div style="text-align: center;">
  <h1>Your Practice Name</h1>
  <p>Address | Phone | Fax</p>
</div>'
                rows={6}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="footer-html">Footer HTML</Label>
              <textarea
                id="footer-html"
                value={settingsForm.footer_html}
                onChange={(e) => setSettingsForm({ ...settingsForm, footer_html: e.target.value })}
                placeholder='<div style="text-align: center; font-size: 12px; color: #666;">
  <p>Thank you for your referral.</p>
</div>'
                rows={6}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              This is how the letter will appear with header and footer.
            </DialogDescription>
          </DialogHeader>
          <div
            className="border rounded-md p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
          />
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTemplate} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
