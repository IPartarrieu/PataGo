// PataGo — aplicación principal: mapa 3D, avatares, paseos, logros y lugares cercanos.
import { CapaAvatares } from './scene.js';
import { EDITOR, ACCESORIOS, POR_DEFECTO, aplicarRaza } from './avatars.js';
import { Rastreador, distancia } from './walk.js';
import { cargar, guardar, estadisticas, MEDALLAS, progresoMedalla, medallasLogradas, accesoriosDesbloqueados, ZANCADA_M } from './progress.js';

const INICIO = [-73.050246, -36.827098]; // Plaza de la Independencia, Concepción
const $ = id => document.getElementById(id);
const estado = cargar();
// Completa los rasgos con los valores por defecto y descarta los de versiones anteriores (otro tipo de dato)
const sanear = (def, val = {}) => Object.fromEntries(Object.entries(def).map(([k, d]) =>
  [k, val[k] !== undefined && (d === null || Array.isArray(d) === Array.isArray(val[k]) && typeof val[k] === typeof d) ? val[k] : d]));
estado.persona = sanear(POR_DEFECTO.persona, estado.persona);
estado.perro = sanear(POR_DEFECTO.perro, estado.perro);
const nf = (x, d = 0) => x.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtKm = m => nf(m / 1000, m < 10000 ? 2 : 1);
const fmtDur = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = Math.floor(s % 60); return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`; };
const nombrePerro = () => estado.perfil?.perro || 'tu perro';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const persistir = () => guardar(estado);

// ---------- mapa ----------
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: INICIO, zoom: 17.4, pitch: 60, bearing: -20, maxPitch: 70, minZoom: 12,
  attributionControl: { compact: true },
});
const capa = new CapaAvatares(INICIO);
capa.setModelos(estado.persona, estado.perro);
let posicion = null, siguiendo = true, lugares = [], toastTimer, marcarListo;
const mapaListo = new Promise(r => (marcarListo = r)); // se cumple cuando el mapa, los lugares y las capas están cargados

// Íconos de lugares: emoji sobre un círculo blanco con borde de color
const TIPOS = {
  area_verde: { emoji: '🌳', color: '#2f9e44', nombre: 'Área verde' },
  perros: { emoji: '🐕', color: '#7048e8', nombre: 'Parque para perros' },
  veterinaria: { emoji: '🩺', color: '#e03131', nombre: 'Veterinaria' },
  tienda: { emoji: '🦴', color: '#f08c00', nombre: 'Tienda de mascotas' },
};
function iconoEmoji(emoji, color) {
  const s = 72, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
  g.fillStyle = '#1f2840'; g.fill(); g.lineWidth = 6; g.strokeStyle = color; g.stroke();
  g.font = '38px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, s / 2, s / 2 + 2);
  return g.getImageData(0, 0, s, s);
}
const lineaVacia = (coords = []) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });

map.on('load', async () => {
  // fuera los íconos de comercios del mapa base: así destacan las áreas verdes y veterinarias
  for (const l of map.getStyle().layers) if (/^poi_/.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none');
  oscurecerMapa();
  for (const [k, t] of Object.entries(TIPOS)) map.addImage('ic-' + k, iconoEmoji(t.emoji, t.color), { pixelRatio: 2 });
  const datos = await fetch('data/lugares.geojson').then(r => r.json());
  lugares = datos.features;
  map.addSource('lugares', { type: 'geojson', data: datos });
  map.addSource('ruta', { type: 'geojson', data: lineaVacia() });
  map.addSource('historial', { type: 'geojson', data: lineaVacia() });
  const linea = { 'line-cap': 'round', 'line-join': 'round' };
  map.addLayer({ id: 'historial', type: 'line', source: 'historial', layout: linea, paint: { 'line-color': '#8338ec', 'line-width': 6, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'ruta', type: 'line', source: 'ruta', layout: linea, paint: { 'line-color': '#ff5a36', 'line-width': 7 } });
  map.addLayer({
    id: 'lugares', type: 'symbol', source: 'lugares', minzoom: 13,
    layout: {
      'icon-image': ['concat', 'ic-', ['get', 'tipo']], 'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.55, 17, 0.9],
      'icon-allow-overlap': ['step', ['zoom'], false, 16, true],
      'text-field': ['step', ['zoom'], '', 16, ['coalesce', ['get', 'nombre'], '']], 'text-font': ['Noto Sans Bold'], 'text-size': 12,
      'text-offset': [0, 1.6], 'text-anchor': 'top', 'text-optional': true,
    },
    paint: { 'text-color': '#f4f6fb', 'text-halo-color': '#161d2e', 'text-halo-width': 1.6 },
  });
  map.addLayer(capa);
  map.on('click', 'lugares', e => mostrarLugar(e.features[0]));
  map.on('mouseenter', 'lugares', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'lugares', () => (map.getCanvas().style.cursor = ''));
  marcarListo();
});

// Tonos de atardecer sobre el estilo "liberty" (el único de OpenFreeMap con edificios 3D)
function oscurecerMapa() {
  const C = { fondo: '#263042', suelo: '#2b3548', verde: '#2c5541', agua: '#1d4466', edificio: '#4b5772', calle: '#55627c', principal: '#9a7650', borde: '#1b2230', texto: '#dfe6f1', halo: '#1b2230' };
  for (const { id, type, paint } of map.getStyle().layers) {
    const pon = (prop, valor) => { try { map.setPaintProperty(id, prop, valor); } catch { /* propiedad no aplica a esta capa */ } };
    if (paint?.['fill-pattern']) { map.setLayoutProperty(id, 'visibility', 'none'); continue; } // texturas claras: se ven ruidosas en oscuro
    if (/^label_(city|town|village|state|country)/.test(id)) map.setLayerZoomRange(id, 0, 14.5); // no tapar al avatar de cerca
    if (type === 'background') pon('background-color', C.fondo);
    else if (type === 'fill') pon('fill-color', /water/.test(id) ? C.agua : /park|grass|wood|forest|landcover|pitch|cemetery|golf|garden|meadow|scrub/.test(id) ? C.verde : /building/.test(id) ? C.edificio : C.suelo);
    else if (type === 'fill-extrusion') { pon('fill-extrusion-color', C.edificio); pon('fill-extrusion-opacity', 0.92); }
    else if (type === 'line') {
      if (/water|river|stream|canal/.test(id)) pon('line-color', C.agua);
      else if (/casing/.test(id)) pon('line-color', C.borde);
      else if (/motorway|trunk|primary/.test(id)) pon('line-color', C.principal);
      else if (/road|highway|street|bridge|tunnel|path|track|service|minor|secondary|tertiary|link/.test(id)) pon('line-color', C.calle);
      else if (/boundary/.test(id)) pon('line-color', '#6c6488');
      else if (/rail/.test(id)) pon('line-color', '#59627a');
    } else if (type === 'symbol') { pon('text-color', C.texto); pon('text-halo-color', C.halo); }
    else if (type === 'raster') pon('raster-opacity', 0.25);
  }
}

// Si el usuario mueve el mapa con el dedo, se deja de seguir al avatar hasta tocar 📍
map.on('dragstart', () => { siguiendo = false; $('btnCentrar').style.display = 'block'; });
$('btnCentrar').onclick = () => {
  siguiendo = true;
  $('btnCentrar').style.display = 'none';
  if (posicion) map.easeTo({ center: posicion, zoom: Math.max(map.getZoom(), 17), duration: 700 });
};

function mostrarLugar(f) {
  const p = f.properties, [lon, lat] = f.geometry.coordinates, t = TIPOS[p.tipo];
  const d = posicion ? distancia(posicion, [lon, lat]) : null;
  const dir = [p.calle, p.numero].filter(Boolean).join(' ');
  const busqueda = p.nombre ? `${p.nombre}, Concepción` : `${lat},${lon}`;
  new maplibregl.Popup({ offset: 18, maxWidth: '260px' }).setLngLat([lon, lat]).setHTML(`
    <h3>${t.emoji} ${esc(p.nombre || t.nombre)}</h3>
    <p>${t.nombre}${p.area ? ` · ${nf(p.area / 10000, 1)} ha` : ''}${d != null ? ` · a ${d < 1000 ? nf(d) + ' m' : fmtKm(d) + ' km'} (~${Math.max(1, Math.round(d / 80))} min)` : ''}</p>
    ${dir ? `<p>📍 ${esc(dir)}</p>` : ''}${p.horario ? `<p>🕒 ${esc(p.horario)}</p>` : ''}${p.telefono ? `<p>📞 ${esc(p.telefono)}</p>` : ''}
    <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}" target="_blank" rel="noopener">Ver en Google Maps${p.tipo === 'veterinaria' ? ' (horarios)' : ''} ↗</a></p>`).addTo(map);
}

