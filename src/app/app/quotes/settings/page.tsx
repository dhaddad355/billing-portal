"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  QuoteSettings,
  QuoteDiscount,
  QuoteAddon,
  PricingGridItem,
} from "@/types/database";

export default function QuoteSettingsPage() {
  const [settings, setSettings] = React.useState<QuoteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // New discount form
  const [newDiscountName, setNewDiscountName] = React.useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = React.useState("");

  // New addon form
  const [newAddonName, setNewAddonName] = React.useState("");
  const [newAddonPrice, setNewAddonPrice] = React.useState("");

  // Financing settings
  const [bilateralDiscountPercentage, setBilateralDiscountPercentage] =
    React.useState("");
  const [schedulingDepositPercentage, setSchedulingDepositPercentage] =
    React.useState("");
  const [interestRate36Month, setInterestRate36Month] = React.useState("");
  const [interestRate60Month, setInterestRate60Month] = React.useState("");

  // Load settings
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/app/quotes/settings");
        const data = await res.json();
        setSettings(data);

        // Set financing values
        setBilateralDiscountPercentage(
          data.financing_settings.bilateral_discount_percentage?.toString() || "10"
        );
        setSchedulingDepositPercentage(
          data.financing_settings.scheduling_deposit_percentage?.toString() || "20"
        );
        setInterestRate36Month(
          data.financing_settings.interest_rate_36_month?.toString() || "12.99"
        );
        setInterestRate60Month(
          data.financing_settings.interest_rate_60_month?.toString() || "15.99"
        );
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Update pricing grid item
  const handlePricingUpdate = async (id: string, newPrice: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/app/quotes/settings/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price: parseFloat(newPrice) }),
      });

      if (!res.ok) throw new Error("Failed to update price");

      // Refresh settings
      const settingsRes = await fetch("/api/app/quotes/settings");
      const data = await settingsRes.json();
      setSettings(data);
      alert("Price updated successfully");
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  // Add new discount
  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/app/quotes/settings/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDiscountName,
          percentage: parseFloat(newDiscountPercentage),
        }),
      });

      if (!res.ok) throw new Error("Failed to add discount");

      // Refresh settings
      const settingsRes = await fetch("/api/app/quotes/settings");
      const data = await settingsRes.json();
      setSettings(data);

      // Clear form
      setNewDiscountName("");
      setNewDiscountPercentage("");
      alert("Discount added successfully");
    } catch (error) {
      console.error("Error adding discount:", error);
      alert("Failed to add discount");
    } finally {
      setSaving(false);
    }
  };

  // Delete discount
  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/app/quotes/settings/discounts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete discount");

      // Refresh settings
      const settingsRes = await fetch("/api/app/quotes/settings");
      const data = await settingsRes.json();
      setSettings(data);
      alert("Discount deleted successfully");
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert("Failed to delete discount");
    } finally {
      setSaving(false);
    }
  };

  // Add new addon
  const handleAddAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/app/quotes/settings/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAddonName,
          price: parseFloat(newAddonPrice),
        }),
      });

      if (!res.ok) throw new Error("Failed to add addon");

      // Refresh settings
      const settingsRes = await fetch("/api/app/quotes/settings");
      const data = await settingsRes.json();
      setSettings(data);

      // Clear form
      setNewAddonName("");
      setNewAddonPrice("");
      alert("Add-on added successfully");
    } catch (error) {
      console.error("Error adding addon:", error);
      alert("Failed to add addon");
    } finally {
      setSaving(false);
    }
  };

  // Delete addon
  const handleDeleteAddon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this add-on?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/app/quotes/settings/addons?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete addon");

      // Refresh settings
      const settingsRes = await fetch("/api/app/quotes/settings");
      const data = await settingsRes.json();
      setSettings(data);
      alert("Add-on deleted successfully");
    } catch (error) {
      console.error("Error deleting addon:", error);
      alert("Failed to delete addon");
    } finally {
      setSaving(false);
    }
  };

  // Update financing setting
  const handleFinancingUpdate = async (
    settingKey: string,
    settingValue: string
  ) => {
    setSaving(true);
    try {
      const res = await fetch("/api/app/quotes/settings/financing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_key: settingKey,
          setting_value: parseFloat(settingValue),
        }),
      });

      if (!res.ok) throw new Error("Failed to update setting");

      alert("Setting updated successfully");
    } catch (error) {
      console.error("Error updating setting:", error);
      alert("Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Quote Settings</h1>
        <p className="text-muted-foreground">
          Manage pricing, discounts, add-ons, and financing settings
        </p>
      </div>

      {/* Pricing Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Treatment</TableHead>
                <TableHead>Refractive Error</TableHead>
                <TableHead>Astigmatism</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.pricing_grid.map((item: PricingGridItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.treatment_type}
                  </TableCell>
                  <TableCell>{item.refractive_error}</TableCell>
                  <TableCell>{item.has_astigmatism ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPrice = prompt(
                          "Enter new price:",
                          item.price.toString()
                        );
                        if (newPrice) {
                          handlePricingUpdate(item.id, newPrice);
                        }
                      }}
                      disabled={saving}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>Discounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.discounts.map((discount: QuoteDiscount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.name}</TableCell>
                  <TableCell className="text-right">
                    {discount.percentage}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDiscount(discount.id)}
                      disabled={saving}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <form onSubmit={handleAddDiscount} className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Add New Discount</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount_name">Name</Label>
                <Input
                  id="discount_name"
                  value={newDiscountName}
                  onChange={(e) => setNewDiscountName(e.target.value)}
                  placeholder="e.g., Military Discount"
                  required
                />
              </div>
              <div>
                <Label htmlFor="discount_percentage">Percentage</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newDiscountPercentage}
                  onChange={(e) => setNewDiscountPercentage(e.target.value)}
                  placeholder="10.00"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  Add Discount
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add-Ons */}
      <Card>
        <CardHeader>
          <CardTitle>Add-Ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.addons.map((addon: QuoteAddon) => (
                <TableRow key={addon.id}>
                  <TableCell className="font-medium">{addon.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(addon.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddon(addon.id)}
                      disabled={saving}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <form onSubmit={handleAddAddon} className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Add New Add-On</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="addon_name">Name</Label>
                <Input
                  id="addon_name"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  placeholder="e.g., Monovision"
                  required
                />
              </div>
              <div>
                <Label htmlFor="addon_price">Price</Label>
                <Input
                  id="addon_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAddonPrice}
                  onChange={(e) => setNewAddonPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  Add Add-On
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Financing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Financing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bilateral_discount">
              Bilateral Discount Percentage
            </Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                id="bilateral_discount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={bilateralDiscountPercentage}
                onChange={(e) => setBilateralDiscountPercentage(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-muted-foreground">%</span>
              <Button
                size="sm"
                onClick={() =>
                  handleFinancingUpdate(
                    "bilateral_discount_percentage",
                    bilateralDiscountPercentage
                  )
                }
                disabled={saving}
              >
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Discount applied when treating both eyes
            </p>
          </div>

          <div>
            <Label htmlFor="scheduling_deposit">
              Scheduling Deposit Percentage
            </Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                id="scheduling_deposit"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={schedulingDepositPercentage}
                onChange={(e) => setSchedulingDepositPercentage(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-muted-foreground">%</span>
              <Button
                size="sm"
                onClick={() =>
                  handleFinancingUpdate(
                    "scheduling_deposit_percentage",
                    schedulingDepositPercentage
                  )
                }
                disabled={saving}
              >
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Percentage of total collected as deposit
            </p>
          </div>

          <div>
            <Label htmlFor="interest_36">36-Month Interest Rate (APR)</Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                id="interest_36"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate36Month}
                onChange={(e) => setInterestRate36Month(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-muted-foreground">%</span>
              <Button
                size="sm"
                onClick={() =>
                  handleFinancingUpdate(
                    "interest_rate_36_month",
                    interestRate36Month
                  )
                }
                disabled={saving}
              >
                Update
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="interest_60">60-Month Interest Rate (APR)</Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                id="interest_60"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate60Month}
                onChange={(e) => setInterestRate60Month(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-muted-foreground">%</span>
              <Button
                size="sm"
                onClick={() =>
                  handleFinancingUpdate(
                    "interest_rate_60_month",
                    interestRate60Month
                  )
                }
                disabled={saving}
              >
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
