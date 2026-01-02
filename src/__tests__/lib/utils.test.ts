import { describe, it, expect } from "vitest";
import { parseDateOfBirth, compareDates } from "@/lib/utils";

describe("parseDateOfBirth", () => {
  it("should parse MMDDYYYY format (8 digits)", () => {
    const result = parseDateOfBirth("01012019");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2019);
    expect(result?.getMonth()).toBe(0); // January (0-based)
    expect(result?.getDate()).toBe(1);
  });

  it("should parse 10012019 as October 1, 2019", () => {
    const result = parseDateOfBirth("10012019");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2019);
    expect(result?.getMonth()).toBe(9); // October (0-based)
    expect(result?.getDate()).toBe(1);
  });

  it("should parse MM/DD/YYYY format", () => {
    const result = parseDateOfBirth("01/01/2019");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2019);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(1);
  });

  it("should parse YYYY-MM-DD format", () => {
    const result = parseDateOfBirth("2019-01-01");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2019);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(1);
  });

  it("should parse MM-DD-YYYY format", () => {
    const result = parseDateOfBirth("01-01-2019");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2019);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(1);
  });

  it("should return null for invalid format", () => {
    expect(parseDateOfBirth("abc")).toBeNull();
    expect(parseDateOfBirth("1012019")).toBeNull(); // 7 digits
    expect(parseDateOfBirth("")).toBeNull();
  });

  it("should handle various months correctly", () => {
    const dec = parseDateOfBirth("12312019"); // December 31, 2019
    expect(dec?.getMonth()).toBe(11); // December
    expect(dec?.getDate()).toBe(31);
  });
});

describe("compareDates", () => {
  it("should return true for same dates", () => {
    const date1 = new Date(2019, 0, 1);
    const date2 = new Date(2019, 0, 1);
    expect(compareDates(date1, date2)).toBe(true);
  });

  it("should return false for different dates", () => {
    const date1 = new Date(2019, 0, 1);
    const date2 = new Date(2019, 0, 2);
    expect(compareDates(date1, date2)).toBe(false);
  });

  it("should ignore time component", () => {
    const date1 = new Date(2019, 0, 1, 10, 30, 0);
    const date2 = new Date(2019, 0, 1, 15, 45, 30);
    expect(compareDates(date1, date2)).toBe(true);
  });
});
