import { describe, expect, it } from "vitest";
import { normalizeDbHost, readDbConfig } from "./config";

describe("db config", () => {
  it("rewrites localhost to 127.0.0.1", () => {
    expect(normalizeDbHost("localhost")).toBe("127.0.0.1");
    expect(normalizeDbHost(" LOCALHOST ")).toBe("127.0.0.1");
    expect(normalizeDbHost("127.0.0.1")).toBe("127.0.0.1");
  });

  it("applies defaults and caps the pool at 5", () => {
    const cfg = readDbConfig({ DB_USER: "u", DB_PASSWORD: "p", DB_NAME: "d" });
    expect(cfg).toMatchObject({ host: "127.0.0.1", port: 3306, connectionLimit: 5 });
  });

  it("fails when required vars are missing", () => {
    expect(() => readDbConfig({})).toThrow();
  });
});
