

document.addEventListener('DOMContentLoaded', function() {
    const forumPage = window.location.pathname.includes('forum.html');
    if (!forumPage) return;

    const questionsContainer = document.getElementById('questions-container');
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');

    function loadQuestions() {
        const questions = JSON.parse(localStorage.getItem('lynxQuestions') || '[]');
        questionsContainer.innerHTML = '';
        questions.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'qna-item';
            div.innerHTML = `
                <h5><strong>Q: ${q.question}</strong></h5>
                <small>By: ${q.user || 'Anonymous'} on ${new Date(q.date).toLocaleString()}</small>
                ${q.answer ? `<div class="answer"><h6>A:</h6><p>${q.answer}</p></div>` : '<p class="text-muted">Awaiting response...</p>'}
                <div class="mt-2">
                  <button class="btn btn-sm btn-success me-2" onclick="answerQuestion(${index})">Answer (Admin)</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${index})">Delete</button>
                </div>
            `;
            questionsContainer.appendChild(div);
        });
    }

    function saveQuestion(question, user = 'Anonymous') {
        const questions = JSON.parse(localStorage.getItem('lynxQuestions') || '[]');
        questions.push({
            question,
            user,
            date: new Date().toISOString(),
            answer: null
        });
        localStorage.setItem('lynxQuestions', JSON.stringify(questions));
        loadQuestions();
    }

    questionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const question = questionInput.value.trim();
        if (question) {
            saveQuestion(question);
            questionInput.value = '';
        }
    });

    window.answerQuestion = function(index) {
        const questions = JSON.parse(localStorage.getItem('lynxQuestions') || '[]');
        const answer = prompt('answer:');
        if (answer) {
            questions[index].answer = answer;
            questions[index].answeredBy = 'LYNX Team';
            localStorage.setItem('lynxQuestions', JSON.stringify(questions));
            loadQuestions();
        }
    };

    window.deleteQuestion = function(index) {
        const questions = JSON.parse(localStorage.getItem('lynxQuestions') || '[]');
        if (!questions[index]) return;
        if (!confirm('Delete this question? This action cannot be undone.')) return;
        questions.splice(index, 1);
        localStorage.setItem('lynxQuestions', JSON.stringify(questions));
        loadQuestions();
    };

    loadQuestions();
});

// Global subtle interactive decorations (homepage & donate page easter-eggs)
document.addEventListener('DOMContentLoaded', function(){
    // Clean polish toggle: 'p' to toggle, persists in localStorage
    function applyCleanPolish(enabled){
        if(enabled) document.body.classList.add('clean-polish'); else document.body.classList.remove('clean-polish');
        localStorage.setItem('lynx.cleanPolish', enabled? '1' : '0');
    }
    try{
      const saved = localStorage.getItem('lynx.cleanPolish');
      if(saved === '1') applyCleanPolish(true);
    }catch(e){}
    window.addEventListener('keydown', function(e){ if(e.key === 'p' || e.key === 'P'){ e.preventDefault(); const on = !document.body.classList.contains('clean-polish'); applyCleanPolish(on); const t = on? 'Clean polish enabled' : 'Clean polish disabled'; let tmp = document.querySelector('.site-toast'); if(!tmp){ tmp = document.createElement('div'); tmp.className='site-toast'; document.body.appendChild(tmp);} tmp.textContent = t; tmp.classList.remove('hidden'); clearTimeout(tmp._hide); tmp._hide = setTimeout(()=> tmp.classList.add('hidden'), 1800); }});

    // helper: show a transient toast message
    function showToast(text, timeout=2200){
        let t = document.querySelector('.site-toast');
        if(!t){ t = document.createElement('div'); t.className='site-toast'; document.body.appendChild(t); }
        t.textContent = text; t.classList.remove('hidden');
        clearTimeout(t._hide);
        t._hide = setTimeout(()=>{ t.classList.add('hidden'); }, timeout);
    }

    // Homepage hero decor
    const heroDecor = document.querySelector('.hero-decor');
    if(heroDecor){
        heroDecor.tabIndex = 0;
        heroDecor.addEventListener('click', function(){
            this.classList.toggle('hero-decor--active');
            const active = this.classList.contains('hero-decor--active');
            localStorage.setItem('lynx.heroDecor', active? '1' : '0');
            if(active) showToast('Subtle glow enabled'); else showToast('Subtle glow disabled');
        });
        heroDecor.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); this.click(); } });
        // restore state
        try{ if(localStorage.getItem('lynx.heroDecor')==='1') heroDecor.classList.add('hero-decor--active'); }catch(e){}
    }

    // Donate page bank easter-egg
    const bankPanel = document.getElementById('bank-details') || document.getElementById('bank-details');
    if(bankPanel){
        bankPanel.style.cursor = 'pointer';
        bankPanel.addEventListener('click', function(){
            this.classList.add('bank-easter');
            showToast('Tip: Use the Copy button — quick and safe');
            setTimeout(()=> this.classList.remove('bank-easter'), 1400);
        });
    }

        // Page-specific small interactions
        try{
            if(document.body.classList.contains('page-forum')){
                const qForm = document.getElementById('question-form');
                if(qForm){
                    qForm.addEventListener('submit', function(){
                        // tiny visual pulse near submit button
                        const btn = this.querySelector('button[type=submit]');
                        if(btn){ btn.style.transform = 'scale(0.98)'; setTimeout(()=> btn.style.transform='', 220); }
                        showToast('Question posted (local demo)');
                    });
                }
            }

            if(document.body.classList.contains('page-about')){
                document.querySelectorAll('.card .card-body').forEach((c,i)=>{
                    c.addEventListener('click', ()=>{ c.style.transform='translateY(-6px)'; setTimeout(()=> c.style.transform='',400); showToast('Thanks for exploring the team'); });
                });
            }

            if(document.body.classList.contains('page-how')){
                document.querySelectorAll('.card .card-body').forEach((c)=>{
                    c.addEventListener('mouseenter', ()=> c.classList.add('shimmer')); c.addEventListener('mouseleave', ()=> c.classList.remove('shimmer'));
                });
            }

            if(document.body.classList.contains('page-lynx')){
                document.querySelectorAll('.card .card-body').forEach((c)=>{
                    c.addEventListener('click', ()=>{ c.classList.toggle('highlighted'); showToast('Feature highlighted'); });
                });
            }
        }catch(e){/* ignore */}
});
