// Ejecutar: node pruebas/pruebas.js
const F = require('../js/fisica.js');
let ok = 0, mal = 0;
const casi = (a, b) => Math.abs(a - b) < 1e-9;
function t(n, c) { c ? ok++ : mal++; console.log((c ? '✔ ' : '✘ ') + n); }

const c = F.calcular(20, 30, 10);   // caso conocido
t('T = 2 s (20 m/s, 30°, g=10)', casi(c.tiempo, 2));
t('H = 5 m', casi(c.altura, 5));
t('R ≈ 34.641 m', Math.abs(c.alcance - 34.641016) < 1e-5);

let mejor = 0, am = 0;
for (let a = 1; a < 90; a++) { const r = F.calcular(30, a, 9.8).alcance; if (r > mejor) { mejor = r; am = a; } }
t('Alcance máximo a 45°', am === 45);
t('30° y 60° igual alcance', casi(F.calcular(25, 30, 9.8).alcance, F.calcular(25, 60, 9.8).alcance));
t('20° y 70° igual alcance', casi(F.calcular(25, 20, 9.8).alcance, F.calcular(25, 70, 9.8).alcance));
t('Más V0 -> más tiempo', F.calcular(30, 40, 9.8).tiempo > F.calcular(20, 40, 9.8).tiempo);

const a = F.calcular(20, 40, 9.8), b = F.calcular(20, 40, 19.6);
t('Doble g -> mitad de H', casi(a.altura / 2, b.altura));
t('Doble g -> mitad de R', casi(a.alcance / 2, b.alcance));
t('Doble g -> mitad de T', casi(a.tiempo / 2, b.tiempo));
t('Y(T) = 0', Math.abs(F.posicion(20, 40, 9.8, a.tiempo).y) < 1e-9);
t('X(T) = R', casi(F.posicion(20, 40, 9.8, a.tiempo).x, a.alcance));
t('Y(T/2) = H', casi(F.posicion(20, 40, 9.8, a.tiempo / 2).y, a.altura));
t('vy = 0 en el punto más alto', Math.abs(F.velocidad(20, 40, 9.8, a.tiempo / 2).vy) < 1e-9);
t('90° -> R=0 ; 0° -> H=0', Math.abs(F.calcular(20, 90, 9.8).alcance) < 1e-9 && F.calcular(20, 0, 9.8).altura === 0);
// Cancha de voleibol
const K = (v, a) => F.cancha(v, a, 9.8).veredicto;
t('Suave (10 m/s, 45°) es válido', K(10, 45) === 'valido');
t('Normal (12 m/s, 40°) es válido', K(12, 40) === 'valido');
t('Potente (16 m/s, 12°) es válido', K(16, 12) === 'valido');
t('Saque flojo (6 m/s, 45°) es corto', K(6, 45) === 'corto');
t('Saque plano (20 m/s, 0°) choca con la red', K(20, 0) === 'red');
t('Saque muy fuerte (30 m/s, 45°) se pasa del fondo', K(30, 45) === 'largo');
t('90° no avanza: cae corto', K(20, 90) === 'corto');
const q = F.cancha(12, 40, 9.8);
t('y(tPiso) = -2.3 m', Math.abs(F.posicion(12, 40, 9.8, q.tPiso).y + 2.3) < 1e-9);
console.log(`\n${ok} correctas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
