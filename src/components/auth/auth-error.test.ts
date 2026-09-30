import { describe, expect, it } from "vitest";
import { authErrorKey } from "./auth-error";

describe("authErrorKey", () => {
  it("maps known codes", () => {
    expect(authErrorKey({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toBe(
      "invalidCredentials",
    );
    expect(authErrorKey({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 })).toBe(
      "userExists",
    );
    expect(authErrorKey({ code: "PASSWORD_TOO_SHORT", status: 400 })).toBe("passwordTooShort");
  });

  it("treats 429 as rate limited regardless of code", () => {
    expect(authErrorKey({ status: 429 })).toBe("tooManyRequests");
  });

  it("falls back to generic", () => {
    expect(authErrorKey(null)).toBe("generic");
    expect(authErrorKey({ code: "SOMETHING_NEW", status: 500 })).toBe("generic");
  });
});
