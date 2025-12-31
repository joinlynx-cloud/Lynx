(() => {
  // Unified client script for pages: reveal animations, counters, carousel, accordions,
  // contact form (local), copy bank details, newsletter modal, nav highlighting.
  const CONTACT_KEY = 'lynx_contact_msgs_v1';
  function qs(s){return document.querySelector(s)}
  function qsa(s){return Array.from(document.querySelectorAll(s))}

  // Year
  const yearEl = qs('#year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal on scroll
  const revealItems = qsa('.reveal');
  if(revealItems.length){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{ if(ent.isIntersecting) ent.target.classList.add('visible'); });
    },{threshold:0.15});
    revealItems.forEach(it=>obs.observe(it));
  }

  // Counters
  qsa('.num[data-target]').forEach(el=>{
    let started = false;
    const animate = ()=>{
      if(started) return; started = true;
      const target = +el.dataset.target;
      const dur = 1400; const start = performance.now();
      const step = (t)=>{
        const p = Math.min(1,(t-start)/dur);
        el.textContent = Math.floor(p*target).toLocaleString();
        if(p<1) requestAnimationFrame(step); else el.textContent = target.toLocaleString();
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries)=>{ if(entries[0].isIntersecting) { animate(); io.disconnect(); } });
    io.observe(el);
  });

  // Enhanced Carousel: infinite-loop, controls, dots, hover-pause, keyboard nav, progress
  (function initCarousel(){
    const container = qs('#carousel'); if(!container) return;
    const wrapper = container.closest('.carousel-wrapper') || container.parentElement;
    const prevBtn = wrapper.querySelector('.carousel-prev');
    const nextBtn = wrapper.querySelector('.carousel-next');
    const dotsContainer = wrapper.querySelector('.carousel-dots');
    const progressEl = wrapper.querySelector('.carousel-progress span');

    // configuration
    const autoplayMs = 4000; // show duration
    const slideTransitionMs = 450; // transition for slides (matches CSS)

    // basic swipe detection (no live-drag translation to keep implementation robust)
    let startX = 0, currentX = 0, isPointerDown = false;

    // prepare slides with clones for infinite loop
    const originalSlides = Array.from(container.children);
    const origCount = originalSlides.length;
    if(origCount === 0) return;

    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[origCount-1].cloneNode(true);
    container.appendChild(firstClone);
    container.insertBefore(lastClone, container.firstChild);

    const slides = Array.from(container.children);
    const total = slides.length; // origCount + 2

    // set track sizing so each slide equals viewport
    container.style.width = `${total * 100}%`;
    slides.forEach(s => s.style.flex = `0 0 ${100/total}%`);

    let index = 1; // start at first real slide (after clone)
    let autoplayHandle = null;
    let isTransitioning = false;

    // create dots
    function buildDots(){
      if(!dotsContainer) return;
      dotsContainer.innerHTML='';
      for(let i=0;i<origCount;i++){
        const b = document.createElement('button'); b.className='carousel-dot'; b.setAttribute('aria-label', 'Go to slide '+(i+1));
        b.addEventListener('click', ()=>{ goTo(i+1); restartAutoplay(); });
        dotsContainer.appendChild(b);
      }
      updateDots();
    }

    function updateDots(){
      if(!dotsContainer) return;
      const dots = Array.from(dotsContainer.children);
      const real = ((index-1) % origCount + origCount) % origCount;
      dots.forEach((d,i)=> d.classList.toggle('active', i===real));
    }

    function setTransform(i, withTransition = true){
      if(withTransition) container.style.transition = `transform ${slideTransitionMs}ms cubic-bezier(.2,.9,.25,1)`;
      else container.style.transition = 'none';
      const pct = (i * 100) / total;
      container.style.transform = `translateX(-${pct}%)`;
    }

    function goTo(i){
      if(isTransitioning) return;
      isTransitioning = true;
      index = i;
      setTransform(index, true);
      updateDots();
      resetProgress();
    }

    // handle infinite loop correction after transition
    container.addEventListener('transitionend', ()=>{
      isTransitioning = false;
      if(index === 0){ // jumped to clone of last -> snap to real last
        index = total - 2;
        setTransform(index, false);
      } else if(index === total - 1){ // jumped to clone of first -> snap to real first
        index = 1;
        setTransform(index, false);
      }
    });

    function next(){ goTo(index + 1); }
    function prev(){ goTo(index - 1); }

    // autoplay + progress bar
    function startAutoplay(){
      stopAutoplay();
      if(!progressEl) return autoplayHandle = setTimeout(()=>{ next(); startAutoplay(); }, autoplayMs);
      // animate progress
      progressEl.style.transition = 'none';
      progressEl.style.width = '0%';
      requestAnimationFrame(()=>{
        progressEl.style.transition = `width ${autoplayMs}ms linear`;
        progressEl.style.width = '100%';
      });
      autoplayHandle = setTimeout(()=>{ next(); startAutoplay(); }, autoplayMs);
    }
    function stopAutoplay(){ if(autoplayHandle) { clearTimeout(autoplayHandle); autoplayHandle = null; } if(progressEl){ progressEl.style.transition='none'; progressEl.style.width='0%'; } }
    function restartAutoplay(){ stopAutoplay(); startAutoplay(); }
    function resetProgress(){ if(progressEl){ progressEl.style.transition='none'; progressEl.style.width='0%'; } }

    // events
    prevBtn && prevBtn.addEventListener('click', ()=>{ prev(); restartAutoplay(); });
    nextBtn && nextBtn.addEventListener('click', ()=>{ next(); restartAutoplay(); });

    // hover pause
    wrapper.addEventListener('mouseenter', ()=> stopAutoplay());
    wrapper.addEventListener('mouseleave', ()=> startAutoplay());

    // keyboard navigation
    wrapper.setAttribute('tabindex', '0');
    wrapper.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
      if(e.key === 'ArrowRight') { next(); restartAutoplay(); }
    });

    // simple swipe detection
    container.addEventListener('mousedown', (e)=>{ isPointerDown=true; startX = e.clientX; stopAutoplay(); });
    container.addEventListener('mouseup', (e)=>{ if(!isPointerDown) return; isPointerDown=false; currentX = e.clientX; const delta = currentX - startX; if(Math.abs(delta) > 30) { delta > 0 ? prev() : next(); } restartAutoplay(); });
    container.addEventListener('touchstart', (e)=>{ isPointerDown=true; startX = e.touches[0].clientX; stopAutoplay(); }, {passive:true});
    container.addEventListener('touchend', (e)=>{ if(!isPointerDown) return; isPointerDown=false; currentX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : startX; const delta = currentX - startX; if(Math.abs(delta) > 30) { delta > 0 ? prev() : next(); } restartAutoplay(); });

    // build dots and start
    buildDots();
    // place initial position at first real slide
    setTransform(index, false);
    startAutoplay();
  })();

  // Smooth scroll for in-page links
  qsa('a.nav-link').forEach(a=>{
    if(!a.hash) return; a.addEventListener('click', e=>{ e.preventDefault(); const target = document.querySelector(a.hash); if(target) target.scrollIntoView({behavior:'smooth'}); });
  });

  // Button ripple effect
  function attachRipple(btn){
    btn.addEventListener('click', function(e){
      const r = document.createElement('span'); r.className='ripple'; this.appendChild(r);
      const d = Math.max(this.offsetWidth, this.offsetHeight); r.style.width = r.style.height = d+'px';
      const rect = this.getBoundingClientRect(); r.style.left = (e.clientX-rect.left - d/2)+'px'; r.style.top = (e.clientY-rect.top - d/2)+'px';
      setTimeout(()=> r.remove(),600);
    });
  }
  qsa('.btn').forEach(btn=> attachRipple(btn));

  // Subtle parallax for hero visual
  const heroVisual = qs('.hero-visual');
  if(heroVisual){
    window.addEventListener('scroll', ()=>{
      const rect = heroVisual.getBoundingClientRect();
      const offset = Math.max(-100, Math.min(100, window.scrollY * 0.06));
      heroVisual.style.transform = `translateY(${offset}px)`;
    }, {passive:true});
  }

  

  /* Motion settings modal binding */
  const motionModalEl = qs('#motionModal');
  if(motionModalEl){
    const motionSpeed = qs('#motionSpeed');
    const liftAmount = qs('#liftAmount');
    // load saved values or defaults
    const saved = JSON.parse(localStorage.getItem('lynxMotion') || '{}');
    const defaultSpeed = saved.speed || 250; const defaultLift = (saved.lift!==undefined)? saved.lift : -8;
    if(motionSpeed) { motionSpeed.value = defaultSpeed; }
    if(liftAmount) { liftAmount.value = defaultLift; }

    function applyMotion(){
      const speed = motionSpeed? +motionSpeed.value : defaultSpeed;
      const lift = liftAmount? +liftAmount.value : defaultLift;
      document.documentElement.style.setProperty('--motion-duration', (speed/1000)+'s');
      document.documentElement.style.setProperty('--lift-amount', (lift)+'px');
      document.documentElement.style.setProperty('--btn-lift', Math.round(lift/2)+'px');
      localStorage.setItem('lynxMotion', JSON.stringify({speed, lift}));
    }
    // apply initial
    applyMotion();
    // update on input
    motionSpeed && motionSpeed.addEventListener('input', applyMotion);
    liftAmount && liftAmount.addEventListener('input', applyMotion);
    // open modal via footer link if present
    const motionBtn = qs('#motionBtn'); if(motionBtn){ motionBtn.addEventListener('click', e=>{ e.preventDefault(); new bootstrap.Modal(motionModalEl).show(); }); }
  }

  // Accordion
  qsa('.acc-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const p = btn.nextElementSibling; if(!p) return; p.classList.toggle('open');
    });
  });

  // Flip cards (touch support)
  qsa('.card-flip').forEach(card=>{
    card.addEventListener('click', ()=> card.classList.toggle('flipped'));
  });

  // Copy bank details
  qsa('#copyBank').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const txt = qs('.bank-details')?.innerText || '';
      if(!txt) return alert('No bank details found');
      navigator.clipboard.writeText(txt).then(()=>{
        const prev = btn.textContent; btn.textContent = 'Copied'; setTimeout(()=> btn.textContent = prev, 1800);
      }).catch(()=>alert('Copy failed — please copy manually'));
    });
  });

  // Contact form (store locally)
  const contactForm = qs('#contactForm');
  if(contactForm){
    const messagesDiv = qs('#messages');
    function renderMessages(){
      const raw = localStorage.getItem(CONTACT_KEY); const list = raw?JSON.parse(raw):[];
      if(!messagesDiv) return; messagesDiv.innerHTML='';
      if(!list.length) { messagesDiv.innerHTML = '<div class="muted">No messages yet.</div>'; return; }
      list.slice().reverse().forEach(m=>{
        const el = document.createElement('div'); el.className='member'; el.style.marginBottom='8px';
        el.innerHTML = `<strong>${escapeHtml(m.name)}</strong> <div class="muted" style="font-size:12px">${new Date(m.created).toLocaleString()}</div><div>${escapeHtml(m.message)}</div>`;
        messagesDiv.appendChild(el);
      });
    }
    renderMessages();
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = qs('#cname').value.trim(); const email = qs('#cemail').value.trim(); const message = qs('#cmessage').value.trim();
      if(!name||!email||!message) return alert('Please fill all fields');
      const item = { name, email, message, created: Date.now() };
      const raw = localStorage.getItem(CONTACT_KEY); const list = raw?JSON.parse(raw):[]; list.push(item); localStorage.setItem(CONTACT_KEY, JSON.stringify(list));
      contactForm.reset(); renderMessages(); alert('Thank you — message saved locally (demo)');
    });
  }

  // Newsletter modal (simple)
  const openNewsletter = qs('#openNewsletter');
  if(openNewsletter){
    openNewsletter.addEventListener('click', ()=>{
      const modal = document.createElement('div'); modal.className='modal';
      modal.innerHTML = `<div class="modal-panel"><button class="close">Close</button><h4>Join our newsletter</h4><p>Enter email to join updates.</p><input id="nlEmail" placeholder="you@example.com"><div style="margin-top:10px"><button id="nlSubmit" class="btn">Subscribe</button></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.close').addEventListener('click', ()=> modal.remove());
      modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove() });
      modal.querySelector('#nlSubmit').addEventListener('click', ()=>{
        const v = modal.querySelector('#nlEmail').value.trim(); if(!v) return alert('Enter email');
        const s = 'lynx_newsletter_v1'; const raw = localStorage.getItem(s); const arr = raw?JSON.parse(raw):[]; arr.push({email:v,created:Date.now()}); localStorage.setItem(s, JSON.stringify(arr));
        modal.querySelector('#nlSubmit').textContent = 'Subscribed'; setTimeout(()=>modal.remove(),900);
      });
    });
  }

  // Nav active highlight
  (function navHighlight(){
    const links = qsa('.nav-link'); const path = location.pathname.split('/').pop() || 'index.html';
    links.forEach(a=>{ const href = a.getAttribute('href')||''; if(href.endsWith(path)) a.classList.add('active'); });
  })();

  function escapeHtml(s){ if(!s) return ''; return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

})();
