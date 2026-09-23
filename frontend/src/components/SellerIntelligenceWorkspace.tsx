import { useEffect, useState } from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

type Seller = { id: number; name: string };
type Snapshot = { id:number; seller_account_id:number; health_score:number; health_status:string; metrics:Record<string,any> };
type Recommendation = { id:number; category:string; severity:string; title:string; evidence:string; recommendation:string; status:string };

export default function SellerIntelligenceWorkspace() {
  const [sellers,setSellers] = useState<Seller[]>([]);
  const [sellerId,setSellerId] = useState<number|null>(null);
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null);
  const [recommendations,setRecommendations] = useState<Recommendation[]>([]);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState('');

  const load = async (id:number) => {
    setLoading(true);
    try {
      const r = await fetch(API + '/api/v1/seller-intelligence/overview?seller_account_id=' + id);
      if (!r.ok) throw new Error('Unable to load intelligence');
      const data = await r.json();
      setSnapshot(data.snapshot);
      setRecommendations(data.recommendations || []);
    } catch { setMessage('Unable to load seller intelligence.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch(API + '/api/v1/accounts/sellers')
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data) ? data : data.sellers || [];
        setSellers(rows);
        if (rows[0]?.id) { setSellerId(rows[0].id); load(rows[0].id); }
      })
      .catch(() => setMessage('Unable to load seller accounts.'));
  }, []);

  const analyze = async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const r = await fetch(API + '/api/v1/seller-intelligence/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({seller_account_id:sellerId})
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || 'Analysis failed');
      setSnapshot(data.snapshot);
      setRecommendations(data.recommendations || []);
      setMessage('Fresh 30-day intelligence generated.');
    } catch (e:any) { setMessage(e.message || 'Analysis failed.'); }
    finally { setLoading(false); }
  };

  const setStatus = async (id:number,status:string) => {
    const r = await fetch(API + '/api/v1/seller-intelligence/recommendations/' + id + '/status?status=' + status, {method:'POST'});
    if (r.ok && sellerId) load(sellerId);
  };

  const m = snapshot?.metrics;
  return <section className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div><div className="text-[11px] font-bold tracking-wider text-indigo-500 uppercase">AI Seller Intelligence</div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">Business health & next actions</h1>
        <p className="text-sm text-slate-500 mt-1">Evidence-backed 30-day analysis. Recommendations never write to marketplaces.</p></div>
      <div className="flex gap-2">
        <select className="border rounded-lg p-2 text-sm" value={sellerId || ''} onChange={e=>{const id=Number(e.target.value);setSellerId(id);load(id);}}>
          {sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={analyze} disabled={!sellerId || loading} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{loading?'Analyzing…':'Analyze now'}</button>
      </div>
    </div>
    {message && <div className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-3">{message}</div>}
    {snapshot && <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">Health</div><div className="text-2xl font-bold">{snapshot.health_score}</div><div className="text-xs uppercase font-semibold text-slate-500">{snapshot.health_status}</div></div>
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">Orders 30d</div><div className="text-2xl font-bold">{m?.orders_30d ?? '—'}</div></div>
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">Revenue 30d</div><div className="text-2xl font-bold">₹{m?.revenue_30d ?? '—'}</div></div>
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">Out of stock</div><div className="text-2xl font-bold">{m?.out_of_stock ?? '—'}</div></div>
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">Margin</div><div className="text-2xl font-bold">{m?.margin_percent == null ? '—' : m.margin_percent + '%'}</div></div>
      <div className="bg-white border rounded-xl p-4"><div className="text-xs text-slate-500">ACOS</div><div className="text-2xl font-bold">{m?.acos_percent == null ? '—' : m.acos_percent + '%'}</div></div>
    </div>}
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4"><div><h2 className="font-bold">Recommendations</h2><p className="text-xs text-slate-500 mt-1">Prioritized signals from stored business data.</p></div></div>
      <div className="space-y-3">
        {recommendations.length===0 ? <div className="text-sm text-slate-400">No open recommendations.</div> : recommendations.map(r=>
          <div key={r.id} className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div><div className="flex items-center gap-2"><span className="text-[10px] uppercase font-bold text-slate-500">{r.severity}</span><span className="text-[10px] uppercase font-bold text-indigo-500">{r.category}</span></div><h3 className="font-semibold mt-1">{r.title}</h3><p className="text-xs text-slate-500 mt-1">{r.evidence}</p><p className="text-sm mt-2">{r.recommendation}</p></div>
            <div className="flex gap-2 shrink-0"><button onClick={()=>setStatus(r.id,'acknowledged')} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Acknowledge</button><button onClick={()=>setStatus(r.id,'dismissed')} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Dismiss</button></div>
          </div>
        )}
      </div>
    </div>
  </section>;
}
