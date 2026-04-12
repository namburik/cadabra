// Theme toggle, year helper, and simple client-side search
(function(){
  function applyTheme(theme){
    if(theme==='dark') document.body.classList.add('dark'); else document.body.classList.remove('dark');
  }

  // initialize theme from localStorage or system
  try{
    const saved = localStorage.getItem('theme');
    if(saved) applyTheme(saved);
    else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
  }catch(e){}

  // Update theme toggle aria state
  function updateThemeButtonState(){
    const btn = document.getElementById('theme-toggle');
    if(!btn) return;
    const isDark = document.body.classList.contains('dark');
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Toggle theme');
  }

  // Populate year elements with current year
  function populateYear(){
    const els = document.querySelectorAll('#year, .site-year');
    if(!els || !els.length) return;
    const y = new Date().getFullYear();
    els.forEach(el => { el.textContent = y; });
  }

  // GitHub auth helpers
  // --- Auth helpers for GitHub and LinkedIn ---
  function getAuth(){
    // Prefer GitHub, fallback to LinkedIn
    let auth = null;
    try { auth = JSON.parse(localStorage.getItem('github-auth') || 'null'); } catch(e){}
    if(auth && auth.login) return { ...auth, provider: 'github' };
    try { auth = JSON.parse(localStorage.getItem('linkedin-auth') || 'null'); } catch(e){}
    if(auth && auth.email) return { ...auth, provider: 'linkedin' };
    return null;
  }
  function setAuth(userData, provider){
    if(provider === 'github'){
      try{ localStorage.setItem('github-auth', JSON.stringify(userData)); }catch(e){}
    } else if(provider === 'linkedin'){
      try{ localStorage.setItem('linkedin-auth', JSON.stringify(userData)); }catch(e){}
    }
  }
  function clearAuth(){
    try{ localStorage.removeItem('github-auth'); }catch(e){}
    try{ localStorage.removeItem('linkedin-auth'); }catch(e){}
  }

  // Track authenticated user post views (fire-and-forget)
  (function trackPostView(){
    if(!window.location.pathname.startsWith('/posts/')) return;
    const auth = getAuth();
    if(!auth) return;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: auth.login || (auth.firstName ? `${auth.firstName} ${auth.lastName || ''}`.trim() : ''),
        email: auth.email || '',
        provider: auth.provider || '',
        page: window.location.pathname,
        referrer: document.referrer || ''
      })
    }).catch(() => {});
  })();

  // Blog post auth guard: check if auth is required and redirect to LinkedIn if not signed in
  (async function blogPostGuard(){
    if(!window.location.pathname.startsWith('/posts/')) return;
    if(getAuth()) return; // already signed in
    try {
      const res = await fetch('/api/auth/blog-config');
      const { authRequired } = await res.json();
      if(!authRequired) return;
    } catch(e) {
      return; // if API fails, allow access
    }
    // Not authenticated and auth is required — save return URL and redirect to LinkedIn
    try { sessionStorage.setItem('auth-return-to', window.location.pathname); } catch(e){}
    const clientId = '868q8uysenspzk';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback.html');
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=linkedin&scope=openid%20profile%20email`;
  })();

  // Replace traditional nav links with a system-style path (agentic theme)
  function replaceNavWithSystemPath(){
    try{
      const nav = document.querySelector('.nav');
      if(!nav) return;
      const raw = window.location.pathname || '/';
      // Normalize and remove index.html
      let path = raw.replace(/index\.html$/i, '');
      path = path.replace(/\.html$/i, '');
      const parts = path.split('/').filter(Boolean);
      // Build system path element
      const wrapper = document.createElement('div');
      wrapper.className = 'system-path';
      wrapper.setAttribute('aria-label', 'System path');
      wrapper.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace";
      wrapper.style.fontSize = '14px';
      wrapper.style.color = 'inherit';
      // Don't show path prefix or parts for blog posts
      const isBlogPost = parts.length > 0 && parts[0].toLowerCase() === 'posts';

      if(!isBlogPost){
        // Don't show path at all on any page
      } // close if(!isBlogPost)

      // Create inline text links (About / Blogs / Contact / Auth)
      const navLinks = document.createElement('span');
      navLinks.className = 'system-inline-links';
      navLinks.style.marginLeft = '12px';
      navLinks.style.display = 'inline-flex';
      navLinks.style.gap = '10px';
      navLinks.style.alignItems = 'center';

      const makeLink = (href, text, style = 'default') => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        a.style.textDecoration = 'none';
        a.style.padding = '6px 10px';
        a.style.borderRadius = '4px';
        a.style.cursor = 'pointer';
        a.style.fontWeight = '500';
        a.style.fontSize = '13px';
        a.style.transition = 'all 0.15s ease';
        a.tabIndex = 0;
        if(style === 'default'){
          a.style.color = 'inherit';
          a.style.opacity = '0.8';
        } else if(style === 'signin'){
          a.style.color = '#3b82f6';
          a.style.background = 'rgba(59, 130, 246, 0.1)';
          a.style.border = '1px solid rgba(59, 130, 246, 0.4)';
        } else if(style === 'signout'){
          a.style.color = '#f87171';
          a.style.background = 'rgba(248, 113, 113, 0.08)';
          a.style.border = '1px solid rgba(248, 113, 113, 0.3)';
        }
        return a;
      };

      const auth = getAuth();

      navLinks.appendChild(makeLink('/about.html', 'About'));
      navLinks.appendChild(makeLink('/contact.html', 'Contact'));
      
      // Show Blogs link only if authenticated
      if(auth && (auth.login || auth.email)){
        navLinks.appendChild(makeLink('/blogs.html', 'Blogs'));
      }

      // Auth button
      if(!auth){
        const signInBtn = makeLink('#', 'Sign In', 'signin');
        const dropdown = document.createElement('div');
        dropdown.style.cssText = 'display:none;position:absolute;top:calc(100% + 6px);right:0;background:#1e293b;border:1px solid rgba(59,130,246,0.3);border-radius:8px;overflow:hidden;z-index:999;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';

        const ghBtn = document.createElement('button');
        ghBtn.textContent = '🐙  GitHub';
        ghBtn.style.cssText = 'display:block;width:100%;padding:10px 16px;background:none;border:none;color:#f1f5f9;font-size:13px;text-align:left;cursor:pointer;';
        ghBtn.onmouseover = () => ghBtn.style.background = 'rgba(59,130,246,0.15)';
        ghBtn.onmouseout = () => ghBtn.style.background = 'none';
        ghBtn.addEventListener('click', () => {
          window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23ligh67ROJwOiIXxB&scope=user:email`;
        });

        const liBtn = document.createElement('button');
        liBtn.textContent = '🔗  LinkedIn';
        liBtn.style.cssText = 'display:block;width:100%;padding:10px 16px;background:none;border:none;color:#f1f5f9;font-size:13px;text-align:left;cursor:pointer;border-top:1px solid rgba(255,255,255,0.07);';
        liBtn.onmouseover = () => liBtn.style.background = 'rgba(59,130,246,0.15)';
        liBtn.onmouseout = () => liBtn.style.background = 'none';
        liBtn.addEventListener('click', () => {
          const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback.html');
          window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=868q8uysenspzk&redirect_uri=${redirectUri}&state=linkedin&scope=openid%20profile%20email`;
        });

        dropdown.appendChild(ghBtn);
        dropdown.appendChild(liBtn);

        const wrapper2 = document.createElement('span');
        wrapper2.style.position = 'relative';
        wrapper2.appendChild(signInBtn);
        wrapper2.appendChild(dropdown);

        signInBtn.addEventListener('click', (e) => {
          e.preventDefault();
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
          if (!wrapper2.contains(e.target)) dropdown.style.display = 'none';
        });

        navLinks.appendChild(wrapper2);
      } else {
        // User badge
        const userBadge = document.createElement('span');
        userBadge.style.display = 'inline-flex';
        userBadge.style.alignItems = 'center';
        userBadge.style.gap = '6px';
        userBadge.style.padding = '4px 10px';
        userBadge.style.background = 'rgba(34, 197, 94, 0.1)';
        userBadge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
        userBadge.style.borderRadius = '20px';
        userBadge.style.fontSize = '12px';
        userBadge.style.fontWeight = '600';
        userBadge.style.color = '#22c55e';
        userBadge.style.letterSpacing = '0.01em';

        const avatar = document.createElement('img');
        avatar.src = auth.avatar_url || '';
        avatar.alt = auth.login || auth.email || '';
        avatar.style.width = '18px';
        avatar.style.height = '18px';
        avatar.style.borderRadius = '50%';
        avatar.style.objectFit = 'cover';
        avatar.onerror = () => { avatar.style.display = 'none'; };

        const dot = document.createElement('span');
        dot.textContent = '●';
        dot.style.fontSize = '8px';
        dot.style.color = '#22c55e';

        const name = document.createElement('span');
        name.textContent = auth.login || auth.email;

        userBadge.appendChild(avatar);
        userBadge.appendChild(dot);
        userBadge.appendChild(name);
        navLinks.appendChild(userBadge);

        const signOut = makeLink('#', '↩ Sign Out', 'signout');
        signOut.addEventListener('click', (e) => {
          e.preventDefault();
          clearAuth();
          window.location.reload();
        });
        navLinks.appendChild(signOut);
      }

      // Hide original nav links visually but keep them in the DOM for crawlers/accessibility
      nav.style.display = 'none';
      nav.setAttribute('aria-hidden', 'true');
      const navControls = document.querySelector('.nav-controls');
      // Append quick links into the wrapper
      wrapper.appendChild(navLinks);
      if(navControls) {
        navControls.insertBefore(wrapper, navControls.firstChild);
      } else {
        // fallback: append into header container to ensure visibility
        const headerContainer = document.querySelector('.site-header .container');
        if(headerContainer) headerContainer.appendChild(wrapper);
        else nav.parentNode.insertBefore(wrapper, nav.nextSibling);
      }

      // Ensure wrapper is visible and aligned
      wrapper.style.display = wrapper.style.display || 'inline-flex';
      wrapper.style.alignItems = 'center';
    }catch(e){ /* no-op on failure */ }
  }

  // theme toggle button
  document.addEventListener('click', e => {
    if(e.target && e.target.id==='theme-toggle'){
      const isDark = document.body.classList.toggle('dark');
      try{ localStorage.setItem('theme', isDark? 'dark':'light') }catch(e){}
      updateThemeButtonState();
    }
  });

  // Search removed: feature intentionally disabled.

  // Playbook scroller: cycle through list items with pause/next controls
  function initPlaybook(){
    const list = document.querySelector('.playbook-list');
    if(!list) return;
    const items = Array.from(list.querySelectorAll('li'));
    if(!items.length) return;
    let current = 0;
    let paused = false;
    let timer = null;

    function showItem(idx){
      items.forEach((li, i) => li.classList.toggle('active', i === idx));
    }

    function advance(){
      current = (current + 1) % items.length;
      showItem(current);
    }

    function startTimer(){
      clearInterval(timer);
      timer = setInterval(advance, 3200);
    }

    showItem(0);
    startTimer();

    const pauseBtn = document.getElementById('playbook-pause');
    const nextBtn  = document.getElementById('playbook-next');

    if(pauseBtn){
      pauseBtn.addEventListener('click', ()=>{
        paused = !paused;
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        const label = pauseBtn.querySelector('.btn-label');
        if(label) label.textContent = paused ? 'Resume' : 'Pause';
        // swap pause/play icon
        const icon = pauseBtn.querySelector('svg');
        if(icon){
          icon.innerHTML = paused
            ? '<path d="M8 5v14l11-7L8 5z" fill="currentColor"/>'  // play icon
            : '<rect x="2" y="2" width="4" height="12" rx="1" fill="currentColor"/><rect x="10" y="2" width="4" height="12" rx="1" fill="currentColor"/>'; // pause icon
        }
        if(paused) clearInterval(timer); else startTimer();
      });
    }

    if(nextBtn){
      nextBtn.addEventListener('click', ()=>{
        advance();
        if(!paused) startTimer(); // reset interval so next auto-advance is a full 3.2 s away
      });
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updateThemeButtonState();
    populateYear();
    replaceNavWithSystemPath();
    initPlaybook();
  });
})();
