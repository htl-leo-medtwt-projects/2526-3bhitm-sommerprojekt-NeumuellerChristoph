// main.js — kartenfeed

// STATE
let currentIdx   = 0;
let liked        = false;
let commentOpen  = false;
let menuOpen     = false;
let axoTimers    = {};
let axoShown     = {};
let activeFilter = 'week';
let hiddenTags   = [];
let feedObserver = null;

// ELEMENTS
const feed         = document.getElementById('feed');
const likeBtn      = document.getElementById('likeBtn');
const likeIcon     = document.getElementById('likeIcon');
const likeCount    = document.getElementById('likeCount');
const commentBtn   = document.getElementById('commentBtn');
const commentCount = document.getElementById('commentCount');
const commentPanel = document.getElementById('commentPanel');
const cpList       = document.getElementById('cpList');
const cpInput      = document.getElementById('cpInput');
const cpSend       = document.getElementById('cpSend');
const cpClose      = document.getElementById('cpClose');
const magicBtn     = document.getElementById('magicBtn');
const magicMenu    = document.getElementById('magicMenu');
const mmClose      = document.getElementById('mmClose');
const overlay      = document.getElementById('overlay');
const mmFilters    = document.querySelectorAll('.mm-filter');
const mmTagsContainer = document.getElementById('mmTags');


// TAG BUTTONS
function buildTagButtons() {
  var tags = [];

  CARDS.forEach(function(c) {
    if (tags.indexOf(c.tag) == -1) {
      tags.push(c.tag);
    }
  });

  tags.sort();

  mmTagsContainer.innerHTML = '';

  tags.forEach(function(tag) {
    var btn = document.createElement('button');
    btn.className = 'mm-tag active';
    btn.textContent = tag;
    mmTagsContainer.appendChild(btn);
  });
}


// FILTER & SORT
function getFilteredCards() {
  var cards = CARDS.slice();

  if (hiddenTags.length > 0) {
    cards = cards.filter(function(c) {
      return hiddenTags.indexOf(c.tag) == -1;
    });
  }

  if (activeFilter == 'week') {
    var weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    cards = cards.filter(function(c) { return c.dateAdded >= weekAgo; });
    cards.sort(function(a, b) { return b.likesNum - a.likesNum; });

  } else if (activeFilter == 'liked') {
    cards.sort(function(a, b) { return b.likesNum - a.likesNum; });

  } else if (activeFilter == 'comments') {
    cards.sort(function(a, b) { return b.comments.length - a.comments.length; });

  } else if (activeFilter == 'new') {
    cards.sort(function(a, b) { return b.dateAdded - a.dateAdded; });

  } else if (activeFilter == 'foryou') {
    cards.sort(function(a, b) { return a.id.localeCompare(b.id); });
  }

  return cards;
}


// BUILD FEED
function buildHeatmap(card) {
  return `
    <div class="hm-bg hm-photo">
      <img src="${card.image}" alt="${card.title}" class="hm-img" />
      <div class="hm-label">${card.label}</div>
    </div>
  `;
}