// ---------- ubicación ----------
const params = new URLSearchParams(location.search);
const rastreador = new Rastreador({
  onPosicion: ({ punto, rumbo }) => {
    posicion = punto;
    capa.irA(punto, rumbo);
    if (siguiendo) map.easeTo({ center: punto, duration: 900, easing: t => t });
    if (rastreador.grabando) map.getSource('ruta')?.setData(lineaVacia(rastreador.ruta));
  },
  onError: e => {
    if (rastreador.fuente === 'simulacion') return;
    toast(e.code === 1 ? 'Sin permiso de ubicación.' : 'No pude obtener tu ubicación.', 'Usar simulación', usarSimulacion, 12000);
  },
});
function usarSimulacion() {
  rastreador.iniciar('simulacion');
  $('simVel').style.display = 'block';
  toast('Modo simulación: tu avatar recorre el centro de Concepción.');
}
if (params.has('sim')) usarSimulacion(); else rastreador.iniciar('gps');
$('simVel').onclick = () => { rastreador.velSim = rastreador.velSim === 1 ? 4 : 1; $('simVel').textContent = '×' + rastreador.velSim; };

// ---------- avance del día y racha ----------
function actualizarTop() {
  const s = estadisticas(estado.paseos), enCurso = rastreador.grabando ? rastreador.distancia / 1000 : 0;
  const hoy = s.kmHoy + enCurso, frac = Math.min(1, hoy / estado.metaKm);
  $('txtHoy').textContent = `${nf(hoy, hoy < 10 ? 1 : 0)} / ${nf(estado.metaKm)} km`;
  $('anillo').setAttribute('stroke-dashoffset', String(94.25 * (1 - frac)));
  $('anillo').setAttribute('stroke', frac >= 1 ? '#2f9e44' : '#ff7a59');
  $('txtRacha').textContent = `${s.racha} ${s.racha === 1 ? 'día' : 'días'}`;
}
actualizarTop();

