<?php

// KOMMENTAR SPEICHERN
// dieser endpunkt wird vom javascript per fetch aufgerufen wenn jemand einen kommentar abschickt
// die daten kommen als json rein, deshalb lesen wir php://input statt $_POST
session_start();
header('Content-Type: application/json; charset=utf-8');


// LOGIN CHECK
// wenn jemand nicht eingeloggt ist sollte er hier gar nicht ankommen,
// aber sicher ist sicher
if (!isset($_SESSION["login"]) || $_SESSION["login"] !== 1) {
    http_response_code(401);
    echo json_encode(['error' => 'nicht eingeloggt']);
    exit;
}


// DATEN AUS DEM REQUEST LESEN
// javascript schickt die daten als json body, deshalb json_decode
$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

// map_id und kommentar raus holen, falls was fehlt auf 0 bzw leer setzen
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

// kurz prüfen ob die daten überhaupt sinnvoll sind
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
    // den neuen kommentar direkt zurückschicken damit js ihn gleich anzeigen kann
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
