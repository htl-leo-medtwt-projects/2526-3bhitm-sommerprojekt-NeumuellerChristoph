// GLOBALER ZUSTAND
// hier merken wir uns alles was die app gerade weiß
let currentIdx   = 0;       // welche karte gerade sichtbar ist (index im array)
let liked        = false;   // ob die aktuelle karte geliked wurde
let commentOpen  = false;   // ob das kommentarpanel gerade auf ist
let menuOpen     = false;   // ob das entdecken-menü offen ist
let axoTimer     = null;    // laufender timer für die axl-bubble (immer nur einer gleichzeitig)
let axoShown     = {};      // merkt welche karten axl schon gezeigt haben
let activeFilter = 'week';  // welcher sortier-filter gerade aktiv ist
let hiddenTags   = [];      // tags die der user im menü ausgeblendet hat
let appCards     = [];      // alle geladenen karten, wird nach dem api-call befüllt
let commentsLoaded = {};    // welche karten schon ihre kommentare geladen haben


// DOM ELEMENTE
// alle elemente die wir öfter brauchen einmal raussuchen und speichern
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


// KARTEN AUS DER DATENBANK LADEN
// async/await lässt den code wie normalen code aussehen, wartet aber auf die antwort vom server
async function loadCards() {

  // ladeanimation im feed anzeigen während wir warten
  feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Karten werden geladen...</p></div></div>';

  try {
    let response = await fetch('api.php?action=maps');

    if (!response.ok) {
      throw new Error('server hat fehler zurückgegeben');
    }

    let data = await response.json();

    // die felder aus der datenbank haben andere namen als wir intern verwenden
    // hier bauen wir aus jedem datenbank-eintrag ein karten-objekt
    let cards = [];

    for (let i = 0; i < data.length; i++) {
      let m = data[i];

      let card = {
        id:        String(m.id),
        title:     m.title,
        source:    m.media_url   || '',
        tag:       m.topic       || '',
        label:     (m.topic      || '').toUpperCase(),
        likes:     String(m.likes || 0),
        likesNum:  parseInt(m.likes) || 0,
        // created_at aus der db nehmen damit die sortierung stimmt
        dateAdded: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
        image:     m.image_url   || '',
        comments:  [],
        axo:       m.description || '',
      };

      cards.push(card);
    }

    appCards = cards;
    buildTagButtons();
    buildFeed();

  } catch(e) {
    // wenn die api nicht antwortet, fehlermeldung im feed
    feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Datenbank nicht erreichbar.</p><p>Bitte sicherstellen dass der Server läuft.</p></div></div>';
  }
}


// TAG BUTTONS IM MENÜ AUFBAUEN
// liest alle tags aus den karten und baut daraus klickbare filter-buttons
function buildTagButtons() {
  let tags = [];

  for (let i = 0; i < appCards.length; i++) {
    let tag = appCards[i].tag;
    // duplikate rausfiltern
    if (tags.indexOf(tag) === -1) {
      tags.push(tag);
    }
  }

  tags.sort();

  mmTagsContainer.innerHTML = '';

  for (let j = 0; j < tags.length; j++) {
    let btn = document.createElement('button');
    btn.className   = 'mm-tag active';
    btn.textContent = tags[j];

    // klick-listener direkt auf jeden button, kein event-delegation nötig
    btn.addEventListener('click', function() {
      btn.classList.toggle('active');
      let tagName = btn.textContent.trim();
      let pos     = hiddenTags.indexOf(tagName);

      if (pos !== -1) {
        // tag aus der liste entfernen: neues array ohne diesen eintrag bauen
        let newHiddenTags = [];
        for (let k = 0; k < hiddenTags.length; k++) {
          if (hiddenTags[k] !== tagName) {
            newHiddenTags.push(hiddenTags[k]);
          }
        }
        hiddenTags = newHiddenTags;
      } else {
        hiddenTags.push(tagName);
      }

      buildFeed();
    });

    mmTagsContainer.appendChild(btn);
  }
}


