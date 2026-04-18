const RESEND_API_KEY = import.meta.env.RESEND_API_KEY as string;

export type OrderEmailLineItem = {
  name: string;
  quantity: number;
  amount_total: number; // pence
};

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName?: string | null;
  orderId: string;
  totalPence: number;
  currency: string;
  items: OrderEmailLineItem[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing, skipping send');
    return { ok: false, error: 'missing_api_key' };
  }

  const symbol = opts.currency.toLowerCase() === 'gbp' ? '£'
    : opts.currency.toLowerCase() === 'usd' ? '$'
    : opts.currency.toLowerCase() === 'eur' ? '€' : '';

  const formatted = (p: number) => symbol + (p / 100).toFixed(2);

  const rows = opts.items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">${escapeHtml(i.name)} <span style="color:#888">× ${i.quantity}</span></td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${formatted(i.amount_total)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f7f2eb;font-family:Georgia,serif;color:#1a1714;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 8px;font-size:24px;">Thank you, ${escapeHtml(opts.customerName || 'friend')}.</h1>
        <p style="margin:0 0 24px;color:#555;">Your Ember &amp; Oak order is confirmed. We'll hand-pour, pack and ship within 3 working days.</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;">${rows}</table>
        <p style="margin:24px 0 0;font-size:18px;"><strong>Total: ${formatted(opts.totalPence)}</strong></p>
        <p style="margin:24px 0 0;color:#888;font-size:13px;">Order ${opts.orderId}</p>
        <p style="margin:24px 0 0;color:#b5482a;">— The Ember &amp; Oak studio</p>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ember & Oak <onboarding@resend.dev>',
        to: [opts.to],
        subject: `Your Ember & Oak order is confirmed · ${formatted(opts.totalPence)}`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[email] Resend error:', res.status, text);
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] send failed:', err);
    return { ok: false, error: String(err) };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}
