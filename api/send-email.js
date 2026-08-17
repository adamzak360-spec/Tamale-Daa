const axios = require('axios');

const DEFAULT_ORIGINS = [
  'https://tamale-daa.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || process.env.SITE_URL || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isEmail(value) {
  return typeof value === 'string'
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.VITE_FROM_EMAIL || process.env.FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service is not configured' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { to, subject, html, replyTo } = body;
  if (!isEmail(to)) {
    return res.status(400).json({ error: 'A valid recipient email is required' });
  }
  if (typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 200) {
    return res.status(400).json({ error: 'Subject is required and must be 200 characters or fewer' });
  }
  if (typeof html !== 'string' || html.length === 0 || html.length > 250000) {
    return res.status(400).json({ error: 'Email content is required and must be 250KB or smaller' });
  }
  if (replyTo !== undefined && !isEmail(replyTo)) {
    return res.status(400).json({ error: 'Invalid reply-to email' });
  }

  try {
    const response = await axios.post('https://api.resend.com/emails', {
      from: fromEmail,
      to: to.trim(),
      subject: subject.trim(),
      html,
      reply_to: replyTo ? replyTo.trim() : fromEmail,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });
    return res.status(200).json({ success: true, id: response.data.id });
  } catch (error) {
    const status = error.response?.status || 502;
    const providerMessage = error.response?.data?.message;
    console.error('[SERVERLESS] Email provider request failed', { status });
    return res.status(status).json({ error: providerMessage || 'Failed to send email' });
  }
};
