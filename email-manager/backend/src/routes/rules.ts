import { Router } from "express";
import { addRule, deleteRule, listRules } from "../mail/rules";
import { RuleAction, RuleMatchType } from "../types";

export const rulesRouter = Router();

const MATCH_TYPES: RuleMatchType[] = ["sender", "domain", "subject_contains"];
const ACTIONS: RuleAction[] = ["category", "archive", "block", "mark_important"];

rulesRouter.get("/", (_req, res) => {
  res.json({ rules: listRules() });
});

rulesRouter.post("/", (req, res) => {
  const { matchType, matchValue, action, actionValue } = req.body ?? {};
  if (!MATCH_TYPES.includes(matchType)) {
    return res.status(400).json({ error: `matchType must be one of ${MATCH_TYPES.join(", ")}` });
  }
  if (!ACTIONS.includes(action)) {
    return res.status(400).json({ error: `action must be one of ${ACTIONS.join(", ")}` });
  }
  if (!matchValue || typeof matchValue !== "string") {
    return res.status(400).json({ error: "matchValue required" });
  }
  const rule = addRule(matchType, matchValue, action, actionValue ?? null);
  res.status(201).json({ rule });
});

rulesRouter.delete("/:id", (req, res) => {
  deleteRule(Number(req.params.id));
  res.json({ ok: true });
});
