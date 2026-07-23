import { FormEvent, useEffect, useState } from "react";
import * as api from "../api";
import { Rule, RuleAction, RuleMatchType, Vip } from "../types";

function VipManager() {
  const [vips, setVips] = useState<Vip[]>([]);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");

  function load() {
    api.fetchVips().then((r) => setVips(r.vips));
  }
  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!address) return;
    const { vips } = await api.addVip(address, label);
    setVips(vips);
    setAddress("");
    setLabel("");
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>VIP senders</h3>
      <p style={{ color: "var(--text-muted)" }}>
        Mail from VIP senders is always marked important, no matter what category it lands in.
      </p>
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="email@example.com"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button type="submit">Add VIP</button>
      </form>
      {vips.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No VIP senders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Label</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vips.map((v) => (
              <tr key={v.address}>
                <td>{v.address}</td>
                <td>{v.label}</td>
                <td>
                  <button
                    className="pill-btn danger"
                    onClick={async () => {
                      const { vips } = await api.removeVip(v.address);
                      setVips(vips);
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const MATCH_TYPES: RuleMatchType[] = ["sender", "domain", "subject_contains"];
const ACTIONS: RuleAction[] = ["category", "archive", "block", "mark_important"];
const CATEGORY_VALUES = ["primary", "promotions", "social", "updates", "forums", "junk"];

function RulesManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [matchType, setMatchType] = useState<RuleMatchType>("domain");
  const [matchValue, setMatchValue] = useState("");
  const [action, setAction] = useState<RuleAction>("archive");
  const [actionValue, setActionValue] = useState<string>("junk");

  function load() {
    api.fetchRules().then((r) => setRules(r.rules));
  }
  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!matchValue) return;
    const { rule } = await api.addRule(
      matchType,
      matchValue,
      action,
      action === "category" ? actionValue : null
    );
    setRules((prev) => [rule, ...prev]);
    setMatchValue("");
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Custom rules</h3>
      <p style={{ color: "var(--text-muted)" }}>
        Automatically categorize, archive, mark important, or block mail from a sender, domain, or
        subject match. Applied on every sync.
      </p>
      <form className="inline-form" onSubmit={handleAdd}>
        <select value={matchType} onChange={(e) => setMatchType(e.target.value as RuleMatchType)}>
          {MATCH_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          placeholder={matchType === "subject_contains" ? "text in subject" : "example.com"}
          value={matchValue}
          onChange={(e) => setMatchValue(e.target.value)}
        />
        <select value={action} onChange={(e) => setAction(e.target.value as RuleAction)}>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace("_", " ")}
            </option>
          ))}
        </select>
        {action === "category" && (
          <select value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
            {CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <button type="submit">Add rule</button>
      </form>
      {rules.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No custom rules yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Then</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.matchType.replace("_", " ")} = <code>{r.matchValue}</code>
                </td>
                <td>
                  {r.action.replace("_", " ")}
                  {r.actionValue ? ` → ${r.actionValue}` : ""}
                </td>
                <td>
                  <button
                    className="pill-btn danger"
                    onClick={async () => {
                      await api.deleteRule(r.id);
                      setRules((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function SettingsPanel() {
  return (
    <div className="panel">
      <h2>VIP &amp; Rules</h2>
      <VipManager />
      <RulesManager />
    </div>
  );
}
