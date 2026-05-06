<?php
session_start();

$loggedIn = isset($_SESSION["login"]) && $_SESSION["login"] === 1;
$username = $loggedIn ? htmlspecialchars($_SESSION["user"]["username"], ENT_QUOTES, 'UTF-8') : '';

// Initialen für den Avatar (max. 2 Zeichen)
$initials = '';
if ($loggedIn && $username !== '') {
    $parts = explode(' ', $username);
    foreach ($parts as $p) {
        $initials .= mb_strtoupper(mb_substr($p, 0, 1));
        if (mb_strlen($initials) >= 2) break;
    }
    if ($initials === '') $initials = mb_strtoupper(mb_substr($username, 0, 2));
}

// Modal-Status aus GET-Parametern lesen (nach Redirect von login.php / register.php)
$modalOpen   = isset($_GET["modal"]) ? $_GET["modal"] : '';        // "login" | "register" | ""
$modalError  = isset($_GET["error"]) ? htmlspecialchars($_GET["error"], ENT_QUOTES, 'UTF-8') : '';
$modalSuccess = isset($_GET["success"]) ? htmlspecialchars($_GET["success"], ENT_QUOTES, 'UTF-8') : '';
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intresting Maps 🦎</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <style>
    /* ── AVATAR BUTTON ── */
    .nav-avatar {
      cursor: pointer;
      user-select: none;
      position: relative;
    }
    .nav-avatar-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }
    .nav-username {
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* ── LOGOUT DROPDOWN ── */
    .avatar-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--paper);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(44,28,12,0.12);
      z-index: 2000;
      min-width: 130px;
      overflow: hidden;
    }
    .avatar-dropdown.open { display: block; }
    .avatar-dropdown a {
      display: block;
      padding: 0.65rem 1rem;
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      color: var(--rose);
      text-decoration: none;
      transition: background 0.15s;
    }
    .avatar-dropdown a:hover { background: var(--bg2); }

    /* ── AUTH MODAL ── */
    .auth-modal-bg {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 8000;
      background: rgba(44,28,12,0.35);
      backdrop-filter: blur(3px);
      align-items: center;
      justify-content: center;
    }
    .auth-modal-bg.open { display: flex; }

    .auth-modal {
      background: var(--paper);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem 1.75rem 2rem;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 8px 40px rgba(44,28,12,0.18);
      position: relative;
    }
    .auth-modal-close {
      position: absolute;
      top: 0.9rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--muted);
      cursor: pointer;
      line-height: 1;
    }
    .auth-modal-close:hover { color: var(--ink); }

    .auth-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .auth-tab {
      flex: 1;
      padding: 0.55rem 0;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      color: var(--muted);
      cursor: pointer;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .auth-tab.active {
      color: var(--bark2);
      border-bottom-color: var(--moss);
    }

    .auth-panel { display: none; }
    .auth-panel.active { display: block; }

    .auth-logo {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--bark2);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .auth-field { margin-bottom: 0.85rem; }
    .auth-field label {
      display: block;
      font-size: 0.78rem;
      font-family: 'DM Mono', monospace;
      color: var(--muted);
      margin-bottom: 0.3rem;
      letter-spacing: 0.04em;
    }
    .auth-field input {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg);
      color: var(--ink);
      font-family: 'DM Mono', monospace;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .auth-field input:focus { border-color: var(--moss); }
    .auth-btn {
      width: 100%;
      padding: 0.7rem;
      background: var(--bark2);
      color: var(--paper);
      border: none;
      border-radius: 10px;
      font-family: 'Fraunces', serif;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 0.35rem;
      transition: background 0.2s;
    }
    .auth-btn:hover { background: var(--bark); }
    .auth-msg {
      border-radius: 8px;
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
      padding: 0.55rem 0.75rem;
      margin-bottom: 0.85rem;
    }
    .auth-msg.error {
      background: rgba(196,112,112,0.12);
      border: 1px solid var(--rose);
      color: var(--rose);
    }
    .auth-msg.success {
      background: rgba(110,128,80,0.12);
      border: 1px solid var(--moss);
      color: var(--moss);
    }
  </style>
</head>
<body>

  <!-- GRAIN -->
  <div class="grain"></div>

  <!-- RING BACKGROUND -->
  <div class="rings-bg" aria-hidden="true">
    <div class="ring r1"></div>
    <div class="ring r2"></div>
    <div class="ring r3"></div>
    <div class="ring r4"></div>
    <div class="ring r5"></div>
  </div>

  <!-- OVERLAY -->
  <div class="overlay" id="overlay"></div>

  <!-- MAGIC MENU -->
  <aside class="magic-menu" id="magicMenu" aria-hidden="true">
    <div class="mm-header">
      <span class="mm-title">🌿 entdecken</span>
      <button class="mm-close" id="mmClose" aria-label="Menü schließen">×</button>
    </div>

    <div class="mm-section">
      <p class="mm-section-label">sortierung</p>
      <div class="mm-filters" id="mmFilters">
        <button class="mm-filter active" data-filter="week">
          <span class="mm-icon">🔥</span>
          <span class="mm-filter-text">
            <strong>Top 10 diese Woche</strong>
            <em>meistgeschaut · 7 Tage</em>
          </span>
        </button>
        <button class="mm-filter" data-filter="liked">
          <span class="mm-icon">❤️</span>
          <span class="mm-filter-text">
            <strong>Meist geliked</strong>
            <em>dieser Monat</em>
          </span>
        </button>
        <button class="mm-filter" data-filter="comments">
          <span class="mm-icon">💬</span>
          <span class="mm-filter-text">
            <strong>Meiste Kommentare</strong>
            <em>dieser Monat</em>
          </span>
        </button>
        <button class="mm-filter" data-filter="new">
          <span class="mm-icon">✨</span>
          <span class="mm-filter-text">
            <strong>Neu & Frisch</strong>
            <em>letzte 24 Stunden</em>
          </span>
        </button>
        <button class="mm-filter" data-filter="foryou">
          <span class="mm-icon">🗺️</span>
          <span class="mm-filter-text">
            <strong>Für dich</strong>
            <em>personalisiert</em>
          </span>
        </button>
      </div>
    </div>

    <div class="mm-divider"></div>

    <div class="mm-section">
      <p class="mm-section-label">themen</p>
      <div class="mm-tags" id="mmTags">
        <!-- Tags werden dynamisch aus den Kartendaten geladen -->
      </div>
    </div>

    <div class="mm-axo">
      <span class="mm-axo-emoji">🦎</span>
      <p>Hallo<?php if ($loggedIn): ?> <strong><?= $username ?></strong><?php endif; ?>! Ich bin <strong>Axl</strong>, dein Axolotl 🌸<br>
        Ich erkläre dir jede Karte — gemütlich und ohne Stress.</p>
    </div>
  </aside>

  <!-- ── NAV ── -->
  <header class="topnav">
    <div class="nav-logo">
      <span class="nav-axo">🦎</span>
      <span class="nav-wordmark">Intresting Maps</span>
    </div>
    <div class="nav-right">
      <button class="magic-btn" id="magicBtn" aria-label="Menü öffnen" title="Entdecken & Filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </button>

      <?php if ($loggedIn): ?>
        <div class="nav-avatar-wrap" id="avatarWrap">
          <div class="nav-avatar" id="avatarBtn" title="<?= $username ?>" aria-label="Profilbild"><?= $initials ?></div>
          <div class="avatar-dropdown" id="avatarDropdown">
            <a href="logout.php">⬡ abmelden</a>
          </div>
        </div>
      <?php else: ?>
        <div class="nav-avatar" id="avatarBtn" aria-label="Anmelden" title="Anmelden / Registrieren">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
      <?php endif; ?>
    </div>
  </header>

  <!-- MAIN LAYOUT -->
  <div class="layout">

    <!-- FEED -->
    <main class="feed" id="feed" tabindex="0" aria-label="Intresting Maps">
      <!-- cards injected by JS -->
    </main>

    <!-- RIGHT SIDEBAR -->
    <aside class="sidebar" aria-label="Aktionen">
      <div class="sidebar-rings" aria-hidden="true">
        <div class="sb-ring sb-ring-1"></div>
        <div class="sb-ring sb-ring-2"></div>
      </div>

      <button class="sb-btn" id="likeBtn" aria-label="Like" title="Liken">
        <svg class="sb-icon" id="likeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span class="sb-count" id="likeCount">—</span>
      </button>

      <button class="sb-btn" id="commentBtn" aria-label="Kommentare" title="Kommentare">
        <svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="sb-count" id="commentCount">—</span>
      </button>

      <div class="sb-divider"></div>

      <button class="sb-special" aria-label="Vollbild" title="Vollbild">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="15 3 21 3 21 9"/>
          <polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </button>

      <div class="sb-divider"></div>

      <button class="sb-btn" aria-label="Speichern" title="Speichern">
        <svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="sb-count">merken</span>
      </button>
    </aside>

  </div>

  <!-- COMMENT PANEL -->
  <section class="comment-panel" id="commentPanel" aria-label="Kommentare" aria-hidden="true">
    <div class="cp-header">
      <h2 class="cp-title">Kommentare</h2>
      <button class="cp-close" id="cpClose" aria-label="Schließen">×</button>
    </div>
    <div class="cp-list" id="cpList"></div>
    <div class="cp-input-row">
      <input class="cp-input" id="cpInput" type="text" placeholder="Schreib etwas schönes…" autocomplete="off">
      <button class="cp-send" id="cpSend" aria-label="Senden">→</button>
    </div>
  </section>

  <!-- AUTH MODAL -->
  <?php if (!$loggedIn): ?>
  <div class="auth-modal-bg" id="authModalBg">
    <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Anmelden oder Registrieren">
      <button class="auth-modal-close" id="authModalClose" aria-label="Schließen">×</button>
      <div class="auth-logo"><span>🦎</span> Intresting Maps</div>

      <div class="auth-tabs">
        <button class="auth-tab <?= $modalOpen === 'register' ? '' : 'active' ?>" data-tab="login">anmelden</button>
        <button class="auth-tab <?= $modalOpen === 'register' ? 'active' : '' ?>" data-tab="register">registrieren</button>
      </div>

      <!-- LOGIN PANEL -->
      <div class="auth-panel <?= $modalOpen === 'register' ? '' : 'active' ?>" id="panel-login">
        <?php if ($modalOpen === 'login' && $modalError): ?>
          <div class="auth-msg error"><?= $modalError ?></div>
        <?php endif; ?>
        <?php if ($modalSuccess): ?>
          <div class="auth-msg success"><?= $modalSuccess ?></div>
        <?php endif; ?>
        <form method="POST" action="login.php">
          <div class="auth-field">
            <label>username</label>
            <input type="text" name="username" required autocomplete="username">
          </div>
          <div class="auth-field">
            <label>passwort</label>
            <input type="password" name="passwort" required autocomplete="current-password">
          </div>
          <button class="auth-btn" type="submit" name="submit" value="1">Anmelden</button>
        </form>
      </div>

      <!-- REGISTER PANEL -->
      <div class="auth-panel <?= $modalOpen === 'register' ? 'active' : '' ?>" id="panel-register">
        <?php if ($modalOpen === 'register' && $modalError): ?>
          <div class="auth-msg error"><?= $modalError ?></div>
        <?php endif; ?>
        <form method="POST" action="register.php">
          <div class="auth-field">
            <label>username</label>
            <input type="text" name="username" required autocomplete="username">
          </div>
          <div class="auth-field">
            <label>e-mail</label>
            <input type="email" name="email" required autocomplete="email">
          </div>
          <div class="auth-field">
            <label>passwort</label>
            <input type="password" name="passwort1" required autocomplete="new-password">
          </div>
          <div class="auth-field">
            <label>passwort wiederholen</label>
            <input type="password" name="passwort2" required autocomplete="new-password">
          </div>
          <button class="auth-btn" type="submit" name="submit" value="1">Registrieren</button>
        </form>
      </div>
    </div>
  </div>
  <?php endif; ?>

  <script>
    // AUTH MODAL
    <?php if (!$loggedIn): ?>
    (function () {
      var bg      = document.getElementById('authModalBg');
      var closeBtn = document.getElementById('authModalClose');
      var avatarBtn = document.getElementById('avatarBtn');
      var tabs    = document.querySelectorAll('.auth-tab');
      var panels  = document.querySelectorAll('.auth-panel');

      function openModal() {
        bg.classList.add('open');
      }
      function closeModal() {
        bg.classList.remove('open');
      }

      avatarBtn.addEventListener('click', openModal);
      closeBtn.addEventListener('click', closeModal);
      bg.addEventListener('click', function(e) {
        if (e.target === bg) closeModal();
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
      });

      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var target = this.dataset.tab;
          tabs.forEach(function(t) { t.classList.remove('active'); });
          panels.forEach(function(p) { p.classList.remove('active'); });
          this.classList.add('active');
          document.getElementById('panel-' + target).classList.add('active');
        });
      });

      // Auto-open wenn Fehler/Redirect von login.php oder register.php
      <?php if ($modalOpen): ?>
      openModal();
      <?php endif; ?>
    })();
    <?php else: ?>
    // Logged-in: Avatar-Dropdown
    (function () {
      var wrap    = document.getElementById('avatarWrap');
      var btn     = document.getElementById('avatarBtn');
      var dropdown = document.getElementById('avatarDropdown');

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function() {
        dropdown.classList.remove('open');
      });
    })();
    <?php endif; ?>
  </script>

  <script src="main.js"></script>
</body>
</html>
