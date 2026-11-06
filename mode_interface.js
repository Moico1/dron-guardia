'use strict';

(() => {
  const cellKey = (x, y) => `${x},${y}`;
  const point = (state, x, y) => ({ x: x * state.cell + state.cell / 2, y: y * state.cell + state.cell / 2 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const housesTemplate = [
    { id: 'Casa A', x: 16, y: 5, threatAt: 7 },
    { id: 'Casa B', x: 19, y: 8, threatAt: 17 },
    { id: 'Casa C', x: 16, y: 10, threatAt: 27 }
  ];
  const roadCells = new Set();
  for (let x = 3; x <= 13; x++) roadCells.add(cellKey(x, 13));
  for (let y = 8; y <= 13; y++) roadCells.add(cellKey(13, y));
  for (let x = 13; x <= 17; x++) roadCells.add(cellKey(x, 8));

  const mode = {
    title: 'Interfaz comunidad-monte · priorizar y proteger',
    description: 'PRIORIZAR Y PROTEGER',
    duration: 50,
    controls: 'WASD/flechas o clic para volar. Espacio crea una zona de enfriamiento alrededor del dron. R hace la única recarga en base.',
    lesson: 'Las viviendas y el acceso son objetivos distintos. Prioriza personas y rutas por encima del tamaño visual del foco.',
    observe: 'Lee el estado de cada casa, los frentes laterales y el aviso del camino amenazado.',
    strategy: 'Protege dos viviendas, atiende el camino y conserva una carga para volver o responder al frente secundario.',
    limit: 'Casas, camino y amenazas son símbolos abstractos; no representan una comunidad real ni sus protocolos.',
    objectives: [
      ['Protege viviendas', 'Dos de las tres deben acabar seguras.'],
      ['Mantén el camino abierto', 'Una amenaza distante puede cortar el acceso.'],
      ['Administra el agua', 'Hay tres cargas y una sola recarga en base.']
    ],
    create({ grid, drone }) {
      const state = {
        width: grid.columns, height: grid.rows, cell: grid.cell, timeLimit: 50,
        base: { x: 3, y: 13 }, houses: housesTemplate.map(house => ({ ...house, status: 'segura', deadline: null, resolved: false })),
        fires: new Set(['1,6', '1,7', '1,8', '2,9']), burned: new Set(['1,6', '1,7', '1,8', '2,9']),
        spreadTimer: 0, spreadInterval: 1.15, randomSeed: 41711,
        water: 3, maxWater: 3, refills: 1,
        protection: [],
        road: { status: 'abierto', open: true, threatPoint: { x: 9, y: 13 }, deadline: null, resolved: false },
        secondaryEvent: false, roadEvent: false, remoteFire: null,
        feedback: 'El frente occidental avanza; observa las viviendas y conserva agua.',
        roadCells, timeScale: 1
      };
      drone.x = point(state, state.base.x, state.base.y).x;
      drone.y = point(state, state.base.x, state.base.y).y;
      return state;
    },
    update(state, dt, elapsed, drone) {
      updateHouseThreats(state, elapsed);
      if (!state.secondaryEvent && elapsed >= 25) {
        state.secondaryEvent = true;
        state.remoteFire = { x: 21, y: 1 };
        state.fires.add(cellKey(21, 1)); state.burned.add(cellKey(21, 1));
        state.feedback = 'Frente secundario desde el norte; un foco distante amenaza el camino.';
      }
      if (!state.roadEvent && elapsed >= 25) {
        state.roadEvent = true;
        const roadPoint = point(state, state.road.threatPoint.x, state.road.threatPoint.y);
        if (isProtected(state, roadPoint, elapsed)) {
          state.road.resolved = true;
        } else {
          state.road.status = 'amenazado';
          state.road.deadline = elapsed + 20;
          state.feedback = 'Camino amenazado por un foco aislado. La ruta debe seguir abierta al volver.';
        }
      }
      expireProtection(state, elapsed);
      updateDeadlines(state, elapsed, drone);
      if (state.houses.filter(house => house.status === 'afectada').length >= 2) {
        return { type: 'loss', reason: 'La mayoría de las viviendas resultó afectada.' };
      }
      if (!state.road.open && distance(drone, point(state, state.base.x, state.base.y)) > 72) {
        return { type: 'loss', reason: 'El camino se cortó mientras el dron estaba fuera de la base.' };
      }
      state.spreadTimer += dt;
      while (state.spreadTimer >= state.spreadInterval) {
        state.spreadTimer -= state.spreadInterval;
        const outcome = spread(state, elapsed);
        if (outcome === 'road') {
          state.road.open = false;
          state.road.status = 'cortado';
          state.feedback = 'El fuego cortó el camino. Vuelve a base o enfría el tramo.';
          if (distance(drone, point(state, state.base.x, state.base.y)) > 72) return { type: 'loss', reason: 'El camino se cortó con el dron fuera de la base.' };
        }
      }
      if (elapsed >= state.timeLimit) {
        const safeCount = state.houses.filter(house => house.status === 'segura').length;
        if (safeCount >= 2 && state.road.open) return { type: 'win', reason: 'Al menos dos viviendas siguieron seguras y el camino quedó abierto.' };
        return { type: 'loss', reason: 'La partida terminó sin conservar dos viviendas seguras y el camino abierto.' };
      }
      return null;
    },
    action(state, action, drone, elapsed) {
      if (action === 'drop') {
        if (state.water <= 0) { state.feedback = 'Sin agua. Vuelve a base para usar la recarga disponible.'; return; }
        state.water--;
        const shield = { x: drone.x, y: drone.y, radius: 126, expires: elapsed + 8 };
        state.protection.push(shield);
        for (const key of [...state.fires]) {
          const [x, y] = key.split(',').map(Number);
          if (distance(drone, point(state, x, y)) <= shield.radius) state.fires.delete(key);
        }
        for (const house of state.houses) {
          if (house.status === 'amenazada' && distance(drone, point(state, house.x, house.y)) <= shield.radius) {
            house.status = 'segura'; house.deadline = null; house.resolved = true;
            state.feedback = `${house.id} protegida. Reevalúa las amenazas restantes.`;
          }
        }
        if (state.road.status !== 'abierto' && distance(drone, point(state, state.road.threatPoint.x, state.road.threatPoint.y)) <= shield.radius + 22) {
          state.road.status = 'abierto'; state.road.open = true; state.road.deadline = null; state.road.resolved = true;
          state.feedback = 'Camino protegido y abierto. Conserva una ruta de retirada.';
        } else if (state.feedback.indexOf('protegida') === -1) {
          state.feedback = 'Zona enfriada. Revisa las casas y el camino dentro del radio de protección.';
        }
      }
      if (action === 'refill') {
        if (distance(drone, point(state, state.base.x, state.base.y)) > 72) { state.feedback = 'Acércate a la base para la única recarga.'; return; }
        if (state.refills <= 0 || state.water === state.maxWater) { state.feedback = 'No quedan recargas o el tanque está lleno.'; return; }
        state.refills--;
        state.water = state.maxWater;
        state.feedback = 'Tanque recargado. El camino de regreso sigue siendo parte de la misión.';
      }
    },
    pointer(state, pointer) {
      const x = Math.floor(pointer.x / state.cell), y = Math.floor(pointer.y / state.cell);
      const house = state.houses.find(item => Math.abs(item.x - x) <= 1 && Math.abs(item.y - y) <= 1);
      if (house) {
        state.feedback = `${house.id}: ${house.status}${house.deadline ? ` · amenaza en ${Math.max(0, Math.ceil(house.deadline))} s` : ''}. Vuela cerca para protegerla.`;
        return false;
      }
      if (state.roadCells.has(cellKey(x, y))) state.feedback = 'Ruta principal seleccionada; vuela cerca y usa agua para mantenerla abierta.';
      return false;
    },
    hud(state, elapsed) {
      const safe = state.houses.filter(house => house.status === 'segura').length;
      const threatened = state.houses.filter(house => house.status === 'amenazada').length;
      const next = state.houses.filter(house => house.status === 'amenazada').map(house => `${house.id} ${Math.max(0, Math.ceil(house.deadline - elapsed))}s`);
      if (state.road.status !== 'abierto') next.push(`Camino ${Math.max(0, Math.ceil(state.road.deadline - elapsed))}s`);
      if (state.secondaryEvent && !state.houses[2].resolved && state.houses[2].status === 'segura') next.push('Frente secundario');
      return [
        ['Viviendas', `${safe} seguras · ${threatened} amenazadas`, threatened > 0],
        ['Camino', state.road.status.toUpperCase(), !state.road.open],
        ['Agua / recargas', `${state.water} / ${state.refills}`, state.water <= 1],
        ['Amenazas próximas', next.length ? next.join(' · ') : 'Sin alerta inmediata', next.length > 0],
        ['Tiempo', formatTime(state.timeLimit - elapsed), elapsed > 38]
      ];
    },
    draw(ctx, state, { grid, drone, elapsed }) {
      drawMap(ctx, state, grid, drone, elapsed);
    },
    evaluate(state, outcome) {
      const safe = state.houses.filter(house => house.status === 'segura').length;
      const affected = state.houses.filter(house => house.status === 'afectada').length;
      const won = outcome.type === 'win';
      return {
        title: won ? '¡Comunidad protegida!' : 'La prioridad llegó tarde',
        copy: `${outcome.reason || 'El piloto terminó la práctica.'} Viviendas seguras: ${safe}/3; afectadas: ${affected}/3. Camino: ${state.road.open ? 'abierto' : 'cortado'}. Agua final: ${state.water}; recargas restantes: ${state.refills}.`,
        learning: won ? 'Priorizaste al menos dos viviendas y preservaste la ruta. No toda amenaza puede atenderse; mantener reserva y retirada forma parte de la decisión.' : `${state.feedback} En esta práctica, proteger a las personas y mantener el acceso importa más que perseguir el foco visualmente mayor.`
      };
    },
    snapshot(state) {
      return { houses: state.houses.map(house => ({ id: house.id, status: house.status, deadline: house.deadline, resolved: house.resolved })), road: { ...state.road }, water: state.water, refills: state.refills, secondaryEvent: state.secondaryEvent, fires: state.fires.size, feedback: state.feedback };
    }
  };

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  function updateHouseThreats(state, elapsed) {
    for (const house of state.houses) {
      if (house.status === 'segura' && !house.resolved && elapsed >= house.threatAt) {
        if (isProtected(state, point(state, house.x, house.y), elapsed)) {
          house.resolved = true;
          state.feedback = `${house.id} quedó cubierta por una zona de enfriamiento.`;
        } else {
          house.status = 'amenazada'; house.deadline = elapsed + 16;
          state.feedback = `${house.id} amenazada. Vuela al sector y usa agua antes de que se agote el margen.`;
        }
      }
    }
  }
  function updateDeadlines(state, elapsed) {
    for (const house of state.houses) {
      if (house.status === 'amenazada' && elapsed >= house.deadline) {
        house.status = 'afectada'; house.deadline = null;
        state.feedback = `${house.id} resultó afectada. Protege las restantes y conserva acceso.`;
      }
    }
    if (state.road.status === 'amenazado' && elapsed >= state.road.deadline) {
      state.road.open = false; state.road.status = 'cortado'; state.road.deadline = null;
      state.feedback = 'El camino se cortó por el foco aislado.';
    }
  }
  function expireProtection(state, elapsed) {
    state.protection = state.protection.filter(shield => shield.expires > elapsed);
  }
  function isProtected(state, location, elapsed) {
    return state.protection.some(shield => shield.expires > elapsed && distance(shield, location) <= shield.radius);
  }
  function random(state) {
    state.randomSeed = (Math.imul(state.randomSeed, 1103515245) + 12345) >>> 0;
    return state.randomSeed / 4294967296;
  }
  function spread(state) {
    const fresh = new Set();
    for (const key of state.fires) {
      const [x, y] = key.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy, next = cellKey(nx, ny);
        if (nx < 0 || ny < 0 || nx >= state.width || ny >= state.height || state.fires.has(next) || fresh.has(next)) continue;
        if (state.protection.some(shield => distance(shield, point(state, nx, ny)) <= shield.radius)) continue;
        const chance = dx === 1 ? .28 : .09;
        if (random(state) >= chance) continue;
        fresh.add(next);
      }
    }
    for (const key of fresh) {
      state.fires.add(key); state.burned.add(key);
    }
    return null;
  }
  function drawMap(ctx, state, grid, drone, elapsed) {
    ctx.fillStyle = '#1c2b21'; ctx.fillRect(0, 0, 960, 640);
    for (let y = 0; y < state.height; y++) for (let x = 0; x < state.width; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#2c4030' : '#314735';
      ctx.fillRect(x * grid.cell, y * grid.cell, grid.cell, grid.cell);
      ctx.strokeStyle = 'rgba(7,18,11,.24)'; ctx.strokeRect(x * grid.cell, y * grid.cell, grid.cell, grid.cell);
    }
    for (const key of state.roadCells) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = state.road.open ? '#9a8965' : '#593e36';
      ctx.fillRect(x * grid.cell + 11, y * grid.cell + 11, grid.cell - 22, grid.cell - 22);
    }
    ctx.strokeStyle = state.road.open ? '#d2bd8c' : '#ff7651'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(3.5 * grid.cell, 13.5 * grid.cell); ctx.lineTo(13.5 * grid.cell, 13.5 * grid.cell); ctx.lineTo(13.5 * grid.cell, 8.5 * grid.cell); ctx.lineTo(16.5 * grid.cell, 8.5 * grid.cell); ctx.stroke(); ctx.setLineDash([]);
    for (const shield of state.protection) {
      const alpha = .12 + .12 * ((shield.expires - elapsed) / 8);
      ctx.fillStyle = `rgba(99,213,218,${alpha})`; ctx.beginPath(); ctx.arc(shield.x, shield.y, shield.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(126,231,231,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(shield.x, shield.y, shield.radius, 0, Math.PI * 2); ctx.stroke();
    }
    for (const house of state.houses) drawHouse(ctx, state, house, grid, elapsed);
    for (const key of state.fires) {
      const [x, y] = key.split(',').map(Number), cx = x * grid.cell + 20, cy = y * grid.cell + 20;
      ctx.fillStyle = 'rgba(255,104,62,.2)'; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff714b'; ctx.beginPath(); ctx.moveTo(cx - 9, cy + 8); ctx.quadraticCurveTo(cx - 11, cy - 3, cx - 1, cy - 13); ctx.quadraticCurveTo(cx + 2, cy - 6, cx + 7, cy - 15); ctx.quadraticCurveTo(cx + 14, cy + 1, cx + 8, cy + 8); ctx.fill();
      ctx.fillStyle = '#ffd17c'; ctx.beginPath(); ctx.ellipse(cx + 1, cy + 4, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (state.remoteFire) {
      ctx.fillStyle = '#f0cb78'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('FOCO EN CAMINO', state.road.threatPoint.x * grid.cell + 20, state.road.threatPoint.y * grid.cell - 5);
    }
    const base = point(state, state.base.x, state.base.y);
    ctx.fillStyle = 'rgba(114,204,208,.16)'; ctx.beginPath(); ctx.arc(base.x, base.y, 56, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#72ccd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(base.x, base.y, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#72ccd0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('BASE', base.x, base.y + 35);
    ctx.fillStyle = '#d7e2d4'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.fillText(state.feedback, 14, 21);
    if (state.secondaryEvent) {
      ctx.fillStyle = '#f0cb78'; ctx.textAlign = 'right'; ctx.fillText('FRENTE SECUNDARIO', 944, 21);
    }
  }
  function drawHouse(ctx, state, house, grid, elapsed) {
    const cx = house.x * grid.cell + 20, cy = house.y * grid.cell + 20;
    const color = house.status === 'segura' ? '#e5d6a0' : house.status === 'amenazada' ? '#f0cb78' : '#a95b48';
    ctx.fillStyle = 'rgba(11,17,12,.35)'; ctx.fillRect(cx - 18, cy + 12, 38, 6);
    ctx.fillStyle = color; ctx.fillRect(cx - 15, cy - 7, 30, 21);
    ctx.beginPath(); ctx.moveTo(cx - 19, cy - 6); ctx.lineTo(cx, cy - 21); ctx.lineTo(cx + 19, cy - 6); ctx.fill();
    ctx.fillStyle = '#465d49'; ctx.fillRect(cx - 3, cy + 2, 7, 12);
    ctx.fillStyle = '#f1ead4'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText(house.id, cx, cy + 27);
    ctx.fillStyle = house.status === 'afectada' ? '#ff8b6a' : house.status === 'amenazada' ? '#ffdc85' : '#d7e1d3';
    ctx.font = '9px monospace'; ctx.fillText(house.status.toUpperCase(), cx, cy + 39);
    if (house.status === 'amenazada') {
      ctx.strokeStyle = `rgba(255,203,120,${.35 + Math.sin(elapsed * 6) * .2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();
    }
  }

  window.DronModes = window.DronModes || {};
  window.DronModes.interface = mode;
})();
