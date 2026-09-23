import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, PackageCheck, RefreshCw, Truck } from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

type Shipment = {
  id: number; order_id: number; mode: string; status: string; provider?: string; awb?: string;
  tracking_url?: string; label_url?: string; shipped_at?: string; delivered_at?: string;
};

const statusLabel = (s: string) => s.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function ShippingFulfillmentWorkspace() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API + '/api/v1/shipments?limit=100');
      if (!res.ok) throw new Error('Unable to load shipments (' + res.status + ')');
      setRows(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load shipments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const mark = async (row: Shipment, status: string) => {
    setBusy(row.id); setMessage(null);
    try {
      const res = await fetch(API + '/api/v1/shipments/' + row.id + '/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.detail || 'Unable to update shipment');
      setMessage('Shipment #' + row.id + ' moved to ' + statusLabel(status) + '.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update shipment'); }
    finally { setBusy(null); }
  };

  return <div className="min-h-full p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Shipping & Fulfillment</h1><p className="text-xs sm:text-sm text-slate-500 mt-1">Manage fulfillment state, verified AWBs, labels and tracking without fabricating provider data.</p></div>
      <button onClick={() => void load()} disabled={loading} className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
    </div>
    {error && <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-3 py-2 text-xs">{error}</div>}
    {message && <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{message}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {['ready','label_created','packed'].map(s => <div key={s} className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{statusLabel(s)}</div><div className="text-2xl font-bold text-slate-900 mt-1">{rows.filter(r => r.status === s).length}</div></div>)}
    </div>
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 font-bold text-sm text-slate-800"><Truck className="w-4 h-4" />Shipment queue</div>
      {loading ? <div className="p-10 text-center text-xs text-slate-400">Loading shipment data…</div> : rows.length === 0 ? <div className="p-10 text-center text-xs text-slate-400">No shipments yet. Create fulfillment from a confirmed or packed order.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-slate-50 text-slate-500"><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Provider / AWB</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.id}>
        <td className="px-4 py-3 font-semibold text-slate-900">#{row.id}</td><td className="px-4 py-3">#{row.order_id}</td>
        <td className="px-4 py-3"><div className="font-medium">{row.provider || 'Provider not recorded'}</div><div className="text-slate-400">{row.awb || 'AWB not recorded'}</div></td>
        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"><PackageCheck className="w-3 h-3" />{statusLabel(row.status)}</span></td>
        <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">{row.status === 'label_created' && <button disabled={busy===row.id} onClick={() => void mark(row,'packed')} className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50">Mark Packed</button>}{row.status === 'packed' && <button disabled={busy===row.id} onClick={() => void mark(row,'shipped')} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50">Mark Shipped</button>}{row.tracking_url && <a href={row.tracking_url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold flex items-center gap-1">Track <ExternalLink className="w-3 h-3" /></a>}</div></td>
      </tr>)}</tbody></table></div>}
    </div>
    <p className="text-[11px] text-slate-400">Live courier label/tracking APIs are capability-gated. The UI only records provider output returned by a connected integration; it never invents AWBs, labels or delivery events.</p>
  </div>;
}
