// Modelos 3D del paseador y su perro, armados con figuras simples. Miran hacia +z, el suelo es y = 0 y
// las medidas están en metros. Los catálogos (EDITOR) alimentan el editor de avatares de la app.
import * as THREE from 'three';

// ---------- catálogos ----------
const PIELES = ['#f6d7bf', '#eab68e', '#d39a6a', '#b07447', '#8a5534', '#5e3a24'];
const PELOS = ['#1c1410', '#3b2516', '#6b4226', '#a0662e', '#d8b46a', '#e8d9a8', '#b23a24', '#9aa0a6', '#e9e9e9', '#d9567a'];
const ROPA = ['#ff7a59', '#e63946', '#2ec4b6', '#3a86ff', '#1d3557', '#8338ec', '#ffbe0b', '#2f6f4e', '#6b4f3a', '#f4f6fb', '#2b2d42', '#9aa0a6'];
const OJOS = ['#3b2a20', '#6b4422', '#2f5d8a', '#3f7d4f', '#7a7f86'];
const PELAJES = ['#1d1d1f', '#4b4f58', '#7d838d', '#5a3418', '#7a3f1d', '#a8723f', '#c4823b', '#d4954a', '#e3c38f', '#f2eee8'];

export const RAZAS = {
  quiltro: { nombre: 'Quiltro', largo: 0.72, pata: 0.32, pecho: 0.15, cabeza: 0.11, hocico: [0.11, 0.055], orejas: 'semicaidas', cola: 'curva', pelo: 'corto', pelaje: '#a8723f', mancha: '#1d1d1f', patrones: [], nariz: 'negra' },
  labrador: { nombre: 'Labrador', largo: 0.82, pata: 0.36, pecho: 0.18, cabeza: 0.125, hocico: [0.12, 0.07], orejas: 'caidas', cola: 'gruesa', pelo: 'corto', pelaje: '#e3c38f', mancha: '#5a3418', patrones: [], nariz: 'negra' },
  golden: { nombre: 'Golden', largo: 0.82, pata: 0.37, pecho: 0.17, cabeza: 0.12, hocico: [0.12, 0.062], orejas: 'caidas', cola: 'plumosa', pelo: 'largo', pelaje: '#d4954a', mancha: '#5a3418', patrones: [], nariz: 'negra' },
  pastor: { nombre: 'Pastor alemán', largo: 0.88, pata: 0.4, pecho: 0.17, cabeza: 0.115, hocico: [0.15, 0.055], orejas: 'paradas', cola: 'larga', pelo: 'corto', pelaje: '#b97a3a', mancha: '#1d1d1f', patrones: ['montura', 'mascara'], nariz: 'negra' },
  pitbull: { nombre: 'Pitbull', largo: 0.7, pata: 0.3, pecho: 0.19, cabeza: 0.135, ancho: 1.15, hocico: [0.09, 0.08], orejas: 'rosa', cola: 'fina', pelo: 'corto', pelaje: '#7d838d', mancha: '#1d1d1f', patrones: ['pecho'], nariz: 'rosada' },
  beagle: { nombre: 'Beagle', largo: 0.62, pata: 0.24, pecho: 0.14, cabeza: 0.105, hocico: [0.1, 0.055], orejas: 'largas', cola: 'alta', pelo: 'corto', pelaje: '#c4823b', mancha: '#1d1d1f', patrones: ['montura', 'pecho', 'patas', 'caraBlanca'], nariz: 'negra' },
  poodle: { nombre: 'Poodle', largo: 0.56, pata: 0.36, pecho: 0.13, cabeza: 0.095, hocico: [0.12, 0.04], orejas: 'pompon', cola: 'pompon', pelo: 'rizado', pelaje: '#f2eee8', mancha: '#4b4f58', patrones: [], nariz: 'negra' },
  chihuahua: { nombre: 'Chihuahua', largo: 0.3, pata: 0.13, pecho: 0.075, cabeza: 0.085, hocico: [0.04, 0.03], orejas: 'enormes', cola: 'curva', pelo: 'corto', pelaje: '#e3c38f', mancha: '#1d1d1f', patrones: [], nariz: 'negra' },
  salchicha: { nombre: 'Salchicha', largo: 0.66, pata: 0.1, pecho: 0.12, cabeza: 0.095, hocico: [0.11, 0.045], orejas: 'caidas', cola: 'fina', pelo: 'corto', pelaje: '#7a3f1d', mancha: '#1d1d1f', patrones: [], nariz: 'negra' },
};