// KARTEN FILTERN UND SORTIEREN
// gibt eine gefilterte und sortierte kopie der karten zurück
// ausgeblendete tags werden rausgefiltert, dann wird je nach filter sortiert
function getFilteredCards() {

  // manuelles kopieren damit wir das original nicht verändern
  let cards = [];
  for (let i = 0; i < appCards.length; i++) {
    cards.push(appCards[i]);
  }

  // ausgeblendete tags rauswerfen
  if (hiddenTags.length > 0) {
    let filtered = [];
    for (let i = 0; i < cards.length; i++) {
      if (hiddenTags.indexOf(cards[i].tag) === -1) {
        filtered.push(cards[i]);
      }
    }
    cards = filtered;
  }

  // je nach aktivem filter sortieren
  if (activeFilter === 'week') {
    // nur karten der letzten 7 tage, dann nach likes
    let weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7; // * Millisekunden: 1000ms × 60s × 60min × 24h × 7 Tage
    let thisWeek = [];
    for (let j = 0; j < cards.length; j++) {
      if (cards[j].dateAdded >= weekAgo) {
        thisWeek.push(cards[j]);
      }
    }
    cards = thisWeek;
    cards.sort(function(a, b) { return b.likesNum - a.likesNum; });

  } else if (activeFilter === 'liked') {
    // einfach nach likes sortieren
    cards.sort(function(a, b) { return b.likesNum - a.likesNum; });

  } else if (activeFilter === 'comments') {
    // nach anzahl der kommentare sortieren
    cards.sort(function(a, b) { return b.comments.length - a.comments.length; });

  } else if (activeFilter === 'new') {
    // neueste zuerst, also größtes datum oben
    cards.sort(function(a, b) { return b.dateAdded - a.dateAdded; });
  }

  return cards;
}


// KARTENBILD AUFBAUEN
// gibt den html-block mit dem bild und dem themen-label zurück
function buildHeatmap(card) {
  return '<div class="hm-bg hm-photo">'
       +   '<img src="' + card.image + '" alt="' + card.title + '" class="hm-img" />'
       +   '<div class="hm-label">' + card.label + '</div>'
       + '</div>';
}

// EINE KARTE ALS HTML-ELEMENT BAUEN
// bild, axl-bubble und footer zusammensetzen
function buildCard(card) {
  let section = document.createElement('div');
  section.className  = 'card-section';
  section.dataset.id = card.id;
  section.id         = 'section-' + card.id; // damit wir sie später per id direkt finden können

  section.innerHTML =
    '<div class="card">'
  +   '<div class="card-canvas">' + buildHeatmap(card) + '</div>'
  +   '<div class="axo-bubble" id="axo-' + card.id + '">'
  +     '<div class="axo-emoji-wrap">🦎</div>'
  +     '<div class="axo-body">'
  +       '<div class="axo-label">Axl erklärt ·</div>'
  +       '<div class="axo-text">' + card.axo + '</div>'
  +     '</div>'
  +   '</div>'
  +   '<div class="card-footer">'
  +     '<div>'
  +       '<div class="card-title">' + card.title + '</div>'
  +       '<div class="card-meta">'
  +         '<span class="card-source">' + card.source + '</span>'
  +         '<span class="card-chip">' + card.tag + '</span>'
  +       '</div>'
  +     '</div>'
  +   '</div>'
  + '</div>';

  return section;
}

// DEN FEED NEU AUFBAUEN
// feed leeren und mit den aktuell gefilterten karten neu befüllen
function buildFeed() {
  feed.innerHTML = '';
  axoShown = {};

  // laufenden axl-timer abbrechen da der feed neu gebaut wird
  if (axoTimer !== null) {
    clearTimeout(axoTimer);
    axoTimer = null;
  }

  let cards = getFilteredCards();

  if (cards.length === 0) {
    feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Keine Karten für diese Filter-Kombination.</p><p>Versuch mal andere Themen!</p></div></div>';
    return;
  }

  for (let i = 0; i < cards.length; i++) {
    feed.appendChild(buildCard(cards[i]));
  }

  updateSidebar(0);
  currentIdx = 0;

  // axl nach kurzem delay für die erste karte starten
  setTimeout(function() {
    scheduleAxl(cards[0].id);
  }, 100);
}


// WELCHE KARTE GERADE SICHTBAR IST PRÜFEN
// wird beim scrollen aufgerufen, schaut per getBoundingClientRect welche karte im sichtbereich liegt
function checkVisibleCard() {
  let sections = feed.querySelectorAll('.card-section');
  let cards    = getFilteredCards();
  let feedRect = feed.getBoundingClientRect();
  let foundVisible = false;

  for (let i = 0; i < sections.length; i++) {
    let rect = sections[i].getBoundingClientRect();

    // wie viele pixel der karte sind im sichtbaren bereich des feeds
    let visibleTop    = Math.max(rect.top, feedRect.top);
    let visibleBottom = Math.min(rect.bottom, feedRect.bottom);
    let visibleHeight = visibleBottom - visibleTop;

    // wenn die karte zu mindestens 55% sichtbar ist
    if (visibleHeight > 0 && visibleHeight / rect.height >= 0.55) {
      foundVisible = true;

      let id  = sections[i].dataset.id;
      let idx = -1;

      for (let j = 0; j < cards.length; j++) {
        if (cards[j].id === id) {
          idx = j;
          break;
        }
      }

      if (idx !== -1 && idx !== currentIdx) {
        currentIdx = idx;
        updateSidebar(idx);
        scheduleAxl(id);
        preloadComments(id);
        if (commentOpen) {
          renderComments();
          commentCount.textContent = cards[idx].comments.length;
        }
      }

      break; // nur eine karte kann gleichzeitig 55% sichtbar sein
    }
  }

  // wenn gerade keine karte zu 55% sichtbar ist, timer stoppen
  if (!foundVisible && axoTimer !== null) {
    clearTimeout(axoTimer);
    axoTimer = null;
  }
}


