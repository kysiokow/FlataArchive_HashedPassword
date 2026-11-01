(function() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.style.position = 'relative';

  // 1. Kontener na spadające dynie w sidebarze
  let pumpkinContainer = document.getElementById('sidebar-pumpkin-container');
  if (!pumpkinContainer) {
    pumpkinContainer = document.createElement('div');
    pumpkinContainer.id = 'sidebar-pumpkin-container';
    pumpkinContainer.style.position = 'absolute';
    pumpkinContainer.style.top = '0';
    pumpkinContainer.style.left = '0';
    pumpkinContainer.style.width = '100%';
    pumpkinContainer.style.height = '100%';
    pumpkinContainer.style.overflow = 'hidden';
    pumpkinContainer.style.pointerEvents = 'none';
    sidebar.appendChild(pumpkinContainer);
  }

  const maxPumpkins = 15; // Liczba dyniek w sidebarze

  function createPumpkin() {
    if (pumpkinContainer.children.length >= maxPumpkins) return;

    const pumpkin = document.createElement('div');
    pumpkin.classList.add('sidebar-pumpkin');
    pumpkin.innerHTML = '🎃'; // Mała dynia
    
    const size = Math.random() * 8 + 14; // Rozmiar od 14px do 22px
    const leftPos = Math.random() * (sidebar.clientWidth - 20);
    const duration = Math.random() * 5 + 4; // Czas spadania od 4 do 9 sekund
    const delay = Math.random() * 5;

    pumpkin.style.fontSize = `${size}px`;
    pumpkin.style.left = `${leftPos}px`;
    pumpkin.style.animationDuration = `${duration}s`;
    pumpkin.style.animationDelay = `${delay}s`;

    pumpkinContainer.appendChild(pumpkin);

    setTimeout(() => {
      pumpkin.remove();
      createPumpkin();
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < maxPumpkins; i++) {
    createPumpkin();
  }

  // 2. Dodanie migoczących świeczek/dyń w dolnych rogach ekranu
  let candlesContainer = document.getElementById('halloween-corners');
  if (!candlesContainer) {
    candlesContainer = document.createElement('div');
    candlesContainer.id = 'halloween-corners';
    
    // Lewy róg (świeczka)
    const leftCandle = document.createElement('div');
    leftCandle.className = 'halloween-corner-candle left';
    leftCandle.innerHTML = '🕯️';
    candlesContainer.appendChild(leftCandle);

    // Prawy róg (upiorna dynia)
    const rightCandle = document.createElement('div');
    rightCandle.className = 'halloween-corner-candle right';
    rightCandle.innerHTML = '🎃';
    candlesContainer.appendChild(rightCandle);

    document.body.appendChild(candlesContainer);
  }
})();