import React, { useEffect, useState } from 'react';

export default function FinalSellerOSWorkspace({ sellerAccountId = 1 }: { sellerAccountId?: number }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/seller-os/overview?seller_account_id=${sellerAccountId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Unable to load Seller OS'))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [sellerAccountId]);

  return (
    <section className="seller-os-workspace">
      <header><h1>AI Seller Agent</h1><span>Online</span></header>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading business context…</p>}
      {data && <>
        <div className="seller-os-confidence">Context confidence: {Math.round(data.context.confidence * 100)}%</div>
        <h2>Priority Actions</h2>
        <div>{data.context.priorities.map((item: any, i: number) => <article key={i}><strong>{item.priority}</strong><p>{item.reason}</p></article>)}</div>
        <h2>System Health</h2>
        <p>{data.reliability.status}</p>
        <ul>{data.reliability.dependencies.map((d: any) => <li key={d.dependency}>{d.dependency}: {d.status} ({Math.round(d.latency_ms)}ms)</li>)}</ul>
      </>}
    </section>
  );
}
