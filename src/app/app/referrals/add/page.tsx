"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderWithPractice } from "@/types/database";

const REFERRAL_STATUSES = [
  "Scheduling",
  "Appointment",
  "Quote",
  "Procedure",
  "Post-Op",
];

export default function AddReferralPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  // Provider search
  const [providerSearch, setProviderSearch] = React.useState("");
  const [providerResults, setProviderResults] = React.useState<ProviderWithPractice[]>([]);
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderWithPractice | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = React.useState(false);
  const [searchingProvider, setSearchingProvider] = React.useState(false);

  // Form state
  const [form, setForm] = React.useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_dob: "",
    patient_phone: "",
    patient_email: "",
    procedure_type: "",
    procedure_location: "",
    notes: "",
    status: "Scheduling",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  // Search providers when query is 3+ chars
  React.useEffect(() => {
    const searchProviders = async () => {
      if (providerSearch.length >= 3) {
        setSearchingProvider(true);
        try {
          const res = await fetch(
            `/api/app/providers/search?q=${encodeURIComponent(providerSearch)}`
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
  };

  const clearProvider = () => {
    setSelectedProvider(null);
    setProviderSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      alert("Please select a referring provider");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/app/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          patient_full_name: `${form.patient_first_name} ${form.patient_last_name}`,
          patient_first_name: form.patient_first_name,
          patient_last_name: form.patient_last_name,
          patient_dob: form.patient_dob || null,
          patient_phone: form.patient_phone || null,
          patient_email: form.patient_email || null,
          procedure_type: form.procedure_type || null,
          procedure_location: form.procedure_location || null,
          notes: form.notes || null,
          status: form.status,
          priority: form.priority,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/app/referrals/${data.referral.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create referral");
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      alert("An error occurred while creating the referral");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Referral</h1>
        <p className="text-muted-foreground">
          Create a new patient referral from a referring physician
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Referring Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Referring Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Label htmlFor="provider_search">Search Provider *</Label>
              <div className="relative mt-1">
                <Input
                  id="provider_search"
                  placeholder="Type at least 3 characters to search..."
                  value={providerSearch}
                  onChange={(e) => {
                    setProviderSearch(e.target.value);
                    if (selectedProvider) {
                      setSelectedProvider(null);
                    }
                  }}
                  onFocus={() => {
                    if (providerResults.length > 0) {
                      setShowProviderDropdown(true);
                    }
                  }}
                />
                {searchingProvider && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>

              {/* Provider dropdown */}
              {showProviderDropdown && providerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                  {providerResults.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => selectProvider(provider)}
                      className="flex w-full flex-col px-4 py-2 text-left hover:bg-muted"
                    >
                      <span className="font-medium">
                        {provider.first_name} {provider.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {provider.practices?.name}
                        {provider.specialty && ` • ${provider.specialty}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showProviderDropdown && providerResults.length === 0 && providerSearch.length >= 3 && !searchingProvider && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
                  No providers found matching &ldquo;{providerSearch}&rdquo;
                </div>
              )}
            </div>

            {/* Selected provider display */}
            {selectedProvider && (
              <div className="mt-4 flex items-center justify-between rounded-md border bg-muted/50 p-3">
                <div>
                  <div className="font-medium">
                    {selectedProvider.first_name} {selectedProvider.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProvider.practices?.name}
                    {selectedProvider.specialty && ` • ${selectedProvider.specialty}`}
                  </div>
                  {selectedProvider.phone && (
                    <div className="text-sm text-muted-foreground">
                      {selectedProvider.phone}
                    </div>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearProvider}>
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_first_name">First Name *</Label>
                <Input
                  id="patient_first_name"
                  value={form.patient_first_name}
                  onChange={(e) =>
                    setForm({ ...form, patient_first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="patient_last_name">Last Name *</Label>
                <Input
                  id="patient_last_name"
                  value={form.patient_last_name}
                  onChange={(e) =>
                    setForm({ ...form, patient_last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="patient_dob">Date of Birth</Label>
                <Input
                  id="patient_dob"
                  type="date"
                  value={form.patient_dob}
                  onChange={(e) => setForm({ ...form, patient_dob: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="patient_phone">Phone</Label>
                <Input
                  id="patient_phone"
                  type="tel"
                  value={form.patient_phone}
                  onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="patient_email">Email</Label>
                <Input
                  id="patient_email"
                  type="email"
                  value={form.patient_email}
                  onChange={(e) => setForm({ ...form, patient_email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Details */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="procedure_type">Procedure Type</Label>
                <Input
                  id="procedure_type"
                  placeholder="e.g., Cataract Surgery"
                  value={form.procedure_type}
                  onChange={(e) => setForm({ ...form, procedure_type: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="procedure_location">Location</Label>
                <Input
                  id="procedure_location"
                  placeholder="e.g., Main Office"
                  value={form.procedure_location}
                  onChange={(e) =>
                    setForm({ ...form, procedure_location: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {REFERRAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as "low" | "normal" | "high" | "urgent",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                placeholder="Additional notes about the referral..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/app/referrals")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              saving ||
              !selectedProvider ||
              !form.patient_first_name ||
              !form.patient_last_name
            }
          >
            {saving ? "Creating..." : "Create Referral"}
          </Button>
        </div>
      </form>
    </div>
  );
}
