<?php

// DATENBANKVERBINDUNG
// diese variablen hier müssen mit den docker-compose einstellungen übereinstimmen
$db_host      = "db_server";   // so heißt der mysql-container im docker netzwerk
$db_datenbank = "intresting maps";
$db_username  = "root";
$db_passwort  = "rootpassword";

// verbindung aufbauen
$conn = new mysqli($db_host, $db_username, $db_passwort, $db_datenbank);

// wenn die verbindung nicht klappt gleich abbrechen, sonst gibts komische folgefehler
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}
