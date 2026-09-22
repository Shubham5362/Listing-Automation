import React, { useEffect, useState } from 'react';

type Seller = { id: number; name: string; is_active: boolean };
type SellerOSData = {
  seller: { id: number; name: string };
  business: { products: number; inventory_records: number; orders: number; marketplace_accounts: number };
  ai: { confidence: number; evidence: string[]; priorities: Array<{ priority: string; reason: string }> };
  safety: { autonomous_execution: string; approval_required_for_actions: boolean; marketplace_credentials_invented: boolean };
  release: { release?: string; checks?: Array<{ name: string; status: string }> };
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function FinalSellerOSWorkspace({ sellerAccountId }: { sellerAccountId?: number }) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(sellerAccountId);
  const [data, setData] = useState<SellerOSData | null>(null);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [risk, setRisk] = useState('medium');
  const [confidence, setConfidence] = useState('0.9');
  const [financialImpact, setFinancialImpact] = useState('0');
  const [requiresApproval, setRequiresApproval] = useState(true);

  const loadSellers = async () => {
    const response = await fetch(`${API_BASE}/api/v1/accounts/sellers`);
    if (!response.ok) throw new Error('Unable to load seller accounts');
    const rows = (await response.json()) as Seller[];
    setSellers(rows);
    if (!selectedSellerId) setSelectedSellerId(rows.find((item) => item.is_active)?.id);
  };

  const loadOverview = async (id: number) => {
    const response = await fetch(`${API_BASE}/api/v1/seller-os/v2/overview?seller_account_id=${id}`);
    if (!response.ok) throw new Error('Unable to load AI Seller OS');
    setData(await response.json());
  };

  useEffect(() => {
    loadSellers().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedSellerId) return;
    setError('');
    loadOverview(selectedSellerId).catch((e) => setError(e.message));
  }, [selectedSellerId]);

  const evaluateProposal = async () => {
    setProposal(null);
    const response = await fetch(`${API_BASE}/api/v1/seller-os/v2/action-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        risk,
        confidence: Number(confidence),
        financial_impact: Number(financialImpact),
        requires_approval: requiresApproval,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'Unable to evaluate action proposal');
    setProposal(body);
  };

  return (
    <section className="seller-os-workspace p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Final AI Seller OS</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">AI Seller Agent</h1>
          <p className="text-sm text-slate-500">Evidence-backed business context with policy-gated action proposals.</p>
        </div>
        <select
          value={selectedSellerId ?? ''}
          onChange={(e) => setSelectedSellerId(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          disabled={!sellers.length}
        >
          {!sellers.length && <option value="">No seller account</option>}
          {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
        </select>
      </header>

      {error && <div role="alert" className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</div>}
      {!data && !error && <p className="text-sm text-slate-500">Loading business context…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <article className="p-4 bg-white border rounded-xl"><span className="text-xs text-slate-500">Products</span><strong className="block text-xl">{data.business.products}</strong></article>
            <article className="p-4 bg-white border rounded-xl"><span className="text-xs text-slate-500">Inventory records</span><strong className="block text-xl">{data.business.inventory_records}</strong></article>
            <article className="p-4 bg-white border rounded-xl"><span className="text-xs text-slate-500">Orders</span><strong className="block text-xl">{data.business.orders}</strong></article>
            <article className="p-4 bg-white border rounded-xl"><span className="text-xs text-slate-500">AI confidence</span><strong className="block text-xl">{Math.round(data.ai.confidence * 100)}%</strong></article>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <section className="p-5 bg-white border rounded-xl space-y-3">
              <h2 className="font-bold">Priority Actions</h2>
              {data.ai.priorities.length ? data.ai.priorities.map((item, i) => (
                <article key={i} className="p-3 rounded-lg bg-slate-50 border">
                  <strong>{item.priority}</strong>
                  <p className="text-sm text-slate-600 mt-1">{item.reason}</p>
                </article>
              )) : <p className="text-sm text-slate-500">No evidence-backed priorities right now.</p>}
            </section>

            <section className="p-5 bg-white border rounded-xl space-y-3">
              <h2 className="font-bold">Safety & Release</h2>
              <p className="text-sm">Autonomous execution: <b>{data.safety.autonomous_execution}</b></p>
              <p className="text-sm">Approval required: <b>{data.safety.approval_required_for_actions ? 'Yes' : 'No'}</b></p>
              <p className="text-sm">Credentials fabricated: <b>{data.safety.marketplace_credentials_invented ? 'Blocked' : 'No'}</b></p>
              <p className="text-sm">Release: <b>{data.release.release || 'Not ready'}</b></p>
            </section>
          </div>

          <section className="p-5 bg-white border rounded-xl space-y-4">
            <div><h2 className="font-bold">Action Proposal Gate</h2><p className="text-sm text-slate-500">Evaluate an action without executing it.</p></div>
            <div className="grid sm:grid-cols-4 gap-3">
              <select value={risk} onChange={(e) => setRisk(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option>low</option><option>medium</option><option>high</option><option>critical</option>
              </select>
              <input value={confidence} onChange={(e) => setConfidence(e.target.value)} type="number" min="0" max="1" step="0.01" className="border rounded-lg px-3 py-2 text-sm" placeholder="Confidence" />
              <input value={financialImpact} onChange={(e) => setFinancialImpact(e.target.value)} type="number" min="0" step="0.01" className="border rounded-lg px-3 py-2 text-sm" placeholder="Financial impact" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} /> Requires approval</label>
            </div>
            <button onClick={() => evaluateProposal().catch((e) => setError(e.message))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold">Evaluate policy</button>
            {proposal && <div className="p-3 rounded-lg border bg-slate-50 text-sm"><b>{proposal.decision}</b> · execution: {proposal.execution} · risk: {proposal.risk} · confidence: {Math.round(proposal.confidence * 100)}%</div>}
          </section>
        </>
      )}
    </section>
  );
}
