<?php
// CORS-Header damit das Frontend die API aufrufen kann
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// --- Datenbankverbindung (XAMPP Standard) ---
$host = 'localhost';
$db   = 'interesting_maps'; // <-- ggf. deinen Datenbanknamen anpassen
$user = 'root';
$pass = '';                  // XAMPP hat standardmäßig kein Passwort

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

// --- Welche Aktion soll ausgeführt werden? ---
// Aufruf z.B.: api.php?action=maps  oder  api.php?action=users  etc.
$action = $_GET['action'] ?? 'maps';

switch ($action) {

    // ---- Alle Maps (mit zugehörigen Tags) ----
    case 'maps':
        $maps = $pdo->query("SELECT * FROM maps ORDER BY id")->fetchAll();

        // Zu jeder Map die Tags laden
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

        echo json_encode($maps, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ---- Einzelne Map per ID ----
    case 'map':
        $id = (int) ($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT * FROM maps WHERE id = ?");
        $stmt->execute([$id]);
        $map = $stmt->fetch();

        if (!$map) {
            http_response_code(404);
            echo json_encode(['error' => 'Map nicht gefunden']);
            break;
        }

        // Tags dazu laden
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.category
            FROM tags t
            JOIN map_tags mt ON mt.tag_id = t.id
            WHERE mt.map_id = ?
        ");
        $tagStmt->execute([$id]);
        $map['tags'] = $tagStmt->fetchAll();

        echo json_encode($map, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ---- Alle Users ----
    case 'users':
        // Passwort-Hash wird NICHT mitgeschickt
        $users = $pdo->query("SELECT id, username, email FROM users ORDER BY id")->fetchAll();
        echo json_encode($users, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ---- Alle Tags ----
    case 'tags':
        $tags = $pdo->query("SELECT * FROM tags ORDER BY category, name")->fetchAll();
        echo json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ---- Votes pro Map ----
    case 'votes':
        $votes = $pdo->query("
            SELECT map_id, COUNT(*) AS vote_count
            FROM votes
            GROUP BY map_id
            ORDER BY vote_count DESC
        ")->fetchAll();
        echo json_encode($votes, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ---- Unbekannte Aktion ----
    default:
        http_response_code(400);
        echo json_encode([
            'error'            => 'Unbekannte Aktion',
            'verfuegbare_actions' => ['maps', 'map', 'users', 'tags', 'votes']
        ]);
        break;
}