// ---------- paseo ----------
let reloj, wakeLock = null;
async function mantenerPantalla() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && rastreador.grabando) mantenerPantalla(); });

$('btnPasear').onclick = () => (rastreador.grabando ? terminarPaseo() : comenzarPaseo());

function comenzarPaseo() {
  if (!estado.perfil) return bienvenida();
  if (!posicion) return toast('Esperando tu ubicación…', rastreador.fuente === 'simulacion' ? null : 'Usar simulación', usarSimulacion);
  cerrarHoja();
  rastreador.comenzarPaseo();
  map.getSource('historial')?.setData(lineaVacia());
  document.body.classList.add('paseando');
  $('btnPasear').classList.add('paseando');
  $('btnPasear').querySelector('span').textContent = 'TERMINAR';
  $('hud').classList.add('on');
  siguiendo = true;
  $('btnCentrar').style.display = 'none';
  map.easeTo({ center: posicion, zoom: 17.6, pitch: 62, duration: 800 });
  mantenerPantalla();
  const tick = () => {
    const seg = (Date.now() - rastreador.inicio) / 1000, m = rastreador.distancia;
    $('hudTiempo').textContent = fmtDur(seg);
    $('hudKm').textContent = fmtKm(m);
    $('hudPasos').textContent = nf(Math.round(m / ZANCADA_M));
    $('hudRitmo').textContent = m > 50 ? fmtDur(seg / (m / 1000)) : '–';
    actualizarTop();
  };
  tick();
  reloj = setInterval(tick, 1000);
  toast(`¡A pasear con ${nombrePerro()}! 🐾 Mantén la app abierta durante el paseo.`);
}