const op = (...pares) => pares.map(p => p.split(':'));
// [clave, título, tipo, valores]; tipo: 'op' (una opción), 'color', 'multi' (varias), 'bool'
export const EDITOR = {
  persona: [
    ['Cuerpo', [['genero', 'Género', 'op', op('masculino:Hombre', 'femenino:Mujer')], ['piel', 'Tono de piel', 'color', PIELES]]],
    ['Cara', [
      ['ojos', 'Ojos', 'op', op('redondos:Redondos', 'almendrados:Almendrados', 'grandes:Grandes', 'sonrientes:Sonrientes')],
      ['colorOjos', 'Color de ojos', 'color', OJOS],
      ['cejas', 'Cejas', 'op', op('finas:Finas', 'gruesas:Gruesas', 'arqueadas:Arqueadas')],
      ['nariz', 'Nariz', 'op', op('pequena:Pequeña', 'recta:Recta', 'ancha:Ancha')],
      ['boca', 'Boca', 'op', op('sonrisa:Sonrisa', 'neutra:Neutra', 'abierta:Feliz')],
      ['vello', 'Vello facial', 'op', op('ninguno:Ninguno', 'barba:Barba', 'barba3:Barba de 3 días', 'bigote:Bigote', 'candado:Candado')],
      ['pecas', 'Pecas', 'bool'],
    ]],
    ['Pelo', [
      ['pelo', 'Peinado', 'op', op('corto:Corto', 'rapado:Rapado', 'crespo:Crespo', 'melena:Melena', 'largo:Largo liso', 'cola:Cola de caballo', 'mono:Moño', 'trenza:Trenza', 'calvo:Calvo')],
      ['colorPelo', 'Color de pelo', 'color', PELOS],
    ]],
    ['Ropa', [
      ['arriba', 'Parte de arriba', 'op', op('polera:Polera', 'poleron:Polerón', 'camisa:Camisa', 'chaqueta:Chaqueta', 'parka:Parka', 'vestido:Vestido')],
      ['colorArriba', 'Color', 'color', ROPA],
      ['abajo', 'Parte de abajo', 'op', op('jeans:Jeans', 'pantalon:Pantalón', 'buzo:Buzo', 'calzas:Calzas', 'short:Short', 'falda:Falda')],
      ['colorAbajo', 'Color', 'color', ['#3a5a8c', '#25324a', ...ROPA]],
      ['calzado', 'Calzado', 'op', op('zapatillas:Zapatillas', 'urbanas:Urbanas', 'botas:Botas')],
      ['colorCalzado', 'Color', 'color', ROPA],
    ]],
  ],
  perro: [
    ['Raza', [
      ['raza', 'Raza', 'op', Object.entries(RAZAS).map(([k, r]) => [k, r.nombre])],
      ['contextura', 'Contextura', 'op', op('delgado:Delgado', 'normal:Normal', 'robusto:Robusto')],
    ]],
    ['Pelaje', [
      ['pelaje', 'Color del pelaje', 'color', PELAJES],
      ['patrones', 'Manchas', 'multi', op('pecho:Pecho blanco', 'patas:Patas blancas', 'caraBlanca:Cara blanca', 'mascara:Máscara oscura', 'montura:Lomo oscuro', 'manchas:Manchas')],
      ['colorMancha', 'Color de las manchas oscuras', 'color', PELAJES.slice(0, 6)],
      ['nariz', 'Hocico', 'op', op('negra:Nariz negra', 'rosada:Nariz rosada', 'cafe:Nariz café')],
    ]],
  ],
};

export const POR_DEFECTO = {
  persona: {
    genero: 'masculino', piel: '#eab68e', ojos: 'redondos', colorOjos: '#3b2a20', cejas: 'finas', nariz: 'recta', boca: 'sonrisa', vello: 'ninguno', pecas: false,
    pelo: 'corto', colorPelo: '#3b2516', arriba: 'polera', colorArriba: '#ff7a59', abajo: 'jeans', colorAbajo: '#3a5a8c', calzado: 'zapatillas', colorCalzado: '#f4f6fb', accesorio: null,
  },
  perro: { raza: 'quiltro', contextura: 'normal', pelaje: '#a8723f', colorMancha: '#1d1d1f', patrones: [], nariz: 'negra', accesorio: null },
};

// Al cambiar de raza se cargan sus colores y manchas típicos (luego se pueden editar)
export function aplicarRaza(cfg, raza) {
  const r = RAZAS[raza];
  Object.assign(cfg, { raza, pelaje: r.pelaje, colorMancha: r.mancha, patrones: [...r.patrones], nariz: r.nariz });
}

export const ACCESORIOS = {
  persona: { gorro: 'Gorro', lentes: 'Lentes de sol', bufanda: 'Bufanda', mochila: 'Mochila', corona: 'Corona' },
  perro: { bandana: 'Bandana', collar: 'Collar dorado', sombrero: 'Sombrero', capa: 'Capa', corona: 'Corona' },
};

