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

// Pobranie danych
$data  = trim($_POST['data'] ?? '');
$tytul = trim($_POST['tytul'] ?? '');
$tresc = trim($_POST['tresc'] ?? '');
$tryb  = trim($_POST['tryb'] ?? 'add'); // 'edit' lub 'add'

if (empty($data) || empty($tresc)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Data i treść są wymagane.']);
    exit;
}

// Walidacja daty (RRRR-MM-DD)
if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $data, $matches)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nieprawidłowy format daty.']);
    exit;
}

list(, $rok, $miesiac, $dzien) = $matches;
if (!checkdate((int)$miesiac, (int)$dzien, (int)$rok)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Podana data nie istnieje w kalendarzu.']);
    exit;
}

$folderPath = __DIR__ . "/content/$rok/$miesiac/$dzien";
$filePath   = "$folderPath/{$rok}{$miesiac}{$dzien}.md";

if (!is_dir($folderPath)) {
    mkdir($folderPath, 0755, true);
}

// Przygotowanie nagłówków Markdown
$naglowekDnia = "# $data\n\n";
$sekcjaWpisu = !empty($tytul) ? "## $tytul\n\n$tresc\n" : "$tresc\n";

if ($tryb === 'edit' || !file_exists($filePath)) {
    // TRYB EDYCJI: Nadpisujemy cały plik nową treścią
    if (strpos($tresc, "# $data") === false) {
        $nowaTresc = $naglowekDnia . $sekcjaWpisu;
    } else {
        $nowaTresc = $tresc . "\n";
    }
} else {
    // TRYB DODAWANIA: Dopisujemy kolejny sekcję na końcu
    $istniejacaTresc = file_get_contents($filePath);
    $nowaTresc = rtrim($istniejacaTresc) . "\n\n" . $sekcjaWpisu;
}

if (file_put_contents($filePath, $nowaTresc) !== false) {
    define('INSIDE_PHP', true);
    require_once __DIR__ . '/generuj-indeks.php';
    generujIndeks($contentDir, $mediaDir, $outputFile);
    
    echo json_encode(['status' => 'success', 'message' => 'Wpis został pomyślnie zapisany!']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Nie udało się zapisać pliku na serwerze.']);
}
?>