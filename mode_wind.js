'use strict';

(() => {
  const directions = [
    { key: 'east', label: 'ESTE', dx: 1, dy: 0 },
    { key: 'north', label: 'NORTE', dx: 0, dy: -1 },
    { key: 'west', label: 'OESTE', dx: -1, dy: 0 },
    { key: 'south', label: 'SUR', dx: 0, dy: 1 }
  ];
  const cellKey = (x, y) => `${x},${y}`;
  const parseCell = key => key.split(',').map(Number);
  const center = (state, x, y) => ({ x: x * state.cell + state.cell / 2, y: y * state.cell + state.cell / 2 });
  const zone = { x0: 10, x1: 13, y0: 6, y1: 9 };
  const mode = {
    title: 'Viento cambiante · contener y anticipar',
    description: 'CONTENER Y ANTICIPAR',
    duration: 45,
    controls: 'WASD/flechas o clic para volar. Espacio crea una barrera temporal perpendicular al viento actual o anunciado. R recarga en base.',
    lesson: 'El viento cambia la prioridad. Una barrera útil ahora puede dejar un nuevo corredor abierto al girar.',
    observe: 'El fuego se extiende por celdas; lee la flecha futura y la cuenta regresiva antes de cada giro.',
    strategy: 'Coloca agua entre el frente y la zona protegida. Durante el aviso, cambia la orientación de la barrera.',
    limit: 'Autómata celular, viento y barreras son sintéticos; no representan una predicción ni un incendio real.',
    objectives: [
      ['Lee el frente', 'Las celdas encendidas muestran rutas posibles.'],
      ['Anticipa el giro', 'La flecha y el aviso aparecen cinco segundos antes.'],
      ['Protege el sector', 'Una barrera cuesta agua y dura un tiempo limitado.']
    ],
    create({ grid, drone }) {
      const state = {
        width: grid.columns, height: grid.rows, cell: grid.cell, timeLimit: 45,
        windIndex: 0, nextWindIndex: 1, shiftTimes: [15, 27, 39], shiftIndex: 0,
        warning: false, warningSeen: false, spreadTimer: 0, spreadInterval: .85,
        fires: new Set(), barriers: new Map(), water: 5, maxWater: 7, refills: 1,
        base: { x: 8, y: 13 }, burned: 0, zoneHit: false, changesHandled: 0,
        randomSeed: 71431, feedback: 'El frente avanza hacia la zona protegida.',
        zone, timeScale: 1
      };
      addWave(state, state.windIndex);
      drone.x = center(state, state.base.x, state.base.y).x;
      drone.y = center(state, state.base.x, state.base.y).y;
      return state;
    },
    update(state, dt, elapsed) {
      const nextShift = state.shiftTimes[state.shiftIndex];
      state.warning = Number.isFinite(nextShift) && elapsed >= nextShift - 5 && elapsed < nextShift;
      if (state.warning && !state.warningSeen) {
        state.feedback = `El viento girará a ${directions[state.nextWindIndex].label} en cinco segundos. Reorienta la contención.`;
        state.warningSeen = true;
      }
      if (Number.isFinite(nextShift) && elapsed >= nextShift) {
        state.windIndex = state.nextWindIndex;
        state.shiftIndex++;
        state.nextWindIndex = (state.windIndex + 1) % directions.length;
        state.warning = false;
        state.warningSeen = false;
        state.changesHandled++;
        addWave(state, state.windIndex);
        state.feedback = `Viento ${directions[state.windIndex].label}. El nuevo frente requiere otra orientación.`;
      }
      for (const [key, expires] of state.barriers) if (elapsed >= expires) state.barriers.delete(key);
      state.spreadTimer += dt;
      while (state.spreadTimer >= state.spreadInterval) {
        state.spreadTimer -= state.spreadInterval;
        const result = spread(state, elapsed);
        if (result === 'zone') {
          state.zoneHit = true;
          state.feedback = 'El fuego alcanzó el sector protegido.';
          return { type: 'loss', reason: 'Una celda de fuego entró en la zona protegida.' };
        }
      }
      if (elapsed >= state.timeLimit) return { type: 'win', reason: 'La zona protegida permaneció sin fuego hasta el final.' };
      return null;
    },
    action(state, action, drone, elapsed) {
      if (action === 'drop') {
        if (state.water <= 0) { state.feedback = 'Sin agua. Vuelve a la base para la recarga disponible.'; return; }
        const direction = state.warning ? directions[state.nextWindIndex] : directions[state.windIndex];
        const x = Math.floor(drone.x / state.cell), y = Math.floor(drone.y / state.cell);
        if (direction.dx !== 0) {
          for (let row = 0; row < state.height; row++) state.barriers.set(cellKey(x, row), elapsed + 21);
        } else {
          for (let column = 0; column < state.width; column++) state.barriers.set(cellKey(column, y), elapsed + 21);
        }
        state.water--;
        state.feedback = `Barrera temporal trazada para el viento ${direction.label}. Quedan ${state.water} cargas.`;
      }
      if (action === 'refill') {
        if (distance(drone, center(state, state.base.x, state.base.y)) > 68) { state.feedback = 'Regresa a la base antes de recargar.'; return; }
        if (state.refills <= 0 || state.water === state.maxWater) { state.feedback = 'No quedan recargas o el tanque ya está lleno.'; return; }
        state.refills--;
        state.water = state.maxWater;
        state.feedback = 'Tanque recargado en base. El viaje consume tiempo de misión.';
      }
    },
    hud(state, elapsed) {
      const direction = directions[state.windIndex];
      const nextChange = state.shiftTimes[state.shiftIndex];
      const countdown = Number.isFinite(nextChange) ? `${Math.max(0, Math.ceil(nextChange - elapsed))} s · ${directions[state.nextWindIndex].label}` : 'sin cambio';
      const safe = !state.zoneHit && !Array.from(state.fires).some(key => inZone(state, ...parseCell(key)));
      return [
        ['Viento actual', `${direction.label} ${arrow(direction)}`, false],
        ['Próximo cambio', state.warning ? `AHORA ${countdown}` : countdown, state.warning],
        ['Agua / recargas', `${state.water} / ${state.refills}`, state.water <= 1],
        ['Celdas quemadas', state.burned, false],
        ['Zona protegida', safe ? 'SEGURA' : 'ALCANZADA', !safe]
      ];
    },
    draw(ctx, state, { grid, drone, elapsed }) {
      drawMap(ctx, state, grid, drone, elapsed);
    },
    evaluate(state, outcome) {
      const won = outcome.type === 'win';
      return {
        title: won ? '¡Sector protegido!' : 'El fuego llegó al sector',
        copy: `${outcome.reason || 'La práctica se terminó antes de completar el objetivo.'} Celdas quemadas: ${state.burned}. Cambios de viento atendidos: ${state.changesHandled}. Agua restante: ${state.water}; recargas disponibles: ${state.refills}.`,
        learning: won ? 'La contención funcionó mientras estuvo activa. Una nueva dirección exige observar de nuevo y adaptar la barrera.' : `${state.feedback} Revisa la flecha futura y conserva agua para una barrera posterior.`
      };
    },
    snapshot(state) {
      return { wind: directions[state.windIndex].label, nextWind: directions[state.nextWindIndex].label, warning: state.warning, burned: state.burned, fireCells: state.fires.size, zoneHit: state.zoneHit, water: state.water, refills: state.refills, changes: state.changesHandled };
    }
  };

  function arrow(direction) {
    if (direction.key === 'east') return '→';
    if (direction.key === 'west') return '←';
    if (direction.key === 'north') return '↑';
    return '↓';
  }
  function inZone(state, x, y) { return x >= state.zone.x0 && x <= state.zone.x1 && y >= state.zone.y0 && y <= state.zone.y1; }
  function addWave(state, index) {
    const source = index === 0 ? { x: 1, y: 7 } : index === 1 ? { x: 11, y: 14 } : index === 2 ? { x: 22, y: 7 } : { x: 11, y: 1 };
    for (const offset of [-1, 0, 1]) {
      const x = source.x + (index % 2 ? offset : 0);
      const y = source.y + (index % 2 ? 0 : offset);
      if (x >= 0 && y >= 0 && x < state.width && y < state.height) state.fires.add(cellKey(x, y));
    }
  }
  function random(state) {
    state.randomSeed = (Math.imul(state.randomSeed, 1664525) + 1013904223) >>> 0;
    return state.randomSeed / 4294967296;
  }
  function spread(state, elapsed) {
    const fresh = new Set();
    const wind = directions[state.windIndex];
    const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const key of state.fires) {
      const [x, y] = parseCell(key);
      for (const [dx, dy] of neighbors) {
        const nx = x + dx, ny = y + dy, next = cellKey(nx, ny);
        if (nx < 0 || ny < 0 || nx >= state.width || ny >= state.height || state.fires.has(next) || fresh.has(next)) continue;
        if ((state.barriers.get(next) || 0) > elapsed) continue;
        const downwind = dx === wind.dx && dy === wind.dy;
        const upwind = dx === -wind.dx && dy === -wind.dy;
        const probability = downwind ? .34 : upwind ? .025 : .075;
        if (random(state) >= probability) continue;
        if (inZone(state, nx, ny)) return 'zone';
        fresh.add(next);
      }
    }
    for (const cell of fresh) state.fires.add(cell);
    state.burned += fresh.size;
    return null;
  }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function drawMap(ctx, state, grid, drone, elapsed) {
    ctx.fillStyle = '#17251d'; ctx.fillRect(0, 0, 960, 640);
    for (let y = 0; y < state.height; y++) for (let x = 0; x < state.width; x++) {
      const px = x * grid.cell, py = y * grid.cell;
      ctx.fillStyle = (x + y) % 2 ? '#2b4032' : '#304636'; ctx.fillRect(px, py, grid.cell, grid.cell);
      ctx.strokeStyle = 'rgba(7,18,11,.27)'; ctx.strokeRect(px, py, grid.cell, grid.cell);
    }
    const zoneX = state.zone.x0 * grid.cell, zoneY = state.zone.y0 * grid.cell;
    const zoneW = (state.zone.x1 - state.zone.x0 + 1) * grid.cell, zoneH = (state.zone.y1 - state.zone.y0 + 1) * grid.cell;
    ctx.fillStyle = 'rgba(240,203,120,.1)'; ctx.fillRect(zoneX, zoneY, zoneW, zoneH);
    ctx.strokeStyle = '#f0cb78'; ctx.lineWidth = 3; ctx.strokeRect(zoneX + 2, zoneY + 2, zoneW - 4, zoneH - 4);
    ctx.fillStyle = '#f0cb78'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('SECTOR PROTEGIDO', zoneX + zoneW / 2, zoneY + zoneH / 2 + 4);
    for (const [key, expires] of state.barriers) {
      if (expires <= elapsed) continue;
      const [x, y] = parseCell(key);
      const alpha = .3 + Math.min(.55, (expires - elapsed) / 22);
      ctx.fillStyle = `rgba(94,220,225,${alpha})`;
      ctx.fillRect(x * grid.cell + 2, y * grid.cell + 2, grid.cell - 4, grid.cell - 4);
    }
    for (const key of state.fires) {
      const [x, y] = parseCell(key), cx = x * grid.cell + grid.cell / 2, cy = y * grid.cell + grid.cell / 2;
      const flicker = Math.sin(elapsed * 8 + x * 3 + y) * 2;
      ctx.fillStyle = 'rgba(255,104,62,.2)'; ctx.beginPath(); ctx.arc(cx, cy, 22 + flicker, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff714b'; ctx.beginPath(); ctx.moveTo(cx - 10, cy + 10); ctx.quadraticCurveTo(cx - 12, cy - 4, cx - 2, cy - 13 - flicker); ctx.quadraticCurveTo(cx + 2, cy - 5, cx + 7, cy - 17); ctx.quadraticCurveTo(cx + 15, cy + 1, cx + 9, cy + 10); ctx.fill();
      ctx.fillStyle = '#ffd17c'; ctx.beginPath(); ctx.ellipse(cx + 1, cy + 6, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawBase(ctx, state, grid, elapsed);
    drawWindArrow(ctx, directions[state.windIndex], elapsed);
    if (state.warning) drawFutureWind(ctx, directions[state.nextWindIndex], state.shiftTimes[state.shiftIndex] - elapsed);
    ctx.fillStyle = '#d7e2d4'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.fillText(state.feedback, 14, 21);
    ctx.fillStyle = '#a9b9a7'; ctx.textAlign = 'right'; ctx.fillText(`BARRERA ACTIVA ${[...state.barriers.values()].filter(expires => expires > elapsed).length} celdas`, 944, 21);
  }
  function drawBase(ctx, state, grid, elapsed) {
    const point = center(state, state.base.x, state.base.y);
    ctx.fillStyle = 'rgba(114,204,208,.16)'; ctx.beginPath(); ctx.arc(point.x, point.y, 63 + Math.sin(elapsed * 3) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#72ccd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#72ccd0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('BASE', point.x, point.y + 38);
  }
  function drawWindArrow(ctx, direction, elapsed) {
    const x = 102, y = 78, length = 50;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(direction.dy, direction.dx));
    ctx.strokeStyle = '#d5e0bb'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-length / 2, 0); ctx.lineTo(length / 2, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(length / 2 - 12, -9); ctx.lineTo(length / 2, 0); ctx.lineTo(length / 2 - 12, 9); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#d5e0bb'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText(`VIENTO ${direction.label}`, x, y - 25);
  }
  function drawFutureWind(ctx, direction, seconds) {
    ctx.fillStyle = 'rgba(240,203,120,.95)'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`CAMBIO EN ${Math.max(0, Math.ceil(seconds))} s → ${direction.label} ${arrow(direction)}`, 160, 78);
    ctx.strokeStyle = '#f0cb78'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(165, 92); ctx.lineTo(220, 92); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220, 92); ctx.lineTo(209, 84); ctx.moveTo(220, 92); ctx.lineTo(209, 100); ctx.stroke();
  }

  window.DronModes = window.DronModes || {};
  window.DronModes.wind = mode;
})();
