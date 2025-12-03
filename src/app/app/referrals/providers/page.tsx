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
      practice_id: provider.practice_id,
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
            <Button onClick={openAddProvider}>Add Provider</Button>
          </CardHeader>
          <CardContent>
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
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.first_name} {provider.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {provider.practices?.name || "—"}
                      </Badge>
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
                {providers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No providers found. Add your first provider to get started.
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
    </div>
  );
}
