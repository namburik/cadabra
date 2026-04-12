/**
 * GitHub OAuth Token Exchange Endpoint for Vercel
 * POST /api/auth/exchange-token
 */

const https = require('https');

module.exports = async (req, res) => {
  console.log('[OAuth] Function called');
  console.log('[OAuth] Request method:', req.method);
  console.log('[OAuth] Request path:', req.url);
  console.log('[OAuth] Request headers:', req.headers);
  
  // Parse body if it's a string (Vercel might send it that way)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.log('[OAuth] Body was string but not valid JSON');
    }
  }
  console.log('[OAuth] Parsed body:', body);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    console.log('[OAuth] Responding to OPTIONS');
    return res.status(200).end();
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    console.log('[OAuth] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  const code = body?.code || req.query?.code;
  
  if (!code) {
    console.log('[OAuth] No code provided');
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('[OAuth] Code received:', code.substring(0, 10) + '...');

  const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23ligh67ROJwOiIXxB';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  console.log('[OAuth] Client ID:', clientId);
  console.log('[OAuth] Client Secret:', clientSecret ? 'SET' : 'MISSING');

  if (!clientSecret) {
    console.log('[OAuth] CLIENT_SECRET is not configured!');
    return res.status(500).json({ error: 'Server configuration error: missing CLIENT_SECRET' });
  }

  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code: code
  });

  const options = {
    hostname: 'github.com',
    port: 443,
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      'User-Agent': 'agentic-auth'
    }
  };

  try {
    // Step 1: Exchange code for access token
    console.log('[OAuth] Starting token exchange with GitHub...');
    const accessTokenData = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        console.log('[OAuth] GitHub token endpoint responded with status:', response.statusCode);
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            console.log('[OAuth] Token response data:', data.substring(0, 100));
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        });
      });
      
      request.on('error', (err) => {
        console.error('[OAuth] Token exchange error:', err);
        reject(err);
      });
      request.write(postData);
      request.end();
    });

    console.log('[OAuth] Token exchange complete:', accessTokenData.error ? 'ERROR' : 'SUCCESS');

    if (accessTokenData.error) {
      console.error('[OAuth] GitHub error:', accessTokenData.error_description || accessTokenData.error);
      return res.status(400).json({ 
        error: accessTokenData.error_description || accessTokenData.error 
      });
    }

    const accessToken = accessTokenData.access_token;
    console.log('[OAuth] Access token received:', accessToken.substring(0, 10) + '...');

    // Step 2: Fetch user info using access token
    console.log('[OAuth] Fetching user info...');
    const userOptions = {
      hostname: 'api.github.com',
      port: 443,
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'agentic-auth',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    const userData = await new Promise((resolve, reject) => {
      const request = https.request(userOptions, (response) => {
        console.log('[OAuth] GitHub user endpoint responded with status:', response.statusCode);
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            console.log('[OAuth] User data received successfully');
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        });
      });
      
      request.on('error', (err) => {
        console.error('[OAuth] User fetch error:', err);
        reject(err);
      });
      request.end();
    });

    console.log('[OAuth] User data:', { login: userData.login, id: userData.id });

    // Step 3: Log user to Google Sheet (fire-and-forget)
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      const webhookPayload = JSON.stringify({
        login: userData.login,
        id: userData.id,
        email: userData.email || '',
        avatar_url: userData.avatar_url || ''
      });
      console.log('[OAuth] Calling Google Sheet webhook:', webhookUrl);
      // Use fetch — handles redirects automatically (Google Apps Script issues a redirect)
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: webhookPayload,
        redirect: 'follow'
      })
        .then(r => r.text().then(body => console.log('[OAuth] Sheet webhook response:', r.status, body)))
        .catch(e => console.error('[OAuth] Sheet webhook error:', e.message));
    } else {
      console.log('[OAuth] GOOGLE_SHEET_WEBHOOK_URL not set, skipping sheet logging');
    }

    // Return user data and token to client
    console.log('[OAuth] Returning success response');
    return res.status(200).json({
      login: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      email: userData.email,
      token: accessToken
    });

  } catch(error) {
    console.error('[OAuth] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
};
