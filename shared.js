/* ── shared.js ── MathBase Calculus I ── */

// ── Fade-in observer ──
const fadeEls = document.querySelectorAll('.topic-block');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 90);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });
fadeEls.forEach(el => obs.observe(el));

// ── Practice toggles ──
document.querySelectorAll('.pp-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const ans = btn.nextElementSibling;
    const tog = btn.querySelector('.pp-toggle');
    const isOpen = ans.classList.contains('open');
    document.querySelectorAll('.pp-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.pp-toggle').forEach(t => t.classList.remove('open'));
    if (!isOpen) { ans.classList.add('open'); tog.classList.add('open'); }
  });
});

// ── TOC active tracking ──
const sections = document.querySelectorAll('.topic-block[id]');
const tocLinks = document.querySelectorAll('.toc-list a');
const tocObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.toc-list a[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });
sections.forEach(s => tocObs.observe(s));

// ── AI Chat ──
const UNIT_CONTEXT = window.UNIT_CONTEXT || 'Calculus I';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMathText(text) {
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => `\n${expr.trim()}\n`)
    .replace(/\\\[((?:[\s\S]*?))\\\]/g, (_, expr) => `\n${expr.trim()}\n`)
    .replace(/\\\((.*?)\\\)/g, (_, expr) => expr.trim())
    .replace(/\$([^$\n]+)\$/g, (_, expr) => expr.trim())
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\mathbb\s*\{R\}/g, 'R')
    .replace(/\\mathbb\s*\{N\}/g, 'N')
    .replace(/\\mathbb\s*\{Z\}/g, 'Z')
    .replace(/\\mathbb\s*\{Q\}/g, 'Q')
    .replace(/\\mathbb\s*\{C\}/g, 'C')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\le\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\to/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\infty/g, '∞')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\\exp/g, 'exp')
    .replace(/\\lim/g, 'lim')
    .replace(/\\forall/g, 'for all')
    .replace(/\\exists/g, 'there exists')
    .replace(/\\,|\\;|\\:/g, ' ')
    .replace(/\\\\/g, '\n')
    .replace(/\\([A-Za-z]+)/g, '$1');
}

