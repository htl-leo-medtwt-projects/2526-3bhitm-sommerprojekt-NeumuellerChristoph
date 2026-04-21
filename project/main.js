// GLOBALER ZUSTAND
let currentIdx   = 0;      // index der aktuell sichtbaren karte im feed
let liked        = false;  // ist die aktuelle karte geliked
let commentOpen  = false;
let menuOpen     = false;
let axoTimers    = {};     // laufende timer pro karten-id (für axl-verzögerung)
let axoShown     = {};     // merkt sich welche karten axl schon gezeigt haben
let activeFilter = 'week';
let hiddenTags   = [];     // tags die der user im menü ausgeblendet hat
let feedObserver = null;
let appCards     = [];     // wird nach dem laden der api-daten befüllt

// DOM ELEMENTE
const feed            = document.getElementById('feed');
const likeBtn         = document.getElementById('likeBtn');
const likeIcon        = document.getElementById('likeIcon');
const likeCount       = document.getElementById('likeCount');
const commentBtn      = document.getElementById('commentBtn');
const commentCount    = document.getElementById('commentCount');
const commentPanel    = document.getElementById('commentPanel');
const cpList          = document.getElementById('cpList');
const cpInput         = document.getElementById('cpInput');
const cpSend          = document.getElementById('cpSend');
const cpClose         = document.getElementById('cpClose');
const magicBtn        = document.getElementById('magicBtn');
const magicMenu       = document.getElementById('magicMenu');
const mmClose         = document.getElementById('mmClose');
const overlay         = document.getElementById('overlay');
const mmFilters       = document.querySelectorAll('.mm-filter');
const mmTagsContainer = document.getElementById('mmTags');
const fullscreenBtn   = document.querySelector('.sb-special');


// DATEN LADEN
// schickt eine anfrage an api.php und holt die karten aus der datenbank
// wenn die api nicht erreichbar ist (z.b. kein server), werden die lokalen daten aus data.js verwendet
function loadCards(callback) {
  feed.innerHTML = `
    <div class="card-section">
      <div class="feed-empty">
        <span class="feed-empty-emoji">🦎</span>
        <p>Karten werden geladen...</p>
      </div>
    </div>`;

  fetch('api.php?action=maps')
    .then(function(res) {
      if (!res.ok) throw new Error('server fehler');
      return res.json();
    })
    .then(function(data) {
      // die felder aus der datenbank heißen anders als in der app - hier werden sie umbenannt
      var cards = data.map(function(m) {
        return {
          id:        String(m.id),
          title:     m.title,
          source:    m.media_url   || '',
          tag:       m.topic       || '',
          label:     (m.topic      || '').toUpperCase(),
          likes:     '0',
          likesNum:  0,
          dateAdded: Date.now(),
          image:     m.image_url   || '',
          comments:  [],
          axo:       m.description || '',
        };
      });
      callback(cards);
    })
    .catch(function() {
      // wenn die api nicht antwortet wird eine fehlermeldung im feed angezeigt
      feed.innerHTML = `
        <div class="card-section">
          <div class="feed-empty">
            <span class="feed-empty-emoji">🦎</span>
            <p>Datenbank nicht erreichbar.</p>
            <p>Bitte sicherstellen dass der Server läuft.</p>
          </div>
        </div>`;
    });
}