function terminarPaseo() {
  clearInterval(reloj);
  wakeLock?.release?.().catch(() => {});
  const medAntes = new Set(medallasLogradas(estadisticas(estado.paseos)));
  const paseo = rastreador.terminarPaseo(ZANCADA_M);
  document.body.classList.remove('paseando');
  $('btnPasear').classList.remove('paseando');
  $('btnPasear').querySelector('span').textContent = 'PASEAR';
  $('hud').classList.remove('on');
  const despues = estadisticas([...estado.paseos, paseo]);
  const nuevas = MEDALLAS.filter(m => progresoMedalla(m, despues).logrado && !medAntes.has(m.id));
  modal(`
    <div class="grande">${paseo.distancia >= 1000 ? '🏆' : '🐾'}</div>
    <h2>¡Buen paseo!</h2>
    <p>${esc(nombrePerro())} y tú caminaron juntos.</p>
    <div class="stats">
      <div class="stat"><b>${fmtKm(paseo.distancia)} km</b><span>distancia</span></div>
      <div class="stat"><b>${fmtDur(paseo.duracion)}</b><span>tiempo</span></div>
      <div class="stat"><b>${nf(paseo.pasos)}</b><span>pasos (estimados)</span></div>
      <div class="stat"><b>🔥 ${despues.racha}</b><span>${despues.racha === 1 ? 'día' : 'días'} de racha</span></div>
    </div>
    ${nuevas.map(m => `<div class="premio">${m.icono} Nueva medalla: <b>${m.nombre}</b>${m.premio ? `<br>🎁 Desbloqueaste: ${ACCESORIOS[m.premio[0]][m.premio[1]]} para ${m.premio[0] === 'perro' ? esc(nombrePerro()) : 'tu avatar'}` : ''}</div>`).join('')}
    <div class="fila" style="justify-content:center;margin-top:16px">
      <button class="boton sec" id="btnDescartar">Descartar</button>
      <button class="boton" id="btnGuardar">Guardar paseo</button>
    </div>`);
  $('btnGuardar').onclick = () => {
    estado.paseos.push(paseo);
    persistir();
    cerrarModal();
    actualizarTop();
    if (nuevas.some(m => m.premio)) toast('🎁 Tienes accesorios nuevos', 'Ver', () => abrirHoja('avatar'));
  };
  $('btnDescartar').onclick = () => { cerrarModal(); map.getSource('ruta')?.setData(lineaVacia()); actualizarTop(); };
}

// ---------- hojas (paneles inferiores) ----------
let hojaActual = null;
document.querySelectorAll('#barra .nav').forEach(b => (b.onclick = () => (hojaActual === b.dataset.hoja ? cerrarHoja() : abrirHoja(b.dataset.hoja))));
$('hojaCerrar').onclick = () => cerrarHoja();

async function abrirHoja(tipo) {
  if (rastreador.grabando && tipo !== 'cerca') return toast('Termina el paseo para abrir esta sección.');
  hojaActual = tipo;
  if (tipo === 'cerca' || tipo === 'historial') { // necesitan los lugares y las capas del mapa
    hoja('Cargando…', '<div class="vacio">Cargando el mapa…</div>');
    $('hoja').classList.add('on');
    await mapaListo;
    if (hojaActual !== tipo) return;
  }
  document.querySelectorAll('#barra .nav').forEach(b => b.classList.toggle('on', b.dataset.hoja === tipo));
  ({ avatar: hojaAvatar, cerca: hojaCerca, logros: hojaLogros, historial: hojaHistorial })[tipo]();
  $('hoja').classList.add('on');
  if (tipo === 'avatar') requestAnimationFrame(encuadrarEditor);
}
// En el editor el avatar se ve grande, con los pies justo sobre el panel y la cabeza bajo los indicadores
function encuadrarEditor() {
  if (!posicion) return;
  const H = innerHeight, techo = 90, piso = H - $('hoja').offsetHeight - 85;
  capa.tamano = Math.max(1, Math.min(2.6, (piso - techo) / 120));
  const pad = piso > H / 2 ? { top: 2 * piso - H, bottom: 0 } : { top: 0, bottom: H - 2 * piso };
  map.easeTo({ center: posicion, zoom: 19.3, pitch: 50, padding: pad, duration: 700 });
}

