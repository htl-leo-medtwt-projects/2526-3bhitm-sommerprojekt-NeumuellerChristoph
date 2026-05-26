<?php

// REGISTRIERUNG
session_start();

// wenn jemand schon eingeloggt ist hat er hier nichts verloren
if (isset($_SESSION["login"]) && $_SESSION["login"] === 1) {
    header("Location: index.php");
    exit;
}

require_once "database.php";

$error = "";

// formular wurde abgeschickt
if (!empty($_POST["submit"])) {

    // eingaben aus dem formular holen und sonderzeichen entschärfen (sql injection schutz)
    $username  = $conn->real_escape_string($_POST["username"]);
    $email     = $conn->real_escape_string($_POST["email"]);
    $passwort1 = $conn->real_escape_string($_POST["passwort1"]);
    $passwort2 = $conn->real_escape_string($_POST["passwort2"]);

    // prüfen ob beide passwörter gleich sind
    if ($passwort1 !== $passwort2) {
        $error = "Passwörter stimmen nicht überein.";
    } else {
        // passwort wird gehasht gespeichert, niemals im klartext
        $passwortHash = password_hash($passwort1, PASSWORD_BCRYPT);

        $sql = "INSERT INTO users (username, email, password_hash)
                VALUES ('$username', '$email', '$passwortHash')";

        $res = $conn->query($sql);

        if ($res) {
            // hat geklappt, weiter zum login
            $conn->close();
            header("Location: login.php?registered=1");
            exit;
        } else {
            // meistens bedeutet das dass username oder email schon vergeben sind
            $error = "Benutzername oder E-Mail existiert bereits.";
        }
    }

    // wenn es einen fehler gab zurück zur startseite mit dem register-modal offen
    if ($error) {
        $conn->close();
        header("Location: index.php?modal=register&error=" . urlencode($error));
        exit;
    }
}

$conn->close();

// wenn die seite direkt aufgerufen wird, einfach zur startseite mit modal
header("Location: index.php?modal=register");
exit;
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registrieren – Intresting Maps 🦎</title>
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
      <p class="auth-sub">neues konto erstellen</p>

      <?php if ($error): ?>
        <div class="auth-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
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

      <p class="auth-link">bereits ein konto? <a href="login.php">anmelden →</a></p>
    </div>
  </div>
</body>
</html>
