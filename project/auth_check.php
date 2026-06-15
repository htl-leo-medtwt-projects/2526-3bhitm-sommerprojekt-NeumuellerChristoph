<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$istEingeloggt = !empty($_SESSION["login"]) && $_SESSION["login"] === 1;
$hatBenutzer = !empty($_SESSION["user"]);

// check login
if (!$istEingeloggt || !$hatBenutzer) {
    // Nicht eingeloggt
    header("Location: login.php");
    exit;
}

// Optional: Session-Fixation-Schutz
session_regenerate_id(true);