function cerrarHoja() {
  const sinRelleno = { top: 0, bottom: 0, left: 0, right: 0 };
  if (hojaActual === 'avatar' && posicion) map.easeTo({ center: posicion, zoom: 17.4, pitch: 60, padding: sinRelleno, duration: 700 });
  else map.easeTo({ padding: sinRelleno, duration: 300 });
  hojaActual = null;
  capa.tamano = 1;
  $('hoja').classList.remove('on');
  document.querySelectorAll('#barra .nav').forEach(b => b.classList.remove('on'));
}
const hoja = (titulo, html) => { $('hojaTitulo').textContent = titulo; $('hojaContenido').innerHTML = html; };

// Avatar: catálogo por secciones (paseador: cuerpo, cara, pelo, ropa; perro: raza, pelaje) + accesorios ganados
let pestanaAvatar = 'persona';
const seccionAvatar = { persona: 'Cuerpo', perro: 'Raza' };
function hojaAvatar() {
  const quien = pestanaAvatar, cfg = estado[quien], secciones = EDITOR[quien], sec = seccionAvatar[quien];
  const ganados = accesoriosDesbloqueados(estadisticas(estado.paseos));
  const chip = (k, v, l, on, t, extra = '') => `<button class="opcion ${on ? 'on' : ''}" data-k="${k}" data-v="${esc(v)}" data-t="${t}" ${extra}>${l}</button>`;
  const control = ([k, titulo, tipo, valores]) => {
    let html;
    if (tipo === 'color') html = `<div class="muestras">${valores.map(c => `<button class="muestra ${cfg[k] === c ? 'on' : ''}" style="background:${c}" data-k="${k}" data-v="${c}" data-t="color" aria-label="${titulo} ${c}"></button>`).join('')}</div>`;
    else if (tipo === 'bool') html = `<div class="fila">${chip(k, 'false', 'No', !cfg[k], tipo)}${chip(k, 'true', 'Sí', cfg[k], tipo)}</div>`;
    else if (tipo === 'multi') html = `<div class="fila">${valores.map(([v, l]) => chip(k, v, l, cfg[k].includes(v), tipo)).join('')}</div>`;
    else html = `<div class="fila">${valores.map(([v, l]) => chip(k, v, l, cfg[k] === v, tipo)).join('')}</div>`;
    return `<div class="seccion">${titulo}</div>${html}`;
  };
  const medallaDe = acc => MEDALLAS.find(m => m.premio && m.premio[0] === quien && m.premio[1] === acc);
  const accesorios = `<div class="seccion">Accesorios</div><div class="fila">${chip('accesorio', '', 'Ninguno', !cfg.accesorio, 'op')}
    ${Object.entries(ACCESORIOS[quien]).map(([v, l]) => {
      const libre = ganados[quien].has(v);
      return chip('accesorio', v, (libre ? '' : '🔒 ') + l, cfg.accesorio === v, 'op', libre ? '' : `disabled title="Se gana con la medalla «${medallaDe(v)?.nombre}»"`);
    }).join('')}</div><p style="font-size:13px;color:var(--suave)">Gana accesorios consiguiendo medallas en tus paseos.</p>`;
  const contenido = sec === 'Accesorios' ? accesorios : (secciones.find(x => x[0] === sec) ?? secciones[0])[1].map(control).join('');
  hoja('Tu equipo', `
    <div class="pestanas"><button data-tab="persona" class="${quien === 'persona' ? 'on' : ''}">🧍 ${esc(estado.perfil?.nombre || 'Tú')}</button><button data-tab="perro" class="${quien === 'perro' ? 'on' : ''}">🐕 ${esc(nombrePerro())}</button></div>
    <div class="subtabs">${[...secciones.map(x => x[0]), 'Accesorios'].map(n => `<button data-sec="${n}" class="${n === sec ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${contenido}`);
  const raiz = $('hojaContenido');
  raiz.querySelectorAll('[data-tab]').forEach(b => (b.onclick = () => { pestanaAvatar = b.dataset.tab; hojaAvatar(); encuadrarEditor(); }));
  raiz.querySelectorAll('[data-sec]').forEach(b => (b.onclick = () => { seccionAvatar[quien] = b.dataset.sec; hojaAvatar(); encuadrarEditor(); }));
  raiz.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => {
    const { k, v, t } = b.dataset;
    if (k === 'raza') aplicarRaza(cfg, v);
    else if (t === 'multi') cfg[k] = cfg[k].includes(v) ? cfg[k].filter(x => x !== v) : [...cfg[k], v];
    else if (t === 'bool') cfg[k] = v === 'true';
    else cfg[k] = k === 'accesorio' ? v || null : v;
    persistir();
    capa.setModelos(estado.persona, estado.perro);
    const desplazamiento = raiz.scrollTop;
    hojaAvatar();
    raiz.scrollTop = desplazamiento;
  }));
}

