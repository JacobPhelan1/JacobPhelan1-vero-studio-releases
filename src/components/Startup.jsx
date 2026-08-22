import { useState } from "react";

export default function Startup({ productions, onCreate, onOpen }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ productionName: "", eventName: "", sport: "", date: new Date().toISOString().slice(0, 10) });
  return <main className="startup">
    <section className="startup-brand">
      <img src="/brand/studio/IconWordmarkStudio.png" alt="VERO Studio" />
      <h1>The production brain.</h1>
      <p>Build, connect, and direct a VERO production from one precise workspace.</p>
      <small>VERO STUDIO · VERSION 0.1.0</small>
    </section>
    <section className="startup-actions">
      <header><p>PRODUCTION CONTROL</p><h2>{creating ? "New production" : "Ready when you are."}</h2></header>
      {creating ? <form onSubmit={(event) => { event.preventDefault(); onCreate(form); }}>
        <label>PRODUCTION NAME<input autoFocus required value={form.productionName} onChange={(event) => setForm({ ...form, productionName: event.target.value })} /></label>
        <label>EVENT NAME<input value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} /></label>
        <div><label>SPORT<input value={form.sport} onChange={(event) => setForm({ ...form, sport: event.target.value })} /></label><label>DATE<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div>
        <button className="primary">CREATE PRODUCTION</button><button type="button" onClick={() => setCreating(false)}>CANCEL</button>
      </form> : <>
        <button className="new-production" onClick={() => setCreating(true)}><b>＋</b><span><strong>NEW PRODUCTION</strong><small>Start with a clean production workspace</small></span></button>
        <section className="recent"><h3>RECENT PRODUCTIONS</h3>{productions.length ? productions.map((item) => <button key={item.productionId} onClick={() => onOpen(item.productionId)}><span><strong>{item.productionName}</strong><small>{[item.eventName, item.sport, item.date].filter(Boolean).join(" · ")}</small></span><b>OPEN</b></button>) : <p>No saved productions on this computer.</p>}</section>
        <button className="scheduled" disabled>LOAD SCHEDULED EVENT <small>Account integration required</small></button>
      </>}
    </section>
  </main>;
}
