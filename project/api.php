<?php
// VERBINDUNG ZUR DATENBANK
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = 'db';               // so heißt der mysql-container in docker
$db   = 'intresting maps';  // datenbankname wie in phpmyadmin
$user = 'root';
$pass = '';                 // kein passwort gesetzt

// PDO ist die php-schnittstelle zu mysql
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// welche tabelle soll abgerufen werden - standard ist maps
// aufruf z.b.: api.php?action=maps  oder  api.php?action=users
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} else {
    $action = 'maps';
}

switch ($action) {

    // ALLE MAPS MIT TAGS
    case 'maps':
        $stmt = $pdo->query("SELECT * FROM maps ORDER BY id");
        $maps = $stmt->fetchAll();

        // für jede map wird separat nachgeschaut welche tags sie hat (JOIN über map_tags)
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.category
            FROM tags t
            JOIN map_tags mt ON mt.tag_id = t.id
            WHERE mt.map_id = ?
        ");

        $result = [];
        foreach ($maps as $map) {
            $tagStmt->execute([$map['id']]);
            $map['tags'] = $tagStmt->fetchAll();
            $result[] = $map;
        }

        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        break;

    // EINE MAP PER ID
    case 'map':
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
        } else {
            $id = 0;
        }

        $stmt = $pdo->prepare("SELECT * FROM maps WHERE id = ?");
        $stmt->execute([$id]);
        $map = $stmt->fetch();

        if ($map) {
            $tagStmt = $pdo->prepare("
                SELECT t.id, t.name, t.category
                FROM tags t
                JOIN map_tags mt ON mt.tag_id = t.id
                WHERE mt.map_id = ?
            ");
            $tagStmt->execute([$id]);
            $map['tags'] = $tagStmt->fetchAll();

            echo json_encode($map, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'map nicht gefunden']);
        }
        break;

    // ALLE USER (passwort wird nicht mitgeschickt)
    case 'users':
        $stmt = $pdo->query("SELECT id, username, email FROM users ORDER BY id");
        $users = $stmt->fetchAll();
        echo json_encode($users, JSON_UNESCAPED_UNICODE);
        break;

    // ALLE TAGS
    case 'tags':
        $stmt = $pdo->query("SELECT * FROM tags ORDER BY category, name");
        $tags = $stmt->fetchAll();
        echo json_encode($tags, JSON_UNESCAPED_UNICODE);
        break;

    // VOTES PRO MAP
    case 'votes':
        $stmt = $pdo->query("
            SELECT map_id, COUNT(*) AS vote_count
            FROM votes
            GROUP BY map_id
            ORDER BY vote_count DESC
        ");
        $votes = $stmt->fetchAll();
        echo json_encode($votes, JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'unbekannte action']);
        break;
}
