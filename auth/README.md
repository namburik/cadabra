# GitHub OAuth Setup Guide

Your Client ID is: `Ov23ligh67ROJwOiIXxB`
Your OAuth Redirect URI: `https://namburi.me/blogs.html`

## Current Setup ✅

- ✅ Frontend OAuth flow: [assets/scripts.js](../assets/scripts.js)
- ✅ OAuth callback handler: [blogs.html](../blogs.html) (added inline script)
- ✅ Backend endpoint reference: [auth/exchange-token-backend.js.txt](./exchange-token-backend.js.txt)

## Flow

1. User clicks "Sign In" on any page
2. Redirected to GitHub with Client ID
3. User authorizes → GitHub redirects to `https://namburi.me/blogs.html?code=XXX`
4. [blogs.html](../blogs.html) detects `code` parameter and calls backend `/api/auth/exchange-token`
5. Backend exchanges code for access token
6. Auth data stored in localStorage
7. Page reloads → Blogs menu and Sign Out button appear

## What you need to complete:

### 1. Get your Client Secret

Go to https://github.com/settings/developers and locate your OAuth app (Client ID `Ov23ligh67ROJwOiIXxB`). Copy the **Client Secret**.

**⚠️ IMPORTANT:** Never commit the Client Secret to git. Store it as an environment variable only.

### 2. GitHub OAuth app is already configured

The redirect URI in GitHub should be:
```
https://namburi.me/blogs.html
```

If it's not, update it in GitHub settings.

### 3. Deploy the backend endpoint

Choose one option:

#### **Option A: Vercel (recommended)**

1. Create `/api/auth/exchange-token.js` at the root of your repo
2. Copy the code from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt)
3. In Vercel dashboard → Settings → Environment Variables, add:
   - `GITHUB_CLIENT_ID` = `Ov23ligh67ROJwOiIXxB`
   - `GITHUB_CLIENT_SECRET` = (your secret from step 1)
4. Deploy. Endpoint is now at `https://namburi.me/api/auth/exchange-token`

#### **Option B: Netlify Functions**

1. Create `/functions/exchange-token.js`
2. Adapt the code from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt) for Netlify
3. In Netlify dashboard → Site settings → Environment, add the two env vars above
4. Update [blogs.html](../blogs.html) callback script if needed (`/api/auth/exchange-token` path should work)
5. Deploy. Endpoint is now at `https://namburi.me/api/auth/exchange-token`

#### **Option C: Your own Node.js server**

1. Copy the logic from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt) into your Express/server code
2. Ensure the route is `/api/auth/exchange-token` (used by [blogs.html](../blogs.html))
3. Set environment variables on your server
4. Deploy

### 4. Test the flow

1. Open your site. You should see "Sign In" button (no Blogs link yet)
2. Click "Sign In"
3. You'll be redirected to GitHub to authorize
4. After approval, you're redirected back to [blogs.html](../blogs.html) with a `code` parameter
5. [blogs.html](../blogs.html) calls your backend `/api/auth/exchange-token` to exchange code for token
6. Auth data is stored in localStorage
7. Page reloads, and now you see "Blogs" link + username + "Sign Out" button

### 5. For production

- [ ] GitHub OAuth app has redirect URI set to `https://namburi.me/blogs.html`
- [ ] Environment variables set securely (never in code)
- [ ] Backend endpoint deployed and working at `/api/auth/exchange-token`
- [ ] Test sign-in flow end-to-end
- [ ] Add CORS headers to backend if needed (blogs.html calls from browser)

---

**Next step:** Deploy the backend endpoint. Vercel is easiest — just add the 2 env vars and it works automatically. Then test the flow by clicking "Sign In".
