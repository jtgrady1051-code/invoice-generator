import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Download, Eye, Zap, ChevronDown, X, Send } from 'lucide-react';

// ── PDF PRINT STYLES injected into document head ──
const PDF_STYLES = `
  .pdf-wrapper {
    font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 300;
    color: #1a1a1a;
    background: #fff;
    padding: 2.5rem;
    max-width: 780px;
    margin: 0 auto;
  }
  .pdf-logo { font-family: 'Bebas Neue', Impact, sans-serif; font-size: 2rem; letter-spacing: 0.06em; color: #FF6B2B; margin-bottom: 2px; }
  .pdf-tagline { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 2rem; }
  .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.5rem; border-bottom: 3px solid #FF6B2B; margin-bottom: 2rem; }
  .pdf-title { font-family: 'Bebas Neue', Impact, sans-serif; font-size: 3rem; letter-spacing: 0.04em; color: #080808; line-height: 1; }
  .pdf-meta { text-align: right; font-size: 13px; color: #666; line-height: 1.8; }
  .pdf-meta strong { color: #080808; }
  .pdf-badge { display: inline-block; background: #FF6B2B; color: #080808; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 4px; margin-top: 8px; }
  .pdf-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
  .pdf-party-lbl { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #FF6B2B; margin-bottom: 6px; font-weight: 600; }
  .pdf-party-name { font-weight: 600; font-size: 15px; margin-bottom: 4px; color: #080808; }
  .pdf-party-detail { font-size: 13px; color: #666; line-height: 1.65; }
  .pdf-desc { background: #f8f8f8; border-left: 3px solid #FF6B2B; padding: 12px 16px; margin-bottom: 1.5rem; font-size: 13px; color: #444; line-height: 1.7; border-radius: 0 4px 4px 0; }
  .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
  .pdf-table thead tr { background: #080808; }
  .pdf-table th { color: #f5f2eb; padding: 10px 14px; text-align: left; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 400; }
  .pdf-table th.r { text-align: right; }
  .pdf-table td { padding: 11px 14px; border-bottom: 0.5px solid #e5e5e5; font-size: 13px; color: #1a1a1a; }
  .pdf-table td.r { text-align: right; }
  .pdf-table tr:last-child td { border-bottom: none; }
  .pdf-table tbody tr:nth-child(even) { background: #fafafa; }
  .pdf-totals { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 0.5px solid #e5e5e5; }
  .pdf-tot-row { display: flex; gap: 3rem; font-size: 13px; }
  .pdf-tot-lbl { color: #888; min-width: 110px; text-align: right; }
  .pdf-tot-val { font-weight: 500; min-width: 90px; text-align: right; color: #1a1a1a; }
  .pdf-grand { font-size: 20px; }
  .pdf-grand .pdf-tot-lbl { color: #080808; font-weight: 700; }
  .pdf-grand .pdf-tot-val { color: #FF6B2B; font-weight: 700; }
  .pdf-payment { background: #f8f8f8; padding: 16px 18px; border-radius: 6px; font-size: 13px; color: #666; margin-bottom: 1.5rem; line-height: 1.6; }
  .pdf-payment strong { color: #080808; font-size: 14px; display: block; margin-bottom: 4px; }
  .pdf-footer { text-align: center; font-size: 11px; color: #bbb; padding-top: 1.25rem; border-top: 0.5px solid #e8e8e8; letter-spacing: 1px; }
`;

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

