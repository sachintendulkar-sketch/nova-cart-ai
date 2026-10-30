import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, User, Send, Trash2, Copy, RotateCcw, Sparkles, Check } from "lucide-react";
import { api } from "../api.js";
import ProductImage from "./ProductImage.jsx";
import Reveal from "./Reveal.jsx";
import { formatINR } from "../../shared/format.js";

const SUGGESTED = [
  "I need a laptop for programming, video editing, and machine learning under ₹70,000",
  "Which noise-cancelling headphones are best for travel?",
  "Suggest a smartwatch with GPS under ₹15,000",
  "Which monitor suits design work?"
];

let nextId = 1;

function replyToText(m) {
  const lines = [m.summary];
  (m.products || []).forEach((p) => {
    const rec = (m.recommendations || []).find((r) => r.productId === p.id);
    lines.push(`- ${p.name} (${formatINR(p.price)}): ${rec ? rec.reason : ""}`);
  });
  return lines.filter(Boolean).join("\n");
}

export default function ChatPanel({ health, prefill, onOpenProduct, notify }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null);
  const logRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTo({ top: logRef.current.scrollHeight }); }, [messages, busy]);

  const send = async (raw, productId, replaceId) => {
    const content = raw.trim();
    if (!content || busy) return;
    const history = messages.filter((m) => m.role === "user" || (m.role === "assistant" && !m.error)).map((m) => ({ role: m.role, text: m.role === "user" ? m.text : m.summary || "" })).filter((h) => h.text).slice(-8);
    setBusy(true);
    setText("");
    if (!replaceId) setMessages((ms) => [...ms, { id: nextId++, role: "user", text: content, productId }]);
    else setMessages((ms) => ms.filter((m) => m.id !== replaceId));
    try {
      const data = await api.chat(content, history, productId);
      setMessages((ms) => [...ms, { id: nextId++, role: "assistant", ...data }]);
    } catch (err) {
      setMessages((ms) => [...ms, { id: nextId++, role: "assistant", error: err.message, retry: { content, productId } }]);
    } finally {
      setBusy(false);
    }
  };

  // "Ask AI about this product" from the product dialog
  useEffect(() => {
    if (prefill) send(prefill.text, prefill.productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

  const copy = async (m) => {
    try { await navigator.clipboard.writeText(replyToText(m)); setCopied(m.id); notify("Response copied"); setTimeout(() => setCopied(null), 1500); }
    catch { notify("Copy is not available in this browser", "info"); }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } };

  return (
    <section className="section" id="assistant" aria-labelledby="assistant-title">
      <div className="container">
        <Reveal className="section__head">
          <span className="eyebrow">AI Assistant</span>
          <h2 id="assistant-title">Nova, your shopping command center</h2>
          <p>Describe your budget and what you will use the product for. Nova answers from the catalog and labels any assumption it makes.</p>
        </Reveal>
        <Reveal>
          <div className="chat">
            <div className="chat__head">
              <div className="chat__title"><Bot size={20} color="#22d3ee" /> Nova <span className={`badge ${health?.aiConfigured ? "badge--ok" : ""}`}>{health?.aiConfigured ? "AI online" : "Catalog mode"}</span></div>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setMessages([])} disabled={!messages.length || busy}><Trash2 size={14} /> Clear conversation</button>
            </div>
            <div className="chat__log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
              {!messages.length && !busy && (
                <div className="chat__empty">
                  <Sparkles size={30} color="#8b5cf6" />
                  <h3 style={{ color: "#f8fafc" }}>Ask anything about the catalog</h3>
                  <p>{health?.aiConfigured ? "Try one of the prompts below." : "The AI key is not set on this server, so Nova will answer with catalog-based matching."}</p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div key={m.id} className={`msg msg--${m.role === "user" ? "user" : "ai"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {m.role !== "user" && <span className="msg__avatar"><Bot size={18} /></span>}
                    <div className="msg__body">
                      {m.role === "user" && <div className="bubble">{m.text}</div>}
                      {m.role === "assistant" && m.error && (
                        <div className="error" role="alert"><span>{m.error}</span><button className="btn btn--sm" type="button" onClick={() => send(m.retry.content, m.retry.productId, m.id)}><RotateCcw size={14} /> Retry</button></div>
                      )}
                      {m.role === "assistant" && !m.error && (
                        <>
                          {m.mode === "fallback" && <span className="badge" style={{ justifySelf: "start" }}>Catalog-based answer</span>}
                          {m.summary && <div className="bubble">{m.summary}</div>}
                          {m.clarifyingQuestion && <div className="bubble" style={{ borderColor: "rgba(34,211,238,.4)" }}>{m.clarifyingQuestion}</div>}
                          {m.products?.map((p) => {
                            const rec = m.recommendations.find((r) => r.productId === p.id);
                            return (
                              <div className="rec" key={p.id}>
                                <div className="rec__row">
                                  <ProductImage product={p} />
                                  <div style={{ minWidth: 0 }}>
                                    <div className="rec__name"><span>{p.name}</span><span>{formatINR(p.price)}</span></div>
                                    <p className="rec__why">{rec?.reason}</p>
                                    {rec?.assumption && <p className="assume">Assumption: {rec.assumption}</p>}
                                    <button className="btn btn--sm btn--ghost" type="button" style={{ marginTop: 6 }} onClick={() => onOpenProduct(p.id)}>View details</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {m.missingInfo && <p className="notice">{m.missingInfo}</p>}
                          <div className="msg__tools">
                            <button className="btn btn--sm btn--ghost" type="button" onClick={() => copy(m)}>{copied === m.id ? <Check size={14} /> : <Copy size={14} />} {copied === m.id ? "Copied" : "Copy response"}</button>
                          </div>
                        </>
                      )}
                    </div>
                    {m.role === "user" && <span className="msg__avatar"><User size={18} /></span>}
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <div className="msg msg--ai" aria-label="Nova is thinking">
                  <span className="msg__avatar"><Bot size={18} /></span>
                  <div className="bubble typing" role="status"><i /><i /><i /></div>
                </div>
              )}
            </div>
            <div className="chat__foot">
              <div className="chips" style={{ marginTop: 0 }}>
                {SUGGESTED.map((s) => <button key={s} type="button" className="chip" disabled={busy} onClick={() => send(s)}>{s.length > 52 ? s.slice(0, 50) + "…" : s}</button>)}
              </div>
              <form className="chat__form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
                <label className="sr" htmlFor="chat-input">Message Nova</label>
                <textarea id="chat-input" ref={taRef} rows={1} value={text} maxLength={600} placeholder="Ask about budget, use case or specs" onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
                <button className="btn btn--primary" type="submit" disabled={busy || !text.trim()} aria-label="Send message"><Send size={18} /></button>
              </form>
              <p className="muted" style={{ fontSize: ".78rem" }}>Replies appear when complete (no streaming). Demo catalog data only.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
