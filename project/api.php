<?php
// VERBINDUNG ZUR DATENBANK
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$db   = 'interesting_maps'; // datenbankname ggf. anpassen
$user = 'root';
$pass = '';                  // xampp hat standardmäßig kein passwort

// PDO ist die php-schnittstelle zu mysql - bei einem fehler wirft es eine exception
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

// welche tabelle soll abgerufen werden - standard ist maps
// aufruf z.b.: api.php?action=maps  oder  api.php?action=users
$action = $_GET['action'] ?? 'maps';

switch ($action) {

    // ALLE MAPS MIT TAGS
    case 'maps':
        $maps = $pdo->query("SELECT * FROM maps ORDER BY id")->fetchAll();

        // für jede map wird separat nachgeschaut welche tags sie hat (JOIN über map_tags)
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.category
            FROM tags t
            JOIN map_tags mt ON mt.tag_id = t.id
            WHERE mt.map_id = ?
        ");
        foreach ($maps as &$map) {
            $tagStmt->execute([$map['id']]);
            $map['tags'] = $tagStmt->fetchAll();
        }

        echo json_encode($maps, JSON_UNESCAPED_UNICODE);
        break;

    // EINE MAP PER ID
    case 'map':
        $id = (int) ($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT * FROM maps WHERE id = ?");
        $stmt->execute([$id]);
        $map = $stmt->fetch();

        if (!$map) {
            http_response_code(404);
            echo json_encode(['error' => 'map nicht gefunden']);
            break;
        }

        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.category
            FROM tags t
            JOIN map_tags mt ON mt.tag_id = t.id
            WHERE mt.map_id = ?
        ");
        $tagStmt->execute([$id]);
        $map['tags'] = $tagStmt->fetchAll();

        echo json_encode($map, JSON_UNESCAPED_UNICODE);
        break;

    // ALLE USER (passwort wird nicht mitgeschickt)
    case 'users':
        $users = $pdo->query("SELECT id, username, email FROM users ORDER BY id")->fetchAll();
        echo json_encode($users, JSON_UNESCAPED_UNICODE);
        break;

    // ALLE TAGS
    case 'tags':
        $tags = $pdo->query("SELECT * FROM tags ORDER BY category, name")->fetchAll();
        echo json_encode($tags, JSON_UNESCAPED_UNICODE);
        break;

    // VOTES PRO MAP
    case 'votes':
        $votes = $pdo->query("
            SELECT map_id, COUNT(*) AS vote_count
            FROM votes
            GROUP BY map_id
            ORDER BY vote_count DESC
        ")->fetchAll();
        echo json_encode($votes, JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'unbekannte action']);
        break;
}
