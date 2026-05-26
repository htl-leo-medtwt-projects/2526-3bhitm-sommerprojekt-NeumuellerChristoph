<?php

// LOGIN
session_start();

// schon eingeloggt, kein grund hier zu sein
if (isset($_SESSION["login"]) && $_SESSION["login"] === 1) {
    header("Location: index.php");
    exit;
}

require_once "database.php";

$error = "";

// formular wurde abgeschickt
if (!empty($_POST["submit"])) {

    $username = $_POST["username"];
    $passwort = $_POST["passwort"];

    // user in der datenbank suchen, ? verhindert sql injection
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 1) {
        $user = $res->fetch_assoc();

        // password_verify vergleicht das eingegebene passwort mit dem gespeicherten hash
        if (password_verify($passwort, $user["password_hash"])) {
            // alles passt, session starten und weiter zur hauptseite
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

    // bei fehler zurück zur startseite mit login-modal und fehlermeldung
    $conn->close();
    header("Location: index.php?modal=login&error=" . urlencode($error));
    exit;
}

$conn->close();

// direkt aufgerufen, einfach zur startseite mit modal
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
</head>
<body class="auth-page">
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
