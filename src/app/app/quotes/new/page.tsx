"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  QuoteSettings,
  QuoteAddon,
  QuoteDiscount,
  PricingGridItem,
  RefractiveError,
  TreatmentType,
} from "@/types/database";

interface EyeFormData {
  refractive_error: RefractiveError | "";
  has_astigmatism: boolean;
  treatment: TreatmentType | "";
  price: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<QuoteSettings | null>(null);

  // Form state
  const [patientName, setPatientName] = React.useState("");
  const [patientMrn, setPatientMrn] = React.useState("");
  const [rightEye, setRightEye] = React.useState<EyeFormData>({
    refractive_error: "",
    has_astigmatism: false,
    treatment: "",
    price: 0,
  });
  const [leftEye, setLeftEye] = React.useState<EyeFormData>({
    refractive_error: "",
    has_astigmatism: false,
    treatment: "",
    price: 0,
  });
  const [selectedDiscountId, setSelectedDiscountId] = React.useState("");
  const [selectedAddonIds, setSelectedAddonIds] = React.useState<string[]>([]);

  // Calculated values
  const [calculations, setCalculations] = React.useState({
    subtotal: 0,
    bilateral_discount_amount: 0,
    discount_amount: 0,
    addons_total: 0,
    total_amount: 0,
    scheduling_deposit: 0,
    balance_due: 0,
    payment_24_month: 0,
    payment_36_month: 0,
    payment_60_month: 0,
  });

  // Load settings
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/app/quotes/settings");
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Find price from pricing grid
  const findPrice = React.useCallback((
    refractive_error: string,
    has_astigmatism: boolean,
    treatment: string
  ): number => {
    if (!settings || !refractive_error || !treatment) return 0;

    const item = settings.pricing_grid.find(
      (p: PricingGridItem) =>
        p.refractive_error === refractive_error &&
        p.has_astigmatism === has_astigmatism &&
        p.treatment_type === treatment
    );

    return item?.price || 0;
  }, [settings]);

  // Update right eye price when selections change
  React.useEffect(() => {
    const price = findPrice(
      rightEye.refractive_error,
      rightEye.has_astigmatism,
      rightEye.treatment
    );
    setRightEye((prev) => ({ ...prev, price }));
  }, [
    rightEye.refractive_error,
    rightEye.has_astigmatism,
    rightEye.treatment,
    findPrice,
  ]);

  // Update left eye price when selections change
  React.useEffect(() => {
    const price = findPrice(
      leftEye.refractive_error,
      leftEye.has_astigmatism,
      leftEye.treatment
    );
    setLeftEye((prev) => ({ ...prev, price }));
  }, [
    leftEye.refractive_error,
    leftEye.has_astigmatism,
    leftEye.treatment,
    findPrice,
  ]);

