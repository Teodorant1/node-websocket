import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// PostgreSQL connection from environment variables
const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Initialize Drizzle
export const db = drizzle(pool);
