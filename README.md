# FlatArchive

**FlatArchive** is a lightweight, file-based content management and archiving system built with PHP, HTML, CSS, and JavaScript. Designed with a flat-file architecture, it stores entries and structure cleanly without requiring a traditional SQL database.

---

## 🚀 Key Features

* **Flat-File Architecture:** Fast, portable, and easy to deploy on virtually any PHP-enabled server without complex database setups.
* **JSON-Based Indexing:** Efficiently manages articles, titles, publication dates, anchor links, and content blocks in a single structured index file (`index.json`).
* **Media & File Attachments:** Supports structured file linking and media attachments directly within archived entries.
* **Rich Text Support:** Full support for HTML rendering, Markdown formatting, embedded links, and code blocks.
* **Pre-configured Security:** Comes out-of-the-box with a secure pre-hashed password for administrative or editor access.

---

## 🔐 Default Credentials & Configuration

This repository includes a default administrative configuration:

* **Default Password:** `password` *(pre-hashed in the authentication layer)*

> ⚠️ **Important Security Note:** Make sure to change the hashed password in your configuration file before deploying this application to a public production server.

---

## 📂 Data Structure Example (`index.json`)

The archive index maintains post metadata and content snippets structured like this:

```json
[
    {
        "data": "2026-10-09",
        "tytul": "Sample Post Title",
        "kotwica": "#sample-post-title",
        "tresc": "Content or HTML/Markdown formatted text..."
    }
]
```

---

## 🛠️ Quick Start

### Prerequisites
* Web server running **PHP 7.4+** or **PHP 8.x** (Apache, Nginx, or built-in PHP CLI server)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/FlatArchive.git
   cd FlatArchive
   ```

2. **Set up permissions:**
   Ensure the server process has read/write permissions for data directories and `index.json`:
   ```bash
   chmod -R 775 data media index.json
   ```

3. **Run locally (Optional):**
   You can quickly test the application using PHP's built-in development server:
   ```bash
   php -S localhost:8000
   ```
   Then open `http://localhost:8000` in your web browser.

4. **Log in:**
   Use the default password `password` to access administrative settings.


   # FlatArchive

**FlatArchive** is a lightweight, file-based content management and archiving system built with PHP, HTML, CSS, and JavaScript. Designed with a flat-file architecture, it stores entries and structure cleanly without requiring a traditional SQL database.

## 🚀 Key Features
* **Flat-File Architecture:** Fast, portable, and easy to deploy on virtually any PHP-enabled server.
* **JSON-Based Indexing:** Efficiently manages articles, titles, dates, anchors, and content blocks (as seen in `index.json`)[cite: 1].
* **Media & Attachments Support:** Seamlessly embeds file links and media attachments directly into entries[cite: 1].
* **Markdown & HTML Compatibility:** Renders formatted text, links, and code snippets natively.
* **Pre-configured Security:** This version comes out-of-the-box with a pre-hashed password for administrative access (configured for the default password `"password"`). You can easily set your own custom hashed password in `config.php`.

## 🔒 Custom Password Setup
1. Use the provided `hash.php` script to generate a secure hash for your custom password (remeber to delete hash.php after all):
   ```php
   <?php
   $mojeHaslo = "password";
   echo password_hash($mojeHaslo, PASSWORD_DEFAULT);
   ?>
