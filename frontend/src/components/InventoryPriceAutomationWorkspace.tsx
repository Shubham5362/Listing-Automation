import { useEffect, useState } from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

type Plan = { id:number; action_type:string; sku:string; proposed_value:number; current_value:number|null; floor_value:number|null; ceiling_value:number|null; reason:string; status:string; error:string|null; };
type Targets = { marketplace_accounts:{id:number;seller_account_id:number;marketplace:string;display_name:string}[]; inventory:{seller_account_id:number;product_id:number;sku:string;title:string;available_quantity:number}[]; listings:{id:number;marketplace_account_id:number;sku:string;title:string|null;price:number|null}[]; };

export default function InventoryPriceAutomationWorkspace(){
  const [targets,setTargets]=useState<Targets>({marketplace_accounts:[],inventory:[],listings:[]});
  const [plans,setPlans]=useState<Plan[]>([]);
  const [inventoryTarget,setInventoryTarget]=useState('');
  const [accountTarget,setAccountTarget]=useState('');
  const [message,setMessage]=useState('');
  const load=async()=>{
    const [t,p]=await Promise.all([
      fetch(API+'/api/v1/inventory-price-automation/targets').then(r=>r.json()),
      fetch(API+'/api/v1/inventory-price-automation/plans').then(r=>r.json())
    ]);
    if(t.ok||t.marketplace_accounts) setTargets(t);
    if(p.ok||Array.isArray(p)) setPlans(p);
  };
  useEffect(()=>{load().catch(()=>setMessage('Unable to load automation data.'));},[]);
  const planInventory=async()=>{
    const item=targets.inventory.find(x=>String(x.product_id)===inventoryTarget);
    if(!item||!accountTarget){setMessage('Select a product and connected marketplace.');return;}
    const res=await fetch(API+'/api/v1/inventory-price-automation/plans/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seller_account_id:item.seller_account_id,marketplace_account_id:Number(accountTarget),product_id:item.product_id,sku:item.sku})});
    const json=await res.json(); setMessage(res.ok?'Inventory plan created.':json.detail||'Unable to create plan.'); await load();
  };
  const planPrice=async(id:number)=>{
    const res=await fetch(API+'/api/v1/inventory-price-automation/plans/price',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listing_id:id})});
    const json=await res.json(); setMessage(res.ok?'Price plan created.':json.detail||'Unable to create plan.'); await load();
  };
  const apply=async(id:number)=>{
    const res=await fetch(API+'/api/v1/inventory-price-automation/plans/'+id+'/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved:true})});
    const json=await res.json(); setMessage(res.ok?'Marketplace write verified.':json.detail||'Execution failed.'); await load();
  };
  return <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h1 className="text-xl font-bold text-slate-900">Inventory & Price Automation</h1>
      <p className="text-sm text-slate-500 mt-1">Create a plan first. Live marketplace writes require explicit approval and adapter read-after-write verification.</p>
      {message && <div className="mt-3 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">{message}</div>}
    </div>
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Inventory sync plan</h2>
        <select className="w-full border rounded-lg p-2 text-sm" value={inventoryTarget} onChange={e=>setInventoryTarget(e.target.value)}>
          <option value="">Select SKU</option>
          {targets.inventory.map(x=><option key={x.product_id} value={x.product_id}>{x.sku} — {x.available_quantity} sellable</option>)}
        </select>
        <select className="w-full border rounded-lg p-2 text-sm" value={accountTarget} onChange={e=>setAccountTarget(e.target.value)}>
          <option value="">Select marketplace</option>
          {targets.marketplace_accounts.map(x=><option key={x.id} value={x.id}>{x.display_name} ({x.marketplace})</option>)}
        </select>
        <button onClick={planInventory} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">Create inventory plan</button>
      </section>
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold">Price plans</h2>
        <p className="text-xs text-slate-500">Uses margin, floor/ceiling, competitor and Buy Box signals already stored for the listing.</p>
        <div className="max-h-48 overflow-auto space-y-2">
          {targets.listings.map(x=><div key={x.id} className="flex items-center justify-between border rounded-lg p-2.5">
            <div><div className="text-sm font-semibold">{x.sku}</div><div className="text-xs text-slate-500">{x.title||'Listing'} · ₹{x.price??'—'}</div></div>
            <button onClick={()=>planPrice(x.id)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Plan price</button>
          </div>)}
        </div>
      </section>
    </div>
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-bold mb-3">Automation plans</h2>
      <div className="space-y-2">
        {plans.length===0?<div className="text-sm text-slate-400">No plans yet.</div>:plans.map(p=><div key={p.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><div className="text-sm font-semibold">{p.action_type} · {p.sku}</div><div className="text-xs text-slate-500">{p.reason}</div><div className="text-xs mt-1">Current: {p.current_value??'—'} → Proposed: {p.proposed_value}{p.floor_value!=null?' · Floor '+p.floor_value:''}{p.ceiling_value!=null?' · Ceiling '+p.ceiling_value:''}</div></div>
          <div className="flex items-center gap-2"><span className="text-[11px] font-bold uppercase text-slate-500">{p.status}</span>{p.status==='pending'&&<button onClick={()=>apply(p.id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Approve & execute</button>}</div>
        </div>)}
      </div>
    </section>
  </div>;
}
