// GLOBALER ZUSTAND
// hier merken wir uns alles was die app gerade weiß
let currentIdx   = 0;       // welche karte gerade sichtbar ist (index im array)
let liked        = false;   // ob die aktuelle karte geliked wurde
let commentOpen  = false;   // ob das kommentarpanel gerade auf ist
let menuOpen     = false;   // ob das entdecken-menü offen ist
let axoTimers    = {};      // laufende timer für die axl-bubble (pro karten-id)
let axoShown     = {};      // merkt welche karten axl schon gezeigt haben
let activeFilter = 'week';  // welcher sortier-filter gerade aktiv ist
let hiddenTags   = [];      // tags die der user im menü ausgeblendet hat
let feedObserver = null;    // der intersection observer der das scrollen verfolgt
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
// schickt eine anfrage an api.php und baut daraus die karten-objekte
function loadCards(callback) {

  // ladeanimation im feed anzeigen während wir warten
  feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Karten werden geladen...</p></div></div>';

  fetch('api.php?action=maps')
    .then(function(res) {
      if (!res.ok) {
        throw new Error('server hat fehler zurückgegeben');
      }
      return res.json();
    })
    .then(function(data) {

      // die felder aus der datenbank haben andere namen als wir intern verwenden
      // hier bauen wir aus jedem datenbank-eintrag ein karten-objekt
      var cards = [];

      for (var i = 0; i < data.length; i++) {
        var m = data[i];

        var card = {
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

      callback(cards);
    })
    .catch(function() {
      // wenn die api nicht antwortet, fehlermeldung im feed
      feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Datenbank nicht erreichbar.</p><p>Bitte sicherstellen dass der Server läuft.</p></div></div>';
    });
}


// TAG BUTTONS IM MENÜ AUFBAUEN
// liest alle tags aus den karten und baut daraus klickbare filter-buttons
function buildTagButtons() {
  var tags = [];

  for (var i = 0; i < appCards.length; i++) {
    var tag = appCards[i].tag;
    // duplikate rausfiltern
    if (tags.indexOf(tag) === -1) {
      tags.push(tag);
    }
  }

  tags.sort();

  mmTagsContainer.innerHTML = '';

  for (var j = 0; j < tags.length; j++) {
    var btn = document.createElement('button');
    btn.className   = 'mm-tag active';
    btn.textContent = tags[j];
    mmTagsContainer.appendChild(btn);
  }
}


// KARTEN FILTERN UND SORTIEREN
// gibt eine gefilterte und sortierte kopie der karten zurück
// ausgeblendete tags werden rausgefiltert, dann wird je nach filter sortiert
function getFilteredCards() {

  // erstmal alle karten kopieren damit wir das original nicht verändern
  var cards = appCards.slice();

  // ausgeblendete tags rauswerfen
  if (hiddenTags.length > 0) {
    var filtered = [];
    for (var i = 0; i < cards.length; i++) {
      if (hiddenTags.indexOf(cards[i].tag) === -1) {
        filtered.push(cards[i]);
      }
    }
    cards = filtered;
  }

  // je nach aktivem filter sortieren
  if (activeFilter === 'week') {
    // nur karten der letzten 7 tage, dann nach likes
    var weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    var thisWeek = [];
    for (var j = 0; j < cards.length; j++) {
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
  var section = document.createElement('div');
  section.className    = 'card-section';
  section.dataset.id   = card.id;

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
  axoShown  = {};
  axoTimers = {};

  var cards = getFilteredCards();

  if (cards.length === 0) {
    feed.innerHTML = '<div class="card-section"><div class="feed-empty"><span class="feed-empty-emoji">🦎</span><p>Keine Karten für diese Filter-Kombination.</p><p>Versuch mal andere Themen!</p></div></div>';
    return;
  }

  for (var i = 0; i < cards.length; i++) {
    feed.appendChild(buildCard(cards[i]));
  }

  setupObserver();
  updateSidebar(0);
  currentIdx = 0;

  // axl nach kurzem delay für die erste karte starten
  setTimeout(function() {
    scheduleAxl(cards[0].id);
  }, 100);
}


// SIDEBAR AKTUALISIEREN
// like-zahl und kommentar-anzahl in der rechten leiste aktualisieren
function updateSidebar(idx) {
  var cards = getFilteredCards();

  if (cards[idx]) {
    var card = cards[idx];
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

  // timer aller anderen karten stoppen
  for (var id in axoTimers) {
    if (id !== cardId) {
      clearTimeout(axoTimers[id]);
      delete axoTimers[id];
    }
  }

  // jede karte bekommt axl nur einmal angezeigt
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

// AXL TIMER ABBRECHEN
// z.b. wenn der user zur nächsten karte scrollt
function cancelAxl(cardId) {
  if (axoTimers[cardId]) {
    clearTimeout(axoTimers[cardId]);
    delete axoTimers[cardId];
  }
}


// SCROLL OBSERVER
// schaut welche karte gerade zu mindestens 55% sichtbar ist
// sobald eine karte ins bild kommt: sidebar + axl + kommentare vorladen
function setupObserver() {
  if (feedObserver) {
    feedObserver.disconnect();
  }

  var sections = feed.querySelectorAll('.card-section');
  var cards    = getFilteredCards();

  feedObserver = new IntersectionObserver(function(entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var id    = entry.target.dataset.id;
      var idx   = -1;

      // index der karte im array finden
      for (var j = 0; j < cards.length; j++) {
        if (cards[j].id === id) {
          idx = j;
          break;
        }
      }

      if (entry.isIntersecting) {
        currentIdx = idx;
        updateSidebar(idx);
        scheduleAxl(id);
        // kommentare im hintergrund schon vorladen damit sie sofort da sind
        preloadComments(id);
        if (commentOpen) {
          renderComments();
          commentCount.textContent = cards[idx].comments.length;
        }
      } else {
        cancelAxl(id);
      }
    }
  }, { threshold: 0.55 });

  for (var k = 0; k < sections.length; k++) {
    feedObserver.observe(sections[k]);
  }
}


// LIKE BUTTON
function toggleLike() {
  liked = !liked;
  likeBtn.classList.toggle('liked', liked);

  if (liked) {
    likeIcon.style.stroke       = 'var(--moss)';
    likeIcon.style.fill         = 'rgba(110,128,80,0.15)';
    likeBtn.style.transform     = 'scale(1.28) rotate(-8deg)';
    setTimeout(function() {
      likeBtn.style.transform = '';
    }, 200);
  } else {
    likeIcon.style.fill   = 'none';
    likeIcon.style.stroke = 'currentColor';
  }
}


// KOMMENTARE VORLADEN
// wird beim scrollen aufgerufen damit die kommentare schon da sind wenn man das panel öffnet
function preloadComments(cardId) {

  // nicht nochmal laden wenn wir sie schon haben
  if (commentsLoaded[cardId]) {
    return;
  }

  commentsLoaded[cardId] = true;

  fetch('api.php?action=comments&map_id=' + cardId)
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      // karte im array finden und kommentare eintragen
      var cards = getFilteredCards();
      var card  = null;

      for (var i = 0; i < cards.length; i++) {
        if (cards[i].id === cardId) {
          card = cards[i];
          break;
        }
      }

      if (!card) return;

      card.comments = data;

      // wenn das panel gerade offen ist und diese karte sichtbar ist, gleich rendern
      if (commentOpen && cards[currentIdx] && cards[currentIdx].id === cardId) {
        renderComments();
        commentCount.textContent = data.length;
      } else {
        // sonst nur die zahl in der sidebar aktualisieren
        var idx = -1;
        for (var j = 0; j < cards.length; j++) {
          if (cards[j].id === cardId) {
            idx = j;
            break;
          }
        }
        if (idx >= 0) {
          updateSidebar(idx);
        }
      }
    });
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
  var cards = getFilteredCards();
  if (!cards[currentIdx]) return;

  var mapId = cards[currentIdx].id;

  if (commentsLoaded[mapId]) {
    // schon geladen, einfach anzeigen
    renderComments();
    commentCount.textContent = cards[currentIdx].comments.length;
    return;
  }

  // noch nicht geladen, ladetext anzeigen und dann fetchen
  cpList.innerHTML = '<div class="cp-comment" style="opacity:0.5">Laden…</div>';
  preloadComments(mapId);
}

// KOMMENTARLISTE RENDERN
// baut die html-liste der kommentare für die aktuelle karte
function renderComments() {
  var cards = getFilteredCards();

  if (!cards[currentIdx]) return;

  cpList.innerHTML = '';

  if (cards[currentIdx].comments.length === 0) {
    cpList.innerHTML = '<div class="cp-comment" style="opacity:0.5">Noch keine Kommentare. Sei der Erste!</div>';
    return;
  }

  for (var i = 0; i < cards[currentIdx].comments.length; i++) {
    var c  = cards[currentIdx].comments[i];
    var el = document.createElement('div');
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
function sendComment() {

  if (!IS_LOGGED_IN) {
    openAuthModal();
    return;
  }

  var val = cpInput.value.trim();
  if (!val) return;

  var cards = getFilteredCards();
  if (!cards[currentIdx]) return;

  var mapId = parseInt(cards[currentIdx].id);

  // kommentar per fetch an comment_save.php schicken
  fetch('comment_save.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ map_id: mapId, comment: val }),
  })
    .then(function(res) {
      return res.json();
    })
    .then(function(saved) {
      if (saved.error) return;

      // eingabefeld leeren und neuen kommentar direkt in die liste packen
      cpInput.value = '';
      cards[currentIdx].comments.push(saved);
      renderComments();
      commentCount.textContent = cards[currentIdx].comments.length;

      // nach unten scrollen damit der neue kommentar sichtbar ist
      cpList.scrollTop = cpList.scrollHeight;
    });
}

// LOGIN MODAL ÖFFNEN
// wird aufgerufen wenn nicht-eingeloggte user etwas tun wollen das login braucht
function openAuthModal() {
  var bg = document.getElementById('authModalBg');
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
    document.documentElement.requestFullscreen().catch(function() {});
  } else {
    document.exitFullscreen().catch(function() {});
  }
}

// icon zwischen vergrößern und verkleinern wechseln
document.addEventListener('fullscreenchange', function() {
  var svg = fullscreenBtn.querySelector('svg');
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
  var result = str;
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
    mmFilters.forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    closeMenu();
    buildFeed();
  });
});

// tag ein- oder ausblenden
mmTagsContainer.addEventListener('click', function(e) {
  var btn = e.target.closest('.mm-tag');
  if (!btn) return;

  btn.classList.toggle('active');
  var tagName = btn.textContent.trim();
  var pos     = hiddenTags.indexOf(tagName);

  if (pos !== -1) {
    hiddenTags.splice(pos, 1);
  } else {
    hiddenTags.push(tagName);
  }

  buildFeed();
});

// escape schließt offene panels
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (menuOpen)    closeMenu();
    if (commentOpen) closeComments();
  }
});


// START
// erst daten laden, dann den feed bauen
loadCards(function(cards) {
  appCards = cards;
  buildTagButtons();
  buildFeed();
});
