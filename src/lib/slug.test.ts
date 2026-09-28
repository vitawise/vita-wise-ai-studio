import { describe, expect, it } from "vitest";
import { pharmacySlug } from "./slug";

const fixed = () => "abc123";

describe("pharmacySlug", () => {
  it("slugifies latin names", () => {
    expect(pharmacySlug("VitaWise Pharmacy!", fixed)).toBe("vitawise-pharmacy-abc123");
  });

  it("falls back for Arabic-only names", () => {
    expect(pharmacySlug("صيدلية فيتاوايز", fixed)).toBe("pharmacy-abc123");
  });

  it("keeps the latin part of mixed names", () => {
    expect(pharmacySlug("صيدلية Vita 24", fixed)).toBe("vita-24-abc123");
  });

  it("adds a random suffix by default", () => {
    expect(pharmacySlug("x")).toMatch(/^x-[0-9a-f]{6}$/);
  });
});
