'use strict';

(() => {
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d');
  const cols = 30, rows = 18, tile = 32;
  const scenarios = {
    recon: {name:'Reconocimiento del frente', short:'RECONOCIMIENTO', difficulty:'Inicial', duration:30, spreadInterval:2.0, spreadLimit:3, frontSpeed:34, firstIgnition:7500, ignitionInterval:9000, ignitionCount:1, respawnDelay:9000, water:4, startingFires:3, windShiftAt:Infinity, fuel:0.9, treeCover:0.42, approach:2.2, refillLimit:3, town:{x:26,y:7,w:3,h:4}, base:{x:2.1,y:15.4}, droneStart:{x:3.5,y:14.4}, frontStart:{x:3,y:9}, ignitionRegion:{x0:1,x1:3,y0:6,y1:12,edge:'west'}, lesson:'Practica observar el foco principal, acercarte con seguridad y descargar agua a una distancia efectiva.', observe:'Busca la columna de humo y confirma su dirección antes de acercarte.', strategy:'Vuela hasta el borde seguro del foco, descarga y observa si el fuego deja de crecer.', limit:'El tablero no modela calor, humo real ni ráfagas locales.'},
    woodland: {name:'Monte arbolado', short:'MONTE ARBOLADO', difficulty:'Inicial+', duration:35, spreadInterval:1.35, spreadLimit:5, frontSpeed:42, firstIgnition:6000, ignitionInterval:7500, ignitionCount:2, respawnDelay:8500, water:4, startingFires:7, windShiftAt:Infinity, fuel:1.42, treeCover:0.08, approach:2.0, refillLimit:2, town:{x:24,y:11,w:3,h:4}, base:{x:2.4,y:1.8}, droneStart:{x:3.6,y:3}, frontStart:{x:3,y:5}, ignitionRegion:{x0:1,x1:4,y0:4,y1:15,edge:'west'}, lesson:'La vegetación continua y las copas cercanas pueden facilitar que el fuego alcance nuevos sectores.', observe:'Compara el avance en monte denso con el terreno más abierto.', strategy:'Prioriza el borde del combustible continuo y revisa focos pequeños que podrían crecer.', limit:'Los árboles del mapa son símbolos; no representan una especie ni un mapa forestal real.'},
    wind: {name:'Viento cambiante', short:'VIENTO CAMBIANTE', difficulty:'Intermedia', duration:40, spreadInterval:1.25, spreadLimit:5, frontSpeed:49, firstIgnition:5500, ignitionInterval:6800, ignitionCount:2, respawnDelay:7500, water:4, startingFires:6, windShiftAt:20000, fuel:1.2, treeCover:0.23, approach:1.9, refillLimit:2, town:{x:25,y:3,w:3,h:4}, base:{x:2.3,y:14.8}, droneStart:{x:4,y:14}, frontStart:{x:3,y:8}, ignitionRegion:{x0:1,x1:4,y0:5,y1:13,edge:'west'}, lesson:'El viento gira durante la intervención. Una ruta que era segura puede dejar de serlo.', observe:'Observa el indicador de viento y cómo cambia el avance a sotavento.', strategy:'Reevalúa el frente tras el giro; no sigas usando la prioridad inicial por inercia.', limit:'El cambio se representa en dos direcciones constantes, no en meteorología real.'},
    secondary: {name:'Focos secundarios', short:'FOCOS SECUNDARIOS', difficulty:'Avanzada', duration:45, spreadInterval:0.95, spreadLimit:7, frontSpeed:58, firstIgnition:4300, ignitionInterval:5300, ignitionCount:3, respawnDelay:6500, water:3, startingFires:8, windShiftAt:Infinity, fuel:1.48, treeCover:0.12, approach:1.7, refillLimit:1, town:{x:24,y:8,w:3,h:4}, base:{x:2,y:15.2}, droneStart:{x:4,y:14}, frontStart:{x:3,y:9}, ignitionRegion:{x0:1,x1:5,y0:2,y1:15,edge:'west'}, lesson:'Las pavesas pueden iniciar focos alejados del frente principal; apagar solo la llama mayor no siempre basta.', observe:'Busca llamas aisladas delante del frente y a sotavento.', strategy:'Decide entre contener el frente o apagar focos que amenacen la comunidad; conserva agua para una segunda salida.', limit:'La dispersión de pavesas es una simplificación probabilística.'},
    interface: {name:'Interfaz comunidad-monte', short:'INTERFAZ', difficulty:'Avanzada+', duration:50, spreadInterval:0.9, spreadLimit:7, frontSpeed:64, firstIgnition:4000, ignitionInterval:4900, ignitionCount:4, respawnDelay:6000, water:3, startingFires:9, windShiftAt:Infinity, fuel:1.38, treeCover:0.25, approach:1.2, refillLimit:1, town:{x:21,y:7,w:4,h:5}, base:{x:4,y:15.2}, droneStart:{x:5.5,y:14}, frontStart:{x:4,y:10}, ignitionRegion:{x0:1,x1:5,y0:6,y1:13,edge:'west'}, lesson:'Cuando el monte y las viviendas están próximos, proteger el perímetro y las rutas puede ser más importante que perseguir cada foco.', observe:'Mide cuánto se aproxima el frente a viviendas y caminos.', strategy:'Contén primero los focos del borde urbano y mantén una ruta segura de regreso a base.', limit:'La comunidad es un objetivo abstracto; no modela edificios, evacuación ni protocolos.'},
    hills: {name:'Ladera seca', short:'LADERA SECA', difficulty:'Experta', duration:55, spreadInterval:0.8, spreadLimit:8, frontSpeed:72, firstIgnition:3800, ignitionInterval:4400, ignitionCount:4, respawnDelay:5500, water:2, startingFires:10, windShiftAt:30000, fuel:1.65, treeCover:0.32, approach:1.0, slope:0.2, refillLimit:1, town:{x:25,y:3,w:3,h:4}, base:{x:2,y:15.2}, droneStart:{x:3.5,y:14}, frontStart:{x:4,y:14}, ignitionRegion:{x0:1,x1:6,y0:10,y1:17,edge:'south'}, lesson:'En una pendiente ascendente, el fuego puede precalentar combustible situado más arriba y ganar velocidad.', observe:'Sigue las curvas de nivel y el avance cuesta arriba; vuelve a revisar cuando cambie el viento.', strategy:'Ataca desde una posición segura, prioriza el flanco que amenaza la comunidad y reserva agua para la retirada.', limit:'La pendiente es un modificador visual y probabilístico; no es una simulación física de ladera.'}
  };
  const town = {x: 26, y: 7, w: 3, h: 4, integrity: 3};
  const base = {x: 2.1, y: 15.4};
  const drone = {x: 3.5 * tile, y: 14.4 * tile, speed: 245, angle: -0.3};
  const front = {x: 3 * tile, y: 9 * tile, alive: true, phase: 1, respawnAt: 0, nextIgnite: 0, attackAt: 0, invulnerableUntil: 0};
  const rand = (seed) => { let value = seed | 0; value = Math.imul(value ^ value >>> 16, 0x45d9f3b); value = Math.imul(value ^ value >>> 16, 0x45d9f3b); return ((value ^ value >>> 16) >>> 0) / 4294967295; };
  const density = Array.from({length: rows}, (_, y) => Array.from({length: cols}, (_, x) => hash(x, y)));
  const fires = new Set(), particles = [], droneKeys = new Set();
  let scenario = scenarios.recon, scenarioKey = 'recon', started = false, ended = false;
  let startedAt = 0, lastFrame = 0, spreadTimer = 0, hudTimer = 0, hitCooldown = 0;
  let water = scenarios.recon.water, score = 0, refillsRemaining = scenarios.recon.refillLimit, firesRelit = 0, frontSuppressions = 0;
  let droneTarget = null, windReversed = false;
  const cellKey = (x, y) => `${x},${y}`;
  const keyMap = {ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right'};
  const pointDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function hash(x, y) { let value = (x * 374761393 + y * 668265263 + 1442695041) | 0; value = Math.imul(value ^ (value >>> 13), 1274126177); return ((value ^ (value >>> 16)) >>> 0) / 4294967295; }
  function setFeedback(text) { document.querySelector('#feedback').textContent = text; }
  function townCenter() { return {x:(town.x + town.w / 2) * tile, y:(town.y + town.h / 2) * tile}; }
  function inTown(x, y) { return x >= town.x && x < town.x + town.w && y >= town.y && y < town.y + town.h; }
  function atBase() { return pointDistance(drone, {x:base.x * tile, y:base.y * tile}) < 96; }
  function startFire() {
    fires.clear();
    const region = scenario.ignitionRegion;
    for (let index = 0; index < scenario.startingFires; index++) {
      let x = region.x0 + Math.floor(hash(index, 81 + scenario.startingFires) * (region.x1 - region.x0 + 1));
      let y = region.y0 + Math.floor(hash(index, 95 + scenario.startingFires) * (region.y1 - region.y0 + 1));
      if (region.edge === 'east') x = cols - 1 - (x - region.x0);
      if (region.edge === 'south') y = rows - 1 - (y - region.y0);
      fires.add(cellKey(x, y));
    }
  }
  function hud(now) {
    const elapsed = started ? Math.min(scenario.duration, (now - startedAt) / 1000) : 0;
    const seconds = Math.floor(elapsed);
    document.querySelector('#timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    const integrity = document.querySelector('#integrity');
    integrity.textContent = `${town.integrity} / 3`; integrity.classList.toggle('warn', town.integrity === 1);
    document.querySelector('#score').textContent = String(score).padStart(2, '0');
    document.querySelector('#difficulty-label').textContent = scenario.difficulty;
    document.querySelector('#refill-meter').textContent = String(refillsRemaining);
    document.querySelector('#mission-progress').style.width = `${100 - elapsed / scenario.duration * 100}%`;
    document.querySelector('#mission-status').textContent = ended ? 'Evaluación' : started ? scenario.name : 'Elige situación';
    document.querySelector('#monster-state').textContent = front.alive ? `Fase ${front.phase}` : `Pausa ${Math.max(0, (front.respawnAt - now) / 1000).toFixed(1)}s`;
    const meter = document.querySelector('#water-meter'); meter.setAttribute('aria-label', `${water} cargas de ${scenario.water}`); meter.replaceChildren();
    for (let index = 0; index < 5; index++) { const segment = document.createElement('i'); if (index >= water) segment.className = 'empty'; meter.append(segment); }
    const drop = document.querySelector('#drop'), refill = document.querySelector('#refill');
    drop.disabled = !started || ended || water <= 0;
    refill.disabled = !started || ended || water >= scenario.water || !atBase() || refillsRemaining <= 0;
    document.querySelector('#finish-mission').disabled = !started || ended;
  }
  function setupScenario(selectedScenario) {
    scenarioKey = selectedScenario; scenario = scenarios[scenarioKey]; started = false; ended = false; windReversed = false;
    document.querySelector('#dialog-title').hidden = false;
    document.querySelector('#dialog-copy').hidden = false;
    document.querySelector('#result-title').hidden = true;
    document.querySelector('#result-copy').hidden = true;
    document.querySelector('#result-learning').hidden = true;
    town.x = scenario.town.x; town.y = scenario.town.y; town.w = scenario.town.w; town.h = scenario.town.h;
    base.x = scenario.base.x; base.y = scenario.base.y;
    town.integrity = 3; water = scenario.water; score = 0; refillsRemaining = scenario.refillLimit; firesRelit = 0; frontSuppressions = 0; hitCooldown = 0;
    drone.x = scenario.droneStart.x * tile; drone.y = scenario.droneStart.y * tile; drone.angle = -0.3; droneTarget = null;
    droneKeys.clear(); particles.length = 0;
    front.x = scenario.frontStart.x * tile; front.y = scenario.frontStart.y * tile; front.alive = true; front.phase = 1; front.respawnAt = 0; front.attackAt = 0;
    started = true; startedAt = performance.now(); lastFrame = startedAt; spreadTimer = 0;
    front.nextIgnite = startedAt + scenario.firstIgnition; front.invulnerableUntil = startedAt + 2200;
    startFire();
    document.querySelector('#scenario-choices').hidden = true; document.querySelector('#outcome-actions').hidden = true;
    document.querySelector('#overlay').hidden = true;
    document.querySelector('#scenario-banner').textContent = scenario.short;
    document.querySelector('#scenario-title').textContent = scenario.name;
    document.querySelector('#scenario-summary').textContent = `${scenario.difficulty} · ${scenario.duration} s · ${scenario.startingFires} focos · ${scenario.water} cargas · reaparición ${scenario.respawnDelay / 1000} s`;
    document.querySelector('#scenario-lesson').textContent = scenario.lesson;
    document.querySelector('#scenario-observe').textContent = scenario.observe;
    document.querySelector('#scenario-strategy').textContent = scenario.strategy;
    document.querySelector('#scenario-limit').textContent = scenario.limit;
    document.querySelector('#wind-direction').textContent = 'OESTE → ESTE';
    document.querySelector('#role-one').innerHTML = `${scenario.observe}<small>Observa la situación antes de descargar.</small>`;
    document.querySelector('#role-two').innerHTML = `${scenario.strategy}<small>El frente vuelve tras ${scenario.respawnDelay / 1000} s.</small>`;
    document.querySelector('#role-three').innerHTML = 'Protege comunidad y recursos<small>Quedan tres impactos antes de perder el perímetro</small>';
    document.querySelector('#controls-heading').textContent = 'Controles de vuelo';
    document.querySelector('#controls-description').textContent = 'WASD o flechas para volar. Espacio descarga agua; R recarga en la base. Clic en el mapa para navegar.';
    document.querySelector('#mission-status').textContent = scenario.name;
    setFeedback('Lee el viento, identifica el frente y conserva agua para una segunda descarga.');
    hud(startedAt);
  }
  function showScenarioMenu() {
    started = false; ended = false;
    document.querySelector('#dialog-title').hidden = false;
    document.querySelector('#dialog-copy').hidden = false;
    document.querySelector('#result-title').hidden = true;
    document.querySelector('#result-copy').hidden = true;
    document.querySelector('#result-learning').hidden = true;
    document.querySelector('#dialog-title').textContent = 'Elige una situación';
    document.querySelector('#dialog-copy').textContent = 'Selecciona una práctica individual. Cada nivel tiene condiciones y objetivos distintos.';
    document.querySelector('#scenario-choices').hidden = false; document.querySelector('#outcome-actions').hidden = true;
    document.querySelector('#overlay').hidden = false;
    setFeedback('Selecciona un escenario para iniciar.'); hud(performance.now());
  }
  function evaluateRun(outcome) {
    const elapsed = started ? Math.min(scenario.duration, (performance.now() - startedAt) / 1000) : 0;
    const timePoints = Math.round(elapsed / scenario.duration * 30);
    const communityPoints = Math.round(town.integrity / 3 * 30);
    const firePoints = Math.min(score, 8) * 5;
    const points = Math.max(0, Math.min(100, timePoints + communityPoints + firePoints));
    const rating = points >= 90 ? 'Sobresaliente' : points >= 75 ? 'Buena respuesta' : points >= 55 ? 'En desarrollo' : 'Requiere práctica';
    const advice = outcome === 'manual'
      ? 'Terminaste la práctica antes de completar el objetivo. Revisa el resumen del escenario e inténtalo de nuevo.'
      : town.integrity === 3
        ? 'Mantuviste protegida la comunidad. Sigue observando el perímetro y el viento.'
        : 'Prioriza la vida y las rutas de evacuación; evita perseguir focos si la comunidad queda expuesta.';
    const waterAdvice = water === 0
      ? 'Agotaste el agua: planifica el regreso a la base antes de la última carga.'
      : `La reserva final fue ${water}/${scenario.water}; quedaron ${refillsRemaining} recargas. Planifica los viajes a la base.`;
    document.querySelector('#result-title').textContent = `${rating} · ${points}/100`;
    const finishReason = outcome === 'success'
      ? `Comunidad protegida durante ${scenario.duration} segundos.`
      : outcome === 'manual'
        ? `Partida terminada por el piloto a los ${Math.floor(elapsed)} segundos.`
        : 'La comunidad recibió demasiado daño y se perdió el perímetro.';
    document.querySelector('#result-copy').textContent = `${finishReason} Focos controlados: ${score}; frentes suprimidos: ${frontSuppressions}. Puntaje: tiempo ${timePoints}/30, comunidad ${communityPoints}/30, focos ${firePoints}/40.`;
    document.querySelector('#result-learning').textContent = `${advice} ${scenario.lesson} Observación: ${scenario.observe} ${waterAdvice} Estos indicadores evalúan la misión simulada, no certifican competencia operativa.`;
    document.querySelector('#dialog-title').hidden = true;
    document.querySelector('#dialog-copy').hidden = true;
    document.querySelector('#result-title').hidden = false;
    document.querySelector('#result-copy').hidden = false;
    document.querySelector('#result-learning').hidden = false;
    document.querySelector('#scenario-choices').hidden = true; document.querySelector('#outcome-actions').hidden = false;
    document.querySelector('#overlay').hidden = false; ended = true; hud(performance.now());
  }
  function damageTown(message) {
    const now = performance.now();
    if (now < hitCooldown || ended) return;
    hitCooldown = now + 10000; town.integrity--; setFeedback(message);
    if (town.integrity <= 0) evaluateRun('loss');
  }
  function igniteAt(cx, cy, amount) {
    const candidates = [];
    for (let y = Math.max(0, cy - 3); y <= Math.min(rows - 1, cy + 3); y++) {
      for (let x = Math.max(0, cx - 3); x <= Math.min(cols - 1, cx + 3); x++) {
        if (!inTown(x,y) && !fires.has(cellKey(x,y))) candidates.push({x,y,d:Math.hypot(x-cx,y-cy)});
      }
    }
    candidates.sort((a,b) => a.d-b.d); let created = 0;
    for (const cell of candidates) { if (created >= amount) break; if (Math.random() < .72) { fires.add(cellKey(cell.x,cell.y)); created++; } }
    firesRelit += created; return created;
  }
  function extinguish() {
    if (!started || ended || water <= 0) return;
    water--;
    const cx = Math.floor(drone.x / tile), cy = Math.floor(drone.y / tile);
    const radius = scenarioKey === 'recon' ? 2.35 : 2.05;
    let removed = 0;
    for (const point of [...fires]) {
      const [x,y] = point.split(',').map(Number);
      if (Math.hypot(x-cx,y-cy) <= radius) { fires.delete(point); removed++; }
    }
    let frontSuppressed = false;
    if (front.alive && pointDistance(drone, front) < tile * 2.3) frontSuppressed = suppressFront();
    if (removed) score += removed;
    if (frontSuppressed) setFeedback(`Frente principal contenido. Hay ${scenario.respawnDelay / 1000} segundos para apagar focos residuales.`);
    else if (removed) setFeedback(`${removed} foco${removed === 1 ? '' : 's'} apagado${removed === 1 ? '' : 's'}. Revisa la zona y el humo residual.`);
    else setFeedback('Descarga sin impacto. Acércate más al foco antes de soltar agua.');
    particles.push({x:drone.x,y:drone.y+13,age:0,type:'splash'}); hud(performance.now());
  }
  function suppressFront() {
    if (!front.alive || performance.now() < front.invulnerableUntil) return false;
    front.alive = false; front.respawnAt = performance.now() + scenario.respawnDelay; frontSuppressions++;
    for (const point of [...fires]) {
      const [x,y] = point.split(',').map(Number);
      if (Math.hypot(x*tile-front.x,y*tile-front.y) < tile*1.6) fires.delete(point);
    }
    particles.push({x:front.x,y:front.y,age:0,type:'suppression'}); return true;
  }
  function refill() {
    if (!started || ended || !atBase() || water >= scenario.water || refillsRemaining <= 0) return;
    water = scenario.water; refillsRemaining--; setFeedback(`Tanque recargado a ${scenario.water} cargas. Quedan ${refillsRemaining} recargas.`); hud(performance.now());
  }
  function respawnFront(now) {
    if (front.alive || now < front.respawnAt) return;
    front.x = (2.5 + Math.random() * 1.5) * tile;
    front.y = (3 + Math.floor(Math.random() * 12)) * tile;
    front.phase++; front.alive = true; front.invulnerableUntil = now + 1800; front.nextIgnite = now + scenario.firstIgnition;
    setFeedback('El frente reapareció lejos de la aldea. Tienes tiempo para controlar los focos residuales.');
  }
  function spreadFire() {
    const fresh = [];
    for (const point of fires) {
      const [x,y] = point.split(',').map(Number);
      for (const [dx,dy] of [[1,0],[0,1],[0,-1],[-1,0]]) {
        const nx=x+dx, ny=y+dy, k=cellKey(nx,ny);
        if (nx<0 || nx>=cols || ny<0 || ny>=rows || inTown(nx,ny) || fires.has(k) || fresh.includes(k)) continue;
        const wind = windReversed ? (dx === -1 ? .12 : dx === 1 ? -.04 : 0) : (dx === 1 ? .12 : dx === -1 ? -.04 : 0);
        const slopeBoost = scenario.slope && dy === -1 ? scenario.slope : 0;
        const treeFuel = density[ny][nx] > scenario.treeCover ? 1.55 : .78;
        const probability = Math.min(.68, (.055 + density[ny][nx]*.065 + wind + slopeBoost) * scenario.fuel * treeFuel);
        if (Math.random() < probability) fresh.push(k);
        if (fresh.length >= scenario.spreadLimit) break;
      }
      if (fresh.length >= scenario.spreadLimit) break;
    }
    fresh.forEach(k => fires.add(k));
    const edgeThreat = [...fires].some(point => { const [x,y]=point.split(',').map(Number); return x>=town.x-1 && y>=town.y-1 && y<=town.y+town.h; });
    if (edgeThreat && Math.random() < .055) damageTown('Las llamas alcanzaron el borde del perímetro. Revisa la salida segura.');
  }
  function moveToward(entity,target,speed,dt) {
    const dx=target.x-entity.x, dy=target.y-entity.y, length=Math.hypot(dx,dy);
    if (length<2) return;
    entity.x += dx/length*Math.min(length,speed*dt); entity.y += dy/length*Math.min(length,speed*dt); entity.angle=Math.atan2(dy,dx);
  }
  function updateFrontAI(dt,now) {
    if (!front.alive) { respawnFront(now); return; }
    const center=townCenter();
    const target={x:(town.x-scenario.approach)*tile,y:center.y+Math.sin(now/3700)*34};
    moveToward(front,target,scenario.frontSpeed,dt);
    if (now >= front.nextIgnite) {
      const created=igniteAt(Math.floor(front.x/tile),Math.floor(front.y/tile),scenario.ignitionCount);
      front.nextIgnite=now+scenario.ignitionInterval;
      if (created) setFeedback(`El frente activo reavivó ${created} focos a sotavento.`);
    }
    if (front.x >= target.x-3 && front.y >= (town.y-.5)*tile && front.y <= (town.y+town.h+.5)*tile && now >= front.attackAt) {
      front.attackAt=now+14000; damageTown('El frente alcanzó el perímetro. Prioriza proteger la comunidad.'); front.x-=tile*1.4;
    }
  }
  function update(dt,now) {
    if (!started || ended) return;
    let dx=Number(droneKeys.has('right'))-Number(droneKeys.has('left'));
    let dy=Number(droneKeys.has('down'))-Number(droneKeys.has('up'));
    const length=Math.hypot(dx,dy);
    if (length) { drone.x+=dx/length*drone.speed*dt; drone.y+=dy/length*drone.speed*dt; drone.angle=Math.atan2(dy,dx); droneTarget=null; }
    else if (droneTarget) { moveToward(drone,droneTarget,drone.speed,dt); if (pointDistance(drone,droneTarget)<6) droneTarget=null; }
    drone.x=Math.max(16,Math.min(canvas.width-16,drone.x)); drone.y=Math.max(28,Math.min(canvas.height-18,drone.y));
    updateFrontAI(dt,now);
    if (!windReversed && now-startedAt >= scenario.windShiftAt) {
      windReversed = true;
      document.querySelector('#wind-direction').textContent = 'ESTE → OESTE';
      setFeedback('El viento cambió de dirección. Reevalúa el frente y los focos prioritarios.');
    }
    spreadTimer+=dt; if (spreadTimer>=scenario.spreadInterval) { spreadTimer-=scenario.spreadInterval; spreadFire(); }
    if (now-startedAt>=scenario.duration*1000) evaluateRun('success');
  }
  function drawTerrain(now) {
    ctx.fillStyle='#344b34'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) {
      const px=x*tile,py=y*tile,value=density[y][x];
      ctx.fillStyle=value>.75?'#526544':value>.3?'#475b3d':'#3f5439'; ctx.fillRect(px,py,tile,tile);
      if (value>scenario.treeCover && !inTown(x,y) && !(x<4&&y>13)) {
        const sway=Math.sin(now/550+x*2+y)*1.8;
        const canopy = scenarioKey === 'woodland' ? 8 + value * 7 : 5 + value * 5;
        ctx.fillStyle=value>.82?'#788054':'#68784c'; ctx.beginPath(); ctx.arc(px+10+value*10+sway,py+18,canopy,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(24,36,25,.35)'; ctx.beginPath(); ctx.ellipse(px+11+value*10,py+22,canopy+3,4,0,0,Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle='rgba(13,25,15,.17)'; ctx.lineWidth=1; ctx.strokeRect(px,py,tile,tile);
    }
    if (scenario.slope) {
      ctx.strokeStyle='rgba(213,199,147,.42)'; ctx.lineWidth=2;
      for (let band=0;band<7;band++) {
        ctx.beginPath(); ctx.moveTo(420,band*96-30); ctx.bezierCurveTo(520,band*96+28,650,band*96-32,760,band*96+14); ctx.stroke();
      }
    }
    drawRoad(); drawBase(now); drawTown(now);
  }
  function drawRoad() {
    const start={x:base.x*tile,y:base.y*tile},end=townCenter();
    const control={x:(start.x+end.x)/2+18,y:(start.y+end.y)/2+(end.y<start.y?54:-54)};
    ctx.strokeStyle='#92856b';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(control.x,control.y,end.x,end.y);ctx.stroke();
    ctx.strokeStyle='#c6b58c';ctx.lineWidth=1;ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(control.x,control.y,end.x,end.y);ctx.stroke();ctx.setLineDash([]);
  }
  function drawBase(now) {
    const x=base.x*tile,y=base.y*tile;
    ctx.fillStyle='rgba(118,207,208,.06)';ctx.beginPath();ctx.arc(x,y,96,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(118,207,208,.48)';ctx.lineWidth=1;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,96,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(118,207,208,.14)';ctx.beginPath();ctx.arc(x,y,42+Math.sin(now/340)*2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#76cfd0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,31,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#1c6b6d';ctx.fillRect(x-15,y-11,30,22);ctx.fillStyle='#b7ebdc';ctx.fillRect(x-8,y-6,16,12);
    ctx.fillStyle='#e6f4dc';ctx.font='10px Courier New';ctx.textAlign='center';ctx.fillText('BASE',x,y+49);
  }
  function drawTown(now) {
    const x=town.x*tile,y=town.y*tile,w=town.w*tile,h=town.h*tile;
    ctx.fillStyle='rgba(224,211,153,.14)';ctx.fillRect(x-9,y-9,w+18,h+18);
    ctx.strokeStyle=town.integrity===1&&Math.sin(now/100)>0?'#ff714b':'#d8c897';ctx.lineWidth=2;ctx.strokeRect(x-9,y-9,w+18,h+18);
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
      const bx=x+7+col*37,by=y+7+row*39;ctx.fillStyle='#e2d39b';ctx.fillRect(bx,by,22,20);
      ctx.fillStyle='#877753';ctx.beginPath();ctx.moveTo(bx-3,by+1);ctx.lineTo(bx+11,by-8);ctx.lineTo(bx+25,by+1);ctx.fill();ctx.fillStyle='#536047';ctx.fillRect(bx+8,by+8,5,12);
    }
    ctx.fillStyle='#f1e4b7';ctx.font='10px Courier New';ctx.textAlign='center';ctx.fillText('COMUNIDAD',x+w/2,y-15);
  }
  function drawFires(now) {
    for(const point of fires){
      const [x,y]=point.split(',').map(Number),px=x*tile,py=y*tile,flicker=Math.sin(now/68+x*7+y*3);
      ctx.fillStyle='rgba(255,92,42,.16)';ctx.beginPath();ctx.arc(px+16,py+17,24+flicker*3,0,Math.PI*2);ctx.fill();
      if(density[y][x]>scenario.treeCover){
        ctx.fillStyle='#252b20';ctx.fillRect(px+13,py+13,6,17);
        ctx.strokeStyle='#322a20';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+16,py+19);ctx.lineTo(px+7,py+10);ctx.moveTo(px+16,py+20);ctx.lineTo(px+25,py+8);ctx.stroke();
        ctx.fillStyle=`rgba(255,${120+Math.floor((flicker+1)*45)},54,.68)`;ctx.beginPath();ctx.arc(px+7,py+10,3+Math.max(0,flicker),0,Math.PI*2);ctx.arc(px+25,py+8,3+Math.max(0,-flicker),0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#973c2d';ctx.fillRect(px+2,py+4,28,27);ctx.fillStyle='#f45f37';ctx.beginPath();ctx.ellipse(px+16,py+19,10+flicker,12+flicker*2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffb84e';ctx.beginPath();ctx.ellipse(px+16,py+21,5,8+Math.max(0,flicker),-.12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(40,44,37,.55)';for(let puff=0;puff<3;puff++){const lift=(now/180+puff*10+x*3)%25;ctx.beginPath();ctx.arc(px+11+puff*7+Math.sin(now/300+puff)*2,py+7-lift,3+lift*.15,0,Math.PI*2);ctx.fill();}
    }
  }
  function drawWind(now) {
    ctx.strokeStyle='rgba(222,232,192,.27)';ctx.lineWidth=1;
    for(let i=0;i<14;i++){const x=(i*97+now*.065)%canvas.width,y=(i*139+55)%canvas.height,dir=windReversed?-1:1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14*dir,y-2);ctx.stroke();}
  }
  function drawFront(now) {
    if(!front.alive)return;
    const x=front.x,y=front.y,pulse=Math.sin(now/110)*3;
    ctx.fillStyle='rgba(255,95,42,.14)';ctx.beginPath();ctx.arc(x,y,34+pulse,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a33d2b';ctx.beginPath();ctx.ellipse(x,y+5,16,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff713b';ctx.beginPath();ctx.moveTo(x-15,y+7);ctx.quadraticCurveTo(x-18,y-12-pulse,x-7,y-23);ctx.quadraticCurveTo(x-2,y-11,x+1,y-31-pulse);ctx.quadraticCurveTo(x+14,y-10,x+15,y+7);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd176';ctx.beginPath();ctx.moveTo(x-6,y+5);ctx.quadraticCurveTo(x-3,y-9-pulse,x+2,y-17);ctx.quadraticCurveTo(x+10,y-2,x+7,y+6);ctx.closePath();ctx.fill();
    ctx.strokeStyle=now<front.invulnerableUntil?'#fff0aa':'rgba(255,178,84,.68)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,27+pulse,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffe5ae';ctx.font='9px Courier New';ctx.textAlign='center';ctx.fillText('FRENTE ACTIVO',x,y-38);
  }
  function drawDrone(now) {
    const x=drone.x,y=drone.y,rotor=Math.sin(now/25)*6;
    ctx.fillStyle='rgba(9,17,11,.35)';ctx.beginPath();ctx.ellipse(x+4,y+10,23,10,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(x,y);ctx.rotate(drone.angle*.12);
    ctx.strokeStyle='#d2ded0';ctx.lineWidth=3;ctx.lineCap='round';
    for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(sx*5,sy*4);ctx.lineTo(sx*17,sy*11);ctx.stroke();ctx.strokeStyle='rgba(208,228,208,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx*17-rotor,sy*11);ctx.lineTo(sx*17+rotor,sy*11);ctx.stroke();ctx.strokeStyle='#d2ded0';ctx.lineWidth=3;}
    ctx.fillStyle='#27382d';ctx.beginPath();ctx.ellipse(0,0,11,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c2dc96';ctx.beginPath();ctx.ellipse(2,-1,5,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#73d2df';ctx.beginPath();ctx.arc(0,6,3,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.strokeStyle='rgba(216,236,202,.42)';ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(x,y,34,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  function render(now) {
    ctx.save();
    drawTerrain(now);drawWind(now);drawFires(now);drawFront(now);drawDrone(now);
    for(const effect of particles){const alpha=Math.max(0,1-effect.age/(effect.type==='splash'?.55:.8));if(effect.type==='splash'){ctx.strokeStyle=`rgba(133,229,226,${alpha})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(effect.x,effect.y,effect.radius,0,Math.PI*2);ctx.stroke();}else{ctx.strokeStyle=`rgba(255,166,63,${alpha})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(effect.x,effect.y,15+effect.age*90,0,Math.PI*2);ctx.stroke();}}
    if(atBase()&&water<scenario.water&&refillsRemaining>0){ctx.fillStyle='#a8eff0';ctx.font='10px Courier New';ctx.textAlign='center';ctx.fillText('R PARA RECARGAR',drone.x,drone.y-28);}
    if(!front.alive){ctx.fillStyle='#fff0c1';ctx.font='11px Courier New';ctx.textAlign='center';ctx.fillText(`VENTANA DE CONTROL ${Math.ceil((front.respawnAt-now)/1000)}s`,canvas.width/2,31);}
    ctx.restore();
  }
  function loop(now) {
    const dt=Math.min(.04,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
    update(dt,now);
    for(let i=particles.length-1;i>=0;i--){particles[i].age+=dt;if(particles[i].age>(particles[i].type==='splash'?.55:.8))particles.splice(i,1);}
    if(now-hudTimer>180){hudTimer=now;hud(now);}
    render(now);requestAnimationFrame(loop);
  }
  document.querySelectorAll('.scenario-choice').forEach(button=>button.addEventListener('click',()=>setupScenario(button.dataset.scenario)));
  document.querySelector('#drop').addEventListener('click',extinguish);
  document.querySelector('#refill').addEventListener('click',refill);
  document.querySelector('#finish-mission').addEventListener('click',()=>evaluateRun('manual'));
  document.querySelector('#restart').addEventListener('click',()=>setupScenario(scenarioKey));
  document.querySelector('#back-modes').addEventListener('click',showScenarioMenu);
  const fullscreenButton = document.querySelector('#fullscreen-toggle');
  fullscreenButton.addEventListener('click', async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.app').requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => { fullscreenButton.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : '⛶ Pantalla completa'; });
  window.addEventListener('keydown',event=>{
    const direction=keyMap[event.code];
    if(direction&&started&&!ended){event.preventDefault();droneKeys.add(direction);}
    if(event.code==='Space'){event.preventDefault();extinguish();}
    if(event.code==='KeyR')refill();
  });
  window.addEventListener('keyup',event=>{const direction=keyMap[event.code];if(direction)droneKeys.delete(direction);});
  window.addEventListener('blur',()=>droneKeys.clear());
  document.querySelectorAll('.touch-controls button').forEach(button=>{
    const direction=button.dataset.key;
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);droneKeys.add(direction);});
    const release=()=>droneKeys.delete(direction);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  canvas.addEventListener('pointerdown',event=>{
    if(!started||ended)return;const rect=canvas.getBoundingClientRect();
    droneTarget={x:(event.clientX-rect.left)/rect.width*canvas.width,y:(event.clientY-rect.top)/rect.height*canvas.height};
  });
  startFire();
  hud(performance.now());requestAnimationFrame(loop);
})();
