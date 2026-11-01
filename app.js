// Stan aplikacji
let indeksSzukania = [];
let aktualnieOtwartaData = null;
let trybEdycji = 'add'; // 'add' dla nowego wpisu, 'edit' dla modyfikacji istniejącego

// ==========================================
// 1. OBSŁUGA JĘZYKÓW I SŁOWNIKA (dico.js)
// ==========================================

let aktualnyJezyk = localStorage.getItem('flatarchive_lang') || 'en';

function zmienJezyk(lang) {
  if (typeof TRANSLATIONS === 'undefined' || !TRANSLATIONS[lang]) {
    lang = 'en';
  }
  
  aktualnyJezyk = lang;
  localStorage.setItem('flatarchive_lang', lang);

  // Ustawienie wybranej wartości w rozwijanej liście
  const selectEl = document.getElementById('lang-select');
  if (selectEl) {
    selectEl.value = lang;
  }

  // Tłumaczenie elementów z data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const klucz = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][klucz]) {
      el.innerText = TRANSLATIONS[lang][klucz];
    }
  });

  // Tłumaczenie placeholderów z data-i18n-ph
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const klucz = el.getAttribute('data-i18n-ph');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][klucz]) {
      el.placeholder = TRANSLATIONS[lang][klucz];
    }
  });

  // Odświeżenie drzewka menu (jeśli wczytane)
  if (typeof zbudujMenuZIndeksu === 'function') {
    zbudujMenuZIndeksu();
  }
}

// ==========================================
// 2. INICJALIZACJA APLIKACJI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  zmienMotyw(aktualnyMotyw); // <-- Wczytanie zapisanego motywu
  zmienJezyk(aktualnyJezyk);
  await wczytajIndeks();
  zbudujMenuZIndeksu();
  await wczytajPowitanie();
});

// Pomocnicza funkcja do bezpiecznego parsowania Markdown na HTML
function parsujMarkdown(textMarkdown) {
  const przetworzonyMarkdown = textMarkdown.replace(/^## (.*$)/gim, (match, tytul) => {
    const slug = tytul
      .toLowerCase()
      .trim()
      .replace(/[^\w\u00C0-\u017F]+/g, '-');
    return `<h2 id="${slug}">${tytul}</h2>`;
  });

  const html = marked.parse(przetworzonyMarkdown);
  return typeof html === 'string' ? html : String(html);
}

// 3. Ładowanie indeksu przeszukiwania (index.json)
async function wczytajIndeks() {
  try {
    const response = await fetch('index.json?v=' + Date.now());
    if (response.ok) {
      indeksSzukania = await response.json();
    }
  } catch (e) {
    console.warn('Nie udało się wczytać index.json. Wyszukiwarka niedostępna.');
  }
}

// 4. Automatyczna budowa drzewka menu na podstawie indeksu
function zbudujMenuZIndeksu() {
  const treeContainer = document.getElementById('menu-tree');
  if (!indeksSzukania.length) {
    const brakTekstu = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[aktualnyJezyk] && TRANSLATIONS[aktualnyJezyk].no_index) 
      ? TRANSLATIONS[aktualnyJezyk].no_index 
      : 'Brak indeksu wpisów';
    treeContainer.innerHTML = `<p style="font-size:0.8rem; color:#888;">${brakTekstu}</p>`;
    return;
  }

  const unikalneDaty = [...new Set(indeksSzukania.map(item => item.data))].sort().reverse();
  
  const struktura = {};
  unikalneDaty.forEach(dataStr => {
    const [rok, miesiac, dzien] = dataStr.split('-');
    if (!struktura[rok]) struktura[rok] = {};
    if (!struktura[rok][miesiac]) struktura[rok][miesiac] = [];
    struktura[rok][miesiac].push(dzien);
  });

  let html = '';
  for (const rok in struktura) {
    html += `<details class="tree-year">`;
    html += `  <summary>📁 ${rok}</summary>`;
    
    for (const miesiac in struktura[rok]) {
      const tlumaczenieMiesiecy = TRANSLATIONS[aktualnyJezyk]?.months || TRANSLATIONS['pl']?.months || {};
      const infoMiesiaca = tlumaczenieMiesiecy[miesiac] || { nazwa: `Miesiąc ${miesiac}`, ikonka: '🗓️' };
      
      html += `<details class="tree-month">`;
      html += `  <summary>${infoMiesiaca.ikonka} ${infoMiesiaca.nazwa}</summary>`;
      
      struktura[rok][miesiac].forEach(dzien => {
        const fullDate = `${rok}-${miesiac}-${dzien}`;
        html += `<a href="#" class="tree-day" onclick="otworzDzien('${fullDate}'); return false;">• Dzień ${dzien}</a>`;
      });
      
      html += `</details>`;
    }
    html += `</details>`;
  }
  
  treeContainer.innerHTML = html;
}

