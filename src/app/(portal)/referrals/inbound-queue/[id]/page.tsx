"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InboundReferral, ProviderWithPractice } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONVERTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ProcessInboundReferralPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inboundReferral, setInboundReferral] = React.useState<InboundReferral | null>(null);

  // Provider search
  const [providerSearch, setProviderSearch] = React.useState("");
  const [providerResults, setProviderResults] = React.useState<ProviderWithPractice[]>([]);
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderWithPractice | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = React.useState(false);
  const [searchingProvider, setSearchingProvider] = React.useState(false);

  // Editable form data
  const [form, setForm] = React.useState({
    patient_full_name: "",
    patient_dob: "",
    patient_phone: "",
    patient_email: "",
    referral_reason: "Laser Vision Correction" as "Laser Vision Correction" | "Cataract Consultation" | "Other",
    referral_reason_other: "",
    scheduling_preference: "Call Patient" as "Call Patient" | "SMS Patient" | "Email Patient" | "Patient Instructed To Call",
    communication_preference: "Email" as "Email" | "Fax",
    communication_value: "",
    notes: "",
  });

  // Load inbound referral
  React.useEffect(() => {
    const fetchInboundReferral = async () => {
      try {
        const res = await fetch(`/api/inbound-referral-queue/${id}`);
        const data = await res.json();
        if (data.inbound_referral) {
          const ref = data.inbound_referral;
          setInboundReferral(ref);

          // Pre-populate form with data from inbound referral
          setForm({
            patient_full_name: ref.patient_full_name || 
              `${ref.patient_first_name || ""} ${ref.patient_last_name || ""}`.trim(),
            patient_dob: ref.patient_dob || "",
            patient_phone: ref.patient_phone || "",
            patient_email: ref.patient_email || "",
            referral_reason: (ref.referral_reason || "Laser Vision Correction") as typeof form.referral_reason,
            referral_reason_other: ref.referral_reason_other || "",
            scheduling_preference: (ref.scheduling_preference || "Call Patient") as typeof form.scheduling_preference,
            communication_preference: (ref.communication_preference || "Email") as typeof form.communication_preference,
            communication_value: ref.communication_value || ref.provider_email || "",
            notes: ref.notes || "",
          });

          // Set provider search if we have provider name
          if (ref.provider_name) {
            setProviderSearch(ref.provider_name);
          }
        }
      } catch (error) {
        console.error("Error fetching inbound referral:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInboundReferral();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Search providers when query is 3+ chars
  React.useEffect(() => {
    const searchProviders = async () => {
      if (providerSearch.length >= 3) {
        setSearchingProvider(true);
        try {
          const res = await fetch(
            `/api/providers/search?q=${encodeURIComponent(providerSearch)}`
          );
          const data = await res.json();
          setProviderResults(data.providers || []);
          setShowProviderDropdown(true);
        } catch (error) {
          console.error("Error searching providers:", error);
        } finally {
          setSearchingProvider(false);
        }
      } else {
        setProviderResults([]);
        setShowProviderDropdown(false);
      }
    };

    const debounce = setTimeout(searchProviders, 300);
    return () => clearTimeout(debounce);
  }, [providerSearch]);

  const selectProvider = (provider: ProviderWithPractice) => {
    setSelectedProvider(provider);
    setProviderSearch(`${provider.first_name} ${provider.last_name}`);
    setShowProviderDropdown(false);
    setProviderResults([]);

    // Auto-populate communication value if available
    if (!form.communication_value) {
      if (form.communication_preference === "Email" && provider.email) {
        setForm(prev => ({ ...prev, communication_value: provider.email }));
      } else if (form.communication_preference === "Fax" && provider.practices?.fax) {
        setForm(prev => ({ ...prev, communication_value: provider.practices.fax }));
      }
    }
  };

  const clearProvider = () => {
    setSelectedProvider(null);
    setProviderSearch("");
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedProvider) {
      setError("Please select a referring provider");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/inbound-referral-queue/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          practice_id: selectedProvider.practice_id || null,
          patient_full_name: form.patient_full_name,
          patient_dob: form.patient_dob || null,
          patient_phone: form.patient_phone || null,
          patient_email: form.patient_email || null,
          referral_reason: form.referral_reason,
          referral_reason_other: form.referral_reason === "Other" ? form.referral_reason_other : null,
          scheduling_preference: form.scheduling_preference,
          communication_preference: form.communication_preference,
          communication_value: form.communication_value || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/referrals/${data.referral.id}`);
      } else {
        setError(data.error || "Failed to convert referral");
      }
    } catch (error) {
      console.error("Error converting referral:", error);
      setError("Failed to convert referral. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    setError(null);
    setRejecting(true);
    try {
      const res = await fetch(`/api/inbound-referral-queue/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Rejected by staff" }),
      });

      if (res.ok) {
        router.push("/referrals/inbound-queue");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reject referral");
      }
    } catch (error) {
      console.error("Error rejecting referral:", error);
      setError("Failed to reject referral. Please try again.");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!inboundReferral) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Inbound Referral Not Found</h1>
          <Button onClick={() => router.push("/referrals/inbound-queue")} className="mt-4">
            Back to Queue
          </Button>
        </div>
      </div>
    );
  }

  const isPending = inboundReferral.status === "PENDING";

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isPending ? "Process" : "View"} Inbound Referral
          </h1>
          <p className="text-muted-foreground">
            {isPending
              ? "Review and convert this referral to the main system"
              : "View details of this inbound referral"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={STATUS_COLORS[inboundReferral.status] || ""}>
            {inboundReferral.status}
          </Badge>
          <Button variant="outline" onClick={() => router.push("/referrals/inbound-queue")}>
            Back to Queue
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inboundReferral.status === "CONVERTED" && (
              <>
                <p className="text-sm">
                  <span className="font-medium">Converted At:</span>{" "}
                  {inboundReferral.converted_at
                    ? new Date(inboundReferral.converted_at).toLocaleString()
                    : "—"}
                </p>
                {inboundReferral.converted_referral_id && (
                  <Button
                    onClick={() => router.push(`/referrals/${inboundReferral.converted_referral_id}`)}
                  >
                    View Converted Referral
                  </Button>
                )}
              </>
            )}
            {inboundReferral.status === "REJECTED" && (
              <>
                <p className="text-sm">
                  <span className="font-medium">Rejected At:</span>{" "}
                  {inboundReferral.rejected_at
                    ? new Date(inboundReferral.rejected_at).toLocaleString()
                    : "—"}
                </p>
                {inboundReferral.rejection_reason && (
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {inboundReferral.rejection_reason}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleConvert} className="space-y-6">
        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Referring Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-search">
                Search for Provider {isPending && <span className="text-red-500">*</span>}
              </Label>
              {inboundReferral.provider_name && (
                <p className="text-sm text-muted-foreground">
                  Suggested: {inboundReferral.provider_name}
                  {inboundReferral.practice_name && ` (${inboundReferral.practice_name})`}
                </p>
              )}
              <div className="relative">
                <Input
                  id="provider-search"
                  placeholder="Type provider name..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  disabled={!isPending || !!selectedProvider}
                  required={isPending}
                />
                {selectedProvider && isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={clearProvider}
                  >
                    Change
                  </Button>
                )}
                {searchingProvider && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
                {showProviderDropdown && providerResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {providerResults.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => selectProvider(provider)}
                      >
                        <div className="font-medium">
                          {provider.first_name} {provider.last_name}
                          {provider.degree && `, ${provider.degree}`}
                        </div>
                        {provider.practices && (
                          <div className="text-sm text-muted-foreground">
                            {provider.practices.name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProvider && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="font-medium">
                    {selectedProvider.first_name} {selectedProvider.last_name}
                    {selectedProvider.degree && `, ${selectedProvider.degree}`}
                  </div>
                  {selectedProvider.practices && (
                    <div className="text-sm text-muted-foreground">
                      {selectedProvider.practices.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient_full_name">
                Full Name {isPending && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="patient_full_name"
                value={form.patient_full_name}
                onChange={(e) => setForm({ ...form, patient_full_name: e.target.value })}
                disabled={!isPending}
                required={isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_dob">Date of Birth</Label>
                <Input
                  id="patient_dob"
                  type="date"
                  value={form.patient_dob}
                  onChange={(e) => setForm({ ...form, patient_dob: e.target.value })}
                  disabled={!isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient_phone">Phone</Label>
                <Input
                  id="patient_phone"
                  type="tel"
                  value={form.patient_phone}
                  onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                  disabled={!isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient_email">Email</Label>
              <Input
                id="patient_email"
                type="email"
                value={form.patient_email}
                onChange={(e) => setForm({ ...form, patient_email: e.target.value })}
                disabled={!isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral Details */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral_reason">
                Referral Reason {isPending && <span className="text-red-500">*</span>}
              </Label>
              <select
                id="referral_reason"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={form.referral_reason}
                onChange={(e) =>
                  setForm({
                    ...form,
                    referral_reason: e.target.value as typeof form.referral_reason,
                  })
                }
                disabled={!isPending}
                required={isPending}
              >
                <option value="Laser Vision Correction">Laser Vision Correction</option>
                <option value="Cataract Consultation">Cataract Consultation</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {form.referral_reason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="referral_reason_other">Please Specify</Label>
                <Input
                  id="referral_reason_other"
                  value={form.referral_reason_other}
                  onChange={(e) =>
                    setForm({ ...form, referral_reason_other: e.target.value })
                  }
                  disabled={!isPending}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="scheduling_preference">
                Scheduling Preference {isPending && <span className="text-red-500">*</span>}
              </Label>
              <select
                id="scheduling_preference"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={form.scheduling_preference}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scheduling_preference: e.target.value as typeof form.scheduling_preference,
                  })
                }
                disabled={!isPending}
                required={isPending}
              >
                <option value="Call Patient">Call Patient</option>
                <option value="SMS Patient">SMS Patient</option>
                <option value="Email Patient">Email Patient</option>
                <option value="Patient Instructed To Call">Patient Instructed To Call</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="communication_preference">
                Communication Preference {isPending && <span className="text-red-500">*</span>}
              </Label>
              <select
                id="communication_preference"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={form.communication_preference}
                onChange={(e) =>
                  setForm({
                    ...form,
                    communication_preference: e.target.value as typeof form.communication_preference,
                  })
                }
                disabled={!isPending}
                required={isPending}
              >
                <option value="Email">Email</option>
                <option value="Fax">Fax</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="communication_value">
                {form.communication_preference === "Email" ? "Email Address" : "Fax Number"}
              </Label>
              <Input
                id="communication_value"
                type={form.communication_preference === "Email" ? "email" : "tel"}
                value={form.communication_value}
                onChange={(e) =>
                  setForm({ ...form, communication_value: e.target.value })
                }
                disabled={!isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={!isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={processing || rejecting}
            >
              {rejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
            <Button type="submit" disabled={processing || rejecting || !selectedProvider}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Referral"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
