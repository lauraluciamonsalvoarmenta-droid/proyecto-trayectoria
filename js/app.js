/* TRAYECTORIA: interfaz, animación y actividades. Las fórmulas están en fisica.js. */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const COLORS = ['#087cb8', '#f4a21d', '#d55791', '#218968'];
  const PRESETS = {
    suave: { v0: 10, ang: 45, g: 9.8 },
    normal: { v0: 12, ang: 40, g: 9.8 },
    potente: { v0: 16, ang: 12, g: 9.8 }
  };
  const state = {
    t: 0,
    running: false,
    lastFrame: 0,
    completed: false,
    comparisons: [],
    challengeRuns: [],
    pre: 0,
    drop: 0,
    paused: false,
    demoOn: false,
    score: new Set(),
    animationFrame: null
  };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const player = new Image();
  player.src = 'assets/voleibolista-saque.png';
  player.onload = function () { drawSimulation(); };

  const RETOS = [
    {
      title: 'Más velocidad, ¿qué cambia?', variable: 'v0', min: 5, max: 50, step: 5, start: 15,
      base: { v0: 20, ang: 45, g: 9.8 }, hint: 'Prueba 15, 20, 25 y 30 m/s.',
      question: 'Si mantenemos el mismo ángulo y la misma gravedad, ¿qué sucede cuando aumentamos la velocidad inicial del saque?',
      options: ['El balón alcanza mayor altura, permanece más tiempo en el aire y llega más lejos.', 'El balón alcanza siempre la misma altura, independientemente de la velocidad.', 'El balón pierde distancia porque se mueve demasiado rápido.'],
      correct: 0,
      ok: '¡Excelente! Has comprendido cómo funciona el movimiento parabólico. Cuando aumentamos la velocidad inicial, el balón puede alcanzar mayor altura y recorrer una distancia mayor.',
      wrong: { 1: 'La altura sí depende de la velocidad: si fuera siempre igual, dar un saque flojo o fuerte daría lo mismo.', 2: 'Moverse más rápido no hace perder distancia: sin aire que lo frene, más velocidad es más alcance.' },
      why: 'con más velocidad inicial el balón sale con más impulso hacia arriba (sube más y tarda más en bajar) y más impulso hacia adelante (avanza más). La altura y el alcance crecen con el cuadrado de la velocidad.',
      example: 'imagina un saque suave y otro potente con el mismo ángulo: el potente sube más, dura más en el aire y cae mucho más lejos.',
      conclusion: 'Con el ángulo y la gravedad fijos, el tiempo de vuelo crece en proporción directa a V₀, mientras que la altura máxima y el alcance crecen con V₀².',
      interpret: function (runs) {
        const a = runs[0], b = runs[runs.length - 1], A = Fisica.calcular(a.v0, a.ang, a.g), B = Fisica.calcular(b.v0, b.ang, b.g);
        return 'Con ' + a.v0 + ' m/s tu balón duró ' + f2(A.tiempo) + ' s, subió ' + f2(A.altura) + ' m y llegó a ' + f2(A.alcance) + ' m. Con ' + b.v0 + ' m/s duró ' + f2(B.tiempo) + ' s, subió ' + f2(B.altura) + ' m y llegó a ' + f2(B.alcance) + ' m. La velocidad se multiplicó por ' + f2(b.v0 / a.v0) + ', el tiempo por ' + f2(B.tiempo / A.tiempo) + ' y el alcance por ' + f2(B.alcance / A.alcance) + ' (la velocidad al cuadrado da ' + f2(Math.pow(b.v0 / a.v0, 2)) + ').';
      }
    },
    {
      title: '¿Cuál es el ángulo ideal?', variable: 'ang', min: 10, max: 80, step: 5, start: 30,
      base: { v0: 25, ang: 45, g: 9.8 }, hint: 'Prueba 30°, 45° y 60°, y otro ángulo que quieras.',
      question: 'En un modelo ideal, si lanzamos el balón desde la misma altura a la que cae, ¿qué ángulo permite alcanzar la mayor distancia horizontal?',
      options: ['30 grados.', '45 grados.', '90 grados.'], correct: 1,
      ok: '¡Muy bien! En el modelo ideal, 45° es el ángulo que logra la mayor distancia horizontal.',
      wrong: { 0: 'Con 30° el balón sale muy plano y cae pronto, antes de aprovechar todo su impulso.', 2: 'Con 90° el balón sube derecho y baja en el mismo lugar: el alcance horizontal es cero.' },
      why: 'el alcance depende de sen(2θ), y ese valor es el más grande posible (1) cuando 2θ = 90°, es decir, cuando θ = 45°. Es el equilibrio entre avanzar y subir.',
      example: 'si sacas casi recto hacia arriba, el balón sube mucho pero cae cerca de ti; si lo mandas muy plano, cae pronto o choca con la red. A 45° aprovecha mejor la velocidad.',
      conclusion: 'En un modelo ideal el mayor alcance se obtiene a 45°. En un saque real influyen el aire, la altura del golpe y la técnica, por eso no siempre se usa exactamente 45°.',
      interpret: function (runs) {
        let best = runs[0]; runs.forEach(function (r) { if (Fisica.calcular(r.v0, r.ang, r.g).alcance > Fisica.calcular(best.v0, best.ang, best.g).alcance) best = r; });
        const has45 = runs.some(function (r) { return r.ang === 45; });
        return 'De tus pruebas, el mayor alcance fue ' + f2(Fisica.calcular(best.v0, best.ang, best.g).alcance) + ' m con ' + best.ang + '°. ' + (best.ang === 45 ? 'Coincide con la teoría: 45° es el mejor ángulo en el modelo ideal.' : has45 ? 'Revisa la tabla.' : 'Todavía no probaste 45°; guárdalo para comprobar que ese ángulo llega más lejos que los demás.');
      }
    },
    {
      title: '¿Qué sucede con la gravedad?', variable: 'g', min: 2, max: 25, step: 0.2, start: 4,
      base: { v0: 25, ang: 45, g: 9.8 }, hint: 'Prueba 4, 9.8, 15 y 25 m/s².',
      question: 'Si la gravedad disminuye y mantenemos la misma velocidad y el mismo ángulo, ¿qué sucede?',
      options: ['El balón cae más rápido.', 'El balón permanece más tiempo en el aire y puede llegar más lejos y más alto.', 'El movimiento horizontal desaparece.'], correct: 1,
      ok: '¡Correcto! Con menos gravedad, el balón sube más, dura más en el aire y llega más lejos.',
      wrong: { 0: 'La gravedad es justamente lo que hace caer al balón: si disminuye, cae más lento, no más rápido.', 2: 'El movimiento horizontal nunca desaparece por la gravedad: ella solo actúa hacia abajo.' },
      why: 'la gravedad es lo que frena el balón al subir y lo hace bajar. Si es más pequeña, tarda más en frenarlo y en traerlo al suelo, así que sube más, dura más y avanza más.',
      example: 'en la Luna, donde la gravedad es mucho menor que en la Tierra, un saque con la misma fuerza flotaría mucho más tiempo y llegaría mucho más lejos.',
      conclusion: 'Con una gravedad mayor, el balón sube menos, permanece menos tiempo en el aire y recorre menos distancia: altura, tiempo y alcance son inversamente proporcionales a g.',
      interpret: function (runs) {
        const a = runs[0], b = runs[runs.length - 1], A = Fisica.calcular(a.v0, a.ang, a.g), B = Fisica.calcular(b.v0, b.ang, b.g);
        return 'Con g = ' + a.g + ' m/s² el balón subió ' + f2(A.altura) + ' m, duró ' + f2(A.tiempo) + ' s y llegó a ' + f2(A.alcance) + ' m. Con g = ' + b.g + ' m/s² subió ' + f2(B.altura) + ' m, duró ' + f2(B.tiempo) + ' s y llegó a ' + f2(B.alcance) + ' m. Cuando la gravedad se multiplicó por ' + f2(b.g / a.g) + ', el alcance se multiplicó por ' + f2(B.alcance / A.alcance) + ': a más gravedad, el balón llega menos lejos.';
      }
    },
    {
      title: 'Dos saques diferentes, ¿igual distancia?', variable: 'ang', min: 10, max: 80, step: 5, start: 30,
      base: { v0: 25, ang: 30, g: 9.8 }, hint: 'Prueba 30° y 60°, y otro par que sume 90° (por ejemplo 20° y 70°).',
      question: '¿Es posible que dos saques con ángulos diferentes alcancen la misma distancia horizontal?',
      options: ['No, siempre necesitan tener el mismo ángulo.', 'Sí, pueden conseguirlo utilizando ángulos complementarios, si tienen la misma velocidad inicial y se mantienen las condiciones ideales.', 'No, porque la gravedad impide que ocurra.'], correct: 1,
      ok: '¡Excelente! Dos ángulos complementarios (que suman 90°) llegan a la misma distancia si la velocidad es igual.',
      wrong: { 0: 'Dos ángulos distintos sí pueden llegar igual de lejos; justamente eso es lo curioso de la parábola.', 2: 'La gravedad actúa igual en los dos saques, por eso no impide que lleguen a la misma distancia.' },
      why: 'como sen(2θ) vale lo mismo para θ y para 90° − θ, un saque a 30° y otro a 60° con la misma velocidad caen en el mismo punto.',
      example: 'un saque a 30° va bajo y rápido; uno a 60° sube alto y tarda más. Aunque se ven muy distintos, ambos caen en el mismo lugar.',
      conclusion: 'Los ángulos complementarios tienen el mismo alcance ideal. El de mayor ángulo alcanza más altura y dura más tiempo; el de menor ángulo avanza con una trayectoria más baja.',
      interpret: function (runs) {
        for (let i = 0; i < runs.length; i += 1) for (let j = i + 1; j < runs.length; j += 1) {
          if (runs[i].ang + runs[j].ang === 90) {
            const A = Fisica.calcular(runs[i].v0, runs[i].ang, runs[i].g), B = Fisica.calcular(runs[j].v0, runs[j].ang, runs[j].g);
            return 'Tus saques de ' + runs[i].ang + '° y ' + runs[j].ang + '° llegaron a ' + f2(A.alcance) + ' m y ' + f2(B.alcance) + ' m: ¡la misma distancia! Pero el de ' + runs[j].ang + '° subió ' + f2(B.altura) + ' m y el de ' + runs[i].ang + '° solo ' + f2(A.altura) + ' m.';
          }
        }
        return 'Todavía no guardaste dos ángulos que sumen 90° (por ejemplo 30° y 60°). Guárdalos y compara sus alcances en la tabla.';
      }
    },
    {
      title: 'Ángulo y altura máxima', variable: 'ang', min: 10, max: 90, step: 10, start: 10,
      base: { v0: 25, ang: 45, g: 9.8 }, hint: 'Prueba 10°, 30°, 60° y 90°.',
      question: 'Si mantenemos la misma velocidad y la misma gravedad, ¿qué pasa con la altura máxima cuando aumentamos el ángulo del saque?',
      options: ['Disminuye, porque el balón sale más inclinado.', 'Aumenta: mientras más inclinado el saque, más alto llega el balón.', 'No cambia; solo cambia el alcance.'], correct: 1,
      ok: '¡Muy bien! Un saque más inclinado manda más velocidad hacia arriba y el balón sube más.',
      wrong: { 0: 'Al inclinar más el saque, una parte mayor de la velocidad apunta hacia arriba, y eso hace subir más.', 2: 'La altura sí cambia: depende de la parte vertical de la velocidad, que cambia con el ángulo.' },
      why: 'al inclinar más el saque, más velocidad apunta hacia arriba (Vy = V₀·sen θ). Con más Vy, el balón tarda más en frenarse y sube más: H = V₀²·sen²θ / 2g.',
      example: 'un saque casi recto hacia arriba sube muchísimo pero casi no avanza; uno casi plano avanza, pero apenas sube.',
      conclusion: 'Al aumentar el ángulo crece la altura máxima. A 90° se logra la mayor altura, pero el alcance horizontal es cero porque no hay componente horizontal.',
      interpret: function (runs) {
        const list = runs.map(function (r) { return r.ang + '° → ' + f2(Fisica.calcular(r.v0, r.ang, r.g).altura) + ' m'; }).join(', ');
        return 'Tus alturas máximas fueron: ' + list + '. Mientras el ángulo creció de ' + runs[0].ang + '° a ' + runs[runs.length - 1].ang + '°, la altura subió de ' + f2(Fisica.calcular(runs[0].v0, runs[0].ang, runs[0].g).altura) + ' m a ' + f2(Fisica.calcular(runs[runs.length - 1].v0, runs[runs.length - 1].ang, runs[runs.length - 1].g).altura) + ' m.';
      }
    }
  ];
  const challengeViews = [];
  const LETTERS = ['A', 'B', 'C'];

  function f2(value) {
    const safe = Math.abs(value) < 0.005 ? 0 : value;
    return safe.toFixed(2);
  }

  function valueForControl(value) {
    return String(Number(value));
  }

  function launchFromControls() {
    return {
      v0: Number($('v0').value),
      ang: Number($('ang').value),
      g: Number($('g').value),
      color: COLORS[0]
    };
  }

  function setSceneStatus(text, stateClass, message) {
    const badge = $('sceneStatus');
    badge.textContent = text;
    badge.className = 'status-pill' + (stateClass ? ' ' + stateClass : '');
    if (message) $('simStatus').textContent = message;
  }

  function updateControlLabels() {
    $('lv0').textContent = valueForControl($('v0').value) + ' m/s';
    $('lang').textContent = valueForControl($('ang').value) + '°';
    $('lg').textContent = valueForControl($('g').value) + ' m/s²';
  }

  function makeKpi(label, value, unit) {
    const card = document.createElement('div');
    const name = document.createElement('span');
    const number = document.createElement('strong');
    const units = document.createElement('span');
    card.className = 'kpi';
    name.textContent = label;
    number.textContent = value;
    units.className = 'unit';
    units.textContent = unit;
    card.append(name, number, units);
    return card;
  }

  function showMainResults() {
    const p = launchFromControls();
    const c = Fisica.calcular(p.v0, p.ang, p.g);
    const results = [
      ['Velocidad horizontal Vx', f2(c.vx), 'm/s'],
      ['Velocidad vertical Vy', f2(c.vy), 'm/s'],
      ['Tiempo de vuelo', f2(c.tiempo), 's'],
      ['Altura máxima', f2(c.altura), 'm'],
      ['Alcance', f2(c.alcance), 'm']
    ];
    const target = $('res');
    target.replaceChildren();
    results.forEach(function (item) { target.appendChild(makeKpi(item[0], item[1], item[2])); });
  }

  function showLiveResults() {
    const p = launchFromControls();
    const c = Fisica.calcular(p.v0, p.ang, p.g);
    const t = Math.min(state.t, endTime(Fisica.cancha(p.v0, p.ang, p.g)));
    const position = Fisica.posicion(p.v0, p.ang, p.g, t);
    const velocity = Fisica.velocidad(p.v0, p.ang, p.g, t);
    $('tt').textContent = f2(t);
    const live = [
      ['Distancia x(t)', f2(position.x), 'm'],
      ['Altura y(t) sobre la mano', f2(position.y), 'm'],
      ['Vx constante', f2(velocity.vx), 'm/s'],
      ['Vy actual', f2(velocity.vy), 'm/s']
    ];
    const target = $('vivo');
    target.replaceChildren();
    live.forEach(function (item) { target.appendChild(makeKpi(item[0], item[1], item[2])); });
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 20 || height < 20) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return { ctx: ctx, width: width, height: height };
  }

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBall(ctx, x, y, angle, radius) {
    const r = radius || 11;
    ctx.save();
    const shade = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    shade.addColorStop(0, '#ffffff');
    shade.addColorStop(.56, '#f8fbff');
    shade.addColorStop(1, '#a4c4de');
    ctx.fillStyle = shade;
    ctx.strokeStyle = '#1a5d8b';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#1a6498';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -r * .17, r * .7, -.9, .9);
    ctx.arc(0, r * .17, r * .7, Math.PI - .9, Math.PI + .9);
    ctx.stroke();
    ctx.restore();
  }

  function drawFallbackPlayer(ctx, x, floor, height) {
    const h = height;
    ctx.save();
    ctx.strokeStyle = '#48cde7';
    ctx.fillStyle = '#123b72';
    ctx.lineWidth = Math.max(3, h * .025);
    ctx.beginPath();
    ctx.arc(x + h * .17, floor - h * .86, h * .07, 0, Math.PI * 2);
    ctx.fillStyle = '#eeb080';
    ctx.fill();
    ctx.strokeStyle = '#123b72';
    ctx.beginPath();
    ctx.moveTo(x + h * .17, floor - h * .78);
    ctx.lineTo(x + h * .16, floor - h * .42);
    ctx.lineTo(x, floor);
    ctx.moveTo(x + h * .16, floor - h * .42);
    ctx.lineTo(x + h * .35, floor);
    ctx.moveTo(x + h * .16, floor - h * .7);
    ctx.lineTo(x + h * .43, floor - h * .96);
    ctx.moveTo(x + h * .13, floor - h * .7);
    ctx.lineTo(x, floor - h * .9);
    ctx.stroke();
    ctx.restore();
  }

  const PRE = 0.9;                       // segundos de preparación antes de soltar el balón
  const ease = function (u) { return u * u * (3 - 2 * u); };

  function endTime(k) { return k.veredicto === 'red' ? k.tRed : k.tPiso; }

  function leanAngle() {
    if (state.pre < 0.6) return -0.1 * ease(state.pre / 0.6);
    if (state.pre < PRE) return -0.1 * (1 - ease((state.pre - 0.6) / 0.3));
    return 0.07 * Math.sin(Math.PI * Math.min(1, state.t / 0.5));
  }

  function verdictText(k) {
    const C = Fisica.CANCHA, d = f2(k.xPiso - C.FONDO);
    if (k.veredicto === 'valido') return ['good', '✅ ¡Saque válido! El balón pasa la red a ' + f2(k.alturaRed) + ' m del piso (la red mide ' + C.RED + ' m) y cae dentro de la cancha contraria, a ' + d + ' m de la línea de saque.'];
    if (k.veredicto === 'largo') return ['warn', '⚠️ El balón pasa la red, pero cae fuera: llega a ' + d + ' m de la línea de saque y la cancha termina a 18 m. Prueba con menos velocidad.'];
    if (k.veredicto === 'red') return ['bad', '❌ No pasa la red: al llegar a ella el balón está a ' + f2(k.alturaRed) + ' m del piso y la red mide ' + C.RED + ' m. Prueba subir el ángulo o la velocidad.'];
    return ['bad', '❌ No llega a la red: cae a ' + d + ' m de la línea de saque y la red está a 9 m. Prueba aumentar la velocidad o cambiar el ángulo.'];
  }

  function showVerdict(show) {
    const box = $('verdict');
    if (!show) { box.className = 'verdict'; box.textContent = 'Pulsa “Hacer el saque” para ver si el balón pasa la red.'; return; }
    const p = launchFromControls(), v = verdictText(Fisica.cancha(p.v0, p.ang, p.g));
    box.className = 'verdict ' + v[0];
    box.textContent = v[1];
  }

  function drawSimulation() {
    const setup = prepareCanvas($('cSim'));
    if (!setup) return;
    const ctx = setup.ctx, w = setup.width, h = setup.height, C = Fisica.CANCHA;
    const p = launchFromControls();
    const c = Fisica.calcular(p.v0, p.ang, p.g), k = Fisica.cancha(p.v0, p.ang, p.g);
    const end = endTime(k);
    const x0 = -2.6, x1 = Math.max(C.FONDO_RIVAL + 1.5, Math.min(k.xPiso * 1.04, 90));
    const yTop = C.MANO + Math.min(Math.max(c.altura * 1.15, 1.6), 90);
    const padL = 6, padR = 8, padT = 12, padB = 34;
    const s = Math.min((w - padL - padR) / (x1 - x0), (h - padT - padB) / yTop);
    const floorY = h - padB;
    const X = function (x) { return padL + (x - x0) * s; };
    const Y = function (y) { return floorY - (y + C.MANO) * s; };   // y = altura sobre la mano

    const sky = ctx.createLinearGradient(0, 0, 0, floorY);
    sky.addColorStop(0, '#d8f1ff'); sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e4eef7'; ctx.fillRect(0, floorY, w, h - floorY);
    ctx.fillStyle = '#2f8fc9'; ctx.fillRect(X(C.FONDO), floorY, X(C.FONDO_RIVAL) - X(C.FONDO), 9);
    ctx.fillStyle = '#9fd3ee'; ctx.fillRect(X(C.RED_X - 3), floorY, X(C.RED_X + 3) - X(C.RED_X - 3), 9);
    [C.FONDO, C.RED_X - 3, C.RED_X + 3, C.FONDO_RIVAL].forEach(function (x) { line(ctx, X(x), floorY, X(x), floorY + 9, '#ffffff', 2); });
    line(ctx, 0, floorY, w, floorY, '#1a5d8b', 1.5);
    ctx.font = '10px system-ui'; ctx.fillStyle = '#35597d';
    if (s * 9 > 70) {
      ctx.fillText('Zona de saque', Math.max(2, X(C.FONDO) - 74), floorY + 21);
      ctx.fillText('Cancha contraria', X(C.RED_X) + 4, floorY + 21);
      ctx.fillText('Línea de saque', X(C.FONDO) + 4, floorY + 21);
    }
    const stepM = s * 5 > 26 ? 5 : s * 10 > 26 ? 10 : 20;
    for (let m = 0; X(m) < w - 14; m += stepM) { ctx.fillStyle = '#5b7189'; ctx.fillText(m + ' m', X(m) - 6, floorY + 31); }

    // Red: 2,24 m de alto (poste, malla y cinta superior)
    const nx = X(C.RED_X), nTop = floorY - C.RED * s, nBot = floorY - (C.RED - 1) * s;
    line(ctx, nx, floorY, nx, nTop - 4, '#425a78', 3);
    ctx.save(); ctx.fillStyle = 'rgba(40,70,110,.12)'; ctx.fillRect(nx - 2, nTop, 4, nBot - nTop); ctx.restore();
    for (let y = nTop; y < nBot; y += 5) line(ctx, nx - 3, y, nx + 3, y, 'rgba(40,70,110,.35)', 1);
    line(ctx, nx - 6, nTop, nx + 6, nTop, '#ffffff', 3);
    ctx.fillStyle = '#35597d'; ctx.fillText('Red 2.24 m', nx - 25, nTop - 8);

    // Jugadora: la mano coincide con el origen (0, 0) de las ecuaciones
    const ratio = player.naturalWidth ? player.naturalWidth / player.naturalHeight : .78;
    const ph = (C.MANO / 0.915) * s, pw = ph * ratio;
    const px = X(0) - pw * .94, py = Y(0) - ph * .085, pivotX = px + pw * .5;
    const lean = leanAngle();
    ctx.save();
    ctx.translate(pivotX, floorY); ctx.rotate(lean); ctx.translate(-pivotX, -floorY);
    if (player.complete && player.naturalWidth) ctx.drawImage(player, px, py, pw, ph);
    else drawFallbackPlayer(ctx, px, floorY, ph);
    ctx.restore();

    // Trayectoria prevista (punteada) hasta el piso o hasta la red
    const pts = [];
    for (let i = 0; i <= 140; i += 1) pts.push(Fisica.posicion(p.v0, p.ang, p.g, end * i / 140));
    const r = Math.max(6, Math.min(11, s * .4)), ballShift = r;
    const path = function (n) { ctx.beginPath(); for (let i = 0; i < n; i += 1) { const u = X(pts[i].x), v = Y(pts[i].y) - ballShift; if (i) ctx.lineTo(u, v); else ctx.moveTo(u, v); } ctx.stroke(); };
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#1db5df'; ctx.lineWidth = 2; path(pts.length); ctx.restore();
    const done = state.pre >= PRE ? Math.max(2, Math.round(pts.length * Math.min(1, state.t / end))) : 0;
    if (done) { ctx.save(); ctx.strokeStyle = '#0d2a52'; ctx.lineWidth = 3; path(done); ctx.restore(); }

    // Puntos clave: altura máxima y alcance ideal (a la altura de la mano)
    ctx.font = '700 10px system-ui';
    const dot = function (x, y, txt, col, hollow) {
      ctx.beginPath(); ctx.arc(X(x), Y(y) - ballShift, 4, 0, Math.PI * 2);
      if (hollow) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
      ctx.fillStyle = col; ctx.fillText(txt, X(x) + 7, Y(y) - ballShift - 7);
    };
    if (c.altura > 0.05) { line(ctx, X(c.alcance / 2), Y(0) - ballShift, X(c.alcance / 2), Y(c.altura) - ballShift, 'rgba(244,162,29,.7)', 1.5, [3, 3]); dot(c.alcance / 2, c.altura, 'H = ' + f2(c.altura) + ' m', '#c47a00'); }
    if (c.alcance > 0.05 && X(c.alcance) < w) dot(c.alcance, 0, 'R = ' + f2(c.alcance) + ' m', '#d55791', true);

    // Balón: en la mano durante la preparación; luego sigue las ecuaciones
    let bx, by, spin = state.t * 9;
    if (state.pre < PRE) {
      const lx = X(0) - pivotX, ly = Y(0) - floorY;
      bx = pivotX + lx * Math.cos(lean) - ly * Math.sin(lean);
      by = floorY + lx * Math.sin(lean) + ly * Math.cos(lean) - ballShift;
    } else {
      const t = Math.min(state.t, end), pt = Fisica.posicion(p.v0, p.ang, p.g, t);
      bx = X(pt.x); by = Y(pt.y) - ballShift;
      if (k.veredicto === 'red' && state.t >= end) {
        const dp = Math.min(1, state.drop / 0.5), yy = (k.yRed + C.MANO) * (1 - dp * dp);
        bx = nx - r; by = floorY - yy * s - r;
      }
    }
    if (bx > -20 && bx < w + 20) {
      ctx.save(); ctx.fillStyle = 'rgba(20,50,90,.18)';
      ctx.beginPath(); ctx.ellipse(bx, floorY + 3, r * .9, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (state.pre >= 0.6 && state.pre < PRE) {    // estela del brazo al golpear
        ctx.save(); ctx.strokeStyle = 'rgba(29,181,223,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(bx - ph * .12, by + ph * .18, ph * .2, -2.5, -0.9); ctx.stroke(); ctx.restore();
      }
      if (state.pre >= PRE && state.t < 0.16) { ctx.save(); ctx.fillStyle = 'rgba(255,214,102,.65)'; ctx.beginPath(); ctx.arc(X(0), Y(0) - ballShift, 20 * (1 - state.t / 0.16), 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      drawBall(ctx, bx, by, spin, r);
    }
    ctx.font = '700 11px system-ui'; ctx.fillStyle = '#0d2a52';
    if (!state.running && !state.completed && state.pre === 0) ctx.fillText('Balón listo', Math.min(bx + 14, w - 70), by - 12);
    if (state.completed && k.veredicto !== 'red') { ctx.fillStyle = '#c0307a'; ctx.fillText('Cae al piso', Math.max(4, Math.min(X(k.xPiso) - 30, w - 70)), floorY - 8); }
  }

  function niceStep(value) {
    const raw = Math.max(value / 5, .01);
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / power;
    const choice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return choice * power;
  }

  function drawEmptyChart(ctx, w, h, message) {
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#dceaf6';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 22, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#55708f';
    ctx.font = '700 15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(message, w / 2, h / 2 + 18);
    ctx.font = '13px system-ui';
    ctx.fillText('Los datos aparecerán aquí.', w / 2, h / 2 + 40);
    ctx.textAlign = 'start';
  }

  function drawTrajectoryChart(canvas, launches, emptyMessage) {
    const setup = prepareCanvas(canvas);
    if (!setup) return;
    const ctx = setup.ctx;
    const w = setup.width;
    const h = setup.height;
    if (!launches.length) {
      drawEmptyChart(ctx, w, h, emptyMessage || 'Aún no hay pruebas');
      return;
    }
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(0, 0, w, h);
    const margin = { left: 49, right: 18, top: 18, bottom: 36 };
    let maxX = 1;
    let maxY = 1;
    launches.forEach(function (launch) {
      const c = Fisica.calcular(launch.v0, launch.ang, launch.g);
      maxX = Math.max(maxX, c.alcance);
      maxY = Math.max(maxY, c.altura);
    });
    maxX *= 1.12;
    maxY *= 1.18;
    const xTo = function (x) { return margin.left + x * (w - margin.left - margin.right) / maxX; };
    const yTo = function (y) { return h - margin.bottom - y * (h - margin.top - margin.bottom) / maxY; };
    const xStep = niceStep(maxX);
    const yStep = niceStep(maxY);
    ctx.font = '11px system-ui';
    for (let x = 0; x <= maxX + xStep * .2; x += xStep) {
      const px = xTo(x);
      line(ctx, px, margin.top, px, h - margin.bottom, '#dce8f2', 1);
      ctx.fillStyle = '#5b7189';
      ctx.fillText(f2(x), px - 8, h - margin.bottom + 16);
    }
    for (let y = 0; y <= maxY + yStep * .2; y += yStep) {
      const py = yTo(y);
      line(ctx, margin.left, py, w - margin.right, py, '#dce8f2', 1);
      ctx.fillStyle = '#5b7189';
      ctx.fillText(f2(y), 4, py + 4);
    }
    line(ctx, margin.left, h - margin.bottom, w - margin.right, h - margin.bottom, '#7890aa', 1.3);
    line(ctx, margin.left, margin.top, margin.left, h - margin.bottom, '#7890aa', 1.3);
    ctx.fillStyle = '#3d5874';
    ctx.fillText('distancia horizontal (m)', w / 2 - 56, h - 8);
    ctx.save();
    ctx.translate(13, h / 2 + 44);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('altura (m)', 0, 0);
    ctx.restore();
    launches.forEach(function (launch) {
      const points = Fisica.trayectoria(launch.v0, launch.ang, launch.g);
      ctx.save();
      ctx.strokeStyle = launch.color;
      ctx.lineWidth = 2.7;
      ctx.beginPath();
      points.forEach(function (point, index) {
        if (index === 0) ctx.moveTo(xTo(point.x), yTo(Math.max(0, point.y)));
        else ctx.lineTo(xTo(point.x), yTo(Math.max(0, point.y)));
      });
      ctx.stroke();
      ctx.restore();
    });
  }

  function renderTable(table, entries, emptyText) {
    table.replaceChildren();
    const caption = document.createElement('caption');
    caption.textContent = entries.length ? 'Valores calculados para cada lanzamiento guardado.' : emptyText;
    table.appendChild(caption);
    if (!entries.length) return;
    const headers = ['Prueba', 'V₀ (m/s)', 'Ángulo (°)', 'g (m/s²)', 'Altura (m)', 'Tiempo (s)', 'Alcance (m)'];
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach(function (text) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text;
      headRow.appendChild(cell);
    });
    head.appendChild(headRow);
    const body = document.createElement('tbody');
    entries.forEach(function (entry, index) {
      const c = Fisica.calcular(entry.v0, entry.ang, entry.g);
      const row = document.createElement('tr');
      const cells = [
        '● ' + (index + 1),
        valueForControl(entry.v0),
        valueForControl(entry.ang),
        valueForControl(entry.g),
        f2(c.altura),
        f2(c.tiempo),
        f2(c.alcance)
      ];
      cells.forEach(function (text, cellIndex) {
        const cell = document.createElement('td');
        cell.textContent = text;
        if (cellIndex === 0) {
          cell.style.color = entry.color;
          cell.style.fontWeight = '800';
        }
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    table.append(head, body);
  }

  function drawComparison() {
    drawTrajectoryChart($('cComp'), state.comparisons, 'Guarda un saque para compararlo');
    renderTable($('tabla'), state.comparisons, 'Aún no has guardado saques para comparar.');
  }

  function updateComparisonStatus(message) {
    if (message) {
      $('compStatus').textContent = message;
      return;
    }
    const count = state.comparisons.length;
    $('compStatus').textContent = count ? 'Has guardado ' + count + ' de 3 saques.' : 'Todavía no hay saques guardados.';
  }

  function buildChallenges() {
    const container = $('listaRetos');
    RETOS.forEach(function (ch, index) {
      state.challengeRuns.push([]);
      const details = document.createElement('details');
      details.className = 'challenge';
      details.open = index === 0;
      details.innerHTML =
        '<summary><span class="challenge-number">' + (index + 1) + '</span><span>' + ch.title + '<br><span class="challenge-subtitle">Responde, prueba y compara</span></span></summary>' +
        '<div class="challenge-body">' +
        '<p class="step-label">Paso 1 · Responde</p>' +
        '<fieldset class="quiz"><legend class="challenge-question">' + ch.question + '</legend>' +
        ch.options.map(function (text, o) { return '<label class="opt"><input type="radio" name="q' + index + '" value="' + o + '"><b>' + LETTERS[o] + '</b><span>' + text + '</span></label>'; }).join('') +
        '</fieldset>' +
        '<div class="challenge-actions"><button type="button" class="pri check">Comprobar respuesta</button></div>' +
        '<div class="answer-feedback" role="status" aria-live="polite"></div>' +
        '<div class="experiment" hidden>' +
        '<p class="step-label">Paso 2 · Experimenta</p><p class="hint">' + ch.hint + '</p>' +
        '<div class="challenge-control"><div class="range-head"><label for="reto-control-' + index + '">Valor que vas a probar: ' + labelFor(ch.variable) + '</label><output></output></div>' +
        '<input type="range" id="reto-control-' + index + '" min="' + ch.min + '" max="' + ch.max + '" step="' + ch.step + '" value="' + ch.start + '"></div>' +
        '<p class="fixed-values">' + fixedText(ch) + '</p>' +
        '<div class="challenge-actions"><button type="button" class="pri save"></button><button type="button" class="clear">Limpiar pruebas</button><button type="button" class="reveal">Ver qué significan mis resultados</button></div>' +
        '<p class="challenge-feedback" role="status"></p>' +
        '<canvas class="chart"></canvas><div class="table-wrap"><table></table></div>' +
        '<div class="conclusion"></div></div></div>';
      container.appendChild(details);
      const q = function (sel) { return details.querySelector(sel); };
      const range = q('input[type=range]'), output = q('output'), save = q('.save'), conclusion = q('.conclusion');
      const view = { details: details, save: save, chart: q('canvas'), table: q('table'), feedback: q('.challenge-feedback') };
      challengeViews.push(view);
      const refreshRange = function () { output.textContent = valueForControl(range.value) + unitFor(ch.variable); };
      const refreshConclusion = function () {
        if (!conclusion.classList.contains('visible')) return;
        const runs = state.challengeRuns[index].slice().sort(function (a, b) { return a[ch.variable] - b[ch.variable]; });
        conclusion.replaceChildren();
        const mine = document.createElement('p'), why = document.createElement('p');
        mine.innerHTML = '<b>📊 Tus resultados:</b> ';
        mine.append(runs.length >= 2 ? ch.interpret(runs) : 'Guarda al menos 2 pruebas distintas para poder interpretarlas.');
        why.innerHTML = '<b>💡 Idea clave:</b> ';
        why.append(ch.conclusion);
        conclusion.append(mine, why);
      };
      q('.check').addEventListener('click', function () {
        const picked = details.querySelector('input[name="q' + index + '"]:checked');
        const box = q('.answer-feedback');
        if (!picked) { box.className = 'answer-feedback'; box.textContent = 'Elige una opción (A, B o C) y vuelve a pulsar “Comprobar respuesta”.'; return; }
        const sel = Number(picked.value), good = sel === ch.correct;
        box.className = 'answer-feedback ' + (good ? 'good' : 'bad');
        box.innerHTML = good
          ? '<p><b>' + ch.ok + '</b></p><p>Esto sucede porque ' + ch.why + '</p><p>🏐 Ejemplo: ' + ch.example + '</p>'
          : '<p><b>No te preocupes, vamos a aprender juntos.</b> La respuesta correcta era la opción ' + LETTERS[ch.correct] + '. ' + ch.wrong[sel] + '</p><p>Esto sucede porque ' + ch.why + '</p><p>🏐 Ejemplo: ' + ch.example + '</p>';
        if (good) state.score.add(index);
        $('score').textContent = 'Aciertos: ' + state.score.size + ' de ' + RETOS.length;
        q('.experiment').hidden = false;
        renderChallenge(index);
      });
      range.addEventListener('input', refreshRange);
      save.addEventListener('click', function () {
        const runs = state.challengeRuns[index];
        if (runs.length >= 4) { view.feedback.textContent = 'Ya guardaste 4 pruebas. Pulsa “Limpiar pruebas” si quieres repetir el reto.'; return; }
        const test = { v0: ch.base.v0, ang: ch.base.ang, g: ch.base.g, color: COLORS[runs.length] };
        test[ch.variable] = Number(range.value);
        runs.push(test);
        view.feedback.textContent = 'Prueba ' + runs.length + ' guardada. Compara sus valores en la tabla.';
        renderChallenge(index);
        refreshConclusion();
      });
      q('.clear').addEventListener('click', function () {
        state.challengeRuns[index].length = 0;
        conclusion.classList.remove('visible');
        q('.reveal').textContent = 'Ver qué significan mis resultados';
        view.feedback.textContent = 'Pruebas limpiadas. Puedes empezar una comparación nueva.';
        renderChallenge(index);
      });
      q('.reveal').addEventListener('click', function () {
        const visible = conclusion.classList.toggle('visible');
        q('.reveal').textContent = visible ? 'Ocultar resultados' : 'Ver qué significan mis resultados';
        refreshConclusion();
      });
      details.addEventListener('toggle', function () { if (details.open) window.requestAnimationFrame(function () { renderChallenge(index); }); });
      refreshRange();
      renderChallenge(index);
    });
  }

  function unitFor(variable) {
    return variable === 'v0' ? ' m/s' : variable === 'ang' ? '°' : ' m/s²';
  }

  function labelFor(variable) {
    return variable === 'v0' ? 'velocidad inicial' : variable === 'ang' ? 'ángulo' : 'gravedad';
  }

  function fixedText(challenge) {
    const fixed = [];
    ['v0', 'ang', 'g'].forEach(function (key) {
      if (key !== challenge.variable) fixed.push(labelFor(key) + ': ' + valueForControl(challenge.base[key]) + unitFor(key));
    });
    return 'Valores que se mantienen iguales: ' + fixed.join(' · ') + '.';
  }

  function renderChallenge(index) {
    const view = challengeViews[index];
    if (!view) return;
    const runs = state.challengeRuns[index];
    const remaining = 4 - runs.length;
    view.save.textContent = remaining > 0 ? 'Guardar prueba ' + (runs.length + 1) + ' de 4' : 'Límite de 4 pruebas';
    drawTrajectoryChart(view.chart, runs, 'Guarda una prueba para ver la trayectoria');
    renderTable(view.table, runs, 'Aún no hay pruebas guardadas en este reto.');
  }

  function resetToReady(message) {
    state.running = false; state.paused = false;
    state.t = 0; state.pre = 0; state.drop = 0;
    state.completed = false;
    $('bPausa').textContent = 'Pausar';
    if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
    setSceneStatus('Lista', '', message || 'Lista para sacar: el balón está en la mano de la jugadora.');
    showVerdict(false);
    showLiveResults();
    drawSimulation();
  }

  function beginServe() {
    if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
    state.running = true; state.paused = false; state.completed = false;
    state.t = 0; state.pre = 0; state.drop = 0;
    $('bPausa').textContent = 'Pausar';
    state.lastFrame = performance.now();
    showVerdict(false);
    setSceneStatus('En vuelo', 'running', 'La jugadora se prepara y saca. Observa la altura y el alcance en tiempo real.');
    if (reduceMotion) {
      const p = launchFromControls(), k = Fisica.cancha(p.v0, p.ang, p.g);
      state.pre = PRE; state.t = endTime(k); state.drop = 1;
      finishServe();
    } else {
      drawSimulation();
      state.animationFrame = requestAnimationFrame(animateServe);
    }
  }

  function animateServe(now) {
    if (!state.running) return;
    const p = launchFromControls(), k = Fisica.cancha(p.v0, p.ang, p.g), end = endTime(k);
    const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
    state.lastFrame = now;
    if (state.pre < PRE) state.pre = Math.min(PRE, state.pre + dt);
    else if (state.t < end) state.t = Math.min(end, state.t + dt);
    else state.drop += dt;
    if (state.t >= end && (k.veredicto !== 'red' || state.drop >= 0.5)) { finishServe(); return; }
    showLiveResults();
    drawSimulation();
    state.animationFrame = requestAnimationFrame(animateServe);
  }

  function finishServe() {
    state.running = false;
    state.completed = true;
    state.animationFrame = null;
    setSceneStatus('Completó', 'done', 'Saque completado. Lee el resultado, cambia una sola variable y vuelve a intentarlo.');
    showLiveResults();
    showVerdict(true);
    drawSimulation();
  }

  // ---------- Sección 1: Aprende lo esencial ----------
  const CONCEPTOS = [
    ['🏐', '¿Qué es el movimiento parabólico?', 'Es el recorrido curvo de un objeto lanzado que, después de salir, solo es movido por la gravedad. La curva se llama parábola.', 'Un saque de voleibol, un balón pateado o el agua de una fuente.'],
    ['↗️', '¿Por qué el balón dibuja una curva?', 'Hacia adelante sigue avanzando; hacia arriba, la gravedad lo frena, lo detiene un instante y lo hace bajar. Los dos movimientos juntos forman la curva.', 'Es como caminar hacia adelante mientras saltas: avanzas y subes y bajas a la vez.'],
    ['💨', 'Velocidad inicial', 'Qué tan rápido golpeamos el balón al salir de la mano. Se mide en metros por segundo (m/s).', 'Un saque suave sale despacio; uno potente sale rápido.'],
    ['📐', 'Ángulo de lanzamiento', 'Hacia dónde dirigimos el saque: 0° es horizontal y 90° es recto hacia arriba.', 'Si apuntas muy alto, el balón sube mucho; si apuntas plano, avanza rápido.'],
    ['⬇️', 'Gravedad', 'La fuerza que hace que el balón vuelva hacia el suelo. En la Tierra es de unos 9.8 m/s²: cada segundo, el balón cae 9.8 m/s más rápido.', 'Por eso, por más fuerte que saques, el balón siempre termina bajando.'],
    ['⛰️', 'Altura máxima', 'El punto más alto que alcanza el balón. Allí deja de subir por un instante antes de bajar.', 'El momento en que el balón “se queda quieto” arriba, justo antes de caer.'],
    ['↔️', 'Alcance horizontal', 'La distancia horizontal que recorre el balón desde que sale de la mano.', 'Lo que medirías con una cinta en el piso, desde la jugadora hasta donde cae.'],
    ['➗', '¿Qué relación tienen las matemáticas?', 'Con seno y coseno separamos la velocidad en una parte horizontal y otra vertical. Con ecuaciones calculamos tiempo, altura y alcance antes de que el balón caiga.', 'Por ejemplo: alcance R = V₀² · sen(2θ) / g.']
  ];
  const DEMO = { v: [10, 50, 9.8], d: null };
  const DEMO_TEXT = {
    v: '💨 La flecha muestra la velocidad inicial: qué tan rápido sale el balón de la mano (aquí, 10 m/s). Flecha larga = saque rápido.',
    ang: '📐 El arco muestra el ángulo de salida respecto al piso (aquí, 50°). Más ángulo = el balón sube más.',
    g: '⬇️ Las flechas azules muestran la gravedad: siempre tira del balón hacia abajo (9.8 m/s²) y por eso la trayectoria se curva.',
    h: '⛰️ La línea naranja marca la altura máxima: el punto más alto del recorrido.',
    r: '↔️ La línea rosada marca el alcance: la distancia horizontal que recorre el balón.'
  };
  let demoKey = 'v';

  function drawDemo(now) {
    const canvas = $('cDemo');
    if (!$('learn').classList.contains('on')) { state.demoOn = false; return; }
    const setup = prepareCanvas(canvas);
    if (setup) {
      const ctx = setup.ctx, w = setup.width, h = setup.height, v0 = 10, ang = 50, g = 9.8;
      const c = Fisica.calcular(v0, ang, g), pad = { l: 24, r: 24, t: 28, b: 26 };
      const s = Math.min((w - pad.l - pad.r) / c.alcance, (h - pad.t - pad.b) / (c.altura * 1.5));
      const X = function (x) { return pad.l + x * s; }, Y = function (y) { return h - pad.b - y * s; };
      ctx.fillStyle = '#f2faff'; ctx.fillRect(0, 0, w, h);
      line(ctx, 0, Y(0), w, Y(0), '#2f8fc9', 3);
      ctx.save(); ctx.strokeStyle = '#9fd3ee'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath();
      Fisica.trayectoria(v0, ang, g).forEach(function (q, i) { if (i) ctx.lineTo(X(q.x), Y(q.y)); else ctx.moveTo(X(q.x), Y(q.y)); });
      ctx.stroke(); ctx.restore();
      const u = Math.min(1, ((now / 1000) % 3.4) / 2.6), t = c.tiempo * u, q = Fisica.posicion(v0, ang, g, t);
      ctx.font = '700 12px system-ui';
      if (demoKey === 'v') { const L = Math.min(150, w * .22), dx = Math.cos(Fisica.rad(ang)) * L, dy = Math.sin(Fisica.rad(ang)) * L; line(ctx, X(0), Y(0), X(0) + dx, Y(0) - dy, '#d55791', 4); ctx.fillStyle = '#d55791'; ctx.beginPath(); ctx.arc(X(0) + dx, Y(0) - dy, 5, 0, 7); ctx.fill(); ctx.fillText('Velocidad inicial', X(0) + dx + 8, Y(0) - dy); }
      if (demoKey === 'ang') { line(ctx, X(0), Y(0), X(0) + 90, Y(0), '#566985', 1.5, [4, 4]); ctx.strokeStyle = '#087cb8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(0), Y(0), 60, -Fisica.rad(ang), 0); ctx.stroke(); ctx.fillStyle = '#087cb8'; ctx.fillText('50°', X(0) + 66, Y(0) - 16); }
      if (demoKey === 'g') { ctx.fillStyle = '#087cb8'; [.2, .5, .8].forEach(function (f) { const gx = X(c.alcance * f); line(ctx, gx, 24, gx, 24 + 38, '#087cb8', 3); ctx.beginPath(); ctx.moveTo(gx - 6, 58); ctx.lineTo(gx + 6, 58); ctx.lineTo(gx, 68); ctx.fill(); }); ctx.fillText('Gravedad', X(c.alcance * .5) + 12, 44); }
      if (demoKey === 'h') { line(ctx, X(c.alcance / 2), Y(0), X(c.alcance / 2), Y(c.altura), '#f4a21d', 3, [5, 4]); ctx.fillStyle = '#c47a00'; ctx.fillText('Altura máxima', X(c.alcance / 2) + 8, Y(c.altura / 2)); }
      if (demoKey === 'r') { line(ctx, X(0), Y(0) + 14, X(c.alcance), Y(0) + 14, '#d55791', 3); ctx.fillStyle = '#d55791'; ctx.fillText('Alcance', X(c.alcance / 2) - 24, Y(0) + 11); }
      drawBall(ctx, X(q.x), Y(q.y), t * 9, 10);
    }
    window.requestAnimationFrame(drawDemo);
  }

  function startDemo() { if (!state.demoOn) { state.demoOn = true; window.requestAnimationFrame(drawDemo); } }

  function buildLearn() {
    $('conceptos').innerHTML = CONCEPTOS.map(function (c) { return '<article class="theory-card"><span class="theory-icon">' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p><p class="example">👉 ' + c[3] + '</p></article>'; }).join('');
    $('demoText').textContent = DEMO_TEXT.v;
    document.querySelectorAll('#demoBtns button').forEach(function (b) {
      b.addEventListener('click', function () {
        demoKey = b.dataset.d;
        document.querySelectorAll('#demoBtns button').forEach(function (x) { x.classList.toggle('on', x === b); });
        $('demoText').textContent = DEMO_TEXT[demoKey];
      });
    });
    const pairs = [['Qué tan rápido sale el balón de la mano', 'Velocidad inicial'], ['Hacia dónde dirijo el saque (qué tan inclinado)', 'Ángulo de lanzamiento'], ['La fuerza que hace que el balón vuelva al suelo', 'Gravedad'], ['El punto más alto que alcanza el balón', 'Altura máxima'], ['La distancia horizontal que recorre el balón', 'Alcance']];
    const names = ['Altura máxima', 'Alcance', 'Ángulo de lanzamiento', 'Gravedad', 'Velocidad inicial'];
    $('match').innerHTML = pairs.map(function (pr, i) {
      return '<div class="match-row"><span>' + pr[0] + '</span><select id="m' + i + '" aria-label="' + pr[0] + '"><option value="">Elige…</option>' + names.map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select><span class="mark" id="mk' + i + '"></span></div>';
    }).join('');
    $('bMatch').addEventListener('click', function () {
      let right = 0, empty = 0;
      pairs.forEach(function (pr, i) {
        const v = $('m' + i).value, mk = $('mk' + i);
        if (!v) { empty += 1; mk.textContent = ''; return; }
        if (v === pr[1]) { right += 1; mk.textContent = '✅'; } else mk.textContent = '❌ Era: ' + pr[1];
      });
      $('matchOut').textContent = empty ? 'Falta responder ' + empty + ' frase(s).' : right === pairs.length ? '¡Excelente! 5 de 5. Ya estás listo para simular un saque.' : 'Acertaste ' + right + ' de 5. Mira las correcciones, repasa las tarjetas de arriba y vuelve a intentarlo.';
    });
    startDemo();
  }

  function openTab(id, shouldScroll) {
    document.querySelectorAll('#tabs button').forEach(function (button) {
      const active = button.dataset.tab === id;
      button.classList.toggle('on', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab').forEach(function (panel) {
      panel.classList.toggle('on', panel.id === id);
    });
    if (id === 'learn') {
      startDemo();
    } else if (id === 'sim') {
      drawSimulation();
      showLiveResults();
    } else if (id === 'comp') {
      drawComparison();
    } else if (id === 'retos') {
      challengeViews.forEach(function (view, index) {
        if (view.details.open) renderChallenge(index);
      });
    }
    if (shouldScroll) document.getElementById('contenido').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    $('v0').value = String(preset.v0);
    $('ang').value = String(preset.ang);
    $('g').value = String(preset.g);
    document.querySelectorAll('.preset').forEach(function (button) {
      button.classList.toggle('active', button.dataset.preset === name);
    });
    updateControlLabels();
    showMainResults();
    resetToReady('Valores sugeridos cargados. Pulsa “Hacer el saque” para probarlos.');
  }

  function onControlChange() {
    document.querySelectorAll('.preset').forEach(function (button) { button.classList.remove('active'); });
    updateControlLabels();
    showMainResults();
    resetToReady('Valores actualizados. El balón volvió a la mano para un nuevo saque.');
  }

  function bindEvents() {
    document.querySelectorAll('#tabs button').forEach(function (button) {
      button.addEventListener('click', function () { openTab(button.dataset.tab, false); });
    });
    document.querySelectorAll('[data-go]').forEach(function (button) {
      button.addEventListener('click', function () { openTab(button.dataset.go, true); });
    });
    ['v0', 'ang', 'g'].forEach(function (id) {
      $(id).addEventListener('input', onControlChange);
    });
    document.querySelectorAll('.preset').forEach(function (button) {
      button.addEventListener('click', function () { applyPreset(button.dataset.preset); });
    });
    $('bIniciar').addEventListener('click', beginServe);
    $('bPausa').addEventListener('click', function () {
      if (state.paused) {
        state.paused = false; state.running = true; state.lastFrame = performance.now();
        $('bPausa').textContent = 'Pausar';
        setSceneStatus('En vuelo', 'running', 'Saque en movimiento.');
        state.animationFrame = requestAnimationFrame(animateServe);
        return;
      }
      if (!state.running) {
        $('simStatus').textContent = 'No hay un saque en movimiento para pausar.';
        return;
      }
      state.running = false; state.paused = true;
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
      $('bPausa').textContent = 'Continuar';
      setSceneStatus('Pausada', 'running', 'Saque pausado. Pulsa “Continuar” para seguir o “Volver al inicio”.');
      drawSimulation();
    });
    $('bReinicio').addEventListener('click', function () { resetToReady(); });
    $('bGuardar').addEventListener('click', function () {
      if (state.comparisons.length >= 3) {
        updateComparisonStatus('Ya hay 3 saques guardados. Borra la comparación para guardar otros valores.');
        return;
      }
      const entry = launchFromControls();
      entry.color = COLORS[state.comparisons.length];
      state.comparisons.push(entry);
      updateComparisonStatus('Guardaste el saque ' + state.comparisons.length + ' de 3. Cambia los controles y guarda otro para compararlo.');
      drawComparison();
    });
    $('bBorrar').addEventListener('click', function () {
      state.comparisons.length = 0;
      updateComparisonStatus('Comparación borrada. Puedes guardar nuevas pruebas.');
      drawComparison();
    });
    window.addEventListener('resize', function () {
      window.requestAnimationFrame(function () {
        drawSimulation();
        drawComparison();
        challengeViews.forEach(function (view, index) {
          if (view.details.open) renderChallenge(index);
        });
      });
    });
    document.addEventListener('keydown', function (event) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (event.key === 'Enter' && $('sim').classList.contains('on') && tag !== 'TEXTAREA' && tag !== 'BUTTON' && tag !== 'INPUT') {
        event.preventDefault();
        beginServe();
      }
    });
  }

  function initialize() {
    buildChallenges();
    bindEvents();
    applyPreset('normal');
    buildLearn();
    drawComparison();
  }

  initialize();
}());
