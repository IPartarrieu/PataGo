// Progreso del usuario: estadísticas de paseos, rachas, medallas y premios. Lógica pura + guardado local.

export const ZANCADA_M = 0.72; // largo de paso promedio, para estimar pasos a partir de la distancia

// ---------- estadísticas ----------
const diaLocal = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const diaSiguiente = clave => { const [y, m, d] = clave.split('-').map(Number); return diaLocal(new Date(y, m - 1, d + 1)); };

// Racha = días consecutivos con al menos un paseo. "actual" cuenta si el último paseo fue hoy o ayer.
export function rachas(paseos, ahora = Date.now()) {
  const dias = [...new Set(paseos.map(p => diaLocal(p.inicio)))]
    .map(k => k.split('-').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map(a => a.join('-'));
  let max = 0, run = 0, prev = null;
  for (const d of dias) { run = prev && diaSiguiente(prev) === d ? run + 1 : 1; max = Math.max(max, run); prev = d; }
  const h = new Date(ahora), hoy = diaLocal(h), ayer = diaLocal(new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1));
  return { actual: prev === hoy || prev === ayer ? run : 0, max };
}

export function estadisticas(paseos, ahora = Date.now()) {
  const hoy = diaLocal(ahora), deHoy = paseos.filter(p => diaLocal(p.inicio) === hoy);
  const { actual, max } = rachas(paseos, ahora);
  return {
    paseos: paseos.length,
    km: paseos.reduce((s, p) => s + p.distancia, 0) / 1000,
    pasos: paseos.reduce((s, p) => s + p.pasos, 0),
    horas: paseos.reduce((s, p) => s + p.duracion, 0) / 3600,
    kmHoy: deHoy.reduce((s, p) => s + p.distancia, 0) / 1000,
    paseoMasLargoKm: paseos.reduce((m, p) => Math.max(m, p.distancia), 0) / 1000,
    madrugador: paseos.some(p => new Date(p.inicio).getHours() < 8),
    racha: actual,
    rachaMax: max,
  };
}

// ---------- medallas y premios ----------
// Cada medalla puede desbloquear un accesorio para el avatar ("persona") o para el perro ("perro").
export const MEDALLAS = [
  { id: 'primer-paseo', icono: '🐾', nombre: 'Primer paseo', desc: 'Completa tu primer paseo', meta: s => [s.paseos, 1], premio: ['perro', 'bandana'] },
  { id: 'km-1', icono: '🥉', nombre: '1 km', desc: 'Camina 1 km en total', meta: s => [s.km, 1], premio: ['persona', 'gorro'] },
  { id: 'km-5', icono: '🥈', nombre: '5 km', desc: 'Camina 5 km en total', meta: s => [s.km, 5], premio: ['persona', 'bufanda'] },
  { id: 'km-10', icono: '🥇', nombre: '10 km', desc: 'Camina 10 km en total', meta: s => [s.km, 10], premio: ['perro', 'collar'] },
  { id: 'km-25', icono: '🏅', nombre: '25 km', desc: 'Camina 25 km en total', meta: s => [s.km, 25], premio: ['perro', 'sombrero'] },
  { id: 'km-50', icono: '🎖️', nombre: '50 km', desc: 'Camina 50 km en total', meta: s => [s.km, 50], premio: ['persona', 'mochila'] },
  { id: 'km-100', icono: '🏆', nombre: '100 km', desc: 'Camina 100 km en total', meta: s => [s.km, 100], premio: ['persona', 'corona'] },
  { id: 'racha-3', icono: '🔥', nombre: 'Racha de 3 días', desc: 'Pasea 3 días seguidos', meta: s => [s.rachaMax, 3], premio: ['persona', 'lentes'] },
  { id: 'racha-7', icono: '⚡', nombre: 'Semana completa', desc: 'Pasea 7 días seguidos', meta: s => [s.rachaMax, 7], premio: ['perro', 'capa'] },
  { id: 'racha-30', icono: '🌟', nombre: 'Un mes sin parar', desc: 'Pasea 30 días seguidos', meta: s => [s.rachaMax, 30], premio: ['perro', 'corona'] },
  { id: 'largo-3', icono: '🗺️', nombre: 'Gran explorador', desc: 'Un paseo de 3 km o más', meta: s => [s.paseoMasLargoKm, 3], premio: null },
  { id: 'paseos-10', icono: '📅', nombre: '10 paseos', desc: 'Completa 10 paseos', meta: s => [s.paseos, 10], premio: null },
  { id: 'paseos-50', icono: '💯', nombre: '50 paseos', desc: 'Completa 50 paseos', meta: s => [s.paseos, 50], premio: null },
  { id: 'madrugador', icono: '🌅', nombre: 'Madrugador', desc: 'Sal a pasear antes de las 8:00', meta: s => [s.madrugador ? 1 : 0, 1], premio: null },
];

export function progresoMedalla(m, s) {
  const [valor, objetivo] = m.meta(s);
  return { logrado: valor >= objetivo, fraccion: Math.min(1, valor / objetivo), valor, objetivo };
}

export const medallasLogradas = s => MEDALLAS.filter(m => progresoMedalla(m, s).logrado).map(m => m.id);

// Accesorios disponibles según las medallas logradas: { persona: Set, perro: Set }
export function accesoriosDesbloqueados(s) {
  const out = { persona: new Set(), perro: new Set() };
  for (const m of MEDALLAS) if (m.premio && progresoMedalla(m, s).logrado) out[m.premio[0]].add(m.premio[1]);
  return out;
}

// ---------- guardado local ----------
const CLAVE = 'patago-v1';
export const estadoInicial = () => ({
  perfil: null, // { nombre, perro } se completa en la bienvenida
  persona: {}, // rasgos del paseador; los valores por defecto están en avatars.js (POR_DEFECTO)
  perro: {},
  metaKm: 2,
  paseos: [],
});

export function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return { ...estadoInicial(), ...JSON.parse(raw) };
  } catch { /* almacenamiento no disponible o dañado */ }
  return estadoInicial();
}

export function guardar(estado) {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); return true; } catch { return false; }
}
