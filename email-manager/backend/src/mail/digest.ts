import { db } from "../db";
import { Category, DigestData } from "../types";
import { listMessages } from "./repository";

const CATEGORIES: Category[] = ["primary", "promotions", "social", "updates", "forums", "junk"];

export function buildDigest(): DigestData {
  const byCategory = {} as Record<Category, number>;
  for (const category of CATEGORIES) {
    const row = db
      .prepare(
        `SELECT COUNT(*) as n FROM messages WHERE archived = 0 AND seen = 0 AND category = ?`
      )
      .get(category) as { n: number };
    byCategory[category] = row.n;
  }

  const totalUnread = Object.values(byCategory).reduce((a, b) => a + b, 0);

  const highImportanceUnread = listMessages({ importance: "high", seen: false, limit: 10 });

  const newSubscriptionsDetected = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT from_address) as n FROM messages
         WHERE is_bulk = 1 AND datetime(created_at) >= datetime('now', '-1 day')`
      )
      .get() as { n: number }
  ).n;

  const topSenders = db
    .prepare(
      `SELECT from_address as address, from_name as name, COUNT(*) as count
       FROM messages
       WHERE archived = 0
       GROUP BY from_address
       ORDER BY count DESC
       LIMIT 5`
    )
    .all() as { address: string; name: string; count: number }[];

  return {
    generatedAt: new Date().toISOString(),
    totalUnread,
    byCategory,
    highImportanceUnread,
    newSubscriptionsDetected,
    topSenders,
  };
}
