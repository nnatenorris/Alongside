import { Category } from "../types";
import { CategoryFilter } from "../App";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "updates", label: "Updates" },
  { key: "promotions", label: "Promotions" },
  { key: "social", label: "Social" },
  { key: "forums", label: "Forums" },
  { key: "junk", label: "Junk" },
];

interface Props {
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  showArchived: boolean;
  onShowArchived: (v: boolean) => void;
  vipOnly: boolean;
  onVipOnly: (v: boolean) => void;
  byCategory: Record<Category, number> | null;
}

export function Sidebar({
  category,
  onCategory,
  showArchived,
  onShowArchived,
  vipOnly,
  onVipOnly,
  byCategory,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section-title">Mail</div>
      <button
        className={`sidebar-item ${category === "all" && !showArchived ? "active" : ""}`}
        onClick={() => {
          onCategory("all");
          onShowArchived(false);
        }}
      >
        <span>All Mail</span>
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          className={`sidebar-item ${category === c.key && !showArchived ? "active" : ""}`}
          onClick={() => {
            onCategory(c.key);
            onShowArchived(false);
          }}
        >
          <span>{c.label}</span>
          {byCategory && byCategory[c.key] > 0 && <span className="count">{byCategory[c.key]}</span>}
        </button>
      ))}

      <div className="sidebar-section-title">Filters</div>
      <button className={`sidebar-item ${vipOnly ? "active" : ""}`} onClick={() => onVipOnly(!vipOnly)}>
        <span>VIP senders</span>
      </button>
      <button
        className={`sidebar-item ${showArchived ? "active" : ""}`}
        onClick={() => onShowArchived(!showArchived)}
      >
        <span>Archived</span>
      </button>
    </aside>
  );
}
