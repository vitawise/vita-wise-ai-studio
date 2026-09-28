// Applies committed Drizzle migrations. Run with: npm run db:migrate
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { readDbConfig } from "../src/server/db/config.ts";

const connection = await mysql.createConnection({
  ...readDbConfig(process.env),
  multipleStatements: true,
});
try {
  await migrate(drizzle(connection), { migrationsFolder: "./src/server/db/migrations" });
  console.log("migrations applied");
} finally {
  await connection.end();
}