// ---------- utilidades de geometría ----------
const mats = {};
const mat = (color, extra = {}) => (mats[color + JSON.stringify(extra)] ??= new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
const ORO = { metalness: 0.6, roughness: 0.3 };
const mezcla = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function malla(geo, color, pos = [0, 0, 0], extra) {
  const m = new THREE.Mesh(geo, mat(color, extra));
  m.position.set(...pos);
  return m;
}
const esfera = (r, color, pos, esc = [1, 1, 1], seg = 16) => { const m = malla(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), color, pos); m.scale.set(...esc); return m; };
const capsula = (r, largo, color, pos) => malla(new THREE.CapsuleGeometry(r, largo, 4, 12), color, pos);
const caja = (x, y, z, color, pos) => malla(new THREE.BoxGeometry(x, y, z), color, pos);
const torno = (perfil, color) => { const m = malla(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 22), color); m.scale.z = 0.62; return m; };
function pivote(pos, ...hijos) { const g = new THREE.Group(); g.position.set(...pos); g.add(...hijos); return g; }
// casquete esférico (pelo, gorros): `frac` = fracción del ángulo polar cubierta desde arriba
const casquete = (r, frac, color, pos = [0, 0, 0]) => malla(new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI * frac), color, pos);

function corona(radio, y) {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(radio, radio, radio * 0.6, 16, 1, true), '#f6c445', [0, y, 0], { ...ORO, side: THREE.DoubleSide }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(malla(new THREE.ConeGeometry(radio * 0.18, radio * 0.5, 6), '#f6c445', [Math.cos(a) * radio, y + radio * 0.5, Math.sin(a) * radio], ORO));
  }
  return g;
}