function fmtMoney(n) {
  return '$' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buildPDFHTML(inv) {
  const subtotal = inv.lineItems.reduce((s, l) => s + parseFloat(l.qty || 0) * parseFloat(l.rate || 0), 0);
  const taxAmt = subtotal * (parseFloat(inv.taxRate || 0) / 100);
  const grand = subtotal + taxAmt;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600&display=swap" rel="stylesheet"/>
<style>${PDF_STYLES}</style>
</head>
<body>
<div class="pdf-wrapper">
  <div class="pdf-logo">AI Consultants of NEPA</div>
  <div class="pdf-tagline">aiconsultantsofnepa.com · (570) 218-5903 · info@aiconsultantsofnepa.com</div>
  <div class="pdf-header">
    <div class="pdf-title">Invoice</div>
    <div class="pdf-meta">
      <div><strong># ${inv.number}</strong></div>
      <div>Date: ${fmtDate(inv.date)}</div>
      <div>Due: ${fmtDate(inv.dueDate)}</div>
      <div class="pdf-badge">AMOUNT DUE: ${fmtMoney(grand)}</div>
    </div>
  </div>
  <div class="pdf-parties">
    <div>
      <div class="pdf-party-lbl">From</div>
      <div class="pdf-party-name">AI Consultants of NEPA</div>
      <div class="pdf-party-detail">aiconsultantsofnepa.com<br>(570) 218-5903<br>info@aiconsultantsofnepa.com</div>
    </div>
    <div>
      <div class="pdf-party-lbl">Bill To</div>
      <div class="pdf-party-name">${inv.clientName || '—'}${inv.clientCompany ? ' · ' + inv.clientCompany : ''}</div>
      <div class="pdf-party-detail">${[inv.clientEmail, inv.clientPhone].filter(Boolean).join('<br>')}</div>
    </div>
  </div>
  ${inv.description ? `<div class="pdf-desc">${inv.description.replace(/\n/g, '<br>')}</div>` : ''}
  <table class="pdf-table">
    <thead>
      <tr>
        <th style="width:50%">Description</th>
        <th class="r" style="width:12%">Qty</th>
        <th class="r" style="width:18%">Rate</th>
        <th class="r" style="width:20%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${inv.lineItems.map(l => `
        <tr>
          <td>${l.desc || '—'}</td>
          <td class="r">${l.qty}</td>
          <td class="r">${fmtMoney(l.rate)}</td>
          <td class="r">${fmtMoney(parseFloat(l.qty || 0) * parseFloat(l.rate || 0))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="pdf-totals">
    <div class="pdf-tot-row"><span class="pdf-tot-lbl">Subtotal</span><span class="pdf-tot-val">${fmtMoney(subtotal)}</span></div>
    ${parseFloat(inv.taxRate) > 0 ? `<div class="pdf-tot-row"><span class="pdf-tot-lbl">Tax (${parseFloat(inv.taxRate).toFixed(1)}%)</span><span class="pdf-tot-val">${fmtMoney(taxAmt)}</span></div>` : ''}
    <div class="pdf-tot-row pdf-grand"><span class="pdf-tot-lbl">Total Due</span><span class="pdf-tot-val">${fmtMoney(grand)}</span></div>
  </div>
  <div class="pdf-payment">
    <strong>Payment Terms: ${inv.paymentTerms}</strong>
    Make checks payable to AI Consultants of NEPA, or ask about electronic payment options. Thank you for your business.
  </div>
  <div class="pdf-footer">AI Consultants of NEPA · aiconsultantsofnepa.com · (570) 218-5903 · info@aiconsultantsofnepa.com</div>
</div>
</body>
</html>`;
}

// ── DEFAULT STATE ──
function defaultInvoice() {
  const today = new Date();
  const due = new Date();
  due.setDate(today.getDate() + 15);
  return {
    number: 'INV-001',
    date: today.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    paymentTerms: 'Net 15',
    taxRate: '0',
    lineItems: [{ id: 1, desc: 'AI Consulting — Discovery & Assessment', qty: '1', rate: '' }],
  };
}

// ── STYLES (CSS-in-JS) ──
const S = {
  page: {
    minHeight: '100vh',
    background: '#080808',
    color: '#f5f2eb',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.1rem 2.5rem',
    background: 'rgba(8,8,8,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,107,43,0.15)',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.4rem',
    letterSpacing: '0.08em',
    color: '#FF6B2B',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navLink: {
    fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
    color: '#888', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer',
  },
  main: { maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' },
  pageHeader: { marginBottom: '2rem' },
  eyebrow: { fontSize: '0.65rem', letterSpacing: '4px', textTransform: 'uppercase', color: '#FF6B2B', marginBottom: 10 },
  pageTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '0.02em', lineHeight: 1 },

  aiBanner: {
    background: 'rgba(255,107,43,0.1)',
    border: '1px solid rgba(255,107,43,0.25)',
    borderRadius: 10,
    padding: '1rem 1.25rem',
    marginBottom: '0.5rem',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  },
  aiBannerIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  aiBannerBody: { flex: 1 },
  aiBannerTitle: { fontWeight: 600, fontSize: 14, color: '#f5f2eb', marginBottom: 4 },
  aiBannerSub: { fontSize: 12, color: '#888', lineHeight: 1.5 },

  notesArea: {
    background: 'rgba(8,8,8,0.5)',
    border: '1px dashed rgba(255,107,43,0.3)',
    borderRadius: 8, padding: '10px 12px', marginTop: 8,
  },
  notesTextarea: {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300,
    resize: 'vertical', minHeight: 70,
  },
  notesActions: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
  btnAI: {
    background: '#FF6B2B', border: 'none', color: '#080808',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
    fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase',
    padding: '8px 18px', borderRadius: 6, cursor: 'pointer', transition: 'opacity 0.15s',
  },
  divider: { textAlign: 'center', fontSize: 12, color: '#555', margin: '0.85rem 0', letterSpacing: '2px' },

  panel: {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '1.5rem', marginBottom: '1rem',
  },
  panelTitle: { fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: '#666', marginBottom: '1rem' },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#666' },

  input: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 300, padding: '8px 10px', outline: 'none', width: '100%',
    transition: 'border-color 0.15s',
  },
  textarea: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 300, padding: '8px 10px', outline: 'none', width: '100%',
    resize: 'vertical', minHeight: 80, transition: 'border-color 0.15s',
  },
  select: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 300, padding: '8px 10px', outline: 'none', width: '100%',
    appearance: 'none', cursor: 'pointer',
  },

  lineTable: { width: '100%', borderCollapse: 'collapse' },
  lineTh: {
    fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
    color: '#555', textAlign: 'left', padding: '6px 6px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  lineTd: { padding: '5px 3px', verticalAlign: 'middle' },
  lineInput: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 5, color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 300, padding: '7px 8px', outline: 'none', width: '100%',
  },
  lineTotal: { fontSize: 13, fontWeight: 500, color: '#f5f2eb', textAlign: 'right', paddingRight: 4 },
  btnRemove: {
    background: 'none', border: 'none', color: '#555',
    cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4, lineHeight: 1,
    transition: 'color 0.15s',
  },
  btnAddLine: {
    background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)',
    color: '#666', fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase',
    padding: '9px 16px', borderRadius: 6, cursor: 'pointer', width: '100%',
    marginTop: 10, transition: 'border-color 0.15s, color 0.15s',
  },

  taxRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  taxLabel: { fontSize: 12, color: '#666', whiteSpace: 'nowrap' },
  taxInput: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, padding: '7px 8px', outline: 'none', width: 70,
  },

  totalsBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 12,
  },
  totRow: { display: 'flex', gap: '2rem' },
  totLbl: { fontSize: 13, color: '#888', minWidth: 110, textAlign: 'right' },
  totVal: { fontSize: 13, fontWeight: 500, color: '#f5f2eb', minWidth: 90, textAlign: 'right' },
  grandLbl: { fontSize: 17, color: '#f5f2eb', minWidth: 110, textAlign: 'right' },
  grandVal: { fontSize: 17, fontWeight: 600, color: '#FF6B2B', minWidth: 90, textAlign: 'right' },

  actionRow: { display: 'flex', gap: 10, marginTop: '1.25rem' },
  btnPreview: {
    flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
    color: '#f5f2eb', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase',
    padding: 14, borderRadius: 8, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.15s',
  },
  btnDownload: {
    flex: 2, background: '#FF6B2B', border: 'none', color: '#080808',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
    fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase',
    padding: 14, borderRadius: 8, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s',
  },

  // Preview modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-start',
    justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto',
  },
  previewCard: {
    background: '#fff', color: '#1a1a1a', borderRadius: 10,
    width: '100%', maxWidth: 750, padding: '2.5rem', position: 'relative',
    fontFamily: "'DM Sans', sans-serif",
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: '#f0f0f0', border: 'none', borderRadius: '50%',
    width: 32, height: 32, fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333',
  },
  spinner: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888' },
};

// ── HISTORY SIDEBAR ──
function HistorySidebar({ history, onLoad, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ width: 340, background: '#111', borderLeft: '1px solid rgba(255,107,43,0.2)', padding: '2rem 1.5rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#FF6B2B', letterSpacing: '0.05em' }}>Invoice History</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20 }}><X size={20} /></button>
        </div>
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: '#555' }}>No saved invoices yet. Save one by downloading it.</p>
        ) : history.map(inv => (
          <div key={inv.number + inv.date} onClick={() => { onLoad(inv); onClose(); }}
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '1rem', marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#f5f2eb' }}>{inv.number}</span>
              <span style={{ fontSize: 12, color: '#FF6B2B', fontWeight: 600 }}>
                {fmtMoney(inv.lineItems.reduce((s, l) => s + parseFloat(l.qty || 0) * parseFloat(l.rate || 0), 0) * (1 + parseFloat(inv.taxRate || 0) / 100))}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>{inv.clientName || 'No client'}{inv.clientCompany ? ` · ${inv.clientCompany}` : ''}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{fmtDate(inv.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function InvoiceGenerator() {
  const [inv, setInv] = useState(defaultInvoice);
  const [aiNotes, setAiNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('invoice_history');
      if (stored) setHistory(JSON.parse(stored));
      const counterStored = localStorage.getItem('invoice_counter');
      if (counterStored) {
        const n = parseInt(counterStored) + 1;
        setInv(prev => ({ ...prev, number: 'INV-' + String(n).padStart(3, '0') }));
      }
    } catch (e) {}
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const set = (field, val) => setInv(prev => ({ ...prev, [field]: val }));

  const setLineItem = (id, field, val) => {
    setInv(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(l => l.id === id ? { ...l, [field]: val } : l)
    }));
  };

  const addLine = () => setInv(prev => ({
    ...prev,
    lineItems: [...prev.lineItems, { id: Date.now(), desc: '', qty: '1', rate: '' }]
  }));

  const removeLine = (id) => setInv(prev => ({
    ...prev,
    lineItems: prev.lineItems.filter(l => l.id !== id)
  }));

  const subtotal = inv.lineItems.reduce((s, l) => s + parseFloat(l.qty || 0) * parseFloat(l.rate || 0), 0);
  const taxAmt = subtotal * (parseFloat(inv.taxRate || 0) / 100);
  const grand = subtotal + taxAmt;

  const runAIFill = useCallback(async () => {
    if (!aiNotes.trim()) { showToast('Paste some notes first.', 'error'); return; }
    setAiLoading(true);
    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) { showToast('API key not configured — fill in manually.', 'error'); setAiLoading(false); return; }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Extract invoice details from these notes and return ONLY valid JSON with these exact fields: clientName (string), clientCompany (string), clientEmail (string), clientPhone (string), description (string — a clean project summary), paymentTerms (must be one of: "Due on receipt","Net 15","Net 30","Net 45","50% upfront, 50% on delivery"), lineItems (array of {desc: string, qty: string, rate: string} — infer reasonable line items from context, leave rate as empty string if not mentioned). Use empty string for any field not mentioned. Notes: "${aiNotes}"`
          }]
        })
      });
      const data = await res.json();
      const text = (data.content.find(c => c.type === 'text') || {}).text || '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setInv(prev => ({
        ...prev,
        clientName: parsed.clientName || prev.clientName,
        clientCompany: parsed.clientCompany || prev.clientCompany,
        clientEmail: parsed.clientEmail || prev.clientEmail,
        clientPhone: parsed.clientPhone || prev.clientPhone,
        description: parsed.description || prev.description,
        paymentTerms: parsed.paymentTerms || prev.paymentTerms,
        lineItems: parsed.lineItems && parsed.lineItems.length
          ? parsed.lineItems.map((l, i) => ({ id: Date.now() + i, desc: l.desc || '', qty: l.qty || '1', rate: l.rate || '' }))
          : prev.lineItems,
      }));
      setAiNotes('');
      showToast('Invoice auto-filled — review and adjust as needed.');
    } catch (e) {
      console.error(e);
      showToast('Could not parse notes — try again or fill in manually.', 'error');
    }
    setAiLoading(false);
  }, [aiNotes]);

  const saveToHistory = useCallback((invoiceData) => {
    setHistory(prev => {
      const updated = [invoiceData, ...prev.filter(h => h.number !== invoiceData.number)].slice(0, 50);
      try {
        localStorage.setItem('invoice_history', JSON.stringify(updated));
        const num = parseInt(invoiceData.number.replace('INV-', '')) || 1;
        localStorage.setItem('invoice_counter', String(num));
      } catch (e) {}
      return updated;
    });
  }, []);

  const handleSendInvoice = useCallback(async () => {
    if (!inv.clientEmail) {
      showToast('Please add client email before sending.', 'error');
      return;
    }
    setSendLoading(true);
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: inv }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.emailSent) {
          showToast(`Invoice sent to ${inv.clientEmail}!`);
        } else {
          showToast(`Payment link created! Email failed — link: ${data.paymentLink}`, 'error');
        }
        saveToHistory({ ...inv });
        const nextNum = parseInt(inv.number.replace('INV-', '')) + 1;
        setInv(prev => ({ ...prev, number: 'INV-' + String(nextNum).padStart(3, '0') }));
      } else {
        showToast(data.error || 'Failed to send invoice.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to send — check your connection.', 'error');
    }
    setSendLoading(false);
  }, [inv, saveToHistory]);

  const handleDownload = useCallback(async () => {
    setPdfLoading(true);
    try {
      const htmlContent = buildPDFHTML(inv);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:850px;height:1100px;';
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();
      await new Promise(r => setTimeout(r, 1200));
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: `${inv.number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(iframe.contentDocument.body)
        .save();
      document.body.removeChild(iframe);
      saveToHistory({ ...inv });
      showToast(`${inv.number} downloaded and saved to history.`);
      const nextNum = parseInt(inv.number.replace('INV-', '')) + 1;
      setInv(prev => ({ ...prev, number: 'INV-' + String(nextNum).padStart(3, '0') }));
    } catch (e) {
      console.error(e);
      showToast('PDF generation failed — try again.', 'error');
    }
    setPdfLoading(false);
  }, [inv, saveToHistory]);

  const inputStyle = (focused) => ({
    ...S.input,
    borderColor: focused ? '#FF6B2B' : 'rgba(255,255,255,0.1)',
    boxShadow: focused ? '0 0 0 3px rgba(255,107,43,0.12)' : 'none',
  });

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.logo}>AI Consultants of NEPA</div>
        <div style={S.navRight}>
          <span style={S.navLink} onClick={() => setShowHistory(true)}>History</span>
          <span style={{ color: '#333' }}>·</span>
          <a href="/" style={S.navLink}>← Back to site</a>
        </div>
      </nav>

      <div style={S.main}>
        {/* PAGE HEADER */}
        <div style={S.pageHeader}>
          <div style={S.eyebrow}>Invoicing Tool</div>
          <div style={S.pageTitle}>Invoice Generator</div>
        </div>

        {/* AI DRAFT BANNER */}
        <div style={S.aiBanner}>
          <Zap size={18} color="#FF6B2B" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={S.aiBannerBody}>
            <div style={S.aiBannerTitle}>AI Draft — paste job notes to auto-fill</div>
            <div style={S.aiBannerSub}>e.g. "John Smith, ABC Roofing, workflow automation setup, $3,500, net 15"</div>
            <div style={S.notesArea}>
              <textarea
                style={S.notesTextarea}
                value={aiNotes}
                onChange={e => setAiNotes(e.target.value)}
                placeholder="Type or paste any notes about this job, client, or project..."
                rows={3}
              />
            </div>
            <div style={S.notesActions}>
              <button
                style={{ ...S.btnAI, opacity: aiLoading || !aiNotes.trim() ? 0.5 : 1 }}
                disabled={aiLoading || !aiNotes.trim()}
                onClick={runAIFill}
              >
                {aiLoading ? 'Drafting...' : 'Auto-fill Invoice'}
              </button>
              {aiLoading && <div style={S.spinner}><span style={{ width: 14, height: 14, border: '2px solid #333', borderTopColor: '#FF6B2B', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Processing...</div>}
            </div>
          </div>
        </div>

        <div style={S.divider}>— or fill in manually —</div>

        {/* INVOICE DETAILS */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Invoice Details</div>
          <div style={S.grid3}>
            <div style={S.field}>
              <span style={S.label}>Invoice #</span>
              <input style={S.input} value={inv.number} onChange={e => set('number', e.target.value)} />
            </div>
            <div style={S.field}>
              <span style={S.label}>Invoice Date</span>
              <input type="date" style={S.input} value={inv.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div style={S.field}>
              <span style={S.label}>Due Date</span>
              <input type="date" style={S.input} value={inv.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* CLIENT INFO */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Client Information</div>
          <div style={S.grid2}>
            <div style={S.field}>
              <span style={S.label}>Client Name</span>
              <input style={S.input} value={inv.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div style={S.field}>
              <span style={S.label}>Business Name</span>
              <input style={S.input} value={inv.clientCompany} onChange={e => set('clientCompany', e.target.value)} placeholder="ABC Company" />
            </div>
          </div>
          <div style={{ ...S.grid2, marginTop: 12 }}>
            <div style={S.field}>
              <span style={S.label}>Email</span>
              <input type="email" style={S.input} value={inv.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@company.com" />
            </div>
            <div style={S.field}>
              <span style={S.label}>Phone</span>
              <input type="tel" style={S.input} value={inv.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="(570) 555-0000" />
            </div>
          </div>
        </div>

        {/* PROJECT */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Project</div>
          <div style={S.field}>
            <span style={S.label}>Description</span>
            <textarea
              style={S.textarea}
              value={inv.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the project or services delivered..."
            />
          </div>
          <div style={{ ...S.field, marginTop: 12 }}>
            <span style={S.label}>Payment Terms</span>
            <div style={{ position: 'relative' }}>
              <select style={S.select} value={inv.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                <option>Due on receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>50% upfront, 50% on delivery</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Line Items</div>
          <table style={S.lineTable}>
            <thead>
              <tr>
                <th style={{ ...S.lineTh, width: '46%' }}>Description</th>
                <th style={{ ...S.lineTh, width: '12%', textAlign: 'right' }}>Qty</th>
                <th style={{ ...S.lineTh, width: '18%', textAlign: 'right' }}>Rate ($)</th>
                <th style={{ ...S.lineTh, width: '18%', textAlign: 'right' }}>Total</th>
                <th style={{ ...S.lineTh, width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map(line => (
                <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={S.lineTd}>
                    <input style={S.lineInput} value={line.desc} onChange={e => setLineItem(line.id, 'desc', e.target.value)} placeholder="Service or item" />
                  </td>
                  <td style={S.lineTd}>
                    <input type="number" style={{ ...S.lineInput, textAlign: 'right' }} value={line.qty} onChange={e => setLineItem(line.id, 'qty', e.target.value)} min="1" step="1" />
                  </td>
                  <td style={S.lineTd}>
                    <input type="number" style={{ ...S.lineInput, textAlign: 'right' }} value={line.rate} onChange={e => setLineItem(line.id, 'rate', e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </td>
                  <td style={S.lineTd}>
                    <span style={S.lineTotal}>{fmtMoney(parseFloat(line.qty || 0) * parseFloat(line.rate || 0))}</span>
                  </td>
                  <td style={S.lineTd}>
                    <button style={S.btnRemove} onClick={() => removeLine(line.id)} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={S.btnAddLine} onClick={addLine}>
            <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Add Line Item
          </button>

          {/* TAX */}
          <div style={S.taxRow}>
            <span style={S.taxLabel}>Tax Rate (%)</span>
            <input
              type="number" style={S.taxInput}
              value={inv.taxRate} min="0" max="100" step="0.1"
              onChange={e => set('taxRate', e.target.value)}
            />
          </div>

          {/* TOTALS */}
          <div style={S.totalsBlock}>
            <div style={S.totRow}>
              <span style={S.totLbl}>Subtotal</span>
              <span style={S.totVal}>{fmtMoney(subtotal)}</span>
            </div>
            {parseFloat(inv.taxRate) > 0 && (
              <div style={S.totRow}>
                <span style={S.totLbl}>Tax ({parseFloat(inv.taxRate).toFixed(1)}%)</span>
                <span style={S.totVal}>{fmtMoney(taxAmt)}</span>
              </div>
            )}
            <div style={S.totRow}>
              <span style={S.grandLbl}>Total Due</span>
              <span style={S.grandVal}>{fmtMoney(grand)}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={S.actionRow}>
          <button style={S.btnPreview} onClick={() => setShowPreview(true)}>
            <Eye size={16} /> Preview
          </button>
          <button style={{ ...S.btnDownload, opacity: pdfLoading ? 0.6 : 1, background: 'transparent', border: '1px solid #FF6B2B', color: '#FF6B2B' }} onClick={handleDownload} disabled={pdfLoading}>
            <Download size={16} />
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <button style={{ ...S.btnDownload, opacity: sendLoading ? 0.6 : 1, flex: 2 }} onClick={handleSendInvoice} disabled={sendLoading}>
            <Send size={16} />
            {sendLoading ? 'Sending...' : 'Send Invoice'}
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div style={S.previewCard}>
            <button style={S.closeBtn} onClick={() => setShowPreview(false)}>✕</button>
            <div dangerouslySetInnerHTML={{ __html: buildPDFHTML(inv).replace(/<!DOCTYPE html>[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<link[^>]*>/g, '').replace('<div class="pdf-wrapper">', '<div>') }} />
            <button
              style={{ ...S.btnDownload, width: '100%', marginTop: '1.5rem', justifyContent: 'center', borderRadius: 8 }}
              onClick={() => { setShowPreview(false); handleDownload(); }}
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      )}

      {/* HISTORY SIDEBAR */}
      {showHistory && (
        <HistorySidebar
          history={history}
          onLoad={(savedInv) => { setInv(savedInv); showToast('Invoice loaded.'); }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: toast.type === 'error' ? '#E24B4A' : '#FF6B2B',
          color: '#080808', borderRadius: 8, padding: '0.85rem 1.25rem',
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeUp 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        select option { background: #1a1a1a; color: #f5f2eb; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        @media (max-width: 600px) {
          nav { padding: 1rem 1.25rem !important; }
          .grid2, .grid3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
