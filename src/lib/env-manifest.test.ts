import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENV_MANIFEST, envPresence } from "./env-manifest";

describe("env manifest", () => {
  it("matches .env.example exactly", () => {
    const example = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
    const names = example
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0]);
    expect(names.sort()).toEqual(ENV_MANIFEST.map((v) => v.name).sort());
  });

  it("reports presence without exposing values", () => {
    const result = envPresence({ DB_HOST: "sentinel-host-value", DB_USER: "" });
    const host = result.find((r) => r.spec.name === "DB_HOST");
    const user = result.find((r) => r.spec.name === "DB_USER");
    expect(host?.present).toBe(true);
    expect(user?.present).toBe(false);
    expect(JSON.stringify(result)).not.toContain("sentinel-host-value");
  });
});
