import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

const database = process.env.DB_NAME || "gwero_crm";
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Invalid DB_NAME");

const connectionOptions = {
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 3306),
      }),
};

async function connectToDatabase() {
  try {
    return await mysql.createConnection({ ...connectionOptions, database });
  } catch (error) {
    if (error?.code !== "ER_BAD_DB_ERROR") throw error;

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Database "${database}" does not exist or is not accessible. Create it in Hostinger and verify DB_NAME/DB_USER permissions.`,
        { cause: error },
      );
    }

    const bootstrap = await mysql.createConnection(connectionOptions);
    try {
      await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } finally {
      await bootstrap.end();
    }
    return mysql.createConnection({ ...connectionOptions, database });
  }
}

const connection = await connectToDatabase();
try {
  const schema = readFileSync(resolve("database/schema.sql"), "utf8");
  for (const statement of schema
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean)) {
    await connection.query(statement);
  }
  console.log(`MySQL schema ready: ${database}`);
} finally {
  await connection.end();
}
