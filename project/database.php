<?php
// mySQL database information
$db_host      = "db";
$db_datenbank = "intresting maps";
$db_username  = "root";
$db_passwort  = "";

// open database connection
$conn = new mysqli($db_host, $db_username, $db_passwort, $db_datenbank);

// Check connection
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}
