// Applies committed Drizzle migrations. Run with: npm run db:migrate
// Plain JS so it runs on any Node version the host provides.
// Vercel runs this before every build (vercel.json); builds without DB vars
// (e.g. previews) skip it, while a build with an unreachable DB fails loudly.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const env = process.env;
if (!env.DB_NAME || !env.DB_USER) {
  console.log("db:migrate skipped — DB_NAME/DB_USER not set for this environment");
  process.exit(0);
}

// Same rule as src/server/db/config.ts: Node resolves localhost to ::1, which MySQL refuses.
const rawHost = (env.DB_HOST ?? "127.0.0.1").trim();
const host = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;
const port = Number(env.DB_PORT ?? 3306);

let connection;
try {
  connection = await mysql.createConnection({
    host,
    port,
    user: env.DB_USER,
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME,
    connectTimeout: 15000,
    multipleStatements: true,
  });
} catch (err) {
  console.error(`db:migrate cannot connect to MySQL: ${err.code ?? "UNKNOWN"} — ${err.message}`);
  if (host === "127.0.0.1") {
    console.error("DB_HOST is 127.0.0.1 — that only works on the same server as MySQL.");
  }
  process.exit(1);
}

try {
  await migrate(drizzle(connection), { migrationsFolder: "./src/server/db/migrations" });
  console.log("db:migrate applied");
} catch (err) {
  console.error(`db:migrate failed: ${err.code ?? ""} ${err.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