// Cerca: áreas verdes, veterinarias y tiendas más próximas
function hojaCerca() {
  const desde = posicion || INICIO;
  const conDist = lugares.map(f => ({ f, d: distancia(desde, f.geometry.coordinates) })).sort((a, b) => a.d - b.d);
  const bloque = (titulo, tipos, n) => {
    const items = conDist.filter(x => tipos.includes(x.f.properties.tipo)).slice(0, n);
    return `<div class="seccion">${titulo}</div><div class="lista">${items.map(({ f, d }) => {
      const p = f.properties, t = TIPOS[p.tipo];
      return `<button data-i="${lugares.indexOf(f)}"><span class="ic">${t.emoji}</span><span><b>${esc(p.nombre || t.nombre)}</b><span>${p.horario ? '🕒 ' + esc(p.horario) : t.nombre}${p.area ? ' · ' + nf(p.area / 10000, 1) + ' ha' : ''}</span></span><em>${d < 1000 ? nf(Math.round(d / 10) * 10) + ' m' : fmtKm(d) + ' km'}</em></button>`;
    }).join('') || '<div class="vacio">Nada cerca por ahora.</div>'}</div>`;
  };
  hoja('Cerca de ti', (posicion ? '' : '<p class="vacio">Mostrando cerca de la Plaza de la Independencia (aún sin tu ubicación).</p>') +
    bloque('🌳 Áreas verdes', ['area_verde', 'perros'], 6) + bloque('🩺 Veterinarias', ['veterinaria'], 4) + bloque('🦴 Tiendas de mascotas', ['tienda'], 3) +
    '<p style="font-size:12px;color:var(--suave)">Datos de lugares: © OpenStreetMap. Los horarios actualizados están en Google Maps.</p>');
  $('hojaContenido').querySelectorAll('[data-i]').forEach(b => (b.onclick = () => {
    const f = lugares[+b.dataset.i];
    siguiendo = false;
    $('btnCentrar').style.display = 'block';
    map.flyTo({ center: f.geometry.coordinates, zoom: 17, padding: { bottom: innerHeight * 0.5 }, duration: 1200 });
    mostrarLugar(f);
  }));
}

