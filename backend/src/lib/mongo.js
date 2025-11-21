// Optional MongoDB integration. If MONGODB_URI isn't set, these are safe
// no-ops - reviews and report metadata still work via the in-memory stores
// in src/data/, this just mirrors them for durability when configured.
import { MongoClient } from "mongodb";

let db = null;

if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    db = client.db("medifinder");
    console.log("[mongo] connected");
  } catch (err) {
    console.warn("[mongo] could not connect, continuing without it:", err.message);
    db = null;
  }
}

export const mongoEnabled = () => !!db;

export async function mirrorInsert(collection, doc) {
  if (!db) return;
  try {
    await db.collection(collection).insertOne(doc);
  } catch (err) {
    console.warn(`[mongo] mirror insert into ${collection} failed:`, err.message);
  }
}
