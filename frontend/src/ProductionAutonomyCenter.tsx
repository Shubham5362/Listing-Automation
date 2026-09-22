import { useEffect, useState } from 'react'

type Health = { status: string; active_workflows: number; failed_jobs: number; autonomous_success_rate: number }
type Policy = { mode: string; max_financial_impact: number; max_auto_actions_per_day: number; enabled: boolean }

export default function ProductionAutonomyCenter() {
  const [health, setHealth] = useState<Health | null>(null)
  const [policy, setPolicy] = useState<Policy | null>(null)
  useEffect(() => {
    Promise.all([fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/production/health'), fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/production/policy')])
      .then(async ([h, p]) => { setHealth(await h.json()); setPolicy(await p.json()) })
      .catch(() => undefined)
  }, [])
  return <section className="module-page production-autonomy-center">
    <header className="module-header"><div><p className="eyebrow">Production control</p><h1>Autonomous Seller OS</h1><p>Safety, reliability and autonomous workflow health.</p></div></header>
    <div className="stats-grid">
      <article><span>System</span><strong>{health?.status ?? 'Loading…'}</strong></article>
      <article><span>Active workflows</span><strong>{health?.active_workflows ?? 0}</strong></article>
      <article><span>Failed workflows</span><strong>{health?.failed_jobs ?? 0}</strong></article>
      <article><span>Autonomous success</span><strong>{health ? `${Math.round(health.autonomous_success_rate * 100)}%` : '—'}</strong></article>
    </div>
    <div className="module-grid"><article className="module-card"><h2>Safety policy</h2><p>Mode: <b>{policy?.mode ?? 'Loading…'}</b></p><p>Financial guardrail: ₹{policy?.max_financial_impact ?? 0}</p><p>Daily auto-action cap: {policy?.max_auto_actions_per_day ?? 0}</p></article><article className="module-card"><h2>Execution contract</h2><p>High-risk and low-confidence actions remain approval-gated.</p><p>Idempotency prevents duplicate workflow execution.</p><p>Every workflow records completion or failure.</p></article></div>
  </section>
}
