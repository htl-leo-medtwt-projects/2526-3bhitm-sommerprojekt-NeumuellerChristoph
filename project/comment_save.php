<?php

// KOMMENTAR SPEICHERN
// fetch-Aufruf vom JS, Daten kommen als JSON über php://input
session_start();
header('Content-Type: application/json; charset=utf-8');


// LOGIN CHECK
// Sicherheitsnetz falls jemand direkt aufruft
if (!isset($_SESSION["login"]) || $_SESSION["login"] !== 1) {
    http_response_code(401);
    echo json_encode(['error' => 'nicht eingeloggt']);
    exit;
}


// DATEN AUS DEM REQUEST LESEN
// JSON body dekodieren
$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

// map_id und comment auslesen, Fallback auf 0 bzw. leer
if (isset($data['map_id'])) {
    $map_id = (int) $data['map_id'];
} else {
    $map_id = 0;
}

if (isset($data['comment'])) {
    $comment = trim($data['comment']);
} else {
    $comment = '';
}

// Validierung
if ($map_id <= 0 || $comment === '') {
    http_response_code(400);
    echo json_encode(['error' => 'ungültige daten']);
    exit;
}


// KOMMENTAR IN DIE DATENBANK SCHREIBEN
require_once 'database.php';

$user_id = (int) $_SESSION["user"]["id"];

$stmt = $conn->prepare("INSERT INTO comments (map_id, user_id, comment) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $map_id, $user_id, $comment);
$success = $stmt->execute();

if ($success) {
    // neuen Kommentar zurückschicken damit JS ihn direkt anzeigen kann
    $newComment = [
        'id'         => $conn->insert_id,
        'username'   => $_SESSION["user"]["username"],
        'comment'    => $comment,
        'created_at' => date('Y-m-d H:i:s'),
    ];
    echo json_encode($newComment);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'speichern fehlgeschlagen']);
}

$conn->close();