// Logros: estadísticas, meta diaria, medallas y respaldo de datos
function hojaLogros() {
  const s = estadisticas(estado.paseos);
  hoja('Logros', `
    <div class="stats">
      <div class="stat"><b>${fmtKm(s.km * 1000)} km</b><span>caminados en total</span></div>
      <div class="stat"><b>${nf(s.paseos)}</b><span>paseos</span></div>
      <div class="stat"><b>${nf(s.pasos)}</b><span>pasos (estimados)</span></div>
      <div class="stat"><b>🔥 ${s.racha} <small style="font-size:14px;color:var(--suave)">/ récord ${s.rachaMax}</small></b><span>días seguidos</span></div>
    </div>
    <div class="seccion">Meta diaria</div>
    <div class="fila">${[1, 2, 3, 5].map(k => `<button class="opcion ${estado.metaKm === k ? 'on' : ''}" data-meta="${k}">${k} km</button>`).join('')}</div>
    <div class="seccion">Medallas · ${medallasLogradas(s).length} de ${MEDALLAS.length}</div>
    <div class="medallas">${MEDALLAS.map(m => {
      const p = progresoMedalla(m, s);
      return `<div class="medalla ${p.logrado ? '' : 'no'}"><div class="ic">${m.icono}</div><div><h4>${m.nombre}</h4><p>${m.desc}${m.premio ? ` · 🎁 ${ACCESORIOS[m.premio[0]][m.premio[1]]}` : ''}</p><div class="barrita"><i style="width:${Math.round(p.fraccion * 100)}%"></i></div></div></div>`;
    }).join('')}</div>
    <div class="seccion">Tus datos</div>
    <p style="font-size:13px;color:var(--suave);margin:0 0 8px">Por ahora todo se guarda solo en este teléfono. Haz un respaldo de vez en cuando.</p>
    <div class="fila"><button class="boton sec" id="btnExportar">⬇️ Exportar respaldo</button><button class="boton sec" id="btnImportar">⬆️ Importar</button></div>`);
  $('hojaContenido').querySelectorAll('[data-meta]').forEach(b => (b.onclick = () => { estado.metaKm = +b.dataset.meta; persistir(); actualizarTop(); hojaLogros(); }));
  $('btnExportar').onclick = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([JSON.stringify(estado, null, 1)], { type: 'application/json' })),
      download: `patago-respaldo-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('btnImportar').onclick = () => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json,.json' });
    input.onchange = async () => {
      try {
        const datos = JSON.parse(await input.files[0].text());
        if (!Array.isArray(datos.paseos)) throw new Error('formato');
        Object.assign(estado, datos);
        persistir();
        capa.setModelos(estado.persona, estado.perro);
        actualizarTop();
        hojaLogros();
        toast('Respaldo importado ✓');
      } catch { toast('Ese archivo no es un respaldo de PataGo.'); }
    };
    input.click();
  };
}

// Historial de paseos: tocar uno muestra su recorrido en el mapa
function hojaHistorial() {
  const lista = estado.paseos.map((p, i) => ({ p, i })).reverse();
  hoja('Tus paseos', lista.length ? `<div class="lista">${lista.map(({ p, i }) => {
    const f = new Date(p.inicio);
    return `<button data-p="${i}"><span class="ic">🐾</span><span><b>${f.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} · ${f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</b><span>${fmtDur(p.duracion)} · ${nf(p.pasos)} pasos</span></span><em>${fmtKm(p.distancia)} km</em></button>`;
  }).join('')}</div>` : `<div class="vacio">Aún no tienes paseos guardados.<br>Toca <b>PASEAR</b> para salir con ${esc(nombrePerro())}. 🐾</div>`);
  $('hojaContenido').querySelectorAll('[data-p]').forEach(b => (b.onclick = () => {
    const ruta = estado.paseos[+b.dataset.p].ruta;
    if (ruta.length < 2) return toast('Ese paseo no tiene recorrido guardado.');
    map.getSource('historial').setData(lineaVacia(ruta));
    const caja = ruta.reduce((bb, [x, y]) => [[Math.min(bb[0][0], x), Math.min(bb[0][1], y)], [Math.max(bb[1][0], x), Math.max(bb[1][1], y)]], [ruta[0], ruta[0]]);
    siguiendo = false;
    $('btnCentrar').style.display = 'block';
    map.fitBounds(caja, { padding: { top: 90, left: 40, right: 40, bottom: innerHeight * 0.62 + 20 }, pitch: 40, duration: 1000 });
  }));
}

// ---------- modal, avisos y bienvenida ----------
function modal(html) { $('modalContenido').innerHTML = html; $('modal').classList.add('on'); }
function cerrarModal() { $('modal').classList.remove('on'); }
function toast(texto, accion, fn, ms = 4000) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(texto)}</span>${accion ? `<button>${esc(accion)}</button>` : ''}`;
  if (accion) t.querySelector('button').onclick = () => { t.classList.remove('on'); fn(); };
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}

function bienvenida() {
  modal(`
    <div class="grande">🐾</div>
    <h2>¡Bienvenido a PataGo!</h2>
    <p>Pasea a tu perro, junta kilómetros, mantén tu racha y gana premios para tus avatares.</p>
    <input id="inNombre" placeholder="¿Cómo te llamas?" maxlength="24" autocomplete="given-name">
    <input id="inPerro" placeholder="¿Cómo se llama tu perro?" maxlength="24">
    <button class="boton" id="btnEmpezar" style="width:100%;margin-top:6px">Crear nuestros avatares</button>`);
  $('btnEmpezar').onclick = () => {
    const nombre = $('inNombre').value.trim(), perro = $('inPerro').value.trim();
    if (!nombre || !perro) return toast('Escribe ambos nombres 🙂');
    estado.perfil = { nombre, perro };
    persistir();
    cerrarModal();
    abrirHoja('avatar');
  };
}
if (!estado.perfil) bienvenida();

// App instalable y usable sin conexión
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
window.patago = { map, capa, rastreador, estado }; // para pruebas desde la consola