// SIDEBAR AKTUALISIEREN
// like-zahl und kommentar-anzahl in der rechten leiste aktualisieren
function updateSidebar(idx) {
  let cards = getFilteredCards();

  if (cards[idx]) {
    let card = cards[idx];
    likeCount.textContent    = card.likes;
    commentCount.textContent = card.comments.length;

    // like-status zurücksetzen wenn man zu einer neuen karte scrollt
    liked = false;
    likeBtn.classList.remove('liked');
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// AXL BUBBLE PLANEN
// plant die erklärung von axl 2.2 sekunden in der zukunft ein
// wenn der user vorher weiterschrollt wird der timer abgebrochen
function scheduleAxl(cardId) {

  // laufenden timer stoppen bevor wir einen neuen starten
  if (axoTimer !== null) {
    clearTimeout(axoTimer);
    axoTimer = null;
  }

  // jede karte bekommt axl nur einmal angezeigt
  if (!axoShown[cardId]) {
    axoTimer = setTimeout(function() {
      let bubble  = document.getElementById('axo-' + cardId);
      let section = document.getElementById('section-' + cardId);

      if (bubble) {
        bubble.classList.add('axo-enter');
      }

      if (section) {
        section.classList.add('axl-visible');
      }

      axoShown[cardId] = true;
      axoTimer = null;
    }, 2200);
  }
}


// LIKE BUTTON
function toggleLike() {
  liked = !liked;

  if (liked) {
    likeBtn.classList.add('liked');
    likeIcon.style.stroke       = 'var(--moss)';
    likeIcon.style.fill         = 'rgba(110,128,80,0.15)';
    likeBtn.style.transform     = 'scale(1.28) rotate(-8deg)';
    setTimeout(function() {
      likeBtn.style.transform = '';
    }, 200);
  } else {
    likeBtn.classList.remove('liked');
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// KOMMENTARE VORLADEN
// wird beim scrollen aufgerufen damit die kommentare schon da sind wenn man das panel öffnet
async function preloadComments(cardId) {

  // nicht nochmal laden wenn wir sie schon haben
  if (commentsLoaded[cardId]) {
    return;
  }

  commentsLoaded[cardId] = true;

  let response = await fetch('api.php?action=comments&map_id=' + cardId);
  let data     = await response.json();

  // karte im array finden und kommentare eintragen
  let cards = getFilteredCards();
  let card  = null;

  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id === cardId) {
      card = cards[i];
      break;
    }
  }

  if (!card) {
    return;
  }

  card.comments = data;

  // wenn das panel gerade offen ist und diese karte sichtbar ist, gleich rendern
  if (commentOpen && cards[currentIdx] && cards[currentIdx].id === cardId) {
    renderComments();
    commentCount.textContent = data.length;
  } else {
    // sonst nur die zahl in der sidebar aktualisieren
    let idx = -1;
    for (let j = 0; j < cards.length; j++) {
      if (cards[j].id === cardId) {
        idx = j;
        break;
      }
    }
    if (idx >= 0) {
      updateSidebar(idx);
    }
  }
}

// KOMMENTARPANEL ÖFFNEN
function openComments() {
  commentOpen = true;
  commentPanel.classList.add('open');
  commentPanel.setAttribute('aria-hidden', 'false');
  feed.classList.add('comments-open');
  loadCommentsFromDb();
  setTimeout(function() { cpInput.focus(); }, 400);
}

// KOMMENTARPANEL SCHLIESSEN
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

// KOMMENTARE LADEN ODER AUS CACHE NEHMEN
// wenn die kommentare schon vorgeladen wurden zeigen wir sie sofort,
// sonst nochmal von der api holen
function loadCommentsFromDb() {
  let cards = getFilteredCards();
  if (!cards[currentIdx]) {
    return;
  }

  let mapId = cards[currentIdx].id;

  if (commentsLoaded[mapId]) {
    // schon geladen, einfach anzeigen
    renderComments();
    commentCount.textContent = cards[currentIdx].comments.length;
    return;
  }

  // noch nicht geladen, ladetext anzeigen und dann fetchen
  cpList.innerHTML = '<div class="cp-comment cp-comment-muted">Laden…</div>';
  preloadComments(mapId);
}

// KOMMENTARLISTE RENDERN
// baut die html-liste der kommentare für die aktuelle karte
function renderComments() {
  let cards = getFilteredCards();

  if (!cards[currentIdx]) {
    return;
  }

  cpList.innerHTML = '';

  if (cards[currentIdx].comments.length === 0) {
    cpList.innerHTML = '<div class="cp-comment cp-comment-muted">Noch keine Kommentare. Sei der Erste!</div>';
    return;
  }

  for (let i = 0; i < cards[currentIdx].comments.length; i++) {
    let c  = cards[currentIdx].comments[i];
    let el = document.createElement('div');
    el.className = 'cp-comment';

    // username und kommentartext nebeneinander anzeigen
    el.innerHTML =
      '<div class="cp-user">'  + escapeHtml(c.username || c.user || 'anonym') + '</div>'
    + '<div class="cp-text">'  + escapeHtml(c.comment  || c.text || '')       + '</div>';

    cpList.appendChild(el);
  }
}

// KOMMENTAR ABSCHICKEN
// wenn nicht eingeloggt kommt das login-modal, sonst wird der kommentar gespeichert
async function sendComment() {

  if (!IS_LOGGED_IN) {
    openAuthModal();
    return;
  }

  let val = cpInput.value.trim();
  if (!val) {
    return;
  }

  let cards = getFilteredCards();
  if (!cards[currentIdx]) {
    return;
  }

  let mapId = parseInt(cards[currentIdx].id);

  // kommentar per fetch an comment_save.php schicken
  let response = await fetch('comment_save.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ map_id: mapId, comment: val }),
  });

  let saved = await response.json();

  if (saved.error) {
    return;
  }

  // eingabefeld leeren und neuen kommentar direkt in die liste packen
  cpInput.value = '';
  cards[currentIdx].comments.push(saved);
  renderComments();
  commentCount.textContent = cards[currentIdx].comments.length;

  cpList.scrollTop = cpList.scrollHeight; // * scrollHeight = gesamte Höhe des Inhalts, scrollTop = aktuelle Position → setzt Scroll ans Ende
}

// LOGIN MODAL ÖFFNEN
// wird aufgerufen wenn nicht-eingeloggte user etwas tun wollen das login braucht
function openAuthModal() {
  let bg = document.getElementById('authModalBg');
  if (bg) {
    bg.classList.add('open');
  }
}


// ENTDECKEN MENÜ
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


// VOLLBILD
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function() {}); // * .catch() schluckt den Fehler falls der Browser Vollbild verweigert
  } else {
    document.exitFullscreen().catch(function() {}); // * gleiches Prinzip beim Beenden
  }
}

