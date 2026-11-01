<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$haslo = $_POST['password'] ?? '';

if (!checkAuth()) {
   if (!empty($haslo) && password_verify($haslo, API_JSONCREATE_KEY)) {
        $_SESSION['last_activity'] = time();
    } else {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Brak autoryzacji lub nieprawidłowe hasło.']);
        exit;
    }
}

$data = trim($_POST['data'] ?? '');
if (empty($data) || !isset($_FILES['plik']) || $_FILES['plik']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nie wybrano pliku, wystąpił błąd uploadu lub brakuje daty.']);
    exit;
}

// Limit wielkości pliku (np. max 10MB)
if ($_FILES['plik']['size'] > 10 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Plik jest zbyt duży (maksymalnie 10 MB).']);
    exit;
}

if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $data, $matches)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nieprawidłowa data.']);
    exit;
}

list(, $rok, $miesiac, $dzien) = $matches;
$targetDir = __DIR__ . "/media/$rok/$miesiac/$dzien";

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// Kontrola i sanitizowanie nazwy pliku
$surowaNazwa = basename($_FILES['plik']['name']);
$ext = strtolower(pathinfo($surowaNazwa, PATHINFO_EXTENSION));

// Dozwolone rozszerzenia
$dozwoloneRozszerzenia = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'pdf', 'txt', 'zip'];
if (!in_array($ext, $dozwoloneRozszerzenia, true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Niedozwolony format pliku.']);
    exit;
}

$fileName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $surowaNazwa);
$targetFile = "$targetDir/$fileName";

if (move_uploaded_file($_FILES['plik']['tmp_name'], $targetFile)) {
    define('INSIDE_PHP', true);
    require_once __DIR__ . '/generuj-indeks.php';
    generujIndeks($contentDir, $mediaDir, $outputFile);

    echo json_encode(['status' => 'success', 'message' => 'Załącznik dodany pomyślnie!']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Błąd zapisu pliku na serwerze.']);
}
?>