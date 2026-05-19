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

  const NAV_LINKS = [
    ['/src/html/about.html', 'About'],
    ['/src/html/blogs.html', 'Blogs'],
    ['/src/html/demos.html', 'Demos'],
    ['/src/html/contact.html', 'Contact'],
  ];

  const ICON_MENU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  const ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // Replace traditional nav links with a system-style path (agentic theme)
  function replaceNavWithSystemPath(){
    try{
      const nav = document.querySelector('.nav');
      if(!nav) return;

      // Hide original nav (kept in DOM for crawlers/accessibility)
      nav.style.display = 'none';
      nav.setAttribute('aria-hidden', 'true');

      const navControls = document.querySelector('.nav-controls');
      function insertEl(el){
        if(navControls){
          navControls.insertBefore(el, navControls.firstChild);
        } else {
          const hdr = document.querySelector('.site-header .container, header .container');
          if(hdr) hdr.appendChild(el); else nav.parentNode.insertBefore(el, nav.nextSibling);
        }
      }

      if(window.innerWidth <= 640){
        // --- Mobile: hamburger + dropdown ---
        const wrap = document.createElement('div');
        wrap.className = 'system-menu-wrap';

        const btn = document.createElement('button');
        btn.className = 'system-menu-btn';
        btn.setAttribute('aria-label', 'Open navigation menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = ICON_MENU;

        const dropdown = document.createElement('div');
        dropdown.className = 'system-menu-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.hidden = true;

        NAV_LINKS.forEach(([href, label]) => {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = label;
          a.setAttribute('role', 'menuitem');
          dropdown.appendChild(a);
        });

        let open = false;
        const setOpen = (state) => {
          open = state;
          dropdown.hidden = !open;
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          btn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
          btn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        };

        btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!open); });
        document.addEventListener('click', () => { if(open) setOpen(false); });
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        wrap.appendChild(btn);
        wrap.appendChild(dropdown);

        insertEl(wrap);
      } else {
        // --- Desktop: inline links ---
        const wrapper = document.createElement('div');
        wrapper.className = 'system-path';
        wrapper.setAttribute('aria-label', 'Navigation');
        wrapper.style.cssText = "display:inline-flex;align-items:center;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,'Roboto Mono',monospace;font-size:14px;color:inherit";

        const navLinks = document.createElement('span');
        navLinks.className = 'system-inline-links';
        navLinks.style.cssText = 'margin-left:12px;display:inline-flex;gap:10px;align-items:center';

        NAV_LINKS.forEach(([href, text]) => {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = text;
          a.style.cssText = 'text-decoration:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-weight:500;font-size:13px;transition:all 0.15s ease;color:inherit;opacity:0.8';
          a.tabIndex = 0;
          navLinks.appendChild(a);
        });

        wrapper.appendChild(navLinks);

        insertEl(wrapper);
      }
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
