const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const MEDIA_DIR = path.join(__dirname, 'media');
const OUTPUT_FILE = path.join(__dirname, 'index.json');

function pobierzZalaczniki(rok, miesiac, dzien) {
  const mediaPath = path.join(MEDIA_DIR, rok, miesiac, dzien);
  if (!fs.existsSync(mediaPath)) return '';

  const pliki = fs.readdirSync(mediaPath);
  if (pliki.length === 0) return '';

  let htmlZalacznikow = '\n\n---\n### 📎 Załączniki i Media\n<div class="media-attachments">\n<ul>\n';

  pliki.forEach(plik => {
    const ext = path.extname(plik).toLowerCase();
    const relSciezka = `media/${rok}/${miesiac}/${dzien}/${plik}`;

    let ikona = '📁';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      ikona = '🖼️';
    } else if (['.mp4', '.webm', '.ogg'].includes(ext)) {
      ikona = '🎬';
    } else if (ext === '.pdf') {
      ikona = '📄';
    }

    htmlZalacznikow += `  <li>${ikona} <a href="${relSciezka}" target="_blank" rel="noopener noreferrer">${plik}</a></li>\n`;
  });

  htmlZalacznikow += '</ul>\n</div>';
  return htmlZalacznikow;
}

function pobierzPlikiMarkdown(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    // Pomijamy katalog archiwum
    if (file === 'archive' && dirPath === CONTENT_DIR) return;

    if (fs.statSync(fullPath).isDirectory()) {
      pobierzPlikiMarkdown(fullPath, arrayOfFiles);
    } else if (file.endsWith('.md')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function parsujPlikMarkdown(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const lines = rawText.split('\n');

  let dataWpisu = '';
  let dzisiejszeArtykuly = [];
  let aktualnyArtykul = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') && !dataWpisu) {
      dataWpisu = trimmed.replace('# ', '').trim();
    } else if (trimmed.startsWith('## ')) {
      if (aktualnyArtykul) {
        dzisiejszeArtykuly.push(aktualnyArtykul);
      }

      const tytul = trimmed.replace('## ', '').trim();
      const kotwica = '#' + tytul.toLowerCase().replace(/[^\w\u0400-\u04FF]+/g, '-');

      aktualnyArtykul = {
        data: dataWpisu,
        tytul: tytul,
        kotwica: kotwica,
        tresc: ''
      };
    } else if (aktualnyArtykul) {
      aktualnyArtykul.tresc += line + ' ';
    }
  });

  if (aktualnyArtykul) {
    dzisiejszeArtykuly.push(aktualnyArtykul);
  }

  if (dataWpisu && dzisiejszeArtykuly.length > 0) {
    const [rok, miesiac, dzien] = dataWpisu.split('-');
    const doklejkaMedia = pobierzZalaczniki(rok, miesiac, dzien);
    if (doklejkaMedia) {
      dzisiejszeArtykuly[dzisiejszeArtykuly.length - 1].tresc += doklejkaMedia;
    }
  }

  return dzisiejszeArtykuly.map(art => ({
    ...art,
    tresc: art.tresc.replace(/\s+/g, ' ').trim()
  }));
}

function generujIndeks() {
  console.log('Skanowanie katalogu content (z pominięciem archive) oraz media...');
  const pliki = pobierzPlikiMarkdown(CONTENT_DIR);
  let calyIndeks = [];

  pliki.forEach(plik => {
    const wpisy = parsujPlikMarkdown(plik);
    calyIndeks = calyIndeks.concat(wpisy);
  });

  calyIndeks.sort((a, b) => b.data.localeCompare(a.data));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(calyIndeks, null, 2), 'utf-8');
  console.log(`✅ Indeks wygenerowany pomyślnie! Zaktualizowano ${calyIndeks.length} artykułów.`);
}

if (require.main === module) {
  generujIndeks();
}