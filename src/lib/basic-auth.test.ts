import { describe, expect, it } from "vitest";
import { isBasicAuthValid } from "./basic-auth";

const header = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

describe("isBasicAuthValid", () => {
  it("accepts correct credentials", () => {
    expect(isBasicAuthValid(header("admin", "s3cret:x"), "admin", "s3cret:x")).toBe(true);
  });

  it("rejects wrong credentials", () => {
    expect(isBasicAuthValid(header("admin", "nope"), "admin", "s3cret")).toBe(false);
    expect(isBasicAuthValid(header("root", "s3cret"), "admin", "s3cret")).toBe(false);
  });

  it("rejects when not configured", () => {
    expect(isBasicAuthValid(header("", ""), undefined, undefined)).toBe(false);
    expect(isBasicAuthValid(header("admin", "x"), "admin", "")).toBe(false);
  });

  it("rejects malformed headers", () => {
    expect(isBasicAuthValid(null, "admin", "x")).toBe(false);
    expect(isBasicAuthValid("Bearer abc", "admin", "x")).toBe(false);
    expect(isBasicAuthValid("Basic !!!", "admin", "x")).toBe(false);
    expect(isBasicAuthValid(`Basic ${btoa("nocolon")}`, "admin", "x")).toBe(false);
  });
});
