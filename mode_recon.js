'use strict';

(() => {
  const cellKey = (x, y) => `${x},${y}`;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const colors = { ground: '#314735', groundAlt: '#2a3d30', fog: '#111b16', fire: '#ff7350', gold: '#f0cb78', water: '#72ccd0' };
  const mode = {
    title: 'Reconocimiento · explorar y detectar',
    description: 'EXPLORAR Y DETECTAR',
    duration: 60,
    controls: 'WASD/flechas vuelan; clic mueve sobre niebla o marca terreno revelado; M marca; Espacio descarga la práctica; R recarga batería al volver a base.',
      controls: 'WASD/flechas vuelan; clic mueve sobre niebla o marca terreno revelado; M marca; Espacio descarga la práctica; R recupera batería en base.',
    lesson: 'Observa antes de actuar: localiza amenazas con el escáner y administra la batería para volver a la base.',
    observe: 'El círculo de escaneo descubre terreno, focos, la dirección del viento y el punto de entrada.',
    strategy: 'Traza una ruta que descubra varios focos y conserva energía para regresar.',
    limit: 'Niebla, escaneo y focos son didácticos. El mapa es abstracto y no representa el terreno real.',
    objectives: [
      ['Descubre el terreno', 'El escáner revela un radio alrededor del dron.'],
      ['Marca dos focos', 'M marca el foco revelado más cercano; falsa alarma resta.'],
      ['Regresa a base', 'En la base puedes recuperar batería antes de seguir.']
    ],
    create({ grid, drone }) {
      const state = {
        width: grid.columns, height: grid.rows, cell: grid.cell,
        base: { x: 3, y: 13 }, scanRadius: 165, battery: 100, markedCorrect: 0, falseAlarms: 0,
        practiceWater: 1, windFound: false, entryFound: false, feedback: 'Vuela hacia terreno cubierto para escanearlo.',
        explored: new Set(), focuses: [
          { x: 8, y: 4, discovered: false, marked: false },
          { x: 13, y: 8, discovered: false, marked: false },
          { x: 19, y: 3, discovered: false, marked: false }
        ],
        entry: { x: 0, y: 7 }, wind: { x: 20, y: 13, direction: 'NORESTE' },
        lastDrone: { x: drone.x, y: drone.y }, timeLimit: 60
      };
      drone.x = state.base.x * state.cell + state.cell / 2;
      drone.y = state.base.y * state.cell + state.cell / 2;
      scan(state, drone);
      return state;
    },
    onMove(state, moved, dt, drone) {
      if (moved > 0) state.battery = Math.max(0, state.battery - moved / 25);
      const atBase = distance(drone, cellCenter(state, state.base.x, state.base.y)) < 72;
      scan(state, drone);
      if (state.battery <= 0) {
        if (state.markedCorrect >= 2) return;
        if (!atBase) state.feedback = 'Batería agotada lejos de la base.';
      }
    },
    update(state, dt, elapsed, drone) {
      scan(state, drone);
      const atBase = distance(drone, cellCenter(state, state.base.x, state.base.y)) < 72;
      if (state.markedCorrect >= 2) return { type: 'win', reason: 'Se identificó la mayoría de los focos.' };
      if (state.battery <= 0 && !atBase) return { type: 'loss', reason: 'La batería se agotó lejos de la base antes de localizar suficientes focos.' };
      if (elapsed >= state.timeLimit) return { type: 'loss', reason: 'Se terminó el tiempo antes de marcar la mayoría de los focos.' };
      return null;
    },
    action(state, action, drone) {
      if (action === 'mark') markNearest(state, drone);
      if (action === 'drop') {
        if (!state.practiceWater) { state.feedback = 'La descarga de práctica ya fue utilizada.'; return; }
        state.practiceWater = 0;
        state.feedback = 'Descarga de práctica: observa el alcance. No controla los focos de esta experiencia.';
      }
      if (action === 'refill') {
        const atBase = distance(drone, cellCenter(state, state.base.x, state.base.y)) < 72;
        if (!atBase) { state.feedback = 'Acércate a la base para recuperar batería.'; return; }
        const before = state.battery;
        state.battery = Math.min(100, state.battery + 35);
        state.feedback = before === state.battery ? 'Batería completa.' : 'Batería recuperada en la base.';
      }
    },
    pointer(state, point, drone) {
      const x = Math.floor(point.x / state.cell), y = Math.floor(point.y / state.cell);
      if (!inBounds(state, x, y)) return false;
      if (!state.explored.has(cellKey(x, y))) return false;
      const focus = state.focuses.find(item => item.discovered && distance(point, cellCenter(state, item.x, item.y)) < 19);
      if (focus) {
        toggleFocus(state, focus);
        return true;
      }
      return false;
    },
    hud(state, elapsed) {
      const discovered = state.focuses.filter(focus => focus.discovered).length;
      return [
        ['Batería', `${Math.ceil(state.battery)}%`, state.battery < 25],
        ['Mapa explorado', `${Math.round(state.explored.size / (state.width * state.height) * 100)}%`, false],
        ['Marcados / descubiertos', `${state.markedCorrect + state.falseAlarms} / ${discovered}`, false],
        ['Tiempo', formatTime(state.timeLimit - elapsed), elapsed > state.timeLimit - 10]
      ];
    },
    draw(ctx, state, { grid, drone, elapsed }) {
      drawMap(ctx, state, grid, drone, elapsed);
    },
    evaluate(state, outcome) {
      const discovered = state.focuses.filter(focus => focus.discovered).length;
      const won = outcome.type === 'win';
      return {
        title: won ? '¡Reconocimiento completado!' : 'Práctica incompleta',
        copy: `${outcome.reason || 'La batería o el tiempo no alcanzaron para completar el reconocimiento.'} Marcaste ${state.markedCorrect} de 3 focos; ${state.falseAlarms} falsas alarmas; exploraste ${Math.round(state.explored.size / (state.width * state.height) * 100)}% del mapa.`,
        learning: won ? 'Buen reconocimiento: confirma antes de actuar y conserva ruta de regreso.' : `Focos descubiertos: ${discovered}/3. ${state.feedback} Planifica una ruta que escanee y vuelva a la base.`
      };
    },
    snapshot(state) {
      return { battery: Math.round(state.battery), explored: state.explored.size, discovered: state.focuses.filter(focus => focus.discovered).length, marked: state.markedCorrect, falseAlarms: state.falseAlarms, feedback: state.feedback };
    }
  };

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  function inBounds(state, x, y) { return x >= 0 && y >= 0 && x < state.width && y < state.height; }
  function cellCenter(state, x, y) { return { x: x * state.cell + state.cell / 2, y: y * state.cell + state.cell / 2 }; }
  function scan(state, drone) {
    const cx = Math.floor(drone.x / state.cell), cy = Math.floor(drone.y / state.cell);
    const reach = Math.ceil(state.scanRadius / state.cell);
    for (let y = Math.max(0, cy - reach); y <= Math.min(state.height - 1, cy + reach); y++) {
      for (let x = Math.max(0, cx - reach); x <= Math.min(state.width - 1, cx + reach); x++) {
        if (distance(drone, cellCenter(state, x, y)) <= state.scanRadius) state.explored.add(cellKey(x, y));
      }
    }
    for (const focus of state.focuses) {
      if (!focus.discovered && distance(drone, cellCenter(state, focus.x, focus.y)) <= state.scanRadius) {
        focus.discovered = true;
        state.feedback = 'Foco detectado. Pulsa M o haz clic en el símbolo para marcarlo.';
      }
    }
    if (!state.entryFound && distance(drone, cellCenter(state, state.entry.x, state.entry.y)) <= state.scanRadius) {
      state.entryFound = true;
      state.feedback = 'Punto de entrada del frente descubierto.';
    }
    if (!state.windFound && distance(drone, cellCenter(state, state.wind.x, state.wind.y)) <= state.scanRadius) {
      state.windFound = true;
      state.feedback = `Dirección del viento descubierta: ${state.wind.direction}.`;
    }
  }
  function toggleFocus(state, focus) {
    if (focus.marked) {
      focus.marked = false;
      state.markedCorrect--;
      state.feedback = 'Marca retirada. Revisa antes de confirmar.';
    } else {
      focus.marked = true;
      state.markedCorrect++;
      state.feedback = 'Marca correcta: foco confirmado en el mapa.';
    }
  }
  function markNearest(state, drone) {
    const available = state.focuses.filter(focus => focus.discovered && !focus.marked)
      .filter(focus => distance(drone, cellCenter(state, focus.x, focus.y)) <= state.scanRadius)
      .sort((a, b) => distance(drone, cellCenter(state, a.x, a.y)) - distance(drone, cellCenter(state, b.x, b.y)));
    if (!available.length) {
      state.falseAlarms++;
      state.battery = Math.max(0, state.battery - 8);
      state.feedback = 'Falsa alarma: no hay un foco sin marcar en el sector revelado.';
      return;
    }
    toggleFocus(state, available[0]);
  }
  function drawMap(ctx, state, grid, drone, elapsed) {
    const cell = grid.cell;
    ctx.fillStyle = '#17231a'; ctx.fillRect(0, 0, 960, 640);
    for (let y = 0; y < state.height; y++) for (let x = 0; x < state.width; x++) {
      const visible = state.explored.has(cellKey(x, y));
      ctx.fillStyle = visible ? ((x + y) % 2 ? colors.ground : colors.groundAlt) : colors.fog;
      ctx.fillRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = visible ? 'rgba(204,223,185,.12)' : 'rgba(139,160,137,.12)';
      ctx.strokeRect(x * cell, y * cell, cell, cell);
      if (visible && (x * 7 + y * 11) % 13 === 0) {
        ctx.fillStyle = 'rgba(158,183,120,.2)'; ctx.beginPath(); ctx.arc(x * cell + 24, y * cell + 25, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const focus of state.focuses) {
      if (!focus.discovered) continue;
      const center = cellCenter(state, focus.x, focus.y);
      ctx.fillStyle = focus.marked ? colors.gold : colors.fire;
      ctx.beginPath(); ctx.arc(center.x, center.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#142018'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(focus.marked ? '✓' : '!', center.x, center.y + 4);
    }
    if (state.entryFound) {
      const point = cellCenter(state, state.entry.x, state.entry.y);
      ctx.fillStyle = colors.fire; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('ENTRADA', point.x + 42, point.y - 8);
      ctx.beginPath(); ctx.moveTo(point.x + 15, point.y); ctx.lineTo(point.x + 3, point.y); ctx.lineTo(point.x + 10, point.y - 6); ctx.moveTo(point.x + 3, point.y); ctx.lineTo(point.x + 10, point.y + 6); ctx.strokeStyle = colors.fire; ctx.lineWidth = 3; ctx.stroke();
    }
    if (state.windFound) {
      const point = cellCenter(state, state.wind.x, state.wind.y);
      ctx.fillStyle = colors.gold; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(`VIENTO ${state.wind.direction}`, point.x, point.y - 13);
      ctx.beginPath(); ctx.moveTo(point.x - 12, point.y); ctx.lineTo(point.x + 12, point.y); ctx.strokeStyle = colors.gold; ctx.lineWidth = 3; ctx.stroke();
    }
    const base = cellCenter(state, state.base.x, state.base.y);
    ctx.fillStyle = 'rgba(114,204,208,.16)'; ctx.beginPath(); ctx.arc(base.x, base.y, 68, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.water; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(base.x, base.y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = colors.water; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('BASE', base.x, base.y + 38);
    ctx.strokeStyle = 'rgba(238,245,219,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(drone.x, drone.y, state.scanRadius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (state.practiceWater) {
      ctx.beginPath(); ctx.arc(drone.x, drone.y + 4, 45, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(114,204,208,.42)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = '#d9e7ce'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText(state.feedback, 16, 22);
    ctx.fillStyle = '#a8bbab'; ctx.textAlign = 'right'; ctx.fillText(`ESCANEO ${Math.round(state.scanRadius)} m`, 944, 22);
  }

  window.DronModes = window.DronModes || {};
  window.DronModes.recon = mode;
})();