// 5. Pobieranie i wyświetlanie pliku .md dla wybranego dnia
async function otworzDzien(dataStr, zArchiwum = false) {
  aktualnieOtwartaData = dataStr;
  const [rok, miesiac, dzien] = dataStr.split('-');
  
  const czyWIndeksie = indeksSzukania.some(item => item.data === dataStr);
  const bazaSciezka = (zArchiwum || !czyWIndeksie) ? `content/archive` : `content`;
  const sciezka = `${bazaSciezka}/${rok}/${miesiac}/${dzien}/${rok}${miesiac}${dzien}.md?v=` + Date.now();
  
  const container = document.getElementById('articles-container');

  try {
    const response = await fetch(sciezka);
    if (!response.ok) throw new Error();
    let textMarkdown = await response.text();

    const wpisyZDnia = indeksSzukania.filter(item => item.data === dataStr);
    let mediaHtml = '';
    for (const wpis of wpisyZDnia) {
      const match = wpis.tresc.match(/<div class="media-attachments">[\s\S]*<\/div>/);
      if (match) {
        mediaHtml = '\n\n---\n### 📎 Załączniki z Media\n' + match[0];
        break;
      }
    }

    const txtZalacznik = TRANSLATIONS[aktualnyJezyk]?.btn_add_attachment || '📎 Dodaj załącznik';
    const txtEdytuj = TRANSLATIONS[aktualnyJezyk]?.btn_edit || '✏️ Edytuj';
    
    // Przycisk edycji generowany TYLKO dla aktywnych wpisów
    const btnEdytujHtml = czyWIndeksie
      ? `<button class="btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" onclick="otworzFormularzEdycji('${dataStr}')">${txtEdytuj}</button>`
      : '';

    const btnArchiwumHtml = czyWIndeksie
      ? `<button class="btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.85rem; background-color: #fef08a; color: #713f12;" onclick="zmienStanArchiwum('archive')">${TRANSLATIONS[aktualnyJezyk]?.btn_archive || '📦 Zarchiwizuj'}</button>`
      : `<button class="btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.85rem; background-color: #bbf7d0; color: #166534;" onclick="zmienStanArchiwum('unarchive')">${TRANSLATIONS[aktualnyJezyk]?.btn_unarchive || '📂 Przywróć'}</button>`;

    const actionBar = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #f4f4f5; padding: 10px 15px; border-radius: 8px; border: 1px solid #e4e4e7;">
        <span style="font-weight: bold; color: #3f3f46;">📅 ${dataStr} ${!czyWIndeksie ? '(Zarchiwizowane)' : ''}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${czyWIndeksie ? `<button class="btn-primary" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" onclick="otworzOknoUploadu()">${txtZalacznik}</button>` : ''}
          ${btnEdytujHtml}
          ${btnArchiwumHtml}
        </div>
      </div>
    `;

    container.innerHTML = actionBar + parsujMarkdown(textMarkdown + mediaHtml);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Błąd: Brak pliku pod ścieżką <code>${sciezka}</code></p>`;
  }
}

// 6. Wczytywanie ekranu powitalnego (welcome.md)
async function wczytajPowitanie() {
  aktualnieOtwartaData = null;
  const container = document.getElementById('articles-container');
  try {
    const response = await fetch('welcome.md');
    if (!response.ok) throw new Error();
    const textMarkdown = await response.text();
    container.innerHTML = parsujMarkdown(textMarkdown);
  } catch (err) {
    container.innerHTML = `<h1>Witaj w Archiwum</h1><p>Wybierz wpis z menu po lewej stronie.</p>`;
  }
}

// 7. Logika Wyszukiwarki
function obslugawyszukiwania(fraza) {
  const resultsDiv = document.getElementById('search-results');
  
  if (!fraza || fraza.trim().length < 2) {
    resultsDiv.style.display = 'none';
    return;
  }

  const query = fraza.toLowerCase();
  const dopasowania = indeksSzukania.filter(item => 
    item.tytul.toLowerCase().includes(query) || 
    item.tresc.toLowerCase().includes(query)
  );

  const noResText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[aktualnyJezyk] && TRANSLATIONS[aktualnyJezyk].no_results)
    ? TRANSLATIONS[aktualnyJezyk].no_results
    : 'Brak wyników';

  if (dopasowania.length === 0) {
    resultsDiv.innerHTML = `<div style="padding: 10px; color: #888; font-size:0.85rem;">${noResText}</div>`;
  } else {
    resultsDiv.innerHTML = dopasowania.map(item => `
      <div class="search-item" onclick="przejdzDoWyniku('${item.data}', '${item.kotwica}')">
        <div class="search-title">${item.tytul}</div>
        <div class="search-date">🗓️ ${item.data}</div>
      </div>
    `).join('');
  }
  
  resultsDiv.style.display = 'block';
}

