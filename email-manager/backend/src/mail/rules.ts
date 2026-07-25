import { db } from "../db";
import { Category, Rule, RuleAction, RuleMatchType } from "../types";

interface RuleRow {
  id: number;
  match_type: RuleMatchType;
  match_value: string;
  action: RuleAction;
  action_value: string | null;
  created_at: string;
}

function rowToRule(row: RuleRow): Rule {
  return {
    id: row.id,
    matchType: row.match_type,
    matchValue: row.match_value,
    action: row.action,
    actionValue: row.action_value,
    createdAt: row.created_at,
  };
}

export function listRules(): Rule[] {
  const rows = db.prepare(`SELECT * FROM rules ORDER BY created_at DESC`).all() as RuleRow[];
  return rows.map(rowToRule);
}

export function addRule(
  matchType: RuleMatchType,
  matchValue: string,
  action: RuleAction,
  actionValue: string | null
): Rule {
  const info = db
    .prepare(
      `INSERT INTO rules (match_type, match_value, action, action_value) VALUES (?, ?, ?, ?)`
    )
    .run(matchType, matchValue.toLowerCase(), action, actionValue);
  return rowToRule(
    db.prepare(`SELECT * FROM rules WHERE id = ?`).get(info.lastInsertRowid) as RuleRow
  );
}

export function deleteRule(id: number): void {
  db.prepare(`DELETE FROM rules WHERE id = ?`).run(id);
}

export interface RuleEffect {
  category: Category | null;
  archive: boolean;
  markImportant: boolean;
}

/** Applies every stored rule matching a sender/subject and folds the
 * results into a single effect (later rules can still override category). */
export function applyRules(fromAddress: string, subject: string): RuleEffect {
  const effect: RuleEffect = { category: null, archive: false, markImportant: false };
  const address = fromAddress.toLowerCase();
  const domain = address.split("@")[1] ?? "";
  const subjectLower = subject.toLowerCase();

  for (const rule of listRules()) {
    let matched = false;
    if (rule.matchType === "sender") matched = address === rule.matchValue;
    else if (rule.matchType === "domain") matched = domain === rule.matchValue;
    else if (rule.matchType === "subject_contains")
      matched = subjectLower.includes(rule.matchValue);

    if (!matched) continue;

    if (rule.action === "category" && rule.actionValue) {
      effect.category = rule.actionValue as Category;
    } else if (rule.action === "archive") {
      effect.archive = true;
    } else if (rule.action === "mark_important") {
      effect.markImportant = true;
    } else if (rule.action === "block") {
      effect.archive = true;
      effect.category = "junk";
    }
  }

  return effect;
}
