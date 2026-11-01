(function() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Ustawienie pozycji relative dla sidebara, aby płatki pozycjonowały się w jego obrębie
  sidebar.style.position = 'relative';

  // Tworzenie kontenera na śnieg wewnątrz sidebara
  let snowContainer = document.getElementById('sidebar-snow-container');
  if (!snowContainer) {
    snowContainer = document.createElement('div');
    snowContainer.id = 'sidebar-snow-container';
    snowContainer.style.position = 'absolute';
    snowContainer.style.top = '0';
    snowContainer.style.left = '0';
    snowContainer.style.width = '100%';
    snowContainer.style.height = '100%';
    snowContainer.style.overflow = 'hidden';
    snowContainer.style.pointerEvents = 'none';
    sidebar.appendChild(snowContainer);
  }

  // Generowanie płatków
  const maxFlakes = 25; // Liczba płatków śniegu w sidebarze
  const flakes = [];

  function createFlake() {
    if (snowContainer.children.length >= maxFlakes) return;

    const flake = document.createElement('div');
    flake.classList.add('sidebar-snowflake');
    
    const size = Math.random() * 5 + 3; // Rozmiar od 3px do 8px
    const leftPos = Math.random() * sidebar.clientWidth;
    const duration = Math.random() * 4 + 3; // Czas spadania od 3 do 7 sekund
    const delay = Math.random() * 5;

    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.left = `${leftPos}px`;
    flake.style.animationDuration = `${duration}s`;
    flake.style.animationDelay = `${delay}s`;

    snowContainer.appendChild(flake);

    // Usunięcie płatka po zakończeniu animacji i stworzenie nowego
    setTimeout(() => {
      flake.remove();
      createFlake();
    }, (duration + delay) * 1000);
  }

  // Inicjalizacja startowa płatków
  for (let i = 0; i < maxFlakes; i++) {
    createFlake();
  }
})();