  // Calculate all pricing when form values change
  React.useEffect(() => {
    if (!settings) return;

    const subtotal = rightEye.price + leftEye.price;

    // Bilateral discount (both eyes have treatment)
    const hasBothEyes = rightEye.treatment && leftEye.treatment;
    const bilateralDiscountPercentage =
      settings.financing_settings.bilateral_discount_percentage || 0;
    const bilateral_discount_amount = hasBothEyes
      ? (subtotal * bilateralDiscountPercentage) / 100
      : 0;

    // Custom discount
    const selectedDiscount = settings.discounts.find(
      (d: QuoteDiscount) => d.id === selectedDiscountId
    );
    const discount_percentage = selectedDiscount?.percentage || 0;
    const afterBilateralDiscount = subtotal - bilateral_discount_amount;
    const discount_amount =
      (afterBilateralDiscount * discount_percentage) / 100;

    // Add-ons total
    const addons_total = selectedAddonIds.reduce((sum, addonId) => {
      const addon = settings.addons.find((a: QuoteAddon) => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    // Total amount
    const total_amount =
      subtotal - bilateral_discount_amount - discount_amount + addons_total;

    // Scheduling deposit
    const depositPercentage =
      settings.financing_settings.scheduling_deposit_percentage || 20;
    const scheduling_deposit = (total_amount * depositPercentage) / 100;
    const balance_due = total_amount - scheduling_deposit;

    // Payment calculations
    const payment_24_month = balance_due / 24; // 0% interest
    
    // 36 month with interest
    const rate36 =
      (settings.financing_settings.interest_rate_36_month || 0) / 100 / 12;
    const payment_36_month =
      rate36 > 0
        ? (balance_due * rate36 * Math.pow(1 + rate36, 36)) /
          (Math.pow(1 + rate36, 36) - 1)
        : balance_due / 36;

    // 60 month with interest
    const rate60 =
      (settings.financing_settings.interest_rate_60_month || 0) / 100 / 12;
    const payment_60_month =
      rate60 > 0
        ? (balance_due * rate60 * Math.pow(1 + rate60, 60)) /
          (Math.pow(1 + rate60, 60) - 1)
        : balance_due / 60;

    setCalculations({
      subtotal,
      bilateral_discount_amount,
      discount_amount,
      addons_total,
      total_amount,
      scheduling_deposit,
      balance_due,
      payment_24_month,
      payment_36_month,
      payment_60_month,
    });
  }, [
    rightEye,
    leftEye,
    selectedDiscountId,
    selectedAddonIds,
    settings,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedAddons = selectedAddonIds.map((addonId) => {
        const addon = settings?.addons.find((a: QuoteAddon) => a.id === addonId);
        return {
          addon_id: addonId,
          addon_name: addon?.name || "",
          addon_price: addon?.price || 0,
        };
      });

      const quoteData = {
        patient_name: patientName,
        patient_mrn: patientMrn,
        right_eye_refractive_error: rightEye.refractive_error || null,
        right_eye_has_astigmatism: rightEye.has_astigmatism,
        right_eye_treatment: rightEye.treatment || null,
        right_eye_price: rightEye.price,
        left_eye_refractive_error: leftEye.refractive_error || null,
        left_eye_has_astigmatism: leftEye.has_astigmatism,
        left_eye_treatment: leftEye.treatment || null,
        left_eye_price: leftEye.price,
        subtotal: calculations.subtotal,
        bilateral_discount_amount: calculations.bilateral_discount_amount,
        discount_id: selectedDiscountId || null,
        discount_percentage:
          settings?.discounts.find((d: QuoteDiscount) => d.id === selectedDiscountId)
            ?.percentage || 0,
        discount_amount: calculations.discount_amount,
        addons_total: calculations.addons_total,
        total_amount: calculations.total_amount,
        scheduling_deposit: calculations.scheduling_deposit,
        balance_due: calculations.balance_due,
        selected_addons: selectedAddons,
      };

      const res = await fetch("/api/app/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (!res.ok) {
        throw new Error("Failed to create quote");
      }

      const data = await res.json();
      router.push(`/app/quotes/${data.quote.id}`);
    } catch (error) {
      console.error("Error creating quote:", error);
      alert("Failed to create quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
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

  const refractiveErrors: RefractiveError[] = ["Myopia", "Hyperopia", "Presbyopia"];
  const treatments: TreatmentType[] = ["LASIK", "PRK", "SMILE", "ICL", "RLE"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">New Quote</h1>
        <p className="text-muted-foreground">
          Create a new treatment quote for a patient
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient_name">Patient Name *</Label>
              <Input
                id="patient_name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="patient_mrn">MRN *</Label>
              <Input
                id="patient_mrn"
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Eye */}
        <Card>
          <CardHeader>
            <CardTitle>Right Eye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Refractive Error</Label>
              <select
                value={rightEye.refractive_error}
                onChange={(e) =>
                  setRightEye({
                    ...rightEye,
                    refractive_error: e.target.value as RefractiveError | "",
                  })
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {refractiveErrors.map((error) => (
                  <option key={error} value={error}>
                    {error}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="right_astigmatism"
                checked={rightEye.has_astigmatism}
                onCheckedChange={(checked) =>
                  setRightEye({
                    ...rightEye,
                    has_astigmatism: checked === true,
                  })
                }
              />
              <Label htmlFor="right_astigmatism">Astigmatism</Label>
            </div>
            <div>
              <Label>Treatment</Label>
              <select
                value={rightEye.treatment}
                onChange={(e) =>
                  setRightEye({
                    ...rightEye,
                    treatment: e.target.value as TreatmentType | "",
                  })
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {treatments.map((treatment) => (
                  <option key={treatment} value={treatment}>
                    {treatment}
                  </option>
                ))}
              </select>
            </div>
            {rightEye.price > 0 && (
              <div className="text-lg font-semibold">
                Price: {formatCurrency(rightEye.price)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Left Eye */}
        <Card>
          <CardHeader>
            <CardTitle>Left Eye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Refractive Error</Label>
              <select
                value={leftEye.refractive_error}
                onChange={(e) =>
                  setLeftEye({
                    ...leftEye,
                    refractive_error: e.target.value as RefractiveError | "",
                  })
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {refractiveErrors.map((error) => (
                  <option key={error} value={error}>
                    {error}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="left_astigmatism"
                checked={leftEye.has_astigmatism}
                onCheckedChange={(checked) =>
                  setLeftEye({
                    ...leftEye,
                    has_astigmatism: checked === true,
                  })
                }
              />
              <Label htmlFor="left_astigmatism">Astigmatism</Label>
            </div>
            <div>
              <Label>Treatment</Label>
              <select
                value={leftEye.treatment}
                onChange={(e) =>
                  setLeftEye({
                    ...leftEye,
                    treatment: e.target.value as TreatmentType | "",
                  })
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {treatments.map((treatment) => (
                  <option key={treatment} value={treatment}>
                    {treatment}
                  </option>
                ))}
              </select>
            </div>
            {leftEye.price > 0 && (
              <div className="text-lg font-semibold">
                Price: {formatCurrency(leftEye.price)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount */}
        <Card>
          <CardHeader>
            <CardTitle>Discount (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedDiscountId}
              onChange={(e) => setSelectedDiscountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">No Discount</option>
              {settings.discounts.map((discount: QuoteDiscount) => (
                <option key={discount.id} value={discount.id}>
                  {discount.name} ({discount.percentage}% off)
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Add-Ons */}
        <Card>
          <CardHeader>
            <CardTitle>Add-Ons (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings.addons.map((addon: QuoteAddon) => (
              <div key={addon.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`addon_${addon.id}`}
                  checked={selectedAddonIds.includes(addon.id)}
                  onCheckedChange={() => toggleAddon(addon.id)}
                />
                <Label htmlFor={`addon_${addon.id}`} className="flex-1">
                  {addon.name} - {formatCurrency(addon.price)}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(calculations.subtotal)}
              </span>
            </div>
            {calculations.bilateral_discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Bilateral Discount:</span>
                <span className="font-medium">
                  -{formatCurrency(calculations.bilateral_discount_amount)}
                </span>
              </div>
            )}
            {calculations.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">
                  -{formatCurrency(calculations.discount_amount)}
                </span>
              </div>
            )}
            {calculations.addons_total > 0 && (
              <div className="flex justify-between">
                <span>Add-Ons:</span>
                <span className="font-medium">
                  +{formatCurrency(calculations.addons_total)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(calculations.total_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Scheduling Deposit:</span>
              <span className="font-semibold">
                {formatCurrency(calculations.scheduling_deposit)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Balance Due:</span>
              <span>{formatCurrency(calculations.balance_due)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Single Payment:</span>
              <span className="font-medium">
                {formatCurrency(calculations.balance_due)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>24-Month (0% Interest):</span>
              <span className="font-medium">
                {formatCurrency(calculations.payment_24_month)}/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                36-Month (
                {settings.financing_settings.interest_rate_36_month || 0}% APR):
              </span>
              <span className="font-medium">
                {formatCurrency(calculations.payment_36_month)}/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                60-Month (
                {settings.financing_settings.interest_rate_60_month || 0}% APR):
              </span>
              <span className="font-medium">
                {formatCurrency(calculations.payment_60_month)}/mo
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/app/quotes")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </form>
    </div>
  );
}
