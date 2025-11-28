"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Code,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface PostmarkTemplate {
  templateId: number;
  name: string;
  alias: string | null;
  active: boolean;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
}

interface Settings {
  sms_message_template: string;
  email_subject_template: string;
  email_html_template: string;
  email_text_template: string;
  postmark_template_id: string;
}

const SMS_MAX_LENGTH = 160;
const SMS_SEGMENT_LENGTH = 153;

// Standard handlebars variables for billing
const STANDARD_VARIABLES = [
  { name: "{{first_name}}", description: "Patient's first name" },
  { name: "{{last_name}}", description: "Patient's last name" },
  { name: "{{full_name}}", description: "Patient's full name" },
  { name: "{{amount_due}}", description: "Total amount due (formatted as currency)" },
  { name: "{{link}}", description: "URL to view and pay the statement" },
  { name: "{{statement_date}}", description: "Date of the statement" },
  { name: "{{account_number}}", description: "Patient's account number" },
  { name: "{{due_date}}", description: "Payment due date" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    sms_message_template: "",
    email_subject_template: "",
    email_html_template: "",
    email_text_template: "",
    postmark_template_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Test SMS state
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testingSms, setTestingSms] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<"idle" | "success" | "error">("idle");
  const [testSmsMessage, setTestSmsMessage] = useState("");

  // Test Email state
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "success" | "error">("idle");
  const [testEmailMessage, setTestEmailMessage] = useState("");

  // Postmark templates state
  const [postmarkTemplates, setPostmarkTemplates] = useState<PostmarkTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PostmarkTemplate | null>(null);
  const [loadingTemplateDetails, setLoadingTemplateDetails] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/app/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({
          sms_message_template: data.settings.sms_message_template || "",
          email_subject_template: data.settings.email_subject_template || "",
          email_html_template: data.settings.email_html_template || "",
          email_text_template: data.settings.email_text_template || "",
          postmark_template_id: data.settings.postmark_template_id || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const response = await fetch("/api/app/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testSmsPhone) {
      setTestSmsMessage("Please enter a phone number");
      setTestSmsStatus("error");
      return;
    }

    setTestingSms(true);
    setTestSmsStatus("idle");
    setTestSmsMessage("");

    try {
      // Replace variables with sample data for test
      const testMessage = settings.sms_message_template
        .replace(/\{\{first_name\}\}/g, "John")
        .replace(/\{\{last_name\}\}/g, "Doe")
        .replace(/\{\{full_name\}\}/g, "John Doe")
        .replace(/\{\{amount_due\}\}/g, "$150.00")
        .replace(/\{\{link\}\}/g, "https://bill.example.com/test")
        .replace(/\{\{statement_date\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{account_number\}\}/g, "12345")
        .replace(/\{\{due_date\}\}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());

      const response = await fetch("/api/app/settings/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: testSmsPhone,
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestSmsStatus("success");
        setTestSmsMessage("Test SMS sent successfully!");
      } else {
        setTestSmsStatus("error");
        setTestSmsMessage(data.error || "Failed to send test SMS");
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      setTestSmsStatus("error");
      setTestSmsMessage("Failed to send test SMS");
    } finally {
      setTestingSms(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      setTestEmailMessage("Please enter an email address");
      setTestEmailStatus("error");
      return;
    }

    setTestingEmail(true);
    setTestEmailStatus("idle");
    setTestEmailMessage("");

    try {
      // Replace variables with sample data for test
      const replaceVars = (text: string) =>
        text
          .replace(/\{\{first_name\}\}/g, "John")
          .replace(/\{\{last_name\}\}/g, "Doe")
          .replace(/\{\{full_name\}\}/g, "John Doe")
          .replace(/\{\{amount_due\}\}/g, "$150.00")
          .replace(/\{\{link\}\}/g, "https://bill.example.com/test")
          .replace(/\{\{statement_date\}\}/g, new Date().toLocaleDateString())
          .replace(/\{\{account_number\}\}/g, "12345")
          .replace(/\{\{due_date\}\}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());

      const response = await fetch("/api/app/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: testEmailAddress,
          subject: replaceVars(settings.email_subject_template),
          htmlBody: replaceVars(settings.email_html_template),
          textBody: replaceVars(settings.email_text_template),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestEmailStatus("success");
        setTestEmailMessage("Test email sent successfully!");
      } else {
        setTestEmailStatus("error");
        setTestEmailMessage(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      setTestEmailStatus("error");
      setTestEmailMessage("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchPostmarkTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/app/settings/postmark-templates");
      if (response.ok) {
        const data = await response.json();
        setPostmarkTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching Postmark templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchTemplateDetails = async (templateId: number) => {
    setLoadingTemplateDetails(true);
    try {
      const response = await fetch("/api/app/settings/postmark-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", templateId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate(data.template);
      }
    } catch (error) {
      console.error("Error fetching template details:", error);
    } finally {
      setLoadingTemplateDetails(false);
    }
  };

  const handleUpdatePostmarkTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const response = await fetch("/api/app/settings/postmark-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          templateId: selectedTemplate.templateId,
          subject: selectedTemplate.subject,
          htmlBody: selectedTemplate.htmlBody,
          textBody: selectedTemplate.textBody,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error updating Postmark template:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const getSmsCharacterCount = () => {
    const length = settings.sms_message_template.length;
    if (length <= SMS_MAX_LENGTH) {
      return { segments: 1, remaining: SMS_MAX_LENGTH - length };
    }
    const segments = Math.ceil(length / SMS_SEGMENT_LENGTH);
    const remaining = segments * SMS_SEGMENT_LENGTH - length;
    return { segments, remaining };
  };

  const smsStats = getSmsCharacterCount();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure SMS and email templates for billing notifications
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveStatus === "success" ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Saved!
            </>
          ) : saveStatus === "error" ? (
            <>
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Error
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <Tabs defaultValue="sms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sms">
            <MessageSquare className="mr-2 h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="postmark">
            <Mail className="mr-2 h-4 w-4" />
            Postmark Templates
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Code className="mr-2 h-4 w-4" />
            Variables
          </TabsTrigger>
        </TabsList>

        {/* SMS Configuration */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration</CardTitle>
              <CardDescription>
                Configure the SMS message template sent to patients with their billing statement link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-template">SMS Message Template</Label>
                <Textarea
                  id="sms-template"
                  placeholder="Enter SMS message template..."
                  value={settings.sms_message_template}
                  onChange={(e) =>
                    setSettings({ ...settings, sms_message_template: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Use handlebars variables like {"{{first_name}}"}, {"{{amount_due}}"}, {"{{link}}"}
                  </span>
                  <span
                    className={
                      smsStats.segments > 1 ? "text-yellow-600" : "text-muted-foreground"
                    }
                  >
                    {settings.sms_message_template.length} characters •{" "}
                    {smsStats.segments} segment{smsStats.segments > 1 ? "s" : ""} •{" "}
                    {smsStats.remaining} remaining
                  </span>
                </div>
                {smsStats.segments > 1 && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ Messages over 160 characters are sent as multiple segments and may cost more.
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Send Test SMS</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="Phone number (e.g., +1234567890)"
                      value={testSmsPhone}
                      onChange={(e) => setTestSmsPhone(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestSms}
                    disabled={testingSms}
                  >
                    {testingSms ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Test
                  </Button>
                </div>
                {testSmsMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      testSmsStatus === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {testSmsMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure the email template sent to patients with their billing statement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-subject">Email Subject Line</Label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject..."
                  value={settings.email_subject_template}
                  onChange={(e) =>
                    setSettings({ ...settings, email_subject_template: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Use handlebars variables like {"{{first_name}}"}, {"{{amount_due}}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-html">Email Body (HTML)</Label>
                <Textarea
                  id="email-html"
                  placeholder="Enter HTML email body..."
                  value={settings.email_html_template}
                  onChange={(e) =>
                    setSettings({ ...settings, email_html_template: e.target.value })
                  }
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  HTML template for rich email clients. Use handlebars for variables.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-text">Email Body (Plain Text)</Label>
                <Textarea
                  id="email-text"
                  placeholder="Enter plain text email body..."
                  value={settings.email_text_template}
                  onChange={(e) =>
                    setSettings({ ...settings, email_text_template: e.target.value })
                  }
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Plain text fallback for email clients that don&apos;t support HTML.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Send Test Email</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                  >
                    {testingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Test
                  </Button>
                </div>
                {testEmailMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      testEmailStatus === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {testEmailMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postmark Templates */}
        <TabsContent value="postmark" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Postmark Templates</CardTitle>
                  <CardDescription>
                    Manage email templates directly from Postmark. Templates use handlebars syntax for variables.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchPostmarkTemplates}
                  disabled={loadingTemplates}
                >
                  {loadingTemplates ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Load Templates
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {postmarkTemplates.length === 0 ? (
                <p className="text-muted-foreground">
                  Click &quot;Load Templates&quot; to fetch your Postmark email templates.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <div className="grid gap-2">
                      {postmarkTemplates.map((template) => (
                        <button
                          key={template.templateId}
                          className={`flex items-center justify-between rounded-md border p-3 text-left hover:bg-muted ${
                            selectedTemplate?.templateId === template.templateId
                              ? "border-primary bg-muted"
                              : ""
                          }`}
                          onClick={() => fetchTemplateDetails(template.templateId)}
                        >
                          <div>
                            <div className="font-medium">{template.name}</div>
                            {template.alias && (
                              <div className="text-sm text-muted-foreground">
                                Alias: {template.alias}
                              </div>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              template.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {template.active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingTemplateDetails && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {selectedTemplate && !loadingTemplateDetails && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Edit Template: {selectedTemplate.name}</h4>

                      <div className="space-y-2">
                        <Label htmlFor="pm-subject">Subject</Label>
                        <Input
                          id="pm-subject"
                          value={selectedTemplate.subject || ""}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              subject: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pm-html">HTML Body</Label>
                        <Textarea
                          id="pm-html"
                          value={selectedTemplate.htmlBody || ""}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              htmlBody: e.target.value,
                            })
                          }
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pm-text">Text Body</Label>
                        <Textarea
                          id="pm-text"
                          value={selectedTemplate.textBody || ""}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              textBody: e.target.value,
                            })
                          }
                          className="min-h-[150px]"
                        />
                      </div>

                      <Button onClick={handleUpdatePostmarkTemplate} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Template in Postmark"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Use Postmark Template for Statements</CardTitle>
              <CardDescription>
                Instead of using the custom email templates above, you can use a Postmark template by entering its ID or alias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="postmark-template-id">Postmark Template ID or Alias</Label>
                <Input
                  id="postmark-template-id"
                  placeholder="e.g., billing-statement or 12345678"
                  value={settings.postmark_template_id}
                  onChange={(e) =>
                    setSettings({ ...settings, postmark_template_id: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to use the custom email template defined above.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables Reference */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Variables</CardTitle>
              <CardDescription>
                These handlebars variables are available for use in your SMS and email templates.
                Variables are automatically replaced with patient data when messages are sent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Variable</th>
                      <th className="p-3 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARD_VARIABLES.map((variable) => (
                      <tr key={variable.name} className="border-b last:border-0">
                        <td className="p-3">
                          <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                            {variable.name}
                          </code>
                        </td>
                        <td className="p-3 text-muted-foreground">{variable.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">Usage Example</h4>
                <p className="mb-3 text-sm text-blue-800">
                  Here&apos;s an example of how to use these variables in your templates:
                </p>
                <div className="rounded bg-white p-3 font-mono text-sm">
                  <p>Hi {"{{first_name}}"},</p>
                  <p className="mt-2">
                    Your statement of {"{{amount_due}}"} is ready to view.
                  </p>
                  <p className="mt-2">View and pay here: {"{{link}}"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