// ---------- paseador (~1,75 m) ----------
export function crearPersona(entrada) {
  const c = { ...POR_DEFECTO.persona, ...entrada }, mujer = c.genero === 'femenino';
  const piel = c.piel, pelo = c.colorPelo, ropa = c.colorArriba, abajo = c.colorAbajo;
  const g = new THREE.Group();
  const vestido = c.arriba === 'vestido';
  const conFalda = vestido || c.abajo === 'falda';
  const piernasPiel = vestido || c.abajo === 'falda';

  // torso: pelvis (ropa de abajo) + tronco (ropa de arriba), con perfil distinto por género
  const hombro = mujer ? 0.17 : 0.2;
  const perfilTronco = mujer
    ? [[0.135, 1.0], [0.13, 1.08], [0.155, 1.2], [0.17, 1.28], [0.165, 1.36], [0.13, 1.43], [0.06, 1.47], [0.001, 1.475]]
    : [[0.15, 1.0], [0.15, 1.08], [0.175, 1.2], [0.2, 1.3], [0.2, 1.38], [0.14, 1.44], [0.06, 1.48], [0.001, 1.485]];
  const perfilPelvis = mujer ? [[0.001, 0.86], [0.13, 0.875], [0.185, 0.93], [0.16, 0.99], [0.135, 1.01]] : [[0.001, 0.86], [0.13, 0.875], [0.165, 0.93], [0.155, 0.99], [0.15, 1.01]];
  const grosor = c.arriba === 'parka' ? 1.08 : 1;
  const tronco = torno(perfilTronco, ropa);
  tronco.scale.set(grosor, 1, 0.62 * grosor);
  g.add(tronco, torno(perfilPelvis, vestido ? ropa : abajo));
  if (conFalda) {
    const falda = malla(new THREE.CylinderGeometry(0.16, vestido ? 0.27 : 0.23, vestido ? 0.4 : 0.26, 22, 1, true), vestido ? ropa : abajo, [0, vestido ? 0.74 : 0.82, 0], { side: THREE.DoubleSide });
    falda.scale.z = 0.8;
    g.add(falda);
  }

  // piernas (muslo + pierna + zapato), articuladas en la cadera
  const anchoCadera = mujer ? 0.095 : 0.085;
  const piernas = [-1, 1].map(lado => {
    const muslo = capsula(0.068, 0.3, piernasPiel ? piel : abajo, [0, -0.2, 0]);
    const pierna = capsula(0.052, 0.3, piernasPiel || c.abajo === 'short' ? piel : abajo, [0, -0.6, 0]);
    const p = pivote([lado * anchoCadera, 0.9, 0], muslo, pierna);
    if (c.abajo === 'buzo') p.add(caja(0.012, 0.74, 0.03, '#f4f6fb', [lado * 0.062, -0.4, 0]));
    const z = c.colorCalzado;
    if (c.calzado === 'botas') p.add(malla(new THREE.CylinderGeometry(0.058, 0.062, 0.16, 12), z, [0, -0.78, 0]), caja(0.1, 0.06, 0.2, z, [0, -0.85, 0.04]));
    else if (c.calzado === 'urbanas') p.add(caja(0.095, 0.06, 0.21, z, [0, -0.85, 0.04]), caja(0.1, 0.015, 0.215, '#2b2d42', [0, -0.88, 0.04]));
    else p.add(caja(0.1, 0.07, 0.22, z, [0, -0.84, 0.04]), caja(0.105, 0.025, 0.225, '#f4f6fb', [0, -0.88, 0.04]));
    return p;
  });
  g.add(...piernas);

  // brazos (brazo + antebrazo + mano), con mangas según la prenda
  const mangaLarga = !['polera', 'vestido'].includes(c.arriba);
  const brazos = [-1, 1].map(lado => {
    const brazo = capsula(0.048, 0.22, vestido ? piel : ropa, [0, -0.14, 0]);
    const codo = pivote([0, -0.29, 0], capsula(0.042, 0.2, mangaLarga ? ropa : piel, [0, -0.13, 0]), esfera(0.045, piel, [0, -0.28, 0.005], [0.9, 1.1, 0.8]));
    codo.rotation.x = -0.18;
    const p = pivote([lado * (hombro + 0.045) * grosor, 1.39, 0], brazo, codo);
    p.rotation.z = lado * 0.08;
    return p;
  });
  g.add(...brazos);

  // detalles de la ropa de arriba
  if (c.arriba === 'poleron') {
    g.add(malla(new THREE.TorusGeometry(0.1, 0.045, 8, 16, Math.PI), ropa, [0, 1.46, -0.07]).rotateX(-0.4));
    g.add(caja(0.2, 0.09, 0.02, mezcla(ropa, '#000', 0.15), [0, 1.08, 0.11]));
    for (const x of [-0.035, 0.035]) g.add(caja(0.008, 0.1, 0.008, '#f4f6fb', [x, 1.36, 0.13]));
  } else if (c.arriba === 'chaqueta') {
    g.add(caja(0.075, 0.38, 0.02, '#f4f6fb', [0, 1.22, 0.115]));
    for (const x of [-0.04, 0.04]) g.add(caja(0.006, 0.4, 0.024, mezcla(ropa, '#000', 0.3), [x, 1.22, 0.118]));
  } else if (c.arriba === 'camisa') {
    for (const lado of [-1, 1]) g.add(caja(0.06, 0.03, 0.05, mezcla(ropa, '#fff', 0.2), [lado * 0.035, 1.45, 0.07]).rotateZ(lado * 0.4));
    for (let i = 0; i < 4; i++) g.add(esfera(0.007, '#f4f6fb', [0, 1.36 - i * 0.09, 0.122]));
  } else if (c.arriba === 'parka') {
    g.add(malla(new THREE.TorusGeometry(0.1, 0.04, 8, 18), '#e9dcc8', [0, 1.47, 0]).rotateX(Math.PI / 2));
    g.add(caja(0.012, 0.42, 0.02, mezcla(ropa, '#000', 0.35), [0, 1.2, 0.13]));
  }

  // cuello y cabeza
  g.add(malla(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 12), piel, [0, 1.5, 0]));
  const cabeza = new THREE.Group();
  cabeza.position.y = 1.63;
  const R = 0.125;
  cabeza.add(esfera(R, piel, [0, 0, 0], [0.9, 1.05, 0.96], 28));
  cabeza.add(esfera(0.07, piel, [0, -0.07, 0.03], [1, 0.8, 1])); // mandíbula
  for (const lado of [-1, 1]) cabeza.add(esfera(0.028, piel, [lado * 0.112, -0.005, 0], [0.55, 1, 0.8]));
  // ojos, cejas y pecas
  const yOjo = 0.012, xOjo = 0.042, zOjo = 0.103;
  for (const lado of [-1, 1]) {
    if (c.ojos === 'sonrientes') {
      cabeza.add(malla(new THREE.TorusGeometry(0.014, 0.0045, 6, 12, Math.PI), '#1b1b1f', [lado * xOjo, yOjo - 0.004, zOjo + 0.004]));
    } else {
      const k = c.ojos === 'grandes' ? 1.35 : 1, alto = c.ojos === 'almendrados' ? 0.65 : 1;
      cabeza.add(esfera(0.019 * k, '#fbfbfb', [lado * xOjo, yOjo, zOjo], [1.2, alto, 0.5]));
      cabeza.add(esfera(0.011 * k, c.colorOjos, [lado * xOjo, yOjo, zOjo + 0.008], [1, alto, 0.5]));
      cabeza.add(esfera(0.005 * k, '#111', [lado * xOjo, yOjo, zOjo + 0.012], [1, alto, 0.5]));
      if (mujer) cabeza.add(caja(0.034 * k, 0.004, 0.006, '#1b1b1f', [lado * xOjo, yOjo + 0.017 * k * alto, zOjo + 0.006]));
    }
    const ceja = caja(0.036, c.cejas === 'gruesas' ? 0.011 : 0.006, 0.008, mezcla(pelo, '#000', 0.2), [lado * xOjo, yOjo + 0.035, zOjo + 0.006]);
    ceja.rotation.z = c.cejas === 'arqueadas' ? -lado * 0.3 : -lado * 0.08;
    cabeza.add(ceja);
    if (c.pecas) for (const [dx, dy] of [[0, -0.02], [0.012, -0.028], [-0.01, -0.03]]) cabeza.add(esfera(0.0032, '#9a5b3a', [lado * (xOjo + dx), yOjo + dy, zOjo + 0.004]));
  }
  // nariz
  const nariz = { pequena: [0.012, 0.016, 0.014], recta: [0.012, 0.03, 0.02], ancha: [0.02, 0.02, 0.018] }[c.nariz] ?? [0.012, 0.03, 0.02];
  cabeza.add(esfera(1, mezcla(piel, '#7a3b2e', 0.12), [0, -0.022, 0.118], nariz));
  // boca
  const labios = mezcla(piel, '#9b3b3b', 0.45);
  if (c.boca === 'neutra') cabeza.add(caja(0.035, 0.006, 0.006, labios, [0, -0.058, 0.108]));
  else if (c.boca === 'abierta') cabeza.add(esfera(0.02, '#5a1f1f', [0, -0.056, 0.104], [1.1, 0.7, 0.45]), caja(0.024, 0.006, 0.004, '#fbfbfb', [0, -0.047, 0.113]));
  else cabeza.add(malla(new THREE.TorusGeometry(0.022, 0.0045, 6, 14, Math.PI), labios, [0, -0.052, 0.108]).rotateZ(Math.PI));
  // vello facial
  if (c.vello === 'barba' || c.vello === 'barba3') {
    const b = malla(new THREE.SphereGeometry(0.118, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), c.vello === 'barba3' ? mezcla(piel, pelo, 0.45) : pelo, [0, -0.045, 0.005]);
    b.scale.set(0.92, 0.75, 0.97);
    cabeza.add(b, esfera(0.072, piel, [0, -0.07, 0.045], [0.7, 0.4, 0.9]));
  }
  if (['bigote', 'candado', 'barba'].includes(c.vello)) cabeza.add(esfera(0.022, pelo, [0, -0.04, 0.113], [1.5, 0.4, 0.5]));
  if (c.vello === 'candado') cabeza.add(esfera(0.022, pelo, [0, -0.085, 0.1], [1, 0.9, 0.6]));
  // pelo
  const tapa = frac => { const m = casquete(R * 1.06, frac, pelo, [0, 0.008, -0.01]); m.scale.set(0.92, 1.05, 0.98); m.rotation.x = -0.32; return m; };
  if (c.pelo === 'rapado') {
    const m = casquete(R * 1.015, 0.5, mezcla(pelo, piel, 0.45), [0, 0.004, -0.004]);
    m.scale.set(0.91, 1.05, 0.97); m.rotation.x = -0.25;
    cabeza.add(m);
  } else if (c.pelo !== 'calvo') {
    cabeza.add(tapa(c.pelo === 'crespo' ? 0.5 : 0.56));
    if (c.pelo === 'corto') cabeza.add(esfera(0.06, pelo, [0.02, 0.085, 0.06], [1.4, 0.45, 0.8]));
    if (c.pelo === 'crespo') for (let i = 0; i < 26; i++) {
      const a = i * 2.39996, y = 0.25 + (i / 26) * 0.7, rr = Math.sqrt(1 - y * y);
      cabeza.add(esfera(0.042, pelo, [Math.cos(a) * rr * 0.125, y * 0.135 + 0.01, Math.sin(a) * rr * 0.125 - 0.015]));
    }
    if (c.pelo === 'melena') cabeza.add(esfera(0.13, pelo, [0, -0.04, -0.035], [1, 0.95, 0.85]), esfera(0.05, pelo, [0.1, -0.06, 0], [0.6, 1.3, 1]), esfera(0.05, pelo, [-0.1, -0.06, 0], [0.6, 1.3, 1]));
    if (c.pelo === 'largo') {
      cabeza.add(esfera(0.125, pelo, [0, -0.04, -0.04], [1, 1, 0.8]));
      const espalda = capsula(0.1, 0.22, pelo, [0, -0.2, -0.07]);
      espalda.scale.set(1.05, 1, 0.45);
      cabeza.add(espalda);
      for (const lado of [-1, 1]) { const m = capsula(0.035, 0.18, pelo, [lado * 0.105, -0.12, 0.01]); m.scale.z = 0.7; cabeza.add(m); }
    }
    if (c.pelo === 'cola') { const m = capsula(0.035, 0.2, pelo, [0, -0.05, -0.15]); m.rotation.x = 0.35; cabeza.add(m, esfera(0.03, pelo, [0, 0.03, -0.125])); }
    if (c.pelo === 'mono') cabeza.add(esfera(0.055, pelo, [0, 0.12, -0.07]));
    if (c.pelo === 'trenza') for (let i = 0; i < 6; i++) cabeza.add(esfera(0.03 - i * 0.002, pelo, [0, -0.04 - i * 0.05, -0.13 - i * 0.004]));
  }
  g.add(cabeza);

  // accesorios
  const acc = c.accesorio;
  if (acc === 'gorro') {
    const m = casquete(R * 1.12, 0.5, '#e63946', [0, 0.02, -0.005]);
    m.scale.set(0.92, 1, 0.98);
    cabeza.add(m, esfera(0.035, '#f4f6fb', [0, 0.16, 0]));
    cabeza.add(malla(new THREE.TorusGeometry(R * 0.98, 0.016, 8, 24), mezcla('#e63946', '#000', 0.2), [0, 0.02, 0]).rotateX(Math.PI / 2));
  } else if (acc === 'lentes') {
    for (const lado of [-1, 1]) cabeza.add(malla(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16), '#111', [lado * xOjo, yOjo, zOjo + 0.014], { metalness: 0.4, roughness: 0.2 }).rotateX(Math.PI / 2));
    cabeza.add(caja(0.03, 0.006, 0.006, '#111', [0, yOjo + 0.008, zOjo + 0.016]));
  } else if (acc === 'bufanda') {
    g.add(malla(new THREE.TorusGeometry(0.08, 0.035, 8, 16), '#2ec4b6', [0, 1.47, 0.005]).rotateX(Math.PI / 2));
    g.add(caja(0.06, 0.24, 0.025, '#2ec4b6', [0.05, 1.33, 0.13]));
  } else if (acc === 'mochila') {
    g.add(caja(0.26, 0.34, 0.13, '#ffbe0b', [0, 1.18, -0.17]), caja(0.22, 0.12, 0.04, mezcla('#ffbe0b', '#000', 0.2), [0, 1.08, -0.245]));
  } else if (acc === 'corona') {
    cabeza.add(corona(0.075, 0.12));
  }
  const escala = mujer ? 0.96 : 1;
  g.scale.setScalar(escala);
  g.userData = { piernas, brazos, cabeza, mano: new THREE.Vector3((hombro + 0.06) * grosor, 0.83, 0.05).multiplyScalar(escala) };
  return g;
}

