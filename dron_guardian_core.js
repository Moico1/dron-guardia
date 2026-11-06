'use strict';

(() => {
  const canvas = document.querySelector('#world');
  const context = canvas.getContext('2d');
  const grid = { columns: 24, rows: 16, cell: 40 };
  const hud = document.querySelector('#hud');
  const overlay = document.querySelector('#overlay');
  const keyDirections = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
  };
  const debugScale = new URLSearchParams(location.search).get('testScale');
  const timeScale = debugScale ? Math.max(1, Math.min(20, Number(debugScale) || 1)) : 1;
  const input = { keys: new Set(), target: null };
  const game = {
    phase: 'select', modeKey: null, mode: null, state: null,
    elapsed: 0, lastFrame: 0, frameCount: 0, fpsTotal: 0, fpsFrames: 0, fpsStarted: 0, fpsTotalFrames: 0,
    drone: { x: 120, y: 460, speed: 250, angle: -Math.PI / 2 }
  };

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setOverlay(title, copy, actions = 'instructions') {
    setText('#dialog-title', title);
    setText('#dialog-copy', copy);
    document.querySelector('#scenario-choices').hidden = actions !== 'select';
    document.querySelector('#instructions').hidden = true;
    document.querySelector('#instruction-actions').hidden = actions !== 'instructions';
    document.querySelector('#outcome-actions').hidden = actions !== 'outcome';
    document.querySelector('#result-copy').hidden = actions !== 'outcome';
    document.querySelector('#result-learning').hidden = actions !== 'outcome';
    document.querySelector('#overlay').hidden = false;
    game.phase = actions === 'outcome' ? 'outcome' : actions === 'select' ? 'select' : 'instructions';
  }

  function clearInput() {
    input.keys.clear();
    input.target = null;
    game.drone.angle = -Math.PI / 2;
  }

  function selectMode(modeKey) {
    const card = document.querySelector(`[data-mode="${modeKey}"]`);
    if (!card) return;
    clearInput();
    game.modeKey = modeKey;
    game.mode = null;
    game.state = null;
    game.elapsed = 0;
    setText('#dialog-title', card.dataset.title);
    setText('#instruction-goal', card.dataset.goal);
    setText('#instruction-controls', card.dataset.controls);
    setText('#instruction-observe', card.dataset.observe);
    document.querySelector('#scenario-choices').hidden = true;
    document.querySelector('#instructions').hidden = false;
    document.querySelector('#instruction-actions').hidden = false;
    document.querySelector('#outcome-actions').hidden = true;
    document.querySelector('#result-copy').hidden = true;
    overlay.hidden = false;
    game.phase = 'instructions';
  }

  function loadMode(modeKey, callback) {
    if (window.DronModes && window.DronModes[modeKey]) {
      callback(window.DronModes[modeKey]);
      return;
    }
    const script = document.createElement('script');
    script.src = `mode_${modeKey}.js`;
    script.onload = () => callback(window.DronModes && window.DronModes[modeKey]);
    script.onerror = () => setOverlay('No se pudo cargar el modo', 'Comprueba que los archivos del juego se estén sirviendo desde la misma carpeta.', 'select');
    document.head.append(script);
  }

  function beginMode() {
    const modeKey = game.modeKey;
    if (!modeKey) return;
    loadMode(modeKey, mode => {
      if (!mode) {
        setOverlay('Modo no disponible', 'No se encontró la lógica del modo seleccionado.', 'select');
        return;
      }
      clearInput();
      game.mode = mode;
      game.state = mode.create({ grid, drone: game.drone, timeScale });
      game.elapsed = 0;
      game.lastFrame = performance.now();
      game.fpsStarted = game.lastFrame;
      game.fpsTotalFrames = 0;
      game.phase = 'playing';
      overlay.hidden = true;
      hud.hidden = false;
      document.querySelector('#instructions').hidden = true;
      document.querySelector('#finish-mission').disabled = false;
      setText('#mode-title', mode.title);
      setText('#mode-description', mode.description);
      setText('#lesson', mode.lesson);
      setText('#observe', mode.observe);
      setText('#strategy', mode.strategy);
      setText('#limit', mode.limit);
      setText('#controls-description', mode.controls);
      if (mode.objectives) {
        ['one', 'two', 'three'].forEach((name, index) => {
          const item = document.querySelector(`#objective-${name}`);
          item.firstChild.textContent = mode.objectives[index][0];
          item.querySelector('small').textContent = mode.objectives[index][1];
        });
      }
      updateHud();
    });
  }

  function finish(outcome) {
    if (game.phase !== 'playing') return;
    clearInput();
    game.phase = 'outcome';
    const result = game.mode.evaluate(game.state, outcome, game.elapsed);
    setText('#dialog-title', result.title);
    setText('#result-copy', result.copy);
    setText('#result-learning', result.learning);
    document.querySelector('#scenario-choices').hidden = true;
    document.querySelector('#instruction-actions').hidden = true;
    document.querySelector('#outcome-actions').hidden = false;
    document.querySelector('#result-copy').hidden = false;
    document.querySelector('#result-learning').hidden = false;
    overlay.hidden = false;
    document.querySelector('#finish-mission').disabled = true;
  }

  function updateHud() {
    if (!game.mode || !game.state) return;
    const values = game.mode.hud(game.state, game.elapsed);
    hud.replaceChildren();
    for (const [label, value, warning] of values) {
      const metric = document.createElement('div');
      metric.className = 'metric';
      const name = document.createElement('span');
      name.className = 'metric-label';
      name.textContent = label;
      const output = document.createElement('strong');
      output.className = warning ? 'metric-value warn' : 'metric-value';
      output.textContent = String(value);
      metric.append(name, output);
      hud.append(metric);
    }
    setText('#mission-status', game.phase === 'playing' ? 'En juego' : 'Evaluación');
  }

  function moveDrone(dt) {
    const xAxis = Number(input.keys.has('right')) - Number(input.keys.has('left'));
    const yAxis = Number(input.keys.has('down')) - Number(input.keys.has('up'));
    if (xAxis || yAxis) {
      const magnitude = Math.hypot(xAxis, yAxis);
      const dx = xAxis / magnitude;
      const dy = yAxis / magnitude;
      game.drone.x += dx * game.drone.speed * dt;
      game.drone.y += dy * game.drone.speed * dt;
      game.drone.angle = Math.atan2(dy, dx);
      input.target = null;
    } else if (input.target) {
      const dx = input.target.x - game.drone.x;
      const dy = input.target.y - game.drone.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 4) input.target = null;
      else {
        const step = Math.min(distance, game.drone.speed * dt);
        game.drone.x += dx / distance * step;
        game.drone.y += dy / distance * step;
        game.drone.angle = Math.atan2(dy, dx);
      }
    }
    game.drone.x = Math.max(14, Math.min(canvas.width - 14, game.drone.x));
    game.drone.y = Math.max(24, Math.min(canvas.height - 18, game.drone.y));
  }

  function drawDrone() {
    const { x, y, angle } = game.drone;
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.fillStyle = 'rgba(0,0,0,.32)';
    context.beginPath(); context.ellipse(3, 10, 22, 9, 0, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#d7e4ca'; context.lineWidth = 3;
    for (const side of [-1, 1]) {
      context.beginPath(); context.moveTo(-5, side * 4); context.lineTo(-18, side * 12); context.moveTo(5, side * 4); context.lineTo(18, side * 12); context.stroke();
      context.beginPath(); context.moveTo(-23, side * 12); context.lineTo(-13, side * 12); context.moveTo(13, side * 12); context.lineTo(23, side * 12); context.stroke();
    }
    context.fillStyle = '#24382e'; context.beginPath(); context.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#9bce83'; context.beginPath(); context.arc(0, 0, 3, 0, Math.PI * 2); context.fill();
    context.restore();
  }

  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - game.lastFrame) / 1000));
    game.lastFrame = now;
    if (game.phase === 'playing') {
      game.elapsed += dt * timeScale;
      const previousX = game.drone.x;
      const previousY = game.drone.y;
      moveDrone(dt * timeScale);
      const moved = Math.hypot(game.drone.x - previousX, game.drone.y - previousY);
      if (game.mode.onMove) game.mode.onMove(game.state, moved, dt * timeScale, game.drone);
      const outcome = game.mode.update(game.state, dt * timeScale, game.elapsed, game.drone);
      if (outcome) finish(outcome);
      updateHud();
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (game.mode && game.state) game.mode.draw(context, game.state, { grid, drone: game.drone, elapsed: game.elapsed });
    else drawSelectionMap(context, now);
    if (game.phase === 'playing' && game.mode && game.mode.showDrone !== false) drawDrone();
    game.frameCount++;
    game.fpsFrames++;
    game.fpsTotalFrames++;
    if (now - game.fpsTotal >= 1000) {
      game.lastFps = game.fpsFrames;
      game.fpsFrames = 0;
      game.fpsTotal = now;
    }
    requestAnimationFrame(frame);
  }

  function drawSelectionMap(ctx, now) {
    const cell = grid.cell;
    ctx.fillStyle = '#24352b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.columns; x++) {
      const px = x * cell, py = y * cell;
      ctx.fillStyle = (x + y) % 2 ? '#2b4032' : '#304536';
      ctx.fillRect(px, py, cell, cell);
      ctx.strokeStyle = 'rgba(8,18,11,.24)'; ctx.strokeRect(px, py, cell, cell);
    }
    ctx.fillStyle = '#79d0d1'; ctx.beginPath(); ctx.arc(120, 460, 13 + Math.sin(now / 300) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e2d59b'; ctx.font = '12px monospace'; ctx.fillText('BASE', 101, 492);
  }

  function sendAction(action) {
    if (game.phase === 'playing' && game.mode && game.mode.action) game.mode.action(game.state, action, game.drone, game.elapsed);
  }

  document.querySelectorAll('[data-mode]').forEach(card => card.addEventListener('click', () => selectMode(card.dataset.mode)));
  document.querySelector('#start-mode').addEventListener('click', beginMode);
  document.querySelector('#change-mode').addEventListener('click', () => {
    game.modeKey = null;
    document.querySelector('#instructions').hidden = true;
    document.querySelector('#scenario-choices').hidden = false;
    document.querySelector('#instruction-actions').hidden = true;
    game.phase = 'select';
  });
  document.querySelector('#finish-mission').addEventListener('click', () => finish({ type: 'manual', reason: 'El piloto terminó la experiencia antes del límite.' }));
  document.querySelector('#drop').addEventListener('click', () => sendAction('drop'));
  document.querySelector('#refill').addEventListener('click', () => sendAction('refill'));
  document.querySelector('#restart').addEventListener('click', () => beginMode());
  document.querySelector('#back-modes').addEventListener('click', () => {
    clearInput(); game.mode = null; game.state = null; game.modeKey = null; game.elapsed = 0;
    hud.hidden = true; document.querySelector('#finish-mission').disabled = true;
    setOverlay('Elige una experiencia', 'Mapa abstracto y reglas sintéticas. No es una guía operativa ni predice incendios reales.', 'select');
  });
  document.querySelector('#fullscreen-toggle').addEventListener('click', async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.app').requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => setText('#fullscreen-toggle', document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa'));
  window.addEventListener('keydown', event => {
    const direction = keyDirections[event.code];
    if (direction && game.phase === 'playing') {
      event.preventDefault();
      input.keys.add(direction);
    }
    if (event.code === 'Space') { event.preventDefault(); sendAction('drop'); }
    if (event.code === 'KeyR') sendAction('refill');
    if (event.code === 'KeyM') sendAction('mark');
  });
  window.addEventListener('keyup', event => {
    const direction = keyDirections[event.code];
    if (direction) input.keys.delete(direction);
  });
  window.addEventListener('blur', clearInput);
  document.querySelectorAll('.touch-controls button').forEach(button => {
    const direction = button.dataset.key;
    button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); input.keys.add(direction); });
    const release = () => input.keys.delete(direction);
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  canvas.addEventListener('pointerdown', event => {
    if (game.phase !== 'playing') return;
    const bounds = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) / bounds.width * canvas.width, y: (event.clientY - bounds.top) / bounds.height * canvas.height };
    if (!game.mode.pointer || !game.mode.pointer(game.state, point, game.drone, event)) input.target = point;
  });

  window.DronGuardian = {
    getSnapshot() {
      return {
        phase: game.phase,
        mode: game.modeKey,
        elapsed: game.elapsed,
        fps: game.lastFps || 0,
        fpsAverage: game.fpsStarted ? game.fpsTotalFrames / Math.max(.001, (performance.now() - game.fpsStarted) / 1000) : 0,
        hud: [...hud.querySelectorAll('.metric')].map(metric => metric.textContent),
        result: document.querySelector('#result-copy').textContent,
        state: game.mode && game.mode.snapshot ? game.mode.snapshot(game.state) : null
      };
    },
    testScale: timeScale
  };
  hud.hidden = true;
  setOverlay('Elige una experiencia', 'Mapa abstracto y reglas sintéticas. No es una guía operativa ni predice incendios reales.', 'select');
  game.lastFrame = performance.now();
  requestAnimationFrame(frame);
})();
