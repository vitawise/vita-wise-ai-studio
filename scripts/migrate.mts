// Applies committed Drizzle migrations. Run with: npm run db:migrate
// Vercel runs this before every build (vercel.json); builds without DB vars
// (e.g. previews) skip it, while a production build with an unreachable DB fails loudly.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { readDbConfig } from "../src/server/db/config.ts";

if (!process.env.DB_NAME || !process.env.DB_USER) {
  console.log("db:migrate skipped — DB_NAME/DB_USER not set for this environment");
  process.exit(0);
}

const config = readDbConfig(process.env);
let connection: mysql.Connection;
try {
  connection = await mysql.createConnection({ ...config, multipleStatements: true });
} catch (err) {
  const code = (err as { code?: string }).code ?? "UNKNOWN";
  console.error(`db:migrate cannot connect to MySQL (${code}) at port ${config.port}.`);
  if (config.host === "127.0.0.1") {
    console.error("DB_HOST is 127.0.0.1 — that only works on the same server as MySQL.");
    console.error("On Vercel use the database server's public hostname and allow remote access.");
  }
  process.exit(1);
}
try {
  await migrate(drizzle(connection), { migrationsFolder: "./src/server/db/migrations" });
  console.log("db:migrate applied");
} finally {
  await connection.end();
}
