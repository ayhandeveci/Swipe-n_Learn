// Swipe Derivative — vanilla JS, GitHub Pages friendly
const DECK = document.getElementById('deck');
const COUNT = document.getElementById('count');
const POINTS = document.getElementById('points');
const FEEDBACK = document.getElementById('feedback');
const RESULT = document.getElementById('result');
const FINAL = document.getElementById('finalScore');
const ACC = document.getElementById('accuracy');
const COMBO = document.getElementById('comboMsg');
const REPLAY = document.getElementById('replay');
const BTN_RIGHT = document.getElementById('rightBtn');
const BTN_WRONG = document.getElementById('wrongBtn');

let cards = [];
let index = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;

async function loadCards() {
  const res = await fetch('cards.json');
  const data = await res.json();
  // Shuffle & pick first 10
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  cards = data.slice(0, 10);
}

function cardElement(item, z) {
  const el = document.createElement('div');
  el.className = 'card';
  el.style.zIndex = z;
  el.innerHTML = `<span class="hint">Doğru → | ← Yanlış</span><h3>${item.text}</h3>`;
  el.dataset.answer = item.isTrue ? 'right' : 'left';
  el.dataset.badge = item.isTrue ? 'DOĞRU' : 'YANLIŞ';
  return el;
}

function mountNextCard() {
  if (index >= cards.length) {
    endGame();
    return;
  }
  COUNT.textContent = index;
  const item = cards[index];
  const el = cardElement(item, 100 - index);
  DECK.appendChild(el);
  attachDrag(el);
}

function attachDrag(el) {
  let startX = 0, startY = 0;
  let currentX = 0, currentY = 0;
  let dragging = false;

  const onPointerDown = (e) => {
    dragging = true;
    startX = e.clientX ?? e.touches?.[0]?.clientX;
    startY = e.clientY ?? e.touches?.[0]?.clientY;
    el.setPointerCapture?.(e.pointerId ?? 1);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    currentX = x - startX;
    currentY = y - startY;
    const rot = currentX / 15;
    el.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rot}deg)`;

    // visual hint
    if (currentX > 30) {
      el.classList.add('good'); el.classList.remove('bad');
    } else if (currentX < -30) {
      el.classList.add('bad'); el.classList.remove('good');
    } else {
      el.classList.remove('good','bad');
    }
  };

  const decide = (dir) => {
    const correctDir = el.dataset.answer; // 'right' or 'left'
    const isCorrect = (dir === correctDir);
    if (isCorrect) {
      score++; combo++; if (combo > bestCombo) bestCombo = combo;
      FEEDBACK.textContent = 'Doğru ✅';
    } else {
      combo = 0;
      FEEDBACK.textContent = 'Yanlış ❌';
    }
    POINTS.textContent = score;
    COUNT.textContent = index + 1;

    // Animate out
    const flyX = dir === 'right' ? window.innerWidth : -window.innerWidth;
    el.style.transition = 'transform 280ms ease-out, opacity 280ms ease-out';
    el.style.transform = `translate(${flyX}px, ${currentY}px) rotate(${flyX/25}deg)`;
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      index++;
      mountNextCard();
    }, 280);
  };

  const onPointerUp = () => {
    dragging = false;
    // threshold
    if (currentX > 120) decide('right');
    else if (currentX < -120) decide('left');
    else {
      el.style.transition = 'transform 180ms ease-out';
      el.style.transform = 'translate(0,0) rotate(0)';
      el.classList.remove('good','bad');
      setTimeout(()=>{ el.style.transition = '' }, 200);
    }
  };

  // Mouse / touch unified
  el.addEventListener('mousedown', onPointerDown);
  el.addEventListener('touchstart', onPointerDown, {passive:true});
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, {passive:true});
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
}

function endGame() {
  document.getElementById('game').hidden = true;
  RESULT.hidden = false;
  FINAL.textContent = score;
  const acc = Math.round((score / cards.length) * 100);
  ACC.textContent = acc;
  COMBO.textContent = bestCombo >= 3 ? `🔥 En iyi seri: ${bestCombo}` : '';
  REPLAY.onclick = () => location.reload();
}

BTN_RIGHT.onclick = ()=> decideButton('right');
BTN_WRONG.onclick = ()=> decideButton('left');

function decideButton(dir){
  const top = DECK.querySelector('.card:last-child');
  if(!top) return;
  // simulate a big drag in chosen direction
  const eventUp = new Event('mouseup');
  // quick hack: set position vars and call decide via threshold path
  const flyX = dir === 'right' ? 130 : -130;
  top.style.transform = `translate(${flyX}px, 0) rotate(${flyX/15}deg)`;
  // Reuse logic by triggering pointerup flow:
  // Instead, directly evaluate:
  const correctDir = top.dataset.answer;
  const isCorrect = (dir === correctDir);
  if (isCorrect) {
    score++; combo++; if (combo > bestCombo) bestCombo = combo;
    FEEDBACK.textContent = 'Doğru ✅';
  } else {
    combo = 0;
    FEEDBACK.textContent = 'Yanlış ❌';
  }
  POINTS.textContent = score;
  COUNT.textContent = index + 1;
  const offX = dir === 'right' ? window.innerWidth : -window.innerWidth;
  top.style.transition = 'transform 280ms ease-out, opacity 280ms ease-out';
  top.style.transform = `translate(${offX}px, 0) rotate(${offX/25}deg)`;
  top.style.opacity = '0';
  setTimeout(() => {
    top.remove();
    index++;
    mountNextCard();
  }, 280);
}

(async function init(){
  await loadCards();
  mountNextCard();
})();
