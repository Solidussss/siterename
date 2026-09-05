const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.disable('x-powered-by');
app.use(express.json({ limit: '75kb' }));
app.use(express.urlencoded({ extended: false, limit: '75kb' }));
app.use(express.static(__dirname));

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function clean(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }
async function sendEmail(payload) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `Resend returned ${response.status}`);
  return data;
}

app.post('/api/lead', async (req, res) => {
  try {
    if (clean(req.body.companyWebsite, 200)) return res.status(200).json({ ok: true });

    const name = clean(req.body.name, 120);
    const business = clean(req.body.business, 160);
    const website = clean(req.body.website, 500);
    const email = clean(req.body.email, 254);
    const phone = clean(req.body.phone, 80);
    const message = clean(req.body.message, 4000);
    const designMode = clean(req.body.designMode, 80);
    const brandColor = clean(req.body.brandColor, 30);
    const layout = clean(req.body.layout, 80);
    const industry = clean(req.body.industry, 120);
    const sections = clean(req.body.sections, 1000);

    if (!name || !business || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'Please enter your name, business and a valid email.' });
    }

    const safe = {
      name: escapeHtml(name), business: escapeHtml(business), website: escapeHtml(website || 'Not provided'),
      email: escapeHtml(email), phone: escapeHtml(phone || 'Not provided'), message: escapeHtml(message || 'No additional notes'),
      designMode: escapeHtml(designMode || 'Not provided'), brandColor: escapeHtml(brandColor || 'Not provided'),
      layout: escapeHtml(layout || 'Not provided'), industry: escapeHtml(industry || 'Not provided'), sections: escapeHtml(sections || 'Not provided')
    };

    const leadHtml = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#101114">
        <p style="font-size:12px;letter-spacing:.12em;font-weight:700">SITEREMADE — NEW DESIGN LEAD</p>
        <h1 style="font-size:32px;margin:12px 0 8px">${safe.business}</h1>
        <p style="font-size:16px;color:#666;margin:0 0 28px">${safe.designMode} · ${safe.brandColor} · ${safe.layout} · ${safe.industry}</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Name</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.name}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Email</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.email}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Phone</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.phone}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Website</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.website}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Design mode</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.designMode}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Brand colour</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.brandColor}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Layout</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.layout}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Industry</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.industry}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Included</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.sections}</td></tr>
        </table>
        <h3 style="margin-top:28px">Notes</h3>
        <p style="white-space:pre-wrap;line-height:1.6">${safe.message}</p>
      </div>`;

    await sendEmail({
      from: 'SiteRemade Leads <leads@siteremade.com>', to: ['hello@siteremade.com'], reply_to: email,
      subject: `New SiteRemade design — ${business}`, html: leadHtml,
    });

    await sendEmail({
      from: 'SiteRemade <hello@siteremade.com>', to: [email], reply_to: 'hello@siteremade.com',
      subject: 'Your SiteRemade direction is saved',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#101114"><p style="font-size:12px;letter-spacing:.12em;font-weight:700">SITEREMADE</p><h1 style="font-size:32px;line-height:1.1">Got it, ${safe.name}.</h1><p style="font-size:16px;line-height:1.7;color:#555">We received the direction you built for <strong>${safe.business}</strong>.</p><p style="font-size:15px;line-height:1.7"><strong>${safe.designMode}</strong> · ${safe.brandColor} · ${safe.layout} · ${safe.industry}</p><p style="font-size:14px;line-height:1.7;color:#777;margin-top:28px">We'll review it against your real business and get back to you with the next step. If you want to add anything, reply directly to this email.</p></div>`,
    });

    return res.json({ ok: true, message: 'Design received. We’ll review your direction and get back to you.' });
  } catch (error) {
    console.error('Lead submission failed:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong sending your design. Please email hello@siteremade.com.' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`SiteRemade running on port ${PORT}`));