function buildCard(card) {
  var section = document.createElement('div');
  section.className = 'card-section';
  section.dataset.id = card.id;

  section.innerHTML = `
    <div class="card">
      <div class="card-canvas">
        ${buildHeatmap(card)}
      </div>

      <div class="axo-bubble" id="axo-${card.id}">
        <div class="axo-emoji-wrap">🦎</div>
        <div class="axo-body">
          <div class="axo-label">Axl erklärt ·</div>
          <div class="axo-text">${card.axo}</div>
        </div>
      </div>

      <div class="card-footer">
        <div>
          <div class="card-title">${card.title}</div>
          <div class="card-meta">
            <span class="card-source">${card.source}</span>
            <span class="card-chip">${card.tag}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  return section;
}

function buildFeed() {
  feed.innerHTML = '';
  axoShown = {};
  axoTimers = {};

  var cards = getFilteredCards();

  if (cards.length == 0) {
    feed.innerHTML = `
      <div class="card-section">
        <div class="feed-empty">
          <span class="feed-empty-emoji">🦎</span>
          <p>Keine Karten für diese Filter-Kombination.</p>
          <p>Versuch mal andere Themen!</p>
        </div>
      </div>`;
    return;
  }

  cards.forEach(function(card) {
    feed.appendChild(buildCard(card));
  });

  setupObserver();
  updateSidebar(0);
  currentIdx = 0;
  setTimeout(function() { scheduleAxl(cards[0].id); }, 100);
}


// SIDEBAR UPDATE
function updateSidebar(idx) {
  var cards = getFilteredCards();

  if (!cards[idx]) return;

  var card = cards[idx];
  likeCount.textContent    = card.likes;
  commentCount.textContent = card.comments.length;

  liked = false;
  likeBtn.classList.remove('liked');
  likeIcon.style.fill   = 'none';
  likeIcon.style.stroke = 'currentColor';
}


// AXL DELAYED ENTRANCE
function scheduleAxl(cardId) {
  for (var id in axoTimers) {
    if (id != cardId) {
      clearTimeout(axoTimers[id]);
      delete axoTimers[id];
    }
  }

  if (axoShown[cardId]) return;

  axoTimers[cardId] = setTimeout(function() {
    var bubble = document.getElementById('axo-' + cardId);
    if (!bubble) return;

    bubble.classList.add('axo-enter');

    var section = bubble.closest('.card-section');
    if (section) {
      section.classList.add('axl-visible');
    }

    axoShown[cardId] = true;
    delete axoTimers[cardId];

  }, 2200);
}

function cancelAxl(cardId) {
  if (axoTimers[cardId]) {
    clearTimeout(axoTimers[cardId]);
    delete axoTimers[cardId];
  }
}


// INTERSECTION OBSERVER
function setupObserver() {
  if (feedObserver) {
    feedObserver.disconnect();
  }

  var sections = feed.querySelectorAll('.card-section');
  var cards = getFilteredCards();

  feedObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var id  = entry.target.dataset.id;
      var idx = cards.findIndex(function(c) { return c.id == id; });

      if (entry.isIntersecting) {
        currentIdx = idx;
        updateSidebar(idx);
        scheduleAxl(id);
        if (commentOpen) renderComments();
      } else {
        cancelAxl(id);
      }
    });
  }, { threshold: 0.55 });

  sections.forEach(function(s) { feedObserver.observe(s); });
}


// LIKE
function toggleLike() {
  liked = !liked;
  likeBtn.classList.toggle('liked', liked);

  if (liked) {
    likeIcon.style.stroke = 'var(--moss)';
    likeIcon.style.fill   = 'rgba(110,128,80,0.15)';
    likeBtn.style.transform = 'scale(1.28) rotate(-8deg)';
    setTimeout(function() { likeBtn.style.transform = ''; }, 200);
  } else {
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// COMMENTS
function openComments() {
  commentOpen = true;
  commentPanel.classList.add('open');
  commentPanel.setAttribute('aria-hidden', 'false');
  feed.classList.add('comments-open');
  renderComments();
  setTimeout(function() { cpInput.focus(); }, 400);
}

function closeComments() {
  commentOpen = false;
  commentPanel.classList.remove('open');
  commentPanel.setAttribute('aria-hidden', 'true');
  feed.classList.remove('comments-open');
}

function toggleComments() {
  if (commentOpen) {
    closeComments();
  } else {
    openComments();
  }
}

function renderComments() {
  var cards = getFilteredCards();
  if (!cards[currentIdx]) return;

  var card = cards[currentIdx];
  cpList.innerHTML = '';

  card.comments.forEach(function(c) {
    var el = document.createElement('div');
    el.className = 'cp-comment';
    el.innerHTML = `
      <div class="cp-user">${escapeHtml(c.user)}</div>
      <div class="cp-text">${escapeHtml(c.text)}</div>
    `;
    cpList.appendChild(el);
  });
}

function sendComment() {
  var val = cpInput.value.trim();
  if (!val) return;

  var cards = getFilteredCards();
  if (!cards[currentIdx]) return;

  cards[currentIdx].comments.unshift({ user: 'du', text: val });
  cpInput.value = '';
  renderComments();
  commentCount.textContent = cards[currentIdx].comments.length;
  cpList.scrollTop = 0;
}


// MAGIC MENU
function openMenu() {
  menuOpen = true;
  magicMenu.classList.add('open');
  magicMenu.setAttribute('aria-hidden', 'false');
  overlay.classList.add('show');
  if (commentOpen) closeComments();
}

function closeMenu() {
  menuOpen = false;
  magicMenu.classList.remove('open');
  magicMenu.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('show');
}

function toggleMenu() {
  if (menuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}


// UTIL
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// FULLSCREEN
const fullscreenBtn = document.querySelector('.sb-special');

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function() {});
  } else {
    document.exitFullscreen().catch(function() {});
  }
}

document.addEventListener('fullscreenchange', function() {
  var svg = fullscreenBtn.querySelector('svg');

  if (document.fullscreenElement) {
    svg.innerHTML = `
      <polyline points="4 14 10 14 10 20"/>
      <polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
    `;
  } else {
    svg.innerHTML = `
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    `;
  }
});


// EVENT LISTENERS
likeBtn.addEventListener('click', toggleLike);
commentBtn.addEventListener('click', toggleComments);
cpClose.addEventListener('click', closeComments);
cpSend.addEventListener('click', sendComment);

cpInput.addEventListener('keydown', function(e) {
  if (e.key == 'Enter') sendComment();
});

magicBtn.addEventListener('click', toggleMenu);
mmClose.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
fullscreenBtn.addEventListener('click', toggleFullscreen);

mmFilters.forEach(function(btn) {
  btn.addEventListener('click', function() {
    mmFilters.forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    closeMenu();
    buildFeed();
  });
});

mmTagsContainer.addEventListener('click', function(e) {
  var btn = e.target.closest('.mm-tag');
  if (!btn) return;

  btn.classList.toggle('active');
  var tagName = btn.textContent.trim();
  var pos = hiddenTags.indexOf(tagName);

  if (pos != -1) {
    hiddenTags.splice(pos, 1);
  } else {
    hiddenTags.push(tagName);
  }

  buildFeed();
});

document.querySelectorAll('.nav-pill').forEach(function(p) {
  p.addEventListener('click', function() {
    document.querySelectorAll('.nav-pill').forEach(function(x) {
      x.classList.remove('active');
    });
    this.classList.add('active');
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key == 'Escape') {
    if (menuOpen)    closeMenu();
    if (commentOpen) closeComments();
  }
});


// INIT
buildTagButtons();
buildFeed();