<?php
// Wyłączenie cache
header("Cache-Control: no-cache, must-revalidate");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
date_default_timezone_set('Europe/Warsaw');

// Wczytanie konfiguracji
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    define('API_JSONCREATE_KEY', '');
}

// Ujednolicona autoryzacja (sesja lub klucz POST/GET)
if (!defined('INSIDE_PHP')) {
    header('Content-Type: application/json; charset=utf-8');

    $klucz = $_POST['key'] ?? $_GET['key'] ?? '';
    
    if (!checkAuth()) {
        if (!empty($klucz) && password_verify($klucz, API_JSONCREATE_KEY)) {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['last_activity'] = time();
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Brak autoryzacji lub nieprawidłowy klucz.']);
            exit;
        }
    }
}

$contentDir = __DIR__ . '/content';
$mediaDir   = __DIR__ . '/media';
$outputFile = __DIR__ . '/index.json';

// Pobieranie załączników
function pobierzZalaczniki($rok, $miesiac, $dzien, $mediaDir) {
    $mediaPath = $mediaDir . '/' . $rok . '/' . $miesiac . '/' . $dzien;
    if (!is_dir($mediaPath)) return '';

    $pliki = array_diff(scandir($mediaPath), array('.', '..'));
    if (empty($pliki)) return '';

    $htmlZalacznikow = "\n\n---\n### 📎 Załączniki i Media\n<div class=\"media-attachments\">\n<ul>\n";

    foreach ($pliki as $plik) {
        $ext = strtolower(pathinfo($plik, PATHINFO_EXTENSION));
        // Sanityzacja nazwy pliku w linku
        $bezpiecznyPlik = htmlspecialchars($plik, ENT_QUOTES, 'UTF-8');
        $relSciezka = "media/$rok/$miesiac/$dzien/$bezpiecznyPlik";

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $ikona = '🖼️';
        } elseif (in_array($ext, ['mp4', 'webm', 'ogg'])) {
            $ikona = '🎬';
        } elseif ($ext === 'pdf') {
            $ikona = '📄';
        } else {
            $ikona = '📁';
        }

        $htmlZalacznikow .= "  <li>$ikona <a href=\"$relSciezka\" target=\"_blank\" rel=\"noopener noreferrer\">$bezpiecznyPlik</a></li>\n";
    }

    $htmlZalacznikow .= "</ul>\n</div>";
    return $htmlZalacznikow;
}

// Rekurencyjne szukanie plików .md z pominięciem folderu archive
function pobierzPlikiMarkdown($dirPath, &$arrayOfFiles = array()) {
    if (!is_dir($dirPath)) return $arrayOfFiles;
    $files = array_diff(scandir($dirPath), array('.', '..'));

    foreach ($files as $file) {
        $fullPath = $dirPath . '/' . $file;
        // Ignorujemy katalog archiwum w głównym indeksie aktywnym
        if (basename($fullPath) === 'archive' && $dirPath === __DIR__ . '/content') {
            continue;
        }
        if (is_dir($fullPath)) {
            pobierzPlikiMarkdown($fullPath, $arrayOfFiles);
        } elseif (substr($file, -3) === '.md') {
            $arrayOfFiles[] = $fullPath;
        }
    }
    return $arrayOfFiles;
}

// Parsowanie pliku .md z podstawową sanitizacją HTML
function parsujPlikMarkdown($filePath, $mediaDir) {
    $rawText = file_get_contents($filePath);
    $lines = explode("\n", $rawText);

    $dataWpisu = '';
    $dzisiejszeArtykuly = array();
    $aktualnyArtykul = null;

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if (strpos($trimmed, '# ') === 0 && empty($dataWpisu)) {
            $dataWpisu = trim(substr($trimmed, 2));
        } elseif (strpos($trimmed, '## ') === 0) {
            if ($aktualnyArtykul !== null) {
                $dzisiejszeArtykuly[] = $aktualnyArtykul;
            }

            $tytul = trim(substr($trimmed, 3));
            
            // Bezpieczne kodowanie i generowanie kotwicy
            $slug = mb_strtolower($tytul, 'UTF-8');
            $slug = preg_replace('/[^\w\x{00C0}-\x{017F}]+/u', '-', $slug);
            $kotwica = '#' . trim($slug, '-');

            $aktualnyArtykul = array(
                'data' => $dataWpisu,
                'tytul' => htmlspecialchars($tytul, ENT_QUOTES, 'UTF-8'),
                'kotwica' => $kotwica,
                'tresc' => ''
            );
        } elseif ($aktualnyArtykul !== null) {
            $aktualnyArtykul['tresc'] .= $line . ' ';
        }
    }

    if ($aktualnyArtykul !== null) {
        $dzisiejszeArtykuly[] = $aktualnyArtykul;
    }

    if (!empty($dataWpisu) && count($dzisiejszeArtykuly) > 0) {
        $daty = explode('-', $dataWpisu);
        if (count($daty) === 3) {
            list($rok, $miesiac, $dzien) = $daty;
            $doklejkaMedia = pobierzZalaczniki($rok, $miesiac, $dzien, $mediaDir);
            if (!empty($doklejkaMedia)) {
                $dzisiejszeArtykuly[count($dzisiejszeArtykuly) - 1]['tresc'] .= $doklejkaMedia;
            }
        }
    }

    foreach ($dzisiejszeArtykuly as &$art) {
        $art['tresc'] = trim(preg_replace('/\s+/', ' ', $art['tresc']));
    }

    return $dzisiejszeArtykuly;
}

// Główna funkcja generująca
function generujIndeks($contentDir, $mediaDir, $outputFile) {
    $pliki = pobierzPlikiMarkdown($contentDir);
    $calyIndeks = array();

    foreach ($pliki as $plik) {
        $wpisy = parsujPlikMarkdown($plik, $mediaDir);
        $calyIndeks = array_merge($calyIndeks, $wpisy);
    }

    usort($calyIndeks, function($a, $b) {
        return strcmp($b['data'], $a['data']);
    });

    $json = json_encode($calyIndeks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents($outputFile, $json);

    return count($calyIndeks);
}

if (!defined('INSIDE_PHP')) {
    $liczba = generujIndeks($contentDir, $mediaDir, $outputFile);
    echo json_encode(['status' => 'success', 'message' => "Indeks JSON został pomyślnie wygenerowany! Zaktualizowano $liczba artykułów."]);
}
?>