function renderMessageText(text) {
  const codeBlocks = [];
  let content = text.replace(/```([\s\S]*?)```/g, (_, block) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="msg-code-block"><code>${escapeHtml(block.trim())}</code></pre>`);
    return placeholder;
  });

  content = formatMathText(content);
  content = escapeHtml(content);
  content = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const paragraphs = content
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`)
    .join('');

  let html = paragraphs || `<p>${content.replace(/\n/g, '<br>')}</p>`;
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });
  return html;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('sendBtn');
  const text = input.value.trim();
  if (!text) return;
  appendMsg('user', text, messages);
  input.value = ''; sendBtn.disabled = true; input.style.height = 'auto';
  const typingId = 'typing-' + Date.now();
  const typingEl = document.createElement('div');
  typingEl.className = 'msg ai'; typingEl.id = typingId;
  typingEl.innerHTML = `<div class="msg-avatar">∑</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  messages.appendChild(typingEl); messages.scrollTop = messages.scrollHeight;
  const history = [];
  document.querySelectorAll(`.msg:not(#${typingId})`).forEach(m => {
    history.push({ role: m.classList.contains('user') ? 'user' : 'assistant', content: m.querySelector('.msg-bubble').innerText });
  });
  try {
    const res = await fetch('/.netlify/functions/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `You are a university mathematics tutor specializing in ${UNIT_CONTEXT}. Give rigorous, clear, pedagogically excellent explanations. Be concise but thorough. For proofs, give clean numbered steps. Never be vague. Format for a simple website chatbox: prefer plain text and Unicode math symbols like ≤, ≥, →, ∈, and f(x). Do not use LaTeX delimiters such as $...$, $$...$$, \\(...\\), or \\[...\\]. Avoid raw LaTeX commands unless absolutely necessary.`,
        messages: history
      })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Tutor request failed.');
    }
    const data = await res.json();
    const reply = data.reply || 'Sorry, no response.';
    typingEl.remove(); appendMsg('ai', reply, messages);
  } catch (e) {
    typingEl.remove();
    appendMsg('ai', e.message || 'Connection error — please try again.', messages);
  }
  sendBtn.disabled = false; messages.scrollTop = messages.scrollHeight;
}
function appendMsg(role, text, container) {
  const div = document.createElement('div'); div.className = `msg ${role}`;
  const html = renderMessageText(text);
  div.innerHTML = `<div class="msg-avatar">${role==='ai'?'∑':'U'}</div><div class="msg-bubble">${html}</div>`;
  container.appendChild(div); container.scrollTop = container.scrollHeight;
}
const chatInput = document.getElementById('chatInput');
if (chatInput) {
  chatInput.addEventListener('input', function() { this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px'; });
  chatInput.addEventListener('keydown', function(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} });
}

// ══════════════════════════════════════════
//  QUIZ ENGINE
// ══════════════════════════════════════════
function initQuiz(quizId) {
  const quizEl = document.getElementById(quizId);
  if (!quizEl) return;

  const startBtn = quizEl.querySelector('.quiz-start-btn');
  const quizBody = quizEl.querySelector('.quiz-body');
  const progressFill = quizEl.querySelector('.quiz-progress-fill');
  const submitRow = quizEl.querySelector('.quiz-submit-row');
  const submitBtn = quizEl.querySelector('.quiz-submit-btn');
  const scorePanel = quizEl.querySelector('.quiz-score-panel');
  const retryBtn = quizEl.querySelector('.quiz-retry-btn');

  // total answerable questions (MC + SA; LA are always revealed, not scored)
  const mcQuestions = quizEl.querySelectorAll('.mc-options');
  const saQuestions = quizEl.querySelectorAll('.sa-input');
  const totalScored = mcQuestions.length + saQuestions.length;

  // start quiz
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    quizBody.classList.add('active');
    updateProgress();
  });

  function updateProgress() {
    let answered = 0;
    quizEl.querySelectorAll('.mc-option.selected').forEach(() => answered++);
    quizEl.querySelectorAll('.sa-input').forEach(i => { if (i.value.trim()) answered++; });
    const pct = totalScored > 0 ? (answered / totalScored) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
  }

  // MC option selection
  quizEl.querySelectorAll('.mc-options').forEach(optGroup => {
    optGroup.querySelectorAll('.mc-option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (optGroup.classList.contains('locked')) return;
        optGroup.querySelectorAll('.mc-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const checkBtn = optGroup.closest('.quiz-question').querySelector('.qq-check-btn');
        if (checkBtn) checkBtn.disabled = false;
        updateProgress();
      });
    });
  });

  // SA input tracking
  quizEl.querySelectorAll('.sa-input').forEach(inp => {
    inp.addEventListener('input', updateProgress);
  });

  // individual MC check buttons
  quizEl.querySelectorAll('.qq-check-btn[data-type="mc"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qEl = btn.closest('.quiz-question');
      const optGroup = qEl.querySelector('.mc-options');
      const selected = optGroup.querySelector('.mc-option.selected');
      if (!selected) return;
      optGroup.classList.add('locked');
      optGroup.querySelectorAll('.mc-option').forEach(o => o.classList.add('locked'));
      btn.disabled = true;
      const isCorrect = selected.dataset.correct === 'true';
      const feedback = qEl.querySelector('.mc-feedback');
      if (isCorrect) {
        selected.classList.add('correct');
        if (feedback) { feedback.classList.add('show','correct-fb'); }
      } else {
        selected.classList.add('incorrect');
        // reveal correct
        optGroup.querySelectorAll('.mc-option[data-correct="true"]').forEach(o => o.classList.add('reveal-correct'));
        if (feedback) { feedback.classList.add('show','incorrect-fb'); }
      }
    });
  });

  // SA check buttons
  quizEl.querySelectorAll('.qq-check-btn[data-type="sa"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qEl = btn.closest('.quiz-question');
      const inp = qEl.querySelector('.sa-input');
      const feedback = qEl.querySelector('.sa-feedback');
      const userVal = inp.value.trim().toLowerCase().replace(/\s+/g,'');
      const acceptedRaw = (inp.dataset.accept || '').split('|');
      const accepted = acceptedRaw.map(s => s.trim().toLowerCase().replace(/\s+/g,''));
      const correct = accepted.some(a => userVal === a || userVal.includes(a) || a.includes(userVal));
      inp.disabled = true; btn.disabled = true;
      if (correct) {
        inp.classList.add('correct-input');
        if (feedback) { feedback.classList.add('show','correct-sfb'); }
      } else {
        inp.classList.add('incorrect-input');
        if (feedback) { feedback.classList.add('show','incorrect-sfb'); }
      }
    });
  });

  // LA reveal buttons
  quizEl.querySelectorAll('.la-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sol = btn.nextElementSibling;
      if (sol && sol.classList.contains('la-solution')) {
        sol.classList.add('show');
        btn.style.display = 'none';
      }
    });
  });

  // Submit & score
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      // score MC
      let score = 0;
      quizEl.querySelectorAll('.mc-options').forEach(og => {
        const sel = og.querySelector('.mc-option.selected');
        if (sel && sel.dataset.correct === 'true') score++;
        // lock all if not already
        og.classList.add('locked');
        og.querySelectorAll('.mc-option').forEach(o => o.classList.add('locked'));
        const checkBtn = og.closest('.quiz-question')?.querySelector('.qq-check-btn');
        if (checkBtn) checkBtn.disabled = true;
        if (!og.querySelector('.mc-option.correct,.mc-option.incorrect')) {
          if (sel) { sel.classList.add(sel.dataset.correct==='true'?'correct':'incorrect'); }
          og.querySelectorAll('.mc-option[data-correct="true"]').forEach(o => { if(!o.classList.contains('correct')) o.classList.add('reveal-correct'); });
          const fb = og.closest('.quiz-question')?.querySelector('.mc-feedback');
          if (fb && sel) fb.classList.add('show', sel.dataset.correct==='true'?'correct-fb':'incorrect-fb');
        }
      });
      // score SA
      quizEl.querySelectorAll('.sa-input').forEach(inp => {
        const userVal = inp.value.trim().toLowerCase().replace(/\s+/g,'');
        const accepted = (inp.dataset.accept||'').split('|').map(s=>s.trim().toLowerCase().replace(/\s+/g,''));
        const correct = accepted.some(a => userVal===a||userVal.includes(a)||a.includes(userVal));
        if (correct) score++;
        inp.disabled = true;
        inp.classList.add(correct?'correct-input':'incorrect-input');
        const fb = inp.closest('.quiz-question')?.querySelector('.sa-feedback');
        if (fb) fb.classList.add('show', correct?'correct-sfb':'incorrect-sfb');
        const checkBtn = inp.closest('.quiz-question')?.querySelector('.qq-check-btn');
        if (checkBtn) checkBtn.disabled = true;
      });
      // show all LA solutions
      quizEl.querySelectorAll('.la-reveal-btn').forEach(b => b.click());

      if (scorePanel) {
        const scoreEl = scorePanel.querySelector('.qs-score');
        const msgEl = scorePanel.querySelector('.qs-msg');
        if (scoreEl) scoreEl.textContent = `${score}/${totalScored}`;
        const pct = totalScored > 0 ? score/totalScored : 0;
        const msgs = [
          'Keep working through the material — these concepts take time.',
          'Good effort! Review the topics where you got stuck.',
          'Solid work. A few more passes and you\'ll have this cold.',
          'Great performance! You have a strong command of the material.',
          'Excellent — near-perfect mastery of this unit.'
        ];
        if (msgEl) msgEl.textContent = msgs[Math.floor(pct * 4.99)];
        scorePanel.classList.add('show');
        scorePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (submitRow) submitRow.style.display = 'none';
      }
    });
  }

  // Retry
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      quizEl.querySelectorAll('.mc-option').forEach(o => o.classList.remove('selected','correct','incorrect','reveal-correct','locked'));
      quizEl.querySelectorAll('.mc-options').forEach(og => og.classList.remove('locked'));
      quizEl.querySelectorAll('.mc-feedback').forEach(f => f.classList.remove('show','correct-fb','incorrect-fb'));
      quizEl.querySelectorAll('.qq-check-btn').forEach(b => { b.disabled = true; });
      quizEl.querySelectorAll('.sa-input').forEach(i => { i.value=''; i.disabled=false; i.classList.remove('correct-input','incorrect-input'); });
      quizEl.querySelectorAll('.sa-feedback').forEach(f => f.classList.remove('show','correct-sfb','incorrect-sfb'));
      quizEl.querySelectorAll('.la-textarea').forEach(t => { t.value=''; });
      quizEl.querySelectorAll('.la-solution').forEach(s => s.classList.remove('show'));
      quizEl.querySelectorAll('.la-reveal-btn').forEach(b => { b.style.display=''; });
      if (scorePanel) scorePanel.classList.remove('show');
      if (submitRow) submitRow.style.display = '';
      if (progressFill) progressFill.style.width = '0%';
      window.scrollTo({ top: quizEl.offsetTop - 80, behavior: 'smooth' });
    });
  }
}

// auto-init quiz
document.querySelectorAll('.quiz-section[id]').forEach(q => initQuiz(q.id));
