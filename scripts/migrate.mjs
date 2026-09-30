// Applies committed Drizzle migrations. Run with: npm run db:migrate
// Plain JS so it runs on any Node version the host provides.
// Vercel runs this before every build (vercel.json); builds without DB vars
// (e.g. previews) skip it, while a build with an unreachable DB fails loudly.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const migrationsFolder = "./src/server/db/migrations";

/**
 * MySQL DDL isn't transactional, so a failed first run can leave some tables behind
 * without recording the migration; every later run then fails with "table already exists".
 * While no migration has ever been recorded the app cannot have run (it needs these tables),
 * so tables our migrations create are leftovers and are dropped before retrying.
 * Once any migration is recorded this never drops anything.
 */
async function dropLeftoversFromFailedFirstRun() {
  const [journal] = await connection.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '__drizzle_migrations'",
  );
  if (journal[0].n > 0) {
    const [applied] = await connection.query("SELECT COUNT(*) AS n FROM `__drizzle_migrations`");
    if (applied[0].n > 0) return;
  }
  const ours = new Set();
  for (const file of readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql"))) {
    const sqlText = readFileSync(join(migrationsFolder, file), "utf8");
    for (const m of sqlText.matchAll(/CREATE TABLE `([^`]+)`/g)) ours.add(m[1]);
  }
  const [existing] = await connection.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const leftovers = existing
    .map((r) => r.name ?? r.NAME ?? r.TABLE_NAME)
    .filter((n) => ours.has(n));
  if (leftovers.length === 0) return;
  console.log(`db:migrate removing leftovers of a failed first run: ${leftovers.join(", ")}`);
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const name of leftovers) await connection.query(`DROP TABLE \`${name}\``);
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
}

try {
  await dropLeftoversFromFailedFirstRun();
  await migrate(drizzle(connection), { migrationsFolder });
  console.log("db:migrate applied");
} catch (err) {
  const cause = err.cause ?? err;
  console.error(`db:migrate failed: ${cause.code ?? ""} ${cause.message}`);
  if (cause !== err) console.error(err.message.split("\n")[0]);
  process.exitCode = 1;
} finally {
  await connection.end();
}
