const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { invoice } = req.body;

    if (!invoice || !invoice.clientEmail) {
      return res.status(400).json({ error: 'Missing invoice data or client email' });
    }

    // Calculate total
    const lineItems = invoice.lineItems || [];
    const subtotal = lineItems.reduce((s, l) => s + parseFloat(l.qty || 0) * parseFloat(l.rate || 0), 0);
    const taxAmt = subtotal * (parseFloat(invoice.taxRate || 0) / 100);
    const grand = subtotal + taxAmt;
    const grandCents = Math.round(grand * 100);

    if (grandCents < 50) {
      return res.status(400).json({ error: 'Invoice total must be at least $0.50' });
    }

    // Create Stripe Payment Link
    const product = await stripe.products.create({
      name: `Invoice ${invoice.number} — ${invoice.clientName || invoice.clientCompany || 'Client'}`,
      description: invoice.description || `Services rendered — Invoice ${invoice.number}`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: grandCents,
      currency: 'usd',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: 'https://aiconsultantsofnepa.com' },
      },
      metadata: {
        invoice_number: invoice.number,
        client_name: invoice.clientName || '',
        client_email: invoice.clientEmail,
      },
    });

    // Format line items for email
    const lineItemsHTML = lineItems.map(l => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:13px;">${l.desc || '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">${l.qty}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">$${parseFloat(l.rate || 0).toFixed(2)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">$${(parseFloat(l.qty || 0) * parseFloat(l.rate || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const fmtDate = d => { if (!d) return '—'; const [y, m, day] = d.split('-'); return `${m}/${day}/${y}`; };

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AI Consultants of NEPA <onboarding@resend.dev>',
        to: [invoice.clientEmail],
        subject: `Invoice ${invoice.number} from AI Consultants of NEPA — $${grand.toFixed(2)} due`,
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;">
            
            <!-- Header -->
            <div style="background:#080808;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-family:Impact,sans-serif;font-size:22px;letter-spacing:3px;color:#FF6B2B;">AI CONSULTANTS OF NEPA</div>
              <div style="font-family:Impact,sans-serif;font-size:28px;letter-spacing:2px;color:#fff;">INVOICE</div>
            </div>

            <!-- Invoice meta -->
            <div style="background:#f8f8f8;padding:20px 32px;display:flex;justify-content:space-between;border-bottom:3px solid #FF6B2B;">
              <div>
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF6B2B;margin-bottom:4px;">Invoice #</div>
                <div style="font-size:18px;font-weight:700;color:#080808;">${invoice.number}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:#666;">Date: ${fmtDate(invoice.date)}</div>
                <div style="font-size:12px;color:#666;">Due: ${fmtDate(invoice.dueDate)}</div>
                <div style="margin-top:6px;background:#FF6B2B;color:#080808;font-weight:700;font-size:13px;padding:4px 12px;border-radius:4px;display:inline-block;">AMOUNT DUE: $${grand.toFixed(2)}</div>
              </div>
            </div>

            <div style="padding:24px 32px;">
              
              <!-- Parties -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:24px;">
                <div>
                  <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#FF6B2B;margin-bottom:6px;">From</div>
                  <div style="font-weight:600;font-size:14px;margin-bottom:3px;">AI Consultants of NEPA</div>
                  <div style="font-size:12px;color:#666;line-height:1.6;">aiconsultantsofnepa.com<br>(570) 218-5903<br>info@aiconsultantsofnepa.com</div>
                </div>
                <div>
                  <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#FF6B2B;margin-bottom:6px;">Bill To</div>
                  <div style="font-weight:600;font-size:14px;margin-bottom:3px;">${invoice.clientName || '—'}${invoice.clientCompany ? ' · ' + invoice.clientCompany : ''}</div>
                  <div style="font-size:12px;color:#666;line-height:1.6;">${invoice.clientEmail}${invoice.clientPhone ? '<br>' + invoice.clientPhone : ''}</div>
                </div>
              </div>

              ${invoice.description ? `<div style="background:#f8f8f8;border-left:3px solid #FF6B2B;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#444;line-height:1.6;">${invoice.description}</div>` : ''}

              <!-- Line items -->
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr style="background:#080808;">
                    <th style="color:#f5f2eb;padding:10px 14px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Description</th>
                    <th style="color:#f5f2eb;padding:10px 14px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Qty</th>
                    <th style="color:#f5f2eb;padding:10px 14px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Rate</th>
                    <th style="color:#f5f2eb;padding:10px 14px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Total</th>
                  </tr>
                </thead>
                <tbody>${lineItemsHTML}</tbody>
              </table>

              <!-- Totals -->
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-bottom:24px;">
                <div style="display:flex;gap:3rem;font-size:13px;">
                  <span style="color:#888;min-width:100px;text-align:right;">Subtotal</span>
                  <span style="font-weight:500;min-width:80px;text-align:right;">$${subtotal.toFixed(2)}</span>
                </div>
                ${parseFloat(invoice.taxRate) > 0 ? `
                <div style="display:flex;gap:3rem;font-size:13px;">
                  <span style="color:#888;min-width:100px;text-align:right;">Tax (${parseFloat(invoice.taxRate).toFixed(1)}%)</span>
                  <span style="font-weight:500;min-width:80px;text-align:right;">$${taxAmt.toFixed(2)}</span>
                </div>` : ''}
                <div style="display:flex;gap:3rem;font-size:18px;padding-top:8px;border-top:1px solid #e0e0e0;margin-top:4px;">
                  <span style="font-weight:700;min-width:100px;text-align:right;">Total Due</span>
                  <span style="font-weight:700;color:#FF6B2B;min-width:80px;text-align:right;">$${grand.toFixed(2)}</span>
                </div>
              </div>

              <!-- Payment terms -->
              <div style="background:#f8f8f8;padding:14px 16px;border-radius:6px;font-size:12px;color:#666;margin-bottom:24px;">
                <strong style="color:#080808;display:block;margin-bottom:4px;">Payment Terms: ${invoice.paymentTerms}</strong>
                Questions? Reply to this email or call (570) 218-5903.
              </div>

              <!-- PAY NOW BUTTON -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${paymentLink.url}" style="background:#FF6B2B;color:#080808;font-weight:700;font-size:16px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 48px;border-radius:6px;display:inline-block;">
                  Pay Now — $${grand.toFixed(2)}
                </a>
                <div style="font-size:11px;color:#aaa;margin-top:10px;">Secure payment powered by Stripe</div>
              </div>

            </div>

            <!-- Footer -->
            <div style="background:#080808;padding:16px 32px;text-align:center;">
              <div style="font-size:11px;color:#666;letter-spacing:1px;">AI Consultants of NEPA · aiconsultantsofnepa.com · (570) 218-5903</div>
            </div>

          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const emailErr = await emailRes.json();
      console.error('Resend error:', emailErr);
      // Still return success if payment link was created
      return res.status(200).json({ 
        success: true, 
        paymentLink: paymentLink.url,
        emailSent: false,
        warning: 'Payment link created but email failed to send'
      });
    }

    return res.status(200).json({ 
      success: true, 
      paymentLink: paymentLink.url,
      emailSent: true 
    });

  } catch (err) {
    console.error('Send invoice error:', err);
    return res.status(500).json({ error: err.message });
  }
};
