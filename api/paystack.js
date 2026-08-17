const axios = require('axios');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
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

function isValidReference(value) {
  return typeof value === 'string'
    && value.length >= 6
    && value.length <= 100
    && /^[A-Za-z0-9._-]+$/.test(value);
}

function isValidAmount(value) {
  return Number.isInteger(value) && value > 0 && value <= 100000000;
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

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ error: 'Payment service is not configured' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { action, email, amount, reference, metadata } = body;

  try {
    let response;
    if (action === 'initialize') {
      if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email is required for initialization' });
      }
      if (!isValidAmount(amount)) {
        return res.status(400).json({ error: 'Amount must be a positive integer in kobo' });
      }
      if (reference !== undefined && !isValidReference(reference)) {
        return res.status(400).json({ error: 'Invalid payment reference' });
      }

      response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email: email.trim(),
          amount,
          ...(reference ? { reference } : {}),
          ...(metadata && typeof metadata === 'object' ? { metadata } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } else if (action === 'verify') {
      if (!isValidReference(reference)) {
        return res.status(400).json({ error: 'A valid payment reference is required for verification' });
      }

      response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "initialize" or "verify"' });
    }

    return res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const providerMessage = error.response?.data?.message;
    console.error(`[PAYSTACK API] ${action || 'unknown'} failed`, { status });
    return res.status(status).json({
      error: providerMessage || 'Payment operation failed',
    });
  }
};
