import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

const database = process.env.DB_NAME || "gwero_crm";
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Invalid DB_NAME");
const options = {
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : { host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306) }),
};
const connection = await mysql.createConnection(options);
try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${database}\``);
  const schema = readFileSync(resolve("database/schema.sql"), "utf8");
  for (const statement of schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    await connection.query(statement);
  }
  console.log(`MySQL schema ready: ${database}`);
} finally {
  await connection.end();
}
