"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Practice, ProviderWithPractice } from "@/types/database";

export default function ManageProvidersPage() {
  const [practices, setPractices] = React.useState<Practice[]>([]);
  const [providers, setProviders] = React.useState<ProviderWithPractice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"providers" | "practices">("providers");

  // Provider form state
  const [providerForm, setProviderForm] = React.useState({
    id: "",
    first_name: "",
    last_name: "",
    npi: "",
    specialty: "",
    phone: "",
    email: "",
    practice_id: "",
  });
  const [editingProvider, setEditingProvider] = React.useState(false);

  // Practice form state
  const [practiceForm, setPracticeForm] = React.useState({
    id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    fax: "",
  });
  const [editingPractice, setEditingPractice] = React.useState(false);

  // Modals
  const [showProviderModal, setShowProviderModal] = React.useState(false);
  const [showPracticeModal, setShowPracticeModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState<{
    type: "provider" | "practice";
    id: string;
    name: string;
  } | null>(null);

  // CSV Import state
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    success: number;
    skipped: number;
    errors: number;
    details: {
      row: number;
      status: "success" | "skipped" | "error";
      message: string;
      provider?: string;
    }[];
  } | null>(null);

  // Filter state
  const [showUnmappedOnly, setShowUnmappedOnly] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [practicesRes, providersRes] = await Promise.all([
        fetch("/api/app/practices"),
        fetch("/api/app/providers"),
      ]);
      const practicesData = await practicesRes.json();
      const providersData = await providersRes.json();
      setPractices(practicesData.practices || []);
      setProviders(providersData.providers || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Provider handlers
  const openAddProvider = () => {
    setProviderForm({
      id: "",
      first_name: "",
      last_name: "",
      npi: "",
      specialty: "",
      phone: "",
      email: "",
      practice_id: practices[0]?.id || "",
    });
    setEditingProvider(false);
    setShowProviderModal(true);
  };

  const openEditProvider = (provider: ProviderWithPractice) => {
    setProviderForm({
      id: provider.id,
      first_name: provider.first_name,
      last_name: provider.last_name,
      npi: provider.npi || "",
      specialty: provider.specialty || "",
      phone: provider.phone || "",
      email: provider.email || "",
      practice_id: provider.practice_id || "",
    });
    setEditingProvider(true);
    setShowProviderModal(true);
  };

  const saveProvider = async () => {
    try {
      const url = editingProvider
        ? `/api/app/providers/${providerForm.id}`
        : "/api/app/providers";
      const method = editingProvider ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: providerForm.first_name,
          last_name: providerForm.last_name,
          npi: providerForm.npi || null,
          specialty: providerForm.specialty || null,
          phone: providerForm.phone || null,
          email: providerForm.email || null,
          practice_id: providerForm.practice_id,
        }),
      });

      if (res.ok) {
        setShowProviderModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save provider");
      }
    } catch (error) {
      console.error("Error saving provider:", error);
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      const res = await fetch(`/api/app/providers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting provider:", error);
    }
  };

  // Practice handlers
  const openAddPractice = () => {
    setPracticeForm({
      id: "",
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      fax: "",
    });
    setEditingPractice(false);
    setShowPracticeModal(true);
  };

  const openEditPractice = (practice: Practice) => {
    setPracticeForm({
      id: practice.id,
      name: practice.name,
      address: practice.address || "",
      city: practice.city || "",
      state: practice.state || "",
      zip: practice.zip || "",
      phone: practice.phone || "",
      fax: practice.fax || "",
    });
    setEditingPractice(true);
    setShowPracticeModal(true);
  };

  const savePractice = async () => {
    try {
      const url = editingPractice
        ? `/api/app/practices/${practiceForm.id}`
        : "/api/app/practices";
      const method = editingPractice ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: practiceForm.name,
          address: practiceForm.address || null,
          city: practiceForm.city || null,
          state: practiceForm.state || null,
          zip: practiceForm.zip || null,
          phone: practiceForm.phone || null,
          fax: practiceForm.fax || null,
        }),
      });

      if (res.ok) {
        setShowPracticeModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save practice");
      }
    } catch (error) {
      console.error("Error saving practice:", error);
    }
  };

  const deletePractice = async (id: string) => {
    try {
      const res = await fetch(`/api/app/practices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete practice");
      }
    } catch (error) {
      console.error("Error deleting practice:", error);
    }
  };

  // CSV Import handlers
  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setShowImportModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/app/providers/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImportResult(data.result);
        // Refresh providers list
        fetchData();
      } else {
        alert(data.error || "Failed to import providers");
      }
    } catch (error) {
      console.error("Error importing providers:", error);
      alert("An error occurred during import");
    } finally {
      setImporting(false);
    }
  };

  // Filter providers based on unmapped filter
  const filteredProviders = showUnmappedOnly
    ? providers.filter((p) => !p.practice_id)
    : providers;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Providers</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage referring physicians and their practices
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("providers")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "providers"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Providers ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab("practices")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "practices"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Practices ({practices.length})
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Referring Physicians</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportModal}>
                Import CSV
              </Button>
              <Button onClick={openAddProvider}>Add Provider</Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter controls */}
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showUnmappedOnly}
                  onChange={(e) => setShowUnmappedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Show unmapped providers only
              </label>
              {showUnmappedOnly && (
                <Badge variant="secondary">
                  {filteredProviders.length} unmapped provider{filteredProviders.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>NPI</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.first_name} {provider.last_name}
                    </TableCell>
                    <TableCell>
                      {provider.practices?.name ? (
                        <Badge variant="secondary">
                          {provider.practices.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{provider.specialty || "—"}</TableCell>
                    <TableCell>{provider.npi || "—"}</TableCell>
                    <TableCell>{provider.phone || "—"}</TableCell>
                    <TableCell>{provider.email || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditProvider(provider)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setShowDeleteModal({
                            type: "provider",
                            id: provider.id,
                            name: `${provider.first_name} ${provider.last_name}`,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProviders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {showUnmappedOnly
                        ? "No unmapped providers found."
                        : "No providers found. Add your first provider to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Practices Tab */}
      {activeTab === "practices" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Practices / Locations</CardTitle>
            <Button onClick={openAddPractice}>Add Practice</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City, State ZIP</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Fax</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {practices.map((practice) => (
                  <TableRow key={practice.id}>
                    <TableCell className="font-medium">{practice.name}</TableCell>
                    <TableCell>{practice.address || "—"}</TableCell>
                    <TableCell>
                      {[practice.city, practice.state, practice.zip]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>{practice.phone || "—"}</TableCell>
                    <TableCell>{practice.fax || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditPractice(practice)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setShowDeleteModal({
                            type: "practice",
                            id: practice.id,
                            name: practice.name,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {practices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No practices found. Add your first practice to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowProviderModal(false)}
          />
          <div className="z-10 w-full max-w-lg rounded-lg border bg-popover p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editingProvider ? "Edit Provider" : "Add Provider"}
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={providerForm.first_name}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={providerForm.last_name}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="practice_id">Practice *</Label>
                <select
                  id="practice_id"
                  value={providerForm.practice_id}
                  onChange={(e) =>
                    setProviderForm({ ...providerForm, practice_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select a practice</option>
                  {practices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    value={providerForm.specialty}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, specialty: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="npi">NPI</Label>
                  <Input
                    id="npi"
                    value={providerForm.npi}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, npi: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={providerForm.phone}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={providerForm.email}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProviderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveProvider}
                disabled={
                  !providerForm.first_name ||
                  !providerForm.last_name ||
                  !providerForm.practice_id
                }
              >
                {editingProvider ? "Save Changes" : "Add Provider"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Modal */}
      {showPracticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPracticeModal(false)}
          />
          <div className="z-10 w-full max-w-lg rounded-lg border bg-popover p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editingPractice ? "Edit Practice" : "Add Practice"}
            </h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="practice_name">Practice Name *</Label>
                <Input
                  id="practice_name"
                  value={practiceForm.name}
                  onChange={(e) =>
                    setPracticeForm({ ...practiceForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={practiceForm.address}
                  onChange={(e) =>
                    setPracticeForm({ ...practiceForm, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={practiceForm.city}
                    onChange={(e) =>
                      setPracticeForm({ ...practiceForm, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={practiceForm.state}
                    onChange={(e) =>
                      setPracticeForm({ ...practiceForm, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={practiceForm.zip}
                    onChange={(e) =>
                      setPracticeForm({ ...practiceForm, zip: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="practice_phone">Phone</Label>
                  <Input
                    id="practice_phone"
                    value={practiceForm.phone}
                    onChange={(e) =>
                      setPracticeForm({ ...practiceForm, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={practiceForm.fax}
                    onChange={(e) =>
                      setPracticeForm({ ...practiceForm, fax: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPracticeModal(false)}>
                Cancel
              </Button>
              <Button onClick={savePractice} disabled={!practiceForm.name}>
                {editingPractice ? "Save Changes" : "Add Practice"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteModal(null)}
          />
          <div className="z-10 w-full max-w-sm rounded-lg border bg-popover p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Confirm Delete</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {showDeleteModal.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  showDeleteModal.type === "provider"
                    ? deleteProvider(showDeleteModal.id)
                    : deletePractice(showDeleteModal.id)
                }
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !importing && setShowImportModal(false)}
          />
          <div className="z-10 w-full max-w-2xl rounded-lg border bg-popover p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold">Import Providers from CSV</h2>
            
            <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
              <p className="font-medium mb-2">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Required columns: <strong>First Name</strong>, <strong>Last Name</strong></li>
                <li>Optional columns: NPI, Specialty, Email, Phone</li>
                <li>Practice columns: Practice Name, Practice Address, Practice City, Practice State, Practice ZIP, Practice Phone, Practice Fax</li>
                <li>Duplicate providers (by NPI or name+email) will be skipped</li>
                <li>Practices will be auto-created or matched by name and city</li>
              </ul>
              <p className="mt-2">
                <a 
                  href="/sample-providers.csv" 
                  download 
                  className="text-blue-700 underline hover:text-blue-800"
                >
                  Download sample CSV template
                </a>
              </p>
            </div>

            {!importResult ? (
              <>
                <div className="mb-4">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,.xls"
                    onChange={handleFileChange}
                    disabled={importing}
                    className="mt-1"
                  />
                  {importFile && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                  >
                    {importing ? "Importing..." : "Import Providers"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-md bg-green-50 border border-green-200 p-3 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {importResult.success}
                      </div>
                      <div className="text-sm text-green-600">Imported</div>
                    </div>
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-700">
                        {importResult.skipped}
                      </div>
                      <div className="text-sm text-yellow-600">Skipped</div>
                    </div>
                    <div className="rounded-md bg-red-50 border border-red-200 p-3 text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {importResult.errors}
                      </div>
                      <div className="text-sm text-red-600">Errors</div>
                    </div>
                  </div>

                  {importResult.details.length > 0 && (
                    <div className="rounded-md border max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Row</th>
                            <th className="px-3 py-2 text-left font-medium">Provider</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.details.map((detail, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-3 py-2">{detail.row}</td>
                              <td className="px-3 py-2">{detail.provider || "—"}</td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={
                                    detail.status === "success"
                                      ? "secondary"
                                      : detail.status === "skipped"
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {detail.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {detail.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportResult(null);
                      setImportFile(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
