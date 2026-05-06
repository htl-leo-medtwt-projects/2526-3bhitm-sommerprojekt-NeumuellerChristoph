<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// check login
if (
    empty($_SESSION["login"]) ||
    $_SESSION["login"] !== 1  ||
    empty($_SESSION["user"])
) {
    // Nicht eingeloggt
    header("Location: login.php");
    exit;
}

// Optional: Session-Fixation-Schutz
session_regenerate_id(true);
