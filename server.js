const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(express.static(__dirname));

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clean(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

async function sendEmail(payload) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Resend returned ${response.status}`);
  }
  return data;
}

app.post('/api/lead', async (req, res) => {
  try {
    // Honeypot: bots often fill hidden fields.
    if (clean(req.body.companyWebsite, 200)) {
      return res.status(200).json({ ok: true });
    }

    const name = clean(req.body.name, 120);
    const business = clean(req.body.business, 160);
    const website = clean(req.body.website, 500);
    const email = clean(req.body.email, 254);
    const phone = clean(req.body.phone, 80);
    const project = clean(req.body.project, 160);
    const message = clean(req.body.message, 4000);

    if (!name || !business || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'Please enter your name, business and a valid email.' });
    }

    const safe = {
      name: escapeHtml(name),
      business: escapeHtml(business),
      website: escapeHtml(website || 'Not provided'),
      email: escapeHtml(email),
      phone: escapeHtml(phone || 'Not provided'),
      project: escapeHtml(project || 'Not provided'),
      message: escapeHtml(message || 'No additional notes'),
    };

    const leadHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#101114">
        <p style="font-size:12px;letter-spacing:.12em;font-weight:700">SITEREMADE — NEW LEAD</p>
        <h1 style="font-size:32px;margin:12px 0 28px">${safe.business}</h1>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Name</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.name}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Email</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.email}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Phone</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.phone}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Website</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.website}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #ddd;font-weight:700">Project</td><td style="padding:12px 0;border-bottom:1px solid #ddd">${safe.project}</td></tr>
        </table>
        <h3 style="margin-top:28px">What they want changed / added</h3>
        <p style="white-space:pre-wrap;line-height:1.6">${safe.message}</p>
      </div>`;

    // Notify SiteRemade. reply_to makes replying from the notification easy.
    await sendEmail({
      from: 'SiteRemade Leads <leads@siteremade.com>',
      to: ['hello@siteremade.com'],
      reply_to: email,
      subject: `New website lead — ${business}`,
      html: leadHtml,
    });

    // Confirmation to the prospect.
    await sendEmail({
      from: 'SiteRemade <hello@siteremade.com>',
      to: [email],
      reply_to: 'hello@siteremade.com',
      subject: 'We received your SiteRemade request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#101114">
          <p style="font-size:12px;letter-spacing:.12em;font-weight:700">SITEREMADE</p>
          <h1 style="font-size:32px;line-height:1.1">Thanks, ${safe.name}.</h1>
          <p style="font-size:16px;line-height:1.7;color:#555">We received your request for <strong>${safe.business}</strong>. We'll review what you sent and get back to you with the next step.</p>
          <p style="font-size:14px;line-height:1.7;color:#777;margin-top:32px">If you need to add anything, reply directly to this email.</p>
        </div>`,
    });

    return res.json({ ok: true, message: 'Project received. We’ll review it and get back to you.' });
  } catch (error) {
    console.error('Lead submission failed:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong sending your request. Please email hello@siteremade.com.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SiteRemade running on port ${PORT}`);
});
