// server/otp.routes.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

// ===== Provider config via env =====
const BASE = process.env.MESSAGECENTRAL_BASE || 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MC_CUSTOMER_ID;         // required
const KEY = process.env.MC_KEY;                         // required (Base64 of your MC password)
const EMAIL = process.env.MC_EMAIL;                     // optional
const DEFAULT_COUNTRY = process.env.MC_COUNTRY_CODE || '91';
const SCOPE = process.env.MC_SCOPE || 'NEW';            // docs suggest NEW for first time

if (!CUSTOMER_ID || !KEY) {
  console.warn('[OTP] Missing MC_CUSTOMER_ID or MC_KEY in env');
}

// ===== Simple in-memory token cache =====
let cachedToken = null;
let cachedTokenExpiry = 0; // epoch ms

async function getToken(force = false) {
  const now = Date.now();
  if (!force && cachedToken && now < cachedTokenExpiry) return cachedToken;

  const params = {
    customerId: CUSTOMER_ID,
    key: KEY,
  };
  if (SCOPE) params.scope = SCOPE;
  if (DEFAULT_COUNTRY) params.country = DEFAULT_COUNTRY;
  if (EMAIL) params.email = EMAIL;

  const url = `${BASE}/auth/v1/authentication/token`;
  const { data } = await axios.get(url, { params, headers: { accept: '*/*' } });

  // Expected: { status: number, token: string }
  if (!data?.token) {
    throw new Error('Failed to obtain MessageCentral auth token');
  }

  cachedToken = data.token;
  // TTL isn’t in the snippet; cache ~25m (refresh on 401/403 as well)
  cachedTokenExpiry = now + 25 * 60 * 1000;
  return cachedToken;
}

// Helper to call MC with token + 1 retry on 401/403
async function callWithToken(doCall) {
  try {
    const token = await getToken();
    return await doCall(token);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      const token = await getToken(true);
      return await doCall(token);
    }
    throw err;
  }
}

// ====== SEND OTP ======
// POST /api/otp/send   body: { mobileNumber, countryCode?, flowType?, otpLength? }
router.post('/send', async (req, res) => {
  const { mobileNumber, countryCode, flowType = 'SMS', otpLength } = req.body || {};
  if (!mobileNumber) {
    return res.status(400).json({ success: false, error: 'mobileNumber is required' });
  }

  try {
    const result = await callWithToken(async (token) => {
      const url = `${BASE}/verification/v3/send`;
      const params = {
        countryCode: countryCode || DEFAULT_COUNTRY,
        flowType,          // SMS or WHATSAPP
        mobileNumber,
      };
      if (otpLength) params.otpLength = otpLength; // 4..8

      const { data } = await axios.post(url, null, {
        params,
        headers: { authToken: token },
      });
      return data;
    });

    // Normalize a friendly top-level response
    return res.json({
      success: true,
      verificationId: result?.data?.verificationId,
      mobileNumber: result?.data?.mobileNumber,
      timeout: Number(result?.data?.timeout ?? 60),
      transactionId: result?.data?.transactionId,
      provider: {
        responseCode: result?.responseCode,
        message: result?.message,
      },
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    const providerMsg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.response?.data ||
      e.message ||
      'Send OTP failed';
    return res.status(status).json({ success: false, error: providerMsg });
  }
});

// ====== VERIFY / VALIDATE OTP ======
// shared handler
async function handleVerify(req, res) {
  const { verificationId, code, langId } = req.method === 'GET' ? req.query : req.body || {};

  if (!verificationId || !code) {
    return res.status(400).json({ success: false, error: 'verificationId and code are required' });
  }

  try {
    const result = await callWithToken(async (token) => {
      const url = `${BASE}/verification/v3/validateOtp`;
      const params = { verificationId, code };
      if (langId) params.langId = langId;

      const { data } = await axios.get(url, { params, headers: { authToken: token } });
      return data;
    });

    // Many providers return 200 with a status field; surface raw for your own checks if needed
    return res.json({
      success: true,
      verificationStatus: result?.data?.verificationStatus, // may be undefined if provider uses different fielding
      mobileNumber: result?.data?.mobileNumber,
      transactionId: result?.data?.transactionId,
      raw: result,
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    const providerMsg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.response?.data ||
      e.message ||
      'Validate OTP failed';
    return res.status(status).json({ success: false, error: providerMsg });
  }
}

// Official name from docs:
router.get('/validate', handleVerify);
// Friendly alias to match your frontend:
router.get('/verify', handleVerify);
// Optional POST variants if you prefer sending in body:
router.post('/validate', handleVerify);
router.post('/verify', handleVerify);

module.exports = router;
