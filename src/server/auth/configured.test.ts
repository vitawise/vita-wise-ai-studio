import { describe, expect, it } from "vitest";
import { isAuthConfigured } from "./configured";

describe("isAuthConfigured", () => {
  it("requires DB credentials and the auth secret", () => {
    expect(isAuthConfigured({})).toBe(false);
    expect(isAuthConfigured({ DB_USER: "u", DB_NAME: "d" })).toBe(false);
    expect(isAuthConfigured({ DB_USER: "u", DB_NAME: "d", BETTER_AUTH_SECRET: "s" })).toBe(true);
  });
});