// icon zwischen vergrößern und verkleinern wechseln
document.addEventListener('fullscreenchange', function() {
  let svg = fullscreenBtn.querySelector('svg');
  if (document.fullscreenElement) {
    svg.innerHTML =
      '<polyline points="4 14 10 14 10 20"/>'
    + '<polyline points="20 10 14 10 14 4"/>'
    + '<line x1="10" y1="14" x2="3" y2="21"/>'
    + '<line x1="21" y1="3" x2="14" y2="10"/>';
  } else {
    svg.innerHTML =
      '<polyline points="15 3 21 3 21 9"/>'
    + '<polyline points="9 21 3 21 3 15"/>'
    + '<line x1="21" y1="3" x2="14" y2="10"/>'
    + '<line x1="3" y1="21" x2="10" y2="14"/>';
  }
});


// XSS SCHUTZ
// wandelt sonderzeichen in sichere html-codes um damit kommentare nicht als code ausgeführt werden
function escapeHtml(str) {
  let result = str;
  result = result.replace(/&/g,  '&amp;');
  result = result.replace(/</g,  '&lt;');
  result = result.replace(/>/g,  '&gt;');
  result = result.replace(/"/g,  '&quot;');
  return result;
}


// EVENT LISTENER
likeBtn.addEventListener('click', toggleLike);
commentBtn.addEventListener('click', toggleComments);
cpClose.addEventListener('click', closeComments);
cpSend.addEventListener('click', sendComment);

// enter im kommentarfeld: login modal wenn nicht eingeloggt, sonst abschicken
cpInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    if (!IS_LOGGED_IN) {
      openAuthModal();
    } else {
      sendComment();
    }
  }
});

magicBtn.addEventListener('click', toggleMenu);
mmClose.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// aktiven filter wechseln und feed neu bauen
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

// escape schließt offene panels
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (menuOpen) {
      closeMenu();
    }

    if (commentOpen) {
      closeComments();
    }
  }
});

// scroll-tracking einmalig aufsetzen
feed.addEventListener('scroll', checkVisibleCard);


// START
// daten laden, danach wird buildFeed automatisch aufgerufen
loadCards();
