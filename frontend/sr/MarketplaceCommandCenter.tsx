import React, { useEffect, useState } from "react";

const API = "/api/v1/marketplace-expansion";

export default function MarketplaceCommandCenter() {
  const [marketplace, setMarketplace] = useState("amazon");
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [capRes, conflictRes] = await Promise.all([
        fetch(`${API}/capabilities/${encodeURIComponent(marketplace)}`),
        fetch(`${API}/conflicts`),
      ]);
      if (capRes.ok) setCapabilities((await capRes.json()).capabilities ?? {});
      if (conflictRes.ok) setConflicts(await conflictRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [marketplace]);

  return (
    <section style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Marketplace Command Center</h1>
          <p style={{ opacity: 0.7 }}>Universal capabilities, conflicts and safe execution controls.</p>
        </div>
        <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
          <option value="amazon">Amazon</option>
          <option value="flipkart">Flipkart</option>
          <option value="meesho">Meesho</option>
        </select>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        {Object.entries(capabilities).map(([name, supported]) => (
          <article key={name} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <strong>{name}</strong>
            <div style={{ marginTop: 8 }}>{supported ? "✓ Supported" : "✕ Unsupported"}</div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <h2>Open Conflicts</h2>
        {conflicts.length === 0 ? <p>No marketplace conflicts.</p> : conflicts.slice(0, 20).map((c) => (
          <article key={c.id} style={{ padding: 14, borderBottom: "1px solid #eee" }}>
            <strong>{c.marketplace} · {c.field}</strong>
            <div>{c.entity_type} / {c.entity_id} · {c.status}</div>
          </article>
        ))}
      </div>
      <button onClick={() => void refresh()} disabled={loading} style={{ marginTop: 20 }}>
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </section>
  );
}
