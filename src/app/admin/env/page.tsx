import type { Metadata } from "next";
import { connection } from "next/server";
import { envPresence } from "@/lib/env-manifest";
import { checkDb, checkR2, type CheckResult } from "@/server/health";
import { R2UploadTest } from "./r2-upload-test";

export const metadata: Metadata = { title: "Environment check", robots: { index: false } };

async function probeSharp(): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    return `available (libvips ${sharp.versions.vips})`;
  } catch {
    return "unavailable — use provider-side or pure-JS resizing";
  }
}

function Status({ result }: { result: CheckResult }) {
  return (
    <span className={result.ok ? "text-emerald-600" : "text-red-600"}>
      {result.ok ? `OK (${result.latencyMs} ms)` : `FAIL: ${result.error}`}
    </span>
  );
}

export default async function EnvCheckPage() {
  await connection();
  const [db, r2, sharp] = await Promise.all([checkDb(), checkR2(), probeSharp()]);
  const vars = envPresence(process.env);

  return (
    <main dir="ltr" className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-bold">Environment check (admin)</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Runtime</h2>
        <ul className="space-y-1">
          <li>Node.js: {process.version}</li>
          <li>
            MySQL: <Status result={db} />
          </li>
          <li>
            R2 bucket: <Status result={r2} />
          </li>
          <li>sharp: {sharp}</li>
        </ul>
        <R2UploadTest />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Variables (presence only, values never shown)</h2>
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-start">Name</th>
              <th className="py-2 text-start">Phase</th>
              <th className="py-2 text-start">Status</th>
              <th className="py-2 text-start">Description</th>
            </tr>
          </thead>
          <tbody>
            {vars.map(({ spec, present }) => (
              <tr key={spec.name} className="border-b border-slate-200/40">
                <td className="py-1 font-mono">{spec.name}</td>
                <td className="py-1">{spec.phase}</td>
                <td className={`py-1 ${present ? "text-emerald-600" : "opacity-60"}`}>
                  {present ? "set" : "missing"}
                </td>
                <td className="py-1 opacity-80">{spec.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
