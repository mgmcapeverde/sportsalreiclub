(function(){
  var sel = document.getElementById('langSel');
  if(!sel) return;
  var btn = sel.querySelector('.lang-btn');
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = sel.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function(){
    sel.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  });
})();
(function(){
  var car = document.getElementById('shopCarousel');
  if(!car) return;
  var slides = car.querySelectorAll('.slide');
  var dots = car.querySelectorAll('.dots button');
  var i = 0, timer;
  function go(n){
    slides[i].classList.remove('active');
    if(dots[i]) dots[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('active');
    if(dots[i]) dots[i].classList.add('active');
  }
  function start(){ timer = setInterval(function(){ go(i+1); }, 4000); }
  function reset(){ clearInterval(timer); start(); }
  dots.forEach(function(dot){
    dot.addEventListener('click', function(){
      go(parseInt(dot.getAttribute('data-i'),10));
      reset();
    });
  });
  start();
})();
(function(){
  var btn = document.querySelector('.menu-btn');
  if(!btn) return;
  var root = document.documentElement;
  function set(open){
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function(){ set(!root.classList.contains('menu-open')); });
  document.querySelectorAll('.mnav a').forEach(function(a){
    a.addEventListener('click', function(){ set(false); });
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') set(false); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 980) set(false); });
})();
(function(){
  // Section entrances: only for content below the first screen, so nothing visible ever blinks.
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var sel = '.sec-h,.about .txt>*,.about .visual,.feat,.nc,.match,.acad-head>*,.acad-cat,.tr,.mcard,' +
            '.pt-head,.pt-cell,.shop .img,.shop .promo,.shop .carousel,.sp-band .l,.sp-band .r,' +
            '.article>*,.pc,.squad-h,.fx,.fx-month,.standings,.nf-main,.nf-card,.ncard,.club-sec>*';
  var els = [].slice.call(document.querySelectorAll(sel));
  var fold = window.innerHeight;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function(el){
    if(el.getBoundingClientRect().top < fold) return;
    var sibs = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
    el.style.setProperty('--d', Math.min(sibs, 6) * 70 + 'ms');
    el.classList.add('rv');
    io.observe(el);
  });
})();
(function(){
  // Competition tabs on the season page.
  var tabs = document.querySelectorAll('[data-tab]');
  if(!tabs.length) return;
  document.documentElement.classList.add('js');
  function show(id){
    var found = false;
    tabs.forEach(function(t){ var on = t.getAttribute('data-tab') === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); found = found || on; });
    if(!found) return;
    document.querySelectorAll('[data-tab-panel]').forEach(function(p){ p.toggleAttribute('data-inactive', p.id !== id); });
  }
  tabs.forEach(function(t){
    t.addEventListener('click', function(e){
      e.preventDefault();
      show(t.getAttribute('data-tab'));
      history.replaceState(null, '', '#' + t.getAttribute('data-tab'));
    });
  });
  if(location.hash) show(location.hash.slice(1));
})();
// Photo gallery lightbox: arrows, keyboard, swipe.
(function(){
  var grid = document.getElementById('photos'), lb = document.getElementById('lb');
  if(!grid || !lb) return;
  var links = Array.prototype.slice.call(grid.querySelectorAll('a'));
  var img = lb.querySelector('img'), cnt = lb.querySelector('.lb-c'), i = 0, last = null;
  function show(n){
    i = (n + links.length) % links.length;
    img.src = links[i].getAttribute('href');
    img.alt = links[i].querySelector('img').alt;
    cnt.textContent = (i + 1) + ' / ' + links.length;
    var nx = new Image(); nx.src = links[(i + 1) % links.length].getAttribute('href');
  }
  function open(n){ last = document.activeElement; lb.hidden = false; document.body.classList.add('lb-open'); show(n); lb.querySelector('.lb-x').focus(); }
  function close(){ lb.hidden = true; img.removeAttribute('src'); document.body.classList.remove('lb-open'); if(last) last.focus(); }
  links.forEach(function(a, n){ a.addEventListener('click', function(e){ e.preventDefault(); open(n); }); });
  lb.querySelector('.lb-x').addEventListener('click', close);
  lb.querySelector('.lb-p').addEventListener('click', function(){ show(i - 1); });
  lb.querySelector('.lb-n').addEventListener('click', function(){ show(i + 1); });
  lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
  document.addEventListener('keydown', function(e){
    if(lb.hidden) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowLeft') show(i - 1);
    else if(e.key === 'ArrowRight') show(i + 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if(Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
  });
})();
