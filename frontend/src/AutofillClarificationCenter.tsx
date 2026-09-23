import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, {
  ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers || {}) },
});

type Question = {
  id:number; field:string; marketplace_field:string; canonical:string|null; reason:string; prompt:string;
  expected_input_type:string; unit:string|null; options:any[]; required:boolean; confidence_before:number; status:string; answer:any;
};

export default function AutofillClarificationCenter() {
  const [sessionId, setSessionId] = React.useState('');
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [answers, setAnswers] = React.useState<Record<string,string>>({});
  const [message, setMessage] = React.useState('');

  const load = async () => {
    if (!sessionId) return;
    const res = await request(`/autofill/sessions/${sessionId}/questions`);
    const body = await res.json();
    if (!res.ok) { setMessage(body.detail || 'Unable to load clarification questions'); return; }
    setQuestions(body.questions || []);
    setMessage('');
  };

  const submit = async (q: Question) => {
    const value = answers[q.id];
    if (!value?.trim()) { setMessage('Answer enter karo.'); return; }
    const res = await request(`/autofill/sessions/${sessionId}/questions/${q.id}/answer`, {
      method:'POST', body:JSON.stringify({value, canonical: q.reason === 'FIELD_UNCLEAR' ? answers[`canonical-${q.id}`] : undefined}),
    });
    const body = await res.json();
    if (!res.ok) { setMessage(body.detail || 'Answer validation failed'); return; }
    setMessage('Answer verified and saved to this autofill session.');
    setAnswers(prev => ({...prev, [q.id]: ''}));
    await load();
  };

  const skip = async (q: Question) => {
    const res = await request(`/autofill/sessions/${sessionId}/questions/${q.id}/skip`, {method:'POST',body:'{}'});
    const body = await res.json();
    if (!res.ok) { setMessage(body.detail || 'This question cannot be skipped'); return; }
    await load();
  };

  return <section className="module-page" style={{marginTop:18}}>
    <div className="module-hero violet">
      <div className="module-mark">?</div>
      <div><p className="eyebrow">PHASE 3 · HUMAN-IN-THE-LOOP</p><h2>AI Clarification</h2>
      <p>AI guesses nahi karega. Unclear listing fields par yahan exact question aayega; answer validate hone ke baad session resume ho sakta hai.</p></div>
    </div>
    {message && <div className="errorbar" role="status">{message}</div>}
    <article className="panel" style={{marginTop:18}}>
      <div className="panelhead">
        <div><h2>Waiting questions</h2><p>Autofill session ID enter karke pending questions load karo.</p></div>
        <button onClick={load} disabled={!sessionId}>Load Questions</button>
      </div>
      <div style={{padding:16}}>
        <input placeholder="Autofill Session ID" value={sessionId} onChange={e=>setSessionId(e.target.value)} />
      </div>
      <div className="rows">
        {questions.length === 0 && <div><b>No pending questions</b><em>Session ready ho sakta hai ya clarification queue empty hai.</em></div>}
        {questions.map(q=><div key={q.id}>
          <b>{q.field}{q.required ? ' · Required' : ' · Optional'}<small> · {q.marketplace_field}</small></b>
          <strong>{q.reason}</strong>
          <p style={{margin:'8px 0',fontSize:13}}>{q.prompt}</p>
          {q.reason === 'FIELD_UNCLEAR' && <input placeholder="Canonical Product Brain field (e.g. COLOR)" value={answers[`canonical-${q.id}`] || ''} onChange={e=>setAnswers(prev=>({...prev,[`canonical-${q.id}`]:e.target.value}))} />}
          {q.options?.length > 0 && <select value={answers[q.id] || ''} onChange={e=>setAnswers(prev=>({...prev,[q.id]:e.target.value}))}>
            <option value="">Select...</option>{q.options.map((o:any)=><option key={String(o)} value={String(o)}>{String(o)}</option>)}
          </select>}
          {(!q.options || q.options.length === 0) && <input placeholder={q.unit ? `Value in ${q.unit}` : 'Your answer'} value={answers[q.id] || ''} onChange={e=>setAnswers(prev=>({...prev,[q.id]:e.target.value}))} />}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={()=>submit(q)}>Save & Continue</button>
            {!q.required && <button onClick={()=>skip(q)}>Skip</button>}
          </div>
        </div>)}
      </div>
    </article>
  </section>;
}
