<?php

// API ENDPUNKT
// diese datei gibt daten aus der datenbank als json zurück
// aufruf z.b.: api.php?action=maps  oder  api.php?action=comments&map_id=2
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');


// DATENBANKVERBINDUNG
$host = 'db_server';
$db   = 'intresting maps';
$user = 'root';
$pass = 'rootpassword';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankverbindung fehlgeschlagen']);
    exit;
}

// utf8mb4 damit auch emojis und sonderzeichen richtig ankommen
$conn->set_charset('utf8mb4');


// WELCHE ACTION WURDE ANGEFRAGT
// wenn nichts angegeben ist, geben wir einfach alle maps zurück
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} else {
    $action = 'maps';
}


// ROUTING
switch ($action) {

    // ALLE MAPS LADEN
    case 'maps':
        $maps = $conn->query("SELECT * FROM maps ORDER BY id");

        if (!$maps) {
            http_response_code(500);
            echo json_encode(['error' => $conn->error]);
            exit;
        }

        // für jede map schauen wir noch welche tags sie hat
        $tagQuery = $conn->prepare("
            SELECT t.id, t.name, t.category
            FROM tags t
            JOIN map_tags mt ON mt.tag_id = t.id
            WHERE mt.map_id = ?
        ");

        $result = [];

        while ($map = $maps->fetch_assoc()) {
            $tagQuery->bind_param("i", $map['id']);
            $tagQuery->execute();
            $tagResult    = $tagQuery->get_result();
            $map['tags']  = $tagResult->fetch_all(MYSQLI_ASSOC);
            $result[]     = $map;
        }

        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        break;


    // EINE EINZELNE MAP PER ID
    case 'map':
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
        } else {
            $id = 0;
        }

        $stmt = $conn->prepare("SELECT * FROM maps WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $mapResult = $stmt->get_result();
        $map       = $mapResult->fetch_assoc();

        if ($map) {
            // tags für diese map auch noch dazuladen
            $tagQuery = $conn->prepare("
                SELECT t.id, t.name, t.category
                FROM tags t
                JOIN map_tags mt ON mt.tag_id = t.id
                WHERE mt.map_id = ?
            ");
            $tagQuery->bind_param("i", $id);
            $tagQuery->execute();
            $tagResult  = $tagQuery->get_result();
            $map['tags'] = $tagResult->fetch_all(MYSQLI_ASSOC);

            echo json_encode($map, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'map nicht gefunden']);
        }
        break;


    // ALLE USER (passwort kommt hier natürlich nicht mit raus)
    case 'users':
        $res   = $conn->query("SELECT id, username, email FROM users ORDER BY id");
        $users = $res->fetch_all(MYSQLI_ASSOC);
        echo json_encode($users, JSON_UNESCAPED_UNICODE);
        break;


    // ALLE TAGS
    case 'tags':
        $res  = $conn->query("SELECT * FROM tags ORDER BY category, name");
        $tags = $res->fetch_all(MYSQLI_ASSOC);
        echo json_encode($tags, JSON_UNESCAPED_UNICODE);
        break;


    // VOTES PRO MAP (wie viele likes hat jede karte)
    case 'votes':
        $res   = $conn->query("
            SELECT map_id, COUNT(*) AS vote_count
            FROM votes
            GROUP BY map_id
            ORDER BY vote_count DESC
        ");
        $votes = $res->fetch_all(MYSQLI_ASSOC);
        echo json_encode($votes, JSON_UNESCAPED_UNICODE);
        break;


    // KOMMENTARE FÜR EINE MAP
    case 'comments':
        if (isset($_GET['map_id'])) {
            $map_id = (int) $_GET['map_id'];
        } else {
            $map_id = 0;
        }

        // wir joinen mit users damit wir den username direkt mitbekommen
        $stmt = $conn->prepare("
            SELECT c.id, c.comment, c.created_at, u.username
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.map_id = ?
            ORDER BY c.created_at ASC
        ");
        $stmt->bind_param("i", $map_id);
        $stmt->execute();
        $commentResult = $stmt->get_result();
        $comments      = $commentResult->fetch_all(MYSQLI_ASSOC);

        echo json_encode($comments, JSON_UNESCAPED_UNICODE);
        break;


    // ALLES ANDERE
    default:
        http_response_code(400);
        echo json_encode(['error' => 'unbekannte action']);
        break;
}

$conn->close();