// ---------- perro ----------
const NARIZ = { negra: '#151515', rosada: '#d98c8c', cafe: '#6b4226' };

export function crearPerro(entrada) {
  const c = { ...POR_DEFECTO.perro, ...entrada }, r = RAZAS[c.raza] ?? RAZAS.quiltro;
  const w = { delgado: 0.84, normal: 1, robusto: 1.18 }[c.contextura] ?? 1;
  const pat = new Set(c.patrones ?? []);
  const base = c.pelaje, oscuro = c.colorMancha, blanco = '#f4f1ec';
  const P = r.pecho, L = Math.max(0.02, r.largo - 2 * P), yC = r.pata + P * 0.85, Hc = r.cabeza;
  const g = new THREE.Group(), cuerpo = new THREE.Group();

  // tronco: cilindro con pecho profundo adelante y grupa atrás
  const tronco = capsula(P, L, base, [0, yC, 0]);
  tronco.rotation.x = Math.PI / 2;
  tronco.scale.set(w, 1, 1);
  cuerpo.add(tronco, esfera(P * 1.12, base, [0, yC - P * 0.12, L / 2], [w, 1.05, 1]), esfera(P * 0.98, base, [0, yC + 0.005, -L / 2], [w * 1.02, 1, 1]));
  if (pat.has('montura')) {
    const m = malla(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), oscuro, [0, yC + P * 0.08, -L * 0.05]);
    m.scale.set(P * w * 1.06, P, L / 2 + P * 0.9);
    cuerpo.add(m);
  }
  if (pat.has('manchas')) for (const [x, y, z, k] of [[0.8, 0.3, 0.2, 0.55], [-0.75, 0.2, -0.25, 0.6], [0.2, 0.9, -0.05, 0.5], [-0.3, 0.75, 0.35, 0.4]]) {
    cuerpo.add(esfera(P * k, oscuro, [x * P * w, yC + y * P, z * (L + P)], [0.5, 0.75, 1.1]));
  }
  if (pat.has('pecho')) cuerpo.add(esfera(P * 0.72, blanco, [0, yC - P * 0.25, L / 2 + P * 0.62], [w * 0.95, 1.25, 0.6]), esfera(P * 0.45, blanco, [0, yC + P * 0.45, L / 2 + P * 0.75], [w, 1.2, 0.6]));
  if (r.pelo === 'largo') cuerpo.add(esfera(P * 0.8, mezcla(base, '#fff', 0.12), [0, yC - P * 0.3, L / 2 + P * 0.5], [w, 1.1, 0.8]));
  if (r.pelo === 'rizado') cuerpo.add(esfera(P, base, [0, yC + P * 0.1, L / 2 + P * 0.2], [w * 1.05, 1.1, 1]));

  // cuello y cabeza
  const cuello = capsula(P * 0.55, P * 0.9, pat.has('pecho') ? blanco : base, [0, yC + P * 0.85, L / 2 + P * 0.65]);
  cuello.rotation.x = 0.55;
  cuello.scale.x = w;
  cuerpo.add(cuello);
  const cabeza = new THREE.Group();
  cabeza.position.set(0, yC + P * 1.55, L / 2 + P * 1.05);
  const anchoCabeza = (r.ancho ?? 1) * (0.9 + 0.1 * w);
  cabeza.add(esfera(Hc, base, [0, 0, 0], [anchoCabeza, 0.95, 1.05], 20));
  if (pat.has('mascara')) cabeza.add(esfera(Hc * 0.98, oscuro, [0, -Hc * 0.12, Hc * 0.18], [anchoCabeza * 0.95, 0.75, 0.95]));
  if (pat.has('caraBlanca')) cabeza.add(caja(Hc * 0.28, Hc * 0.9, Hc * 0.3, blanco, [0, Hc * 0.25, Hc * 0.82]).rotateX(-0.35));
  const [hl, ha] = r.hocico;
  const colorHocico = pat.has('caraBlanca') ? blanco : pat.has('mascara') ? oscuro : base;
  const hocico = malla(new THREE.CylinderGeometry(ha * 0.85, ha, hl, 14), colorHocico, [0, -Hc * 0.28, Hc * 0.72 + hl / 2]);
  hocico.rotation.x = Math.PI / 2;
  hocico.scale.set(r.ancho ?? 1, 1, 0.85);
  cabeza.add(hocico);
  cabeza.add(esfera(ha * 0.45, NARIZ[c.nariz] ?? NARIZ.negra, [0, -Hc * 0.2, Hc * 0.72 + hl + ha * 0.15], [1.2, 0.85, 0.8]));
  cabeza.add(esfera(ha * 0.75, mezcla(colorHocico, '#000', 0.08), [0, -Hc * 0.42, Hc * 0.68 + hl * 0.45], [0.95, 0.5, 1.2])); // mandíbula
  for (const lado of [-1, 1]) {
    cabeza.add(esfera(Hc * 0.13, '#1b1410', [lado * Hc * 0.4 * anchoCabeza, Hc * 0.2, Hc * 0.8]));
    cabeza.add(esfera(Hc * 0.04, '#ffffff', [lado * Hc * 0.4 * anchoCabeza + 0.003, Hc * 0.24, Hc * 0.9]));
  }
  // orejas
  const colorOreja = pat.has('mascara') || (pat.has('montura') && r.orejas === 'paradas') ? oscuro : base;
  for (const lado of [-1, 1]) {
    const x = lado * Hc * 0.8 * anchoCabeza;
    if (r.orejas === 'caidas' || r.orejas === 'largas') {
      const largo = r.orejas === 'largas' ? 1.9 : 1.25;
      const o = esfera(Hc * 0.45, colorOreja, [lado * Hc * 0.92 * anchoCabeza, -Hc * (0.1 + 0.3 * (largo - 1)), -Hc * 0.05], [0.32, largo, 0.75]);
      o.rotation.z = lado * 0.15;
      cabeza.add(o);
    } else if (r.orejas === 'paradas' || r.orejas === 'enormes') {
      const k = r.orejas === 'enormes' ? 1.45 : 1;
      const o = malla(new THREE.ConeGeometry(Hc * 0.38 * k, Hc * 0.95 * k, 4), colorOreja, [x * 0.85, Hc * (0.8 + 0.25 * (k - 1)), -Hc * 0.15]);
      o.rotation.z = -lado * (r.orejas === 'enormes' ? 0.55 : 0.18);
      o.scale.z = 0.45;
      cabeza.add(o);
    } else if (r.orejas === 'semicaidas') {
      const o = malla(new THREE.ConeGeometry(Hc * 0.32, Hc * 0.62, 4), colorOreja, [x * 0.85, Hc * 0.75, Hc * 0.02]);
      o.rotation.set(0.9, 0, -lado * 0.25);
      o.scale.z = 0.4;
      cabeza.add(o);
    } else if (r.orejas === 'rosa') {
      const o = esfera(Hc * 0.28, colorOreja, [x * 0.85, Hc * 0.72, -Hc * 0.25], [0.9, 0.5, 0.8]);
      o.rotation.z = -lado * 0.6;
      cabeza.add(o);
    } else if (r.orejas === 'pompon') {
      for (let i = 0; i < 3; i++) cabeza.add(esfera(Hc * 0.36, base, [lado * Hc * (0.95 + 0.05 * i), -Hc * (0.15 + 0.28 * i), -Hc * 0.05]));
    }
  }
  if (r.pelo === 'rizado') cabeza.add(esfera(Hc * 0.75, base, [0, Hc * 0.75, -Hc * 0.05], [1.1, 0.8, 1]));
  cuerpo.add(cabeza);

  // patas: muslo + pata + pie, articuladas arriba
  const radioPata = P * 0.3 * (0.85 + 0.15 * w), blancas = pat.has('patas');
  const patas = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([lado, adelante]) => {
    const z = adelante > 0 ? L / 2 + P * 0.25 : -L / 2 - P * 0.1;
    const p = pivote([lado * P * 0.55 * w, r.pata + P * 0.15, z],
      capsula(radioPata * (adelante > 0 ? 1 : 1.25), r.pata * 0.35, base, [0, -r.pata * 0.27, adelante > 0 ? 0 : -P * 0.05]),
      capsula(radioPata * 0.72, r.pata * 0.4, blancas ? blanco : base, [0, -r.pata * 0.72, adelante > 0 ? 0.005 : P * 0.02]),
      esfera(radioPata * 1.05, blancas ? blanco : base, [0, -r.pata - P * 0.12, radioPata * 0.5], [1, 0.6, 1.4]));
    if (r.pelo === 'rizado') p.add(esfera(radioPata * 1.6, base, [0, -r.pata * 0.85, 0]));
    if (r.pelo === 'largo') p.add(esfera(radioPata * 1.1, mezcla(base, '#fff', 0.1), [0, -r.pata * 0.35, -radioPata * 0.8], [0.8, 1.6, 0.8]));
    return p;
  });
  cuerpo.add(...patas);

  // cola
  const s = P / 0.15, cola = new THREE.Group();
  cola.position.set(0, yC + P * 0.45, -L / 2 - P * 0.8);
  if (r.cola === 'curva') {
    cola.add(malla(new THREE.TorusGeometry(0.07 * s, 0.02 * s, 8, 14, Math.PI * 1.2), base, [0, 0.07 * s, -0.01]).rotateY(Math.PI / 2));
  } else {
    const [lc, rb, rt, ang] = { gruesa: [0.3, 0.04, 0.015, -2.3], plumosa: [0.3, 0.035, 0.015, -2.2], larga: [0.38, 0.035, 0.018, -2.6], fina: [0.26, 0.025, 0.01, -2.0], alta: [0.22, 0.025, 0.014, -0.4], pompon: [0.18, 0.012, 0.012, -0.5] }[r.cola] ?? [0.26, 0.025, 0.01, -2.0];
    const brazo = new THREE.Group();
    brazo.add(malla(new THREE.CylinderGeometry(rt * s, rb * s, lc * s, 8), base, [0, (lc * s) / 2, 0]));
    if (r.cola === 'plumosa') for (let i = 1; i <= 3; i++) brazo.add(esfera(0.04 * s, mezcla(base, '#fff', 0.1), [0, lc * s * i * 0.25, -0.02 * s], [0.6, 1.2, 1]));
    if (r.cola === 'alta') brazo.add(esfera(0.022 * s, blanco, [0, lc * s, 0]));
    if (r.cola === 'pompon') brazo.add(esfera(0.05 * s, base, [0, lc * s, 0]));
    brazo.rotation.x = ang;
    cola.add(brazo);
  }
  cuerpo.add(cola);

  // accesorios (referidos al cuello y la cabeza)
  const posCuello = new THREE.Vector3(0, yC + P * 1.1, L / 2 + P * 0.85);
  const acc = c.accesorio;
  if (acc === 'bandana') {
    const b = malla(new THREE.ConeGeometry(P * 0.7, P * 0.9, 3), '#e63946', [0, posCuello.y - P * 0.35, posCuello.z + P * 0.25]);
    b.rotation.x = Math.PI + 0.3;
    b.scale.z = 0.4;
    cuerpo.add(b);
  } else if (acc === 'collar') {
    cuerpo.add(malla(new THREE.TorusGeometry(P * 0.6, P * 0.12, 8, 18), '#f6c445', posCuello.toArray(), ORO).rotateX(Math.PI / 2 - 0.55));
  } else if (acc === 'sombrero') {
    cabeza.add(malla(new THREE.CylinderGeometry(Hc * 0.85, Hc * 0.85, Hc * 0.08, 16), '#2b2d42', [0, Hc * 0.9, 0]));
    cabeza.add(malla(new THREE.CylinderGeometry(Hc * 0.48, Hc * 0.52, Hc * 0.7, 16), '#2b2d42', [0, Hc * 1.25, 0]));
  } else if (acc === 'capa') {
    const capa = malla(new THREE.PlaneGeometry(P * 2 * w, L + P * 1.2), '#8338ec', [0, yC + P * 1.02, -P * 0.1], { side: THREE.DoubleSide });
    capa.rotation.x = -Math.PI / 2 + 0.1;
    cuerpo.add(capa);
  } else if (acc === 'corona') {
    cabeza.add(corona(Hc * 0.6, Hc * 0.95));
  }

  g.add(cuerpo);
  g.userData = { patas, cola, cuerpo, cabeza, cuello: posCuello };
  return g;
}

