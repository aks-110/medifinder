import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "[db] DATABASE_URL is not set. MediFinder now requires a real Postgres database - " +
      "see backend/.env.example and README.md for setup (docker compose up postgres is the fastest path)."
  );
  process.exit(1);
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("[db] unexpected error on idle client", err);
});

export async function query(text, params) {
  return pool.query(text, params);
}

// Runs `fn` inside a transaction, passing a client whose .query() is
// already scoped to it. Commits on success, rolls back on any throw.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
