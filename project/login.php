<?php
session_start();

// already logged in → redirect to main page
if (isset($_SESSION["login"]) && $_SESSION["login"] === 1) {
    header("Location: index.php");
    exit;
}

require_once "database.php";

$error   = "";
$success = "";

if (!empty($_POST["submit"])) {
    // get data from POST array
    $username = $_POST["username"];
    $passwort = $_POST["passwort"];

    // User from db
    // Prepare a select statement for the database query. ? is a placeholder for name.
    $stmt = $conn->prepare(
        "SELECT * FROM users WHERE username = ? LIMIT 1"
    );

    // Bind value username to select statement. (s = String/varchar)
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $res = $stmt->get_result();

    // Check the select result. If there is a row then the user has been found.
    if ($res->num_rows === 1) {
        $user = $res->fetch_assoc();

        // Passwort prüfen – do password verification and set some session variables
        if (password_verify($passwort, $user["password_hash"])) {
            $_SESSION["login"] = 1;
            $_SESSION["user"]  = $user;

            $conn->close();
            header("Location: index.php");
            exit;
        } else {
            $error = "Passwort falsch.";
        }
    } else {
        $error = "Benutzer nicht gefunden.";
    }

    $conn->close();
    header("Location: index.php?modal=login&error=" . urlencode($error));
    exit;
}

$conn->close();

// Wenn direkt aufgerufen → weiter zu index.php mit Modal offen
header("Location: index.php?modal=login");
exit;
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anmelden – Intresting Maps 🦎</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <style>
    html, body { overflow: auto; }

    .auth-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .auth-card {
      background: var(--paper);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 4px 32px rgba(44,28,12,0.08);
      position: relative;
      z-index: 10;
    }
    .auth-logo {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--bark2);
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .auth-sub {
      color: var(--muted);
      font-size: 0.85rem;
      margin-bottom: 2rem;
      font-family: 'DM Mono', monospace;
    }
    .auth-field {
      margin-bottom: 1rem;
    }
    .auth-field label {
      display: block;
      font-size: 0.8rem;
      font-family: 'DM Mono', monospace;
      color: var(--muted);
      margin-bottom: 0.35rem;
      letter-spacing: 0.04em;
    }
    .auth-field input {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg);
      color: var(--ink);
      font-family: 'DM Mono', monospace;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .auth-field input:focus {
      border-color: var(--moss);
    }
    .auth-btn {
      width: 100%;
      padding: 0.75rem;
      background: var(--bark2);
      color: var(--paper);
      border: none;
      border-radius: 10px;
      font-family: 'Fraunces', serif;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
    }
    .auth-btn:hover { background: var(--bark); }

    .auth-error {
      background: rgba(196,112,112,0.12);
      border: 1px solid var(--rose);
      border-radius: 8px;
      color: var(--rose);
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      padding: 0.6rem 0.8rem;
      margin-bottom: 1rem;
    }
    .auth-success {
      background: rgba(110,128,80,0.12);
      border: 1px solid var(--moss);
      border-radius: 8px;
      color: var(--moss);
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      padding: 0.6rem 0.8rem;
      margin-bottom: 1rem;
    }
    .auth-link {
      text-align: center;
      margin-top: 1.25rem;
      font-size: 0.83rem;
      font-family: 'DM Mono', monospace;
      color: var(--muted);
    }
    .auth-link a {
      color: var(--moss);
      text-decoration: none;
      font-weight: 500;
    }
    .auth-link a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="grain"></div>
  <div class="rings-bg" aria-hidden="true">
    <div class="ring r1"></div>
    <div class="ring r2"></div>
    <div class="ring r3"></div>
  </div>

  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo"><span>🦎</span> Intresting Maps</div>
      <p class="auth-sub">anmelden</p>

      <?php if ($error): ?>
        <div class="auth-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <?php if ($success): ?>
        <div class="auth-success"><?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?></div>
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

      <p class="auth-link">noch kein konto? <a href="register.php">registrieren →</a></p>
    </div>
  </div>
</body>
</html>
