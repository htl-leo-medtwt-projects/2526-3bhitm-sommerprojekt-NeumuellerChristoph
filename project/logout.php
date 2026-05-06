<?php
session_start();

// delete all values
$_SESSION = [];

// Session-cookie should be deleted (!)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

session_destroy();

// Forward to Login
header("Location: login.php");
exit;
?>
