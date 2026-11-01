<?php
// Start sesji
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ustawienia autoryzacji
define('API_JSONCREATE_KEY', '$2y$10$/h/eMDxMLcPsO8AQcyaTz.FlZpUmHJdEws.iz0C8JOVdnA1VdPEDC'); // Twoje hasło z configu
define('SESSION_TIMEOUT', 900); // 15 minut nieaktywności (900 sekund)

// Funkcja sprawdzająca czy sesja jest aktywna
function checkAuth() {
    if (isset($_SESSION['last_activity'])) {
        if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
            session_unset();
            session_destroy();
            return false;
        }
        $_SESSION['last_activity'] = time(); // Odświeżamy timer przy akcji
        return true;
    }
    return false;
}
?>