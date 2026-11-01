<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$archiveDir = __DIR__ . '/content/archive';
$zarchiwizowaneDaty = [];

if (is_dir($archiveDir)) {
    $lata = array_diff(scandir($archiveDir), ['.', '..']);
    foreach ($lata as $rok) {
        if (!preg_match('/^\d{4}$/', $rok)) continue;
        $rokDir = "$archiveDir/$rok";
        if (is_dir($rokDir)) {
            $miesiace = array_diff(scandir($rokDir), ['.', '..']);
            foreach ($miesiace as $miesiac) {
                if (!preg_match('/^\d{2}$/', $miesiac)) continue;
                $miesiacDir = "$rokDir/$miesiac";
                if (is_dir($miesiacDir)) {
                    $dni = array_diff(scandir($miesiacDir), ['.', '..']);
                    foreach ($dni as $dzien) {
                        if (!preg_match('/^\d{2}$/', $dzien)) continue;
                        $dzienDir = "$miesiacDir/$dzien";
                        $plikMd = "$dzienDir/{$rok}{$miesiac}{$dzien}.md";
                        if (is_dir($dzienDir) && file_exists($plikMd)) {
                            $dataStr = "$rok-$miesiac-$dzien";
                            $tytul = $dataStr;
                            $zawartosc = file_get_contents($plikMd);
                            if (preg_match('/##\s+(.*)/', $zawartosc, $matches)) {
                                $tytul = trim($matches[1]);
                            }

                            $zarchiwizowaneDaty[] = [
                                'data' => $dataStr,
                                'tytul' => htmlspecialchars($tytul, ENT_QUOTES, 'UTF-8')
                            ];
                        }
                    }
                }
            }
        }
    }
}

usort($zarchiwizowaneDaty, function($a, $b) {
    return strcmp($b['data'], $a['data']);
});

echo json_encode($zarchiwizowaneDaty, JSON_UNESCAPED_UNICODE);
?>