// ---------- animación ----------
// `fase` avanza con la distancia recorrida; `mov` (0–1) indica cuánto se está caminando.
export function animarPersona(p, fase, mov, t) {
  const { piernas, brazos, cabeza } = p.userData, s = Math.sin(fase) * 0.5 * mov;
  piernas[0].rotation.x = s; piernas[1].rotation.x = -s;
  brazos[0].rotation.x = -s * 0.8; brazos[1].rotation.x = s * 0.8;
  p.position.y = Math.abs(Math.cos(fase)) * 0.025 * mov + Math.sin(t * 2) * 0.003;
  cabeza.rotation.y = Math.sin(t * 0.7) * 0.15 * (1 - mov);
}

export function animarPerro(d, fase, mov, t) {
  const { patas, cola, cuerpo, cabeza } = d.userData, s = Math.sin(fase * 1.4) * 0.55 * mov;
  patas[0].rotation.x = s; patas[3].rotation.x = s; patas[1].rotation.x = -s; patas[2].rotation.x = -s;
  cola.rotation.z = Math.sin(t * (mov > 0.2 ? 14 : 8)) * 0.5;
  cuerpo.position.y = Math.abs(Math.cos(fase * 1.4)) * 0.02 * mov;
  cabeza.rotation.x = Math.sin(t * 1.3) * 0.05 * (1 - mov);
}
