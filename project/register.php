<?php

// REGISTRIERUNG
session_start();

// wenn jemand schon eingeloggt ist hat er hier nichts verloren
if (isset($_SESSION["login"]) && $_SESSION["login"] == 1) {
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
    if ($passwort1 != $passwort2) {
        $error = "Passwörter stimmen nicht überein.";

    // prüfen ob benutzername schon vergeben ist
    } elseif ($conn->query("SELECT id FROM users WHERE username = '$username' LIMIT 1")->num_rows > 0) {
        $error = "Dieser Benutzername ist bereits vergeben.";

    // prüfen ob e-mail schon vergeben ist
    } elseif ($conn->query("SELECT id FROM users WHERE email = '$email' LIMIT 1")->num_rows > 0) {
        $error = "Diese E-Mail-Adresse ist bereits registriert.";

    } else {
        // passwort wird gehasht gespeichert, niemals im klartext
        $passwortHash = password_hash($passwort1, PASSWORD_BCRYPT);

        $sql = "INSERT INTO users (username, email, password_hash)
                VALUES ('$username', '$email', '$passwortHash')";

        if ($conn->query($sql)) {
            // hat geklappt, weiter zum login
            $conn->close();
            header("Location: login.php?registered=1");
            exit;
        } else {
            $error = "Registrierung fehlgeschlagen. Bitte versuche es erneut.";
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
