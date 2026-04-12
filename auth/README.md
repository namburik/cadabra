# GitHub OAuth Setup Guide

Your Client ID is: `Ov23ligh67ROJwOiIXxB`

## What's in place:

✅ Frontend OAuth flow in [assets/scripts.js](../assets/scripts.js)
✅ OAuth callback handler at [auth/callback.html](./callback.html)
✅ Backend implementation reference: [auth/exchange-token-backend.js.txt](./exchange-token-backend.js.txt)

## What you need to complete:

### 1. Get your Client Secret

Go to https://github.com/settings/developers and locate your OAuth app (created for Client ID `Ov23ligh67ROJwOiIXxB`). Copy the **Client Secret**.

**⚠️ IMPORTANT:** Never commit the Client Secret to git. Store it as an environment variable only.

### 2. Set redirect URI in GitHub

In the GitHub OAuth app settings, set the Authorization callback URL to:
```
https://yourdomain.com/auth/callback.html
```

(Replace `yourdomain.com` with your actual domain.)

### 3. Deploy the backend endpoint

Choose one option:

#### **Option A: Vercel (recommended)**

1. Create `/api/auth/exchange-token.js` at the root of your repo
2. Copy the code from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt)
3. In Vercel dashboard → Settings → Environment Variables, add:
   - `GITHUB_CLIENT_ID` = `Ov23ligh67ROJwOiIXxB`
   - `GITHUB_CLIENT_SECRET` = (your secret from step 1)
4. Deploy. Endpoint is now at `https://yourdomain.vercel.app/api/auth/exchange-token`

#### **Option B: Netlify Functions**

1. Create `/functions/exchange-token.js`
2. Adapt the code from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt) for Netlify
3. In Netlify dashboard → Site settings → Environment, add the two env vars above
4. Update [callback.html](./callback.html) to call `/api/exchange-token` instead of `/auth/exchange-token`
5. Deploy. Endpoint is now at `https://yourdomain.netlify.app/api/exchange-token`

#### **Option C: Your own Node.js server**

1. Copy the logic from [exchange-token-backend.js.txt](./exchange-token-backend.js.txt) into your Express/server code
2. Ensure the route is `/auth/exchange-token` and matches what [callback.html](./callback.html) expects
3. Set environment variables on your server
4. Deploy

### 4. Test the flow

1. Open your site and you should see "Sign In" button (no Blogs link yet)
2. Click "Sign In"
3. You'll be redirected to GitHub to authorize
4. After approval, you're redirected to [callback.html](./callback.html)
5. Your browser exchanges the code for a token (calls your backend)
6. Auth data is stored in localStorage
7. You're redirected home, and now you see "Blogs" link + username + "Sign Out" button

### 5. For production

- [ ] Domain configured in GitHub OAuth app
- [ ] Environment variables set securely (never in code)
- [ ] Backend endpoint deployed and working
- [ ] Callback URL matches your domain
- [ ] Test sign-in flow end-to-end
- [ ] Add CORS headers to backend if needed (callback.html calls from browser)

---

**Still unsure?** The easiest path is **Vercel** — deploy, add 2 env vars, done. The redirect flow handles the rest automatically.
