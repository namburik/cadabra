// Theme toggle, year helper, and simple client-side search
(function(){
  // OAuth client IDs and URL builders — single source of truth
  const GITHUB_CLIENT_ID = 'Ov23ligh67ROJwOiIXxB';
  const LINKEDIN_CLIENT_ID = '868q8uysenspzk';
  function githubAuthUrl(){
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback.html');
    return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email&state=github`;
  }
  function linkedInAuthUrl(){
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback.html');
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&state=linkedin&scope=openid%20profile%20email`;
  }

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
    window.location.href = linkedInAuthUrl();
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

      // Create inline text links (About / Blogs / Demos / Contact)
      const navLinks = document.createElement('span');
      navLinks.className = 'system-inline-links';
      navLinks.style.marginLeft = '12px';
      navLinks.style.display = 'inline-flex';
      navLinks.style.gap = '10px';
      navLinks.style.alignItems = 'center';

      const makeLink = (href, text) => {
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
        a.style.color = 'inherit';
        a.style.opacity = '0.8';
        a.tabIndex = 0;
        return a;
      };

      navLinks.appendChild(makeLink('/about.html', 'About'));
      navLinks.appendChild(makeLink('/blogs.html', 'Blogs'));
      navLinks.appendChild(makeLink('/demos.html', 'Demos'));
      navLinks.appendChild(makeLink('/contact.html', 'Contact'));

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
