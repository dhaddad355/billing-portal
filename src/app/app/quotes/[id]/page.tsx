"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuoteWithRelations, QuoteSelectedAddon } from "@/types/database";

export default function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [quote, setQuote] = React.useState<QuoteWithRelations | null>(null);
  const [addons, setAddons] = React.useState<QuoteSelectedAddon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/app/quotes/${params.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch quote");
        }
        const data = await res.json();
        setQuote(data.quote);
        setAddons(data.quote.selected_addons || []);
      } catch (error) {
        console.error("Error fetching quote:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quote?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/app/quotes/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete quote");
      }

      router.push("/app/quotes");
    } catch (error) {
      console.error("Error deleting quote:", error);
      alert("Failed to delete quote. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate payment options
  const calculatePayments = () => {
    if (!quote) return { payment_24: 0, payment_36: 0, payment_60: 0 };

    const balance = quote.balance_due;

    // 24 month 0% interest
    const payment_24 = balance / 24;

    // 36 month with 12.99% APR (default)
    const rate36 = 12.99 / 100 / 12;
    const payment_36 =
      (balance * rate36 * Math.pow(1 + rate36, 36)) /
      (Math.pow(1 + rate36, 36) - 1);

    // 60 month with 15.99% APR (default)
    const rate60 = 15.99 / 100 / 12;
    const payment_60 =
      (balance * rate60 * Math.pow(1 + rate60, 60)) /
      (Math.pow(1 + rate60, 60) - 1);

    return { payment_24, payment_36, payment_60 };
  };

  const payments = calculatePayments();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">Quote not found</div>
        <Link href="/app/quotes">
          <Button variant="outline">Back to Quotes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quote Details</h1>
          <p className="text-muted-foreground">
            Created {formatDate(quote.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Quote"}
          </Button>
          <Link href="/app/quotes">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient Name:</span>
            <span className="font-medium">{quote.patient_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MRN:</span>
            <span className="font-medium">{quote.patient_mrn}</span>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Eye */}
        <Card>
          <CardHeader>
            <CardTitle>Right Eye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quote.right_eye_treatment ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treatment:</span>
                  <span className="font-medium">{quote.right_eye_treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refractive Error:</span>
                  <span className="font-medium">
                    {quote.right_eye_refractive_error}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Astigmatism:</span>
                  <span className="font-medium">
                    {quote.right_eye_has_astigmatism ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">
                    {formatCurrency(quote.right_eye_price || 0)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No treatment selected</div>
            )}
          </CardContent>
        </Card>

        {/* Left Eye */}
        <Card>
          <CardHeader>
            <CardTitle>Left Eye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quote.left_eye_treatment ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treatment:</span>
                  <span className="font-medium">{quote.left_eye_treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refractive Error:</span>
                  <span className="font-medium">
                    {quote.left_eye_refractive_error}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Astigmatism:</span>
                  <span className="font-medium">
                    {quote.left_eye_has_astigmatism ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">
                    {formatCurrency(quote.left_eye_price || 0)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No treatment selected</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.bilateral_discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Bilateral Discount:</span>
              <span className="font-medium">
                -{formatCurrency(quote.bilateral_discount_amount)}
              </span>
            </div>
          )}
          {quote.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Discount ({quote.discount_percentage}%):
              </span>
              <span className="font-medium">
                -{formatCurrency(quote.discount_amount)}
              </span>
            </div>
          )}
          {addons.length > 0 && (
            <>
              <div className="border-t pt-2 font-medium">Add-Ons:</div>
              {addons.map((addon) => (
                <div key={addon.id} className="flex justify-between pl-4">
                  <span className="text-sm">{addon.addon_name}</span>
                  <span className="text-sm">
                    +{formatCurrency(addon.addon_price)}
                  </span>
                </div>
              ))}
            </>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(quote.total_amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Scheduling Deposit:</span>
            <span className="font-semibold">
              {formatCurrency(quote.scheduling_deposit)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Balance Due:</span>
            <span>{formatCurrency(quote.balance_due)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">Single Payment</div>
                <div className="text-sm text-muted-foreground">Pay in full</div>
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(quote.balance_due)}
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">24-Month Plan</div>
                <div className="text-sm text-muted-foreground">
                  0% Interest
                </div>
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(payments.payment_24)}/mo
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">36-Month Plan</div>
                <div className="text-sm text-muted-foreground">12.99% APR</div>
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(payments.payment_36)}/mo
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">60-Month Plan</div>
                <div className="text-sm text-muted-foreground">15.99% APR</div>
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(payments.payment_60)}/mo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
