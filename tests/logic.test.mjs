// node tests/logic.test.mjs — distancias, filtro GPS, rachas, medallas y premios
import assert from 'node:assert/strict';
import { distancia, rumbo, aceptarLectura, largoRuta, puntoEnRuta, RUTA_DEMO } from '../docs/js/walk.js';
import { estadisticas, rachas, medallasLogradas, accesoriosDesbloqueados } from '../docs/js/progress.js';

// Distancia: 1° de latitud ≈ 111,2 km; Plaza de la Independencia → Parque Ecuador ≈ 740 m
assert.ok(Math.abs(distancia([0, 0], [0, 1]) - 111195) < 50);
const d = distancia([-73.050246, -36.827098], [-73.050357, -36.83375]);
assert.ok(d > 700 && d < 780, `plaza→parque ${d}`);
assert.ok(Math.abs(rumbo([0, 0], [0, 1]) - 0) < 1e-6 && Math.abs(rumbo([0, 0], [1, 0]) - 90) < 1e-6);

// Filtro GPS
const p0 = { punto: [-73.05, -36.83], precision: 8, t: 0 };
const metros = (m, dt, precision = 8) => ({ punto: [-73.05, -36.83 + m / 111195], precision, t: dt * 1000 });
assert.equal(aceptarLectura(null, { ...p0, precision: 50 }), false, 'lectura imprecisa');
assert.equal(aceptarLectura(p0, metros(2, 1)), false, 'temblor estando quieto');
assert.equal(aceptarLectura(p0, metros(10, 5)), true, 'caminando 2 m/s');
assert.equal(aceptarLectura(p0, metros(100, 2)), false, 'salto de 50 m/s');

// Ruta de demostración: cerrada, ~1,6 km, y puntoEnRuta recorre el largo
const L = largoRuta(RUTA_DEMO);
assert.ok(L > 1200 && L < 2200, `largo demo ${L}`);
assert.ok(distancia(puntoEnRuta(RUTA_DEMO, 0), RUTA_DEMO[0]) < 1 && distancia(puntoEnRuta(RUTA_DEMO, L), RUTA_DEMO[0]) < 1);

// Rachas: 3 días seguidos terminando ayer → actual 3; un hueco la corta
const dia = (y, m, d, h = 18) => new Date(y, m - 1, d, h).getTime();
const paseo = (t, metrosRecorridos = 1000) => ({ inicio: t, fin: t + 1800e3, duracion: 1800, distancia: metrosRecorridos, pasos: 1400 });
const hoy = dia(2026, 10, 9, 12);
assert.deepEqual(rachas([paseo(dia(2026, 10, 6)), paseo(dia(2026, 10, 7)), paseo(dia(2026, 10, 8))], hoy), { actual: 3, max: 3 });
assert.deepEqual(rachas([paseo(dia(2026, 10, 1)), paseo(dia(2026, 10, 2)), paseo(dia(2026, 10, 5))], hoy), { actual: 0, max: 2 });
assert.deepEqual(rachas([paseo(dia(2026, 9, 30)), paseo(dia(2026, 10, 1))], dia(2026, 10, 1)), { actual: 2, max: 2 }, 'cruce de mes');

// Medallas y premios
const s = estadisticas([paseo(dia(2026, 10, 7, 7), 3200), paseo(dia(2026, 10, 8), 2500), paseo(dia(2026, 10, 9, 10), 600)], hoy);
assert.ok(Math.abs(s.km - 6.3) < 1e-9 && Math.abs(s.kmHoy - 0.6) < 1e-9 && s.racha === 3);
const m = medallasLogradas(s);
for (const id of ['primer-paseo', 'km-1', 'km-5', 'racha-3', 'largo-3', 'madrugador']) assert.ok(m.includes(id), id);
for (const id of ['km-10', 'racha-7', 'paseos-10']) assert.ok(!m.includes(id), id);
const acc = accesoriosDesbloqueados(s);
assert.deepEqual([...acc.persona].sort(), ['bufanda', 'gorro', 'lentes']);
assert.deepEqual([...acc.perro], ['bandana']);

console.log('logic.test: OK');
