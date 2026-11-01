(function() {
  // 1. Dodanie dynamicznej siatki skanującej w tle
  let grid = document.getElementById('hologram-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'hologram-grid';
    document.body.prepend(grid);
  }

  // 2. Funkcja tworzenia efektu mgły z cząsteczkami
  function createHologramMist(win) {
    const rect = win.getBoundingClientRect();
    const mist = document.createElement('div');
    mist.className = 'holo-mist';
    mist.style.left = (rect.left + rect.width / 2) + 'px';
    mist.style.top = (rect.top + rect.height / 2) + 'px';
    const particles = 20;
    for (let index = 0; index < particles; index++) {
      const particle = document.createElement('i');
      const angle = (Math.PI * 2 * index) / particles + Math.sin(index * 2.31) * 0.38;
      const distance = 75 + ((index * 37) % 118);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance * 0.62;
      particle.style.setProperty('--x', x.toFixed(1) + 'px');
      particle.style.setProperty('--y', y.toFixed(1) + 'px');
      particle.style.setProperty('--size', (10 + ((index * 11) % 26)) + 'px');
      particle.style.setProperty('--delay', ((index % 7) * 24) + 'ms');
      mist.appendChild(particle);
    }
    document.body.appendChild(mist);
    window.setTimeout(() => mist.remove(), 1150);
  }

  // 3. Efekt wybuchu kuli plazmowej 3D wewnątrz otwieranych okienek (np. Edytor / Upload)
  function triggerOrbEffect(win) {
    win.querySelectorAll('.holo-window-orb').forEach(node => node.remove());
    const orb = document.createElement('div');
    orb.className = 'holo-window-orb';
    const sparkCount = 14;
    for (let index = 0; index < sparkCount; index++) {
      const spark = document.createElement('span');
      const angle = (Math.PI * 2 * index) / sparkCount;
      const distance = 72 + ((index * 19) % 58);
      spark.style.setProperty('--x', (Math.cos(angle) * distance).toFixed(1) + 'px');
      spark.style.setProperty('--y', (Math.sin(angle) * distance).toFixed(1) + 'px');
      spark.style.setProperty('--delay', ((index % 5) * 24) + 'ms');
      orb.appendChild(spark);
    }
    win.appendChild(orb);
    createHologramMist(win);
    window.setTimeout(() => orb.remove(), 850);
  }

  // 4. Obserwator otwierania okienek modalnych w FlatArchive
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target.classList.contains('modal') && target.style.display !== 'none') {
          const content = target.querySelector('.modal-content');
          if (content) {
            triggerOrbEffect(content);
          }
        }
      }
    });
  });

  const editorModal = document.getElementById('editor-modal');
  const uploadModal = document.getElementById('upload-modal');

  if (editorModal) observer.observe(editorModal, { attributes: true });
  if (uploadModal) observer.observe(uploadModal, { attributes: true });
})();