import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateShortCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function parseDateOfBirth(input: string): Date | null {
  // Support MMDDYYYY (8 digits), MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY
  const patterns = [
    /^(\d{2})(\d{2})(\d{4})$/, // MMDDYYYY (8 digits, mobile-friendly)
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      if (pattern === patterns[2]) {
        // YYYY-MM-DD
        return new Date(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3])
        );
      } else {
        // MMDDYYYY, MM/DD/YYYY or MM-DD-YYYY
        return new Date(
          parseInt(match[3]),
          parseInt(match[1]) - 1,
          parseInt(match[2])
        );
      }
    }
  }
  return null;
}

export function compareDates(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