// 8. Nawigacja prosto do konkretnego artykułu na stronie
async function przejdzDoWyniku(dataStr, kotwica) {
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('search-input').value = '';
  
  await otworzDzien(dataStr);

  if (kotwica) {
    setTimeout(() => {
      const id = kotwica.replace('#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }
}

// 9. Ręczne wywołanie generatora PHP z autoryzacją kluczem
async function uruchomGenerowanieIndeksu() {
  const tajnyKlucz = prompt("Podaj klucz autoryzacyjny do przeliczenia indeksu:");
  if (!tajnyKlucz) return;

  const btn = document.getElementById('btn-reindex');
  const statusDiv = document.getElementById('reindex-status');
  
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.innerText = '⏳ Generowanie...';
  statusDiv.innerText = '';

  try {
    const response = await fetch('generuj-indeks.php?key=' + encodeURIComponent(tajnyKlucz));
    
    if (response.ok) {
      statusDiv.style.color = '#16a34a';
      statusDiv.innerText = '✅ Indeks zaktualizowany!';
      await wczytajIndeks();
      zbudujMenuZIndeksu();
    } else if (response.status === 403) {
      statusDiv.style.color = '#dc2626';
      statusDiv.innerText = '❌ Błędny klucz!';
    } else {
      statusDiv.style.color = '#dc2626';
      statusDiv.innerText = '❌ Błąd serwera PHP';
    }
  } catch (err) {
    statusDiv.style.color = '#dc2626';
    statusDiv.innerText = '❌ Nie udało się połączyć';
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerText = '🔄 Przelicz indeks (JSON)';
    
    setTimeout(() => {
      statusDiv.innerText = '';
    }, 4000);
  }
}

// 10. Moduł dodawania nowego wpisu
function otworzFormularzWpisu() {
  trybEdycji = 'add'; // Ustawiamy tryb na dodawanie nowego wpisu
  const modal = document.getElementById('editor-modal');
  const dateInput = document.getElementById('post-date');
  
  const dzis = new Date().toISOString().split('T')[0];
  dateInput.value = dzis;
  dateInput.disabled = false; // Data jest edytowalna dla nowego wpisu
  
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('form-status').innerText = '';
  
  modal.style.display = 'flex';
}

// Otwieranie formularza w trybie edycji istniejącego wpisu
async function otworzFormularzEdycji(dataStr) {
  trybEdycji = 'edit'; // Ustawiamy tryb na edycję (nadpisywanie)
  const [rok, miesiac, dzien] = dataStr.split('-');
  const sciezka = `content/${rok}/${miesiac}/${dzien}/${rok}${miesiac}${dzien}.md`;

  try {
    const response = await fetch(sciezka);
    if (!response.ok) throw new Error('Nie udało się pobrać treści wpisu.');
    let rawText = await response.text();

    // Wyciągamy tytuł z pierwszego nagłówka ##
    let tytulWpisu = '';
    const matchTytul = rawText.match(/##\s+(.*)/);
    if (matchTytul) {
      tytulWpisu = matchTytul[1].trim();
    }

    // Oczyszczamy treść z nagłówka daty (# RRRR-MM-DD) oraz nagłówka artykułu (## Tytuł)
    let czystaTresc = rawText
      .replace(/^#\s+\d{4}-\d{2}-\d{2}\r?\n?/, '')
      .replace(/##\s+.*\r?\n?/, '')
      .trim();

    const modal = document.getElementById('editor-modal');
    const dateInput = document.getElementById('post-date');
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');

    dateInput.value = dataStr;
    dateInput.disabled = true; // Blokujemy zmianę daty dla istniejącego wpisu
    titleInput.value = tytulWpisu;
    contentInput.value = czystaTresc;
    
    document.getElementById('form-status').innerText = '';
    modal.style.display = 'flex';
  } catch (err) {
    alert('❌ Nie udało się wczytać danych wpisu do edycji.');
  }
}

function zamknijFormularzWpisu() {
  document.getElementById('editor-modal').style.display = 'none';
}

function wstawMarkdown(startTag, endTag = '') {
  const textarea = document.getElementById('post-content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  
  const replacement = startTag + selectedText + endTag;
  textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
  
  textarea.focus();
  textarea.setSelectionRange(start + startTag.length, end + startTag.length);
}

// Zapisywanie wpisu (obsługuje zarówno dodawanie jak i edycję z flagą trybEdycji)
async function zapiszWpis(event) {
  event.preventDefault();
  
  const dataVal = document.getElementById('post-date').value;
  const tytulVal = document.getElementById('post-title').value.trim();
  const trescVal = document.getElementById('post-content').value.trim();
  const statusDiv = document.getElementById('form-status');
  
  let haslo = sessionStorage.getItem('flatarchive_pass');
  if (!haslo) {
    haslo = prompt("Podaj hasło administratora do zapisu wpisu:");
    if (!haslo) return;
  }

  statusDiv.style.color = '#2563eb';
  statusDiv.innerText = '⏳ Zapisywanie...';

  const formData = new FormData();
  formData.append('data', dataVal);
  formData.append('tytul', tytulVal);
  formData.append('tresc', trescVal);
  formData.append('tryb', trybEdycji); // Wysyłamy informację czy to 'add' czy 'edit'
  formData.append('password', haslo);

  try {
    const response = await fetch('zapisz-wpis.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      sessionStorage.setItem('flatarchive_pass', haslo);
      
      statusDiv.style.color = '#16a34a';
      statusDiv.innerText = '✅ Wpis zaktualizowany i zapisany!';

      await wczytajIndeks();
      zbudujMenuZIndeksu();
      await otworzDzien(dataVal);

      setTimeout(() => {
        zamknijFormularzWpisu();
      }, 1000);
    } else {
      statusDiv.style.color = '#dc2626';
      statusDiv.innerText = '❌ ' + (result.message || 'Błąd zapisu');
      if (response.status === 401) {
        sessionStorage.removeItem('flatarchive_pass');
      }
    }
  } catch (err) {
    statusDiv.style.color = '#dc2626';
    statusDiv.innerText = '❌ Błąd połączenia z serwerem.';
  }
}

// 11. Moduł wgrywania załączników
function otworzOknoUploadu() {
  if (!aktualnieOtwartaData) return;
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-status').innerText = '';
  document.getElementById('upload-modal').style.display = 'flex';
}

function zamknijOknoUploadu() {
  document.getElementById('upload-modal').style.display = 'none';
}

async function wyślijZałącznik(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('upload-file-input');
  const statusDiv = document.getElementById('upload-status');

  if (!fileInput.files.length) return;

  let haslo = sessionStorage.getItem('flatarchive_pass');
  if (!haslo) {
    haslo = prompt("Podaj hasło administratora do dodania załącznika:");
    if (!haslo) return;
  }

  statusDiv.style.color = '#2563eb';
  statusDiv.innerText = '⏳ Wgrywanie pliku...';

  const formData = new FormData();
  formData.append('data', aktualnieOtwartaData);
  formData.append('plik', fileInput.files[0]);
  formData.append('password', haslo);

  try {
    const response = await fetch('wgraj-zalacznik.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      sessionStorage.setItem('flatarchive_pass', haslo);
      statusDiv.style.color = '#16a34a';
      statusDiv.innerText = '✅ Plik wgrany!';

      await wczytajIndeks();
      await otworzDzien(aktualnieOtwartaData);

      setTimeout(() => {
        zamknijOknoUploadu();
      }, 1000);
    } else {
      statusDiv.style.color = '#dc2626';
      statusDiv.innerText = '❌ ' + (result.message || 'Błąd uploadu');
      if (response.status === 401) {
        sessionStorage.removeItem('flatarchive_pass');
      }
    }
  } catch (err) {
    statusDiv.style.color = '#dc2626';
    statusDiv.innerText = '❌ Błąd połączenia z serwerem.';
  }
}

// 12. Moduł archiwizowania i dearchiwizowania wpisów
async function zmienStanArchiwum(akcja) {
  if (!aktualnieOtwartaData) return;

  const komunikatPotwierdzenia = akcja === 'archive' 
    ? (TRANSLATIONS[aktualnyJezyk]?.confirm_archive || 'Czy na pewno chcesz zarchiwizować ten wpis?')
    : (TRANSLATIONS[aktualnyJezyk]?.confirm_unarchive || 'Czy na pewno chcesz przywrócić ten wpis?');

  if (!confirm(komunikatPotwierdzenia)) return;

  let haslo = sessionStorage.getItem('flatarchive_pass');
  if (!haslo) {
    haslo = prompt("Podaj hasło administratora:");
    if (!haslo) return;
  }

  const formData = new FormData();
  formData.append('data', aktualnieOtwartaData);
  formData.append('akcja', akcja);
  formData.append('password', haslo);

  try {
    const response = await fetch('archiwizuj.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      sessionStorage.setItem('flatarchive_pass', haslo);
      alert(result.message);

      await wczytajIndeks();
      zbudujMenuZIndeksu();
      await wczytajPowitanie();
    } else {
      alert('❌ ' + (result.message || 'Błąd operacji'));
      if (response.status === 401) {
        sessionStorage.removeItem('flatarchive_pass');
      }
    }
  } catch (err) {
    alert('❌ Błąd połączenia z serwerem.');
  }
}

// 13. Wyświetlanie listy zarchiwizowanych wpisów
async function pokazListeArchiwum() {
  aktualnieOtwartaData = null;
  const container = document.getElementById('articles-container');
  
  const titleText = TRANSLATIONS[aktualnyJezyk]?.archive_title || '📦 Zarchiwizowane wpisy';
  const emptyText = TRANSLATIONS[aktualnyJezyk]?.archive_empty || 'Brak zarchiwizowanych wpisów.';
  const restoreText = TRANSLATIONS[aktualnyJezyk]?.btn_restore || '📂 Przywróć';

  container.innerHTML = `<p class="loading">Ładowanie archiwum...</p>`;

  try {
    const response = await fetch('pobierz-archiwum.php');
    if (!response.ok) throw new Error();
    const archiwum = await response.json();

    let html = `<h1>${titleText}</h1>`;

    if (archiwum.length === 0) {
      html += `<p style="color: #71717a; font-style: italic;">${emptyText}</p>`;
    } else {
      html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
      archiwum.forEach(item => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f4f4f5; padding: 12px 16px; border-radius: 8px; border: 1px solid #e4e4e7;">
            <div>
              <a href="#" onclick="otworzDzien('${item.data}', true); return false;" style="font-weight: 600; color: #2563eb; text-decoration: none; font-size: 1rem;">
                📅 ${item.data} - ${item.tytul}
              </a>
            </div>
            <button class="btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.8rem; background-color: #bbf7d0; color: #166534;" onclick="zmienStanArchiwumZListy('${item.data}')">
              ${restoreText}
            </button>
          </div>
        `;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Nie udało się wczytać listy archiwum.</p>`;
  }
}

// Pomocnicza funkcja do szybkiego przywracania bezpośrednio z listy archiwum
async function zmienStanArchiwumZListy(dataStr) {
  aktualnieOtwartaData = dataStr;
  await zmienStanArchiwum('unarchive');
  await pokazListeArchiwum();
}

// ==========================================
// OBSŁUGA MOTYWÓW (themes/nazwa/nazwa.css i .js)
// ==========================================

let aktualnyMotyw = localStorage.getItem('flatarchive_theme') || 'default';

function zmienMotyw(theme) {
  aktualnyMotyw = theme;
  localStorage.setItem('flatarchive_theme', theme);

  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }

  // === CZYSZCZENIE ELEMENTÓW POPRZEDNIEGO MOTYWU ===
  const oldSnow = document.getElementById('sidebar-snow-container');
  if (oldSnow) oldSnow.remove();

  const oldPumpkins = document.getElementById('sidebar-pumpkin-container');
  if (oldPumpkins) oldPumpkins.remove();

  const oldCorners = document.getElementById('halloween-corners');
  if (oldCorners) oldCorners.remove();

  const oldHoloGrid = document.getElementById('hologram-grid');
if (oldHoloGrid) oldHoloGrid.remove();

  // ===============================================

  // 1. Obsługa pliku CSS motywu
  const themeLink = document.getElementById('theme-stylesheet');
  if (themeLink) {
    if (theme === 'default' || !theme) {
      themeLink.setAttribute('href', '');
    } else {
      themeLink.setAttribute('href', `themes/${theme}/${theme}.css?v=` + Date.now());
    }
  }

  // 2. Obsługa opcjonalnego skryptu JS motywu
  const oldThemeScript = document.getElementById('dynamic-theme-js');
  if (oldThemeScript) {
    oldThemeScript.remove();
  }

  if (theme !== 'default' && theme) {
    const script = document.createElement('script');
    script.id = 'dynamic-theme-js';
    script.src = `themes/${theme}/${theme}.js?v=` + Date.now();
    script.onerror = () => {};
    document.body.appendChild(script);
  }
}