/**
 * GitHub OAuth Token Exchange Endpoint
 * 
 * This is a Node.js/Express endpoint that should be deployed to:
 * - Vercel Functions at /api/auth/exchange-token.js
 * - Netlify Functions at /functions/exchange-token.js
 * - Or your own backend server
 * 
 * Required environment variables:
 * - GITHUB_CLIENT_ID: Ov23ligh67ROJwOiIXxB
 * - GITHUB_CLIENT_SECRET: (keep secret, never commit)
 */

const https = require('https');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23ligh67ROJwOiIXxB';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientSecret) {
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
    const accessTokenData = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        });
      });
      
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    if (accessTokenData.error) {
      return res.status(400).json({ 
        error: accessTokenData.error_description || accessTokenData.error 
      });
    }

    const accessToken = accessTokenData.access_token;

    // Step 2: Fetch user info using access token
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
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        });
      });
      
      request.on('error', reject);
      request.end();
    });

    // Return user data and token to client
    return res.status(200).json({
      login: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      email: userData.email,
      token: accessToken
    });

  } catch(error) {
    console.error('OAuth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
};
