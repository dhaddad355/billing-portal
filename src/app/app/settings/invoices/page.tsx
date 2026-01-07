"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Mail, MessageSquare, Info } from "lucide-react";

interface MessageTemplate {
  id: string;
  template_type: "initial" | "reminder";
  channel: "sms" | "email";
  email_subject: string | null;
  message_body: string;
  is_active: boolean;
  updated_at: string;
}

export default function InvoiceSettingsPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<MessageTemplate>>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/app/settings/message-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateKey = (type: string, channel: string) => `${type}-${channel}`;

  const getTemplate = (type: "initial" | "reminder", channel: "sms" | "email") => {
    return templates.find((t) => t.template_type === type && t.channel === channel);
  };

  const getEditedValue = (template: MessageTemplate | undefined, field: keyof MessageTemplate) => {
    if (!template) return "";
    const key = getTemplateKey(template.template_type, template.channel);
    const edited = editedTemplates[key];
    if (edited && field in edited) {
      return edited[field] as string;
    }
    return template[field] as string || "";
  };

  const handleChange = (
    type: "initial" | "reminder",
    channel: "sms" | "email",
    field: "email_subject" | "message_body",
    value: string
  ) => {
    const key = getTemplateKey(type, channel);
    setEditedTemplates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = async (type: "initial" | "reminder", channel: "sms" | "email") => {
    const key = getTemplateKey(type, channel);
    const template = getTemplate(type, channel);
    const edited = editedTemplates[key];

    if (!template || !edited) return;

    setSaving(key);
    try {
      const response = await fetch("/api/app/settings/message-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_type: type,
          channel,
          email_subject: edited.email_subject ?? template.email_subject,
          message_body: edited.message_body ?? template.message_body,
        }),
      });

      if (response.ok) {
        await fetchTemplates();
        setEditedTemplates((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    } finally {
      setSaving(null);
    }
  };

  const hasChanges = (type: "initial" | "reminder", channel: "sms" | "email") => {
    const key = getTemplateKey(type, channel);
    return !!editedTemplates[key];
  };

  const renderTemplateEditor = (
    type: "initial" | "reminder",
    channel: "sms" | "email",
    title: string,
    description: string
  ) => {
    const template = getTemplate(type, channel);
    const key = getTemplateKey(type, channel);
    const isSaving = saving === key;
    const changed = hasChanges(type, channel);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {channel === "email" ? (
                <Mail className="h-5 w-5 text-blue-600" />
              ) : (
                <MessageSquare className="h-5 w-5 text-green-600" />
              )}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {changed && (
              <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                Unsaved changes
              </Badge>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channel === "email" && (
            <div className="space-y-2">
              <Label htmlFor={`${key}-subject`}>Email Subject</Label>
              <Input
                id={`${key}-subject`}
                value={getEditedValue(template, "email_subject")}
                onChange={(e) => handleChange(type, channel, "email_subject", e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${key}-body`}>
              {channel === "email" ? "Email Body (HTML)" : "SMS Message"}
            </Label>
            <Textarea
              id={`${key}-body`}
              value={getEditedValue(template, "message_body")}
              onChange={(e) => handleChange(type, channel, "message_body", e.target.value)}
              placeholder={channel === "email" ? "Enter email HTML..." : "Enter SMS message..."}
              rows={channel === "email" ? 12 : 4}
              className="font-mono text-sm"
            />
            {channel === "sms" && (
              <p className="text-xs text-muted-foreground">
                Character count: {getEditedValue(template, "message_body").length} / 160 recommended
              </p>
            )}
          </div>
          <Button
            onClick={() => handleSave(type, channel)}
            disabled={!changed || isSaving}
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice Settings</h1>
        <p className="text-muted-foreground">
          Customize message templates for statement notifications
        </p>
      </div>

      {/* Placeholder Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">Available Placeholders</p>
              <p className="text-sm text-blue-800">
                Use these placeholders in your messages. They will be replaced with actual values when sent:
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">{"{{patient_name}}"}</code> - Patient&apos;s full name</li>
                <li><code className="bg-blue-100 px-1 rounded">{"{{balance_amount}}"}</code> - Amount due (e.g., $150.00)</li>
                <li><code className="bg-blue-100 px-1 rounded">{"{{view_url}}"}</code> - Link to view and pay statement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="initial" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="initial">Initial Messages</TabsTrigger>
          <TabsTrigger value="reminder">Reminder Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="initial" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {renderTemplateEditor(
              "initial",
              "sms",
              "Initial SMS",
              "Sent when a statement is first delivered to the patient"
            )}
            {renderTemplateEditor(
              "initial",
              "email",
              "Initial Email",
              "Email sent when a statement is first delivered to the patient"
            )}
          </div>
        </TabsContent>

        <TabsContent value="reminder" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {renderTemplateEditor(
              "reminder",
              "sms",
              "Reminder SMS",
              "Sent when a payment reminder is triggered"
            )}
            {renderTemplateEditor(
              "reminder",
              "email",
              "Reminder Email",
              "Email sent when a payment reminder is triggered"
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
