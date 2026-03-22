// Theme toggle and simple client-side search
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

  // theme toggle button
  document.addEventListener('click', e => {
    if(e.target && e.target.id==='theme-toggle'){
      const isDark = document.body.classList.toggle('dark');
      try{ localStorage.setItem('theme', isDark? 'dark':'light') }catch(e){}
    }
  });

  // Simple search implementation
  let index = [];
  async function fetchIndex(){
    try{
      const r = await fetch('/assets/search-index.json');
      index = await r.json();
    }catch(e){ index = [] }
  }
  function showResults(q){
    const list = document.getElementById('search-results');
    if(!list) return;
    list.innerHTML = '';
    if(!q){ list.style.display='none'; return }
    const ql = q.toLowerCase();
    const results = index.filter(p => (p.title + ' ' + p.excerpt + ' ' + (p.tags||'')).toLowerCase().includes(ql)).slice(0,10);
    for(const r of results){
      const a = document.createElement('a'); a.href = r.url; a.className='search-result';
      a.textContent = r.title + ' — ' + r.date;
      list.appendChild(a);
    }
    list.style.display = results.length ? 'block':'none';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    fetchIndex();
    const input = document.getElementById('search-input');
    if(!input) return;
    // add results container
    const div = document.createElement('div'); div.id='search-results'; div.className='search-results'; div.style.display='none';
    input.parentNode && input.parentNode.appendChild(div);
    let t;
    input.addEventListener('input', e => { clearTimeout(t); t = setTimeout(()=> showResults(e.target.value), 150) });
    input.addEventListener('keydown', e => { if(e.key==='Escape') { input.value=''; showResults('') } });
  });
})();
