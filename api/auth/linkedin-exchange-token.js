/**
 * LinkedIn OAuth Token Exchange Endpoint for Vercel
 * POST /api/auth/linkedin-exchange-token
 */

const https = require('https');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const code = body?.code || req.query?.code;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Server configuration error: missing LinkedIn credentials' });
  }

  // Step 1: Exchange code for access token
  const tokenData = `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
  const tokenOptions = {
    hostname: 'www.linkedin.com',
    port: 443,
    path: '/oauth/v2/accessToken',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenData)
    }
  };

  try {
    const accessTokenData = await new Promise((resolve, reject) => {
      const request = https.request(tokenOptions, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
        });
      });
      request.on('error', (err) => reject(err));
      request.write(tokenData);
      request.end();
    });
    if (!accessTokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get LinkedIn access token', details: accessTokenData });
    }
    const accessToken = accessTokenData.access_token;

    // Step 2: Fetch user info via OpenID Connect userinfo endpoint
    const userInfoOptions = {
      hostname: 'api.linkedin.com',
      port: 443,
      path: '/v2/userinfo',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Connection': 'Keep-Alive'
      }
    };
    const userInfo = await new Promise((resolve, reject) => {
      const request = https.request(userInfoOptions, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
        });
      });
      request.on('error', (err) => reject(err));
      request.end();
    });

    // Return user data
    return res.status(200).json({
      id: userInfo.sub,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      email: userInfo.email,
      token: accessToken
    });
  } catch (error) {
    return res.status(500).json({ error: 'LinkedIn authentication failed', details: error.message });
  }
};
