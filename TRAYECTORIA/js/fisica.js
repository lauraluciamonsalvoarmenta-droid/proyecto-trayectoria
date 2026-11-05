/* ============================================================
   fisica.js — Todas las fórmulas del movimiento parabólico.
   Modelo ideal: sin aire, g constante, sale y cae a la misma altura.
   Unidades: m, s, m/s, m/s². Ángulos en GRADOS (se convierten aquí).
   ============================================================ */
const Fisica = {
  rad(grados) { return grados * Math.PI / 180; },        // grados -> radianes

  // Vx = V0 cos(θ)   Vy = V0 sin(θ)
  componentes(v0, ang) {
    return { vx: v0 * Math.cos(this.rad(ang)), vy: v0 * Math.sin(this.rad(ang)) };
  },

  calcular(v0, ang, g) {
    const { vx, vy } = this.componentes(v0, ang);
    return {
      vx, vy,
      tiempo: 2 * vy / g,                                    // T = 2 V0 sinθ / g
      altura: (vy * vy) / (2 * g),                           // H = V0² sin²θ / 2g
      alcance: (v0 * v0 * Math.sin(this.rad(2 * ang))) / g   // R = V0² sin2θ / g
    };
  },

  // X = Vx t ; Y = Vy t - g t²/2
  posicion(v0, ang, g, t) {
    const { vx, vy } = this.componentes(v0, ang);
    return { x: vx * t, y: vy * t - g * t * t / 2 };
  },

  // vx constante ; vy = Vy - g t
  velocidad(v0, ang, g, t) {
    const { vx, vy } = this.componentes(v0, ang);
    return { vx, vy: vy - g * t };
  },

  // Cancha de voleibol (m). La mano golpea a MANO m del piso; la red mide RED m.
  // Mismas ecuaciones del modelo ideal (sin aire), prolongadas hasta el piso.
  CANCHA: { FONDO: -0.2, RED_X: 8.8, FONDO_RIVAL: 17.8, MANO: 2.3, RED: 2.24 },

  cancha(v0, ang, g) {
    const C = this.CANCHA, { vx, vy } = this.componentes(v0, ang);
    const tPiso = (vy + Math.sqrt(vy * vy + 2 * g * C.MANO)) / g;   // y(t) = -MANO
    const xPiso = vx * tPiso;
    const r = { tPiso, xPiso, tRed: null, yRed: null, veredicto: '' };
    if (vx > 1e-9 && xPiso >= C.RED_X) {
      r.tRed = C.RED_X / vx;
      r.yRed = this.posicion(v0, ang, g, r.tRed).y;                 // altura sobre la mano
      r.alturaRed = r.yRed + C.MANO;                                // altura sobre el piso
    }
    if (xPiso < C.RED_X) r.veredicto = 'corto';
    else if (r.alturaRed < C.RED) r.veredicto = 'red';
    else if (xPiso <= C.FONDO_RIVAL) r.veredicto = 'valido';
    else r.veredicto = 'largo';
    return r;
  },

  trayectoria(v0, ang, g, n = 120) {
    const T = this.calcular(v0, ang, g).tiempo, pts = [];
    for (let i = 0; i <= n; i++) pts.push(this.posicion(v0, ang, g, T * i / n));
    return pts;
  }
};
if (typeof module !== 'undefined') module.exports = Fisica;