// TAG BUTTONS
// liest alle tags aus den kartendaten, entfernt duplikate und baut daraus klickbare filter-buttons
function buildTagButtons() {
  var tags = [];

  appCards.forEach(function(c) {
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


// FILTER UND SORTIERUNG
// gibt eine gefilterte und sortierte kopie der karten zurück
// ausgeblendete tags werden rausgefiltert, dann wird je nach aktivem filter sortiert
function getFilteredCards() {
  var cards = appCards.slice();

  if (hiddenTags.length > 0) {
    cards = cards.filter(function(c) {
      return hiddenTags.indexOf(c.tag) == -1;
    });
  }

  if (activeFilter == 'week') {
    var weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    cards = cards.filter(function(c) {
      return c.dateAdded >= weekAgo;
    });
    cards.sort(function(a, b) {
      return b.likesNum - a.likesNum;
    });
  } else if (activeFilter == 'liked') {
    cards.sort(function(a, b) {
      return b.likesNum - a.likesNum;
    });
  } else if (activeFilter == 'comments') {
    cards.sort(function(a, b) {
      return b.comments.length - a.comments.length;
    });
  } else if (activeFilter == 'new') {
    cards.sort(function(a, b) {
      return b.dateAdded - a.dateAdded;
    });
  } else if (activeFilter == 'foryou') {
    cards.sort(function(a, b) {
      return a.id.localeCompare(b.id);
    });
  }

  return cards;
}


// KARTEN AUFBAUEN
// erzeugt den html-block mit kartenbild und beschriftung
function buildHeatmap(card) {
  return `
    <div class="hm-bg hm-photo">
      <img src="${card.image}" alt="${card.title}" class="hm-img" />
      <div class="hm-label">${card.label}</div>
    </div>
  `;
}

// erzeugt eine komplette karte als html-element: bild, axl-bubble und footer
function buildCard(card) {
  var section = document.createElement('div');
  section.className = 'card-section';
  section.dataset.id = card.id;

  section.innerHTML = `
    <div class="card">
      <div class="card-canvas">${buildHeatmap(card)}</div>

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

// leert den feed und baut ihn mit den aktuell gefilterten karten neu auf
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

  setTimeout(function() {
    scheduleAxl(cards[0].id);
  }, 100);
}


// SIDEBAR
// aktualisiert like-zahl und kommentar-anzahl in der rechten leiste
function updateSidebar(idx) {
  var cards = getFilteredCards();

  if (cards[idx]) {
    var card = cards[idx];
    likeCount.textContent    = card.likes;
    commentCount.textContent = card.comments.length;

    liked = false;
    likeBtn.classList.remove('liked');
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// AXL BUBBLE
// plant die axl-erklärung für eine karte 2,2 sekunden in der zukunft ein
// wenn der user vorher weiterschrollt wird der timer abgebrochen (cancelAxl)
// jede karte bekommt axl nur einmal gezeigt (axoShown verhindert wiederholungen)
function scheduleAxl(cardId) {
  for (var id in axoTimers) {
    if (id != cardId) {
      clearTimeout(axoTimers[id]);
      delete axoTimers[id];
    }
  }

  if (!axoShown[cardId]) {
    axoTimers[cardId] = setTimeout(function() {
      var bubble = document.getElementById('axo-' + cardId);

      if (bubble) {
        bubble.classList.add('axo-enter');

        var section = bubble.closest('.card-section');
        if (section) {
          section.classList.add('axl-visible');
        }

        axoShown[cardId] = true;
        delete axoTimers[cardId];
      }
    }, 2200);
  }
}

// bricht den geplanten axl-timer ab (z.b. wenn der user weiterschrollt)
function cancelAxl(cardId) {
  if (axoTimers[cardId]) {
    clearTimeout(axoTimers[cardId]);
    delete axoTimers[cardId];
  }
}


// SCROLL OBSERVER
// IntersectionObserver schaut welche karte gerade zu mindestens 55% sichtbar ist
// sobald eine karte sichtbar wird: sidebar aktualisieren + axl einplanen
// sobald eine karte verschwindet: axl-timer abbrechen
function setupObserver() {
  if (feedObserver) {
    feedObserver.disconnect();
  }

  var sections = feed.querySelectorAll('.card-section');
  var cards    = getFilteredCards();

  feedObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var id  = entry.target.dataset.id;
      var idx = cards.findIndex(function(c) { return c.id == id; });

      if (entry.isIntersecting) {
        currentIdx = idx;
        updateSidebar(idx);
        scheduleAxl(id);
        if (commentOpen) {
          renderComments();
        }
      } else {
        cancelAxl(id);
      }
    });
  }, { threshold: 0.55 });

  sections.forEach(function(s) {
    feedObserver.observe(s);
  });
}


// LIKE
function toggleLike() {
  liked = !liked;
  likeBtn.classList.toggle('liked', liked);

  if (liked) {
    likeIcon.style.stroke = 'var(--moss)';
    likeIcon.style.fill   = 'rgba(110,128,80,0.15)';
    likeBtn.style.transform = 'scale(1.28) rotate(-8deg)';
    setTimeout(function() {
      likeBtn.style.transform = '';
    }, 200);
  } else {
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// KOMMENTARE
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

// zeichnet die kommentarliste der aktuell sichtbaren karte neu
function renderComments() {
  var cards = getFilteredCards();

  if (cards[currentIdx]) {
    cpList.innerHTML = '';

    cards[currentIdx].comments.forEach(function(c) {
      var el = document.createElement('div');
      el.className = 'cp-comment';
      el.innerHTML = `
        <div class="cp-user">${escapeHtml(c.user)}</div>
        <div class="cp-text">${escapeHtml(c.text)}</div>
      `;
      cpList.appendChild(el);
    });
  }
}

// fügt den neuen kommentar am anfang der liste ein und scrollt nach oben
function sendComment() {
  var val = cpInput.value.trim();

  if (val) {
    var cards = getFilteredCards();

    if (cards[currentIdx]) {
      cards[currentIdx].comments.unshift({ user: 'du', text: val });
      cpInput.value = '';
      renderComments();
      commentCount.textContent = cards[currentIdx].comments.length;
      cpList.scrollTop = 0;
    }
  }
}


// MAGIC MENU
function openMenu() {
  menuOpen = true;
  magicMenu.classList.add('open');
  magicMenu.setAttribute('aria-hidden', 'false');
  overlay.classList.add('show');
  if (commentOpen) {
    closeComments();
  }
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


// HILFSFUNKTIONEN
// wandelt sonderzeichen wie < > & in sichere html-codes um
// verhindert dass kommentare als html-code ausgeführt werden (XSS-schutz)
function escapeHtml(str) {
  var result = str;
  result = result.replace(/&/g, '&amp;');
  result = result.replace(/</g, '&lt;');
  result = result.replace(/>/g, '&gt;');
  result = result.replace(/"/g, '&quot;');
  return result;
}


// VOLLBILD
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function() {});
  } else {
    document.exitFullscreen().catch(function() {});
  }
}

// tauscht das icon zwischen "vergrößern" und "verkleinern" je nach vollbild-status
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
  if (e.key == 'Enter') {
    sendComment();
  }
});

magicBtn.addEventListener('click', toggleMenu);
mmClose.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// aktiven filter setzen und feed neu laden wenn ein filter-button geklickt wird
mmFilters.forEach(function(btn) {
  btn.addEventListener('click', function() {
    mmFilters.forEach(function(b) {
      b.classList.remove('active');
    });
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    closeMenu();
    buildFeed();
  });
});

// tag ein- oder ausblenden wenn ein tag-button im menü geklickt wird
mmTagsContainer.addEventListener('click', function(e) {
  var btn = e.target.closest('.mm-tag');

  if (btn) {
    btn.classList.toggle('active');
    var tagName = btn.textContent.trim();
    var pos = hiddenTags.indexOf(tagName);

    if (pos != -1) {
      hiddenTags.splice(pos, 1);
    } else {
      hiddenTags.push(tagName);
    }

    buildFeed();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key == 'Escape') {
    if (menuOpen) {
      closeMenu();
    }
    if (commentOpen) {
      closeComments();
    }
  }
});


// START
// zuerst daten laden, dann erst den feed aufbauen
loadCards(function(cards) {
  appCards = cards;
  buildTagButtons();
  buildFeed();
});
