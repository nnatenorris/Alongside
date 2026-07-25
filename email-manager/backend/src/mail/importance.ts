import { Category, Importance } from "../types";

export interface ImportanceInput {
  category: Category;
  isVip: boolean;
  isBulk: boolean;
  toCount: number;
  subject: string;
  hasAttachments: boolean;
}

const CATEGORY_WEIGHT: Record<Category, number> = {
  primary: 10,
  updates: 0,
  forums: -5,
  social: -10,
  promotions: -25,
  junk: -60,
};

export function scoreImportance(input: ImportanceInput): number {
  let score = 0;

  if (input.isVip) score += 100;
  score += CATEGORY_WEIGHT[input.category];

  if (input.toCount === 1) score += 10;
  else if (input.toCount > 5) score -= 5;

  if (!input.isBulk) score += 5;
  if (/^\s*(re|fwd?):/i.test(input.subject)) score += 8;
  if (input.hasAttachments) score += 4;

  return score;
}

export function bandImportance(score: number): Importance {
  if (score >= 30) return "high";
  if (score <= -20) return "low";
  return "normal";
}
