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
      // Build clickable system path: agentic://posts/<post-slug>
      const prefix = document.createElement('span');
      prefix.textContent = 'agentic://';
      wrapper.appendChild(prefix);

      if(parts.length===0){
        const root = document.createElement('span'); root.textContent = '/'; wrapper.appendChild(root);
      } else {
        parts.forEach((p, i) => {
          if(i>0){
            const sep = document.createElement('span'); sep.textContent = '/'; sep.style.padding = '0 4px'; wrapper.appendChild(sep);
          }
          // clickable behavior for posts
          const a = document.createElement('a');
          a.textContent = p;
          a.style.color = 'inherit';
          a.style.textDecoration = 'none';
          a.style.fontWeight = '500';
          if (p.toLowerCase() === 'about') {
            a.href = '/about.html';
          } else if (p.toLowerCase() === 'contact') {
            a.href = '/contact.html';
          } else if (p.toLowerCase() === 'blogs') {
            a.href = '/blogs.html';
          } else if(i===0 && p.toLowerCase()==='posts'){
            a.href = '/blogs.html';
          } else if(parts[0] && parts[0].toLowerCase()==='posts'){
            // link to post page under /posts/<slug>.html
            a.href = '/posts/' + encodeURIComponent(p) + '.html';
          } else {
            // default cumulative link
            const cum = '/' + parts.slice(0, i+1).join('/') + '/';
            a.href = cum;
          }
          wrapper.appendChild(a);
        });
      }

      // Create inline text links (About / Blogs / Contact)
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
        a.style.color = 'inherit';
        a.style.textDecoration = 'none';
        a.style.padding = '6px 8px';
        a.tabIndex = 0;
        return a;
      };

      navLinks.appendChild(makeLink('/about.html', 'About'));
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
