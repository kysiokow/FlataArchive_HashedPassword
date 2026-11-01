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
$akcja = trim($_POST['akcja'] ?? ''); // 'archive' lub 'unarchive'

if (empty($data) || !in_array($akcja, ['archive', 'unarchive'], true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nieprawidłowe dane żądania.']);
    exit;
}

// Walidacja formatu daty RRRR-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nieprawidłowy format daty.']);
    exit;
}

list($rok, $miesiac, $dzien) = explode('-', $data);

// Bezpieczne ścieżki w obrębie folderu projektu
$sourceContentDir = realpath(__DIR__ . "/content") . "/$rok/$miesiac/$dzien";
$targetArchiveDir = realpath(__DIR__ . "/content/archive") ? realpath(__DIR__ . "/content/archive") . "/$rok/$miesiac/$dzien" : __DIR__ . "/content/archive/$rok/$miesiac/$dzien";

if ($akcja === 'archive') {
    // Źródło musi znajdować się w content (i nie w archive)
    $activeDirCheck = __DIR__ . "/content/$rok/$miesiac/$dzien";
    if (!is_dir($activeDirCheck)) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Wpis nie istnieje w aktywnych.']);
        exit;
    }

    $archiveParent = dirname($targetArchiveDir);
    if (!is_dir($archiveParent)) {
        mkdir($archiveParent, 0755, true);
    }

    if (rename($activeDirCheck, $targetArchiveDir)) {
        define('INSIDE_PHP', true);
        require_once __DIR__ . '/generuj-indeks.php';
        generujIndeks($contentDir, $mediaDir, $outputFile);

        echo json_encode(['status' => 'success', 'message' => 'Wpis został zarchiwizowany pomyślnie.']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Nie udało się zarchiwizować wpisu.']);
    }
} else {
    // Przywracanie z archiwum do content
    $archivedDirCheck = __DIR__ . "/content/archive/$rok/$miesiac/$dzien";
    if (!is_dir($archivedDirCheck)) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Wpis nie istnieje w archiwum.']);
        exit;
    }

    $activeParent = __DIR__ . "/content/$rok/$miesiac/$dzien";
    if (!is_dir(dirname($activeParent))) {
        mkdir(dirname($activeParent), 0755, true);
    }

    if (rename($archivedDirCheck, $activeParent)) {
        define('INSIDE_PHP', true);
        require_once __DIR__ . '/generuj-indeks.php';
        generujIndeks($contentDir, $mediaDir, $outputFile);

        echo json_encode(['status' => 'success', 'message' => 'Wpis został przywrócony pomyślnie.']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Nie udało się przywrócić wpisu.']);
    }
}
?>