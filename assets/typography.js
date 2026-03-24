(function(){
  // Playbook scroller: cycles through list items
  function Playbook(root){
    this.root = root;
    this.list = root.querySelectorAll('.playbook-list li');
    this.pauseBtn = document.getElementById('playbook-pause');
    this.nextBtn = document.getElementById('playbook-next');
    this.index = 0;
    this.interval = 4000;
    this.timer = null;
    this.paused = false;
    this.init();
  }
  Playbook.prototype.show = function(i){
    this.list.forEach((li,idx)=> li.classList.toggle('active', idx===i));
  }
  Playbook.prototype.next = function(){
    this.index = (this.index + 1) % this.list.length;
    this.show(this.index);
  }
  Playbook.prototype.start = function(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.timer = setInterval(()=>{ if(!this.paused) this.next(); }, this.interval);
  }
  Playbook.prototype.stop = function(){ clearInterval(this.timer); this.timer = null }
  Playbook.prototype.toggle = function(){ this.paused = !this.paused; if(this.pauseBtn) this.pauseBtn.setAttribute('aria-pressed', this.paused? 'true':'false'); }
  Playbook.prototype.bind = function(){
    if(this.nextBtn) this.nextBtn.addEventListener('click', ()=>{ this.next(); });
    if(this.pauseBtn) this.pauseBtn.addEventListener('click', ()=>{ this.toggle(); });
    // keyboard support
    this.root.addEventListener('keydown', e=>{ if(e.key==='ArrowRight') this.next(); if(e.key===' ') { e.preventDefault(); this.toggle(); } });
  }
  Playbook.prototype.init = function(){ if(!this.list.length) return; this.show(0); this.bind(); this.start(); }

  // Status widget: cycle focus values
  function StatusWidget(el){
    this.el = el;
    this.focusLabel = document.getElementById('ai-focus');
    this.focusSource = document.getElementById('ai-focus-source');
    this.focusDot = document.getElementById('focus-dot');
    this.items = [
      {key:'MCP', source:'Model Control Plane', cls:'focus-mcp'},
      {key:'LangGraph', source:'LangGraph routing', cls:'focus-langgraph'}
    ];
    this.index = 0;
    this.interval = 6000;
    this.timer = null;
    this.init();
  }
  StatusWidget.prototype.update = function(i){
    const it = this.items[i];
    if(!it) return;
    if(this.focusLabel) this.focusLabel.textContent = it.key;
    if(this.focusSource) this.focusSource.textContent = it.source;
    if(this.focusDot){ this.focusDot.className = 'focus-dot ' + it.cls }
  }
  StatusWidget.prototype.next = function(){ this.index = (this.index+1) % this.items.length; this.update(this.index); }
  StatusWidget.prototype.start = function(){ var self=this; this.timer = setInterval(()=> self.next(), this.interval); }
  StatusWidget.prototype.init = function(){ this.update(0); this.start(); }

  document.addEventListener('DOMContentLoaded', function(){
    const pb = document.querySelector('.playbook-card'); if(pb) new Playbook(pb);
    const st = document.querySelector('.status-card'); if(st) new StatusWidget(st);
  });
})();
