// Modelos 3D del avatar y su perro, hechos con figuras simples. Miran hacia +z y miden en metros.
import * as THREE from 'three';

export const OPCIONES = {
  persona: {
    piel: ['#f8d9bd', '#eab68e', '#c98e62', '#9a6440', '#6b4428'],
    colorPelo: ['#2b1d14', '#5a3a22', '#a0662e', '#e3c16f', '#c0392b', '#a7adb4'],
    pelo: [['corto', 'Corto'], ['largo', 'Largo'], ['mono', 'Moño'], ['rapado', 'Rapado']],
    polera: ['#ff7a59', '#2ec4b6', '#3a86ff', '#8338ec', '#ffbe0b', '#f4f6fb', '#2b2d42'],
    pantalon: ['#2d3a4a', '#3a6fd8', '#6b4f3a', '#5c5f66', '#2f6f4e'],
  },
  perro: {
    pelaje: ['#c68642', '#f2d6a2', '#2b2b2b', '#f4f1ec', '#8b5a2b', '#9aa0a6'],
    orejas: [['caidas', 'Caídas'], ['paradas', 'Paradas']],
    tamano: [['pequeno', 'Pequeño'], ['mediano', 'Mediano'], ['grande', 'Grande']],
  },
};

export const ACCESORIOS = {
  persona: { gorro: 'Gorro', lentes: 'Lentes de sol', bufanda: 'Bufanda', mochila: 'Mochila', corona: 'Corona' },
  perro: { bandana: 'Bandana', collar: 'Collar dorado', sombrero: 'Sombrero', capa: 'Capa', corona: 'Corona' },
};

const mats = {};
const mat = (color, extra = {}) => (mats[color + JSON.stringify(extra)] ??= new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra }));
const ORO = { metalness: 0.6, roughness: 0.3 };

function malla(geo, color, [x, y, z] = [0, 0, 0], extra) {
  const m = new THREE.Mesh(geo, mat(color, extra));
  m.position.set(x, y, z);
  return m;
}
// Grupo pivote (articulación): rota en su origen y la pieza cuelga desde ahí
function pivote([x, y, z], hijo) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(hijo); return g; }

function corona(radio, y) {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(radio, radio, 0.06, 16, 1, true), '#f6c445', [0, y, 0], { ...ORO, side: THREE.DoubleSide }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(malla(new THREE.ConeGeometry(0.025, 0.07, 6), '#f6c445', [Math.cos(a) * radio, y + 0.06, Math.sin(a) * radio], ORO));
  }
  return g;
}

// ---------- persona (≈ 1,75 m, cabeza grande estilo caricatura) ----------
export function crearPersona(c) {
  const O = OPCIONES.persona, piel = O.piel[c.piel] ?? O.piel[1], pelo = O.colorPelo[c.colorPelo] ?? O.colorPelo[0];
  const polera = O.polera[c.polera] ?? O.polera[0], pantalon = O.pantalon[c.pantalon] ?? O.pantalon[0];
  const g = new THREE.Group();
  const piernas = [-0.09, 0.09].map(x => {
    const pierna = new THREE.Group();
    pierna.add(malla(new THREE.CapsuleGeometry(0.075, 0.5, 4, 10), pantalon, [0, -0.33, 0]));
    pierna.add(malla(new THREE.BoxGeometry(0.13, 0.08, 0.22), '#2b2d42', [0, -0.68, 0.04]));
    return pivote([x, 0.74, 0], pierna);
  });
  g.add(...piernas);
  const torso = malla(new THREE.CapsuleGeometry(0.2, 0.3, 6, 14), polera, [0, 1.06, 0]);
  torso.scale.set(1, 1, 0.72);
  g.add(torso);
  const brazos = [-1, 1].map(lado => {
    const brazo = new THREE.Group();
    brazo.add(malla(new THREE.CapsuleGeometry(0.06, 0.4, 4, 10), polera, [0, -0.24, 0]));
    brazo.add(malla(new THREE.SphereGeometry(0.065, 12, 10), piel, [0, -0.5, 0]));
    const p = pivote([lado * 0.26, 1.3, 0], brazo);
    p.rotation.z = lado * 0.12;
    return p;
  });
  g.add(...brazos);
  g.add(malla(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10), piel, [0, 1.38, 0]));

  const cabeza = new THREE.Group();
  cabeza.position.y = 1.56;
  cabeza.add(malla(new THREE.SphereGeometry(0.2, 24, 18), piel));
  for (const x of [-0.07, 0.07]) cabeza.add(malla(new THREE.SphereGeometry(0.028, 10, 8), '#1b1b1f', [x, 0.02, 0.18]));
  cabeza.add(malla(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), '#7a3b2e', [0, -0.07, 0.18]).rotateZ(Math.PI));
  if (c.pelo === 'rapado') {
    cabeza.add(malla(new THREE.SphereGeometry(0.203, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), pelo, [0, 0, -0.005]));
  } else {
    const casco = malla(new THREE.SphereGeometry(0.212, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), pelo, [0, 0.01, -0.012]);
    casco.rotation.x = -0.25;
    cabeza.add(casco);
    if (c.pelo === 'largo') {
      const melena = malla(new THREE.CapsuleGeometry(0.16, 0.18, 4, 12), pelo, [0, -0.12, -0.1]);
      melena.scale.set(1, 1, 0.55);
      cabeza.add(melena);
    }
    if (c.pelo === 'mono') cabeza.add(malla(new THREE.SphereGeometry(0.09, 14, 10), pelo, [0, 0.19, -0.1]));
  }
  g.add(cabeza);

  // accesorios
  const acc = c.accesorio;
  if (acc === 'gorro') {
    cabeza.add(malla(new THREE.SphereGeometry(0.22, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), '#e63946', [0, 0.04, 0]));
    cabeza.add(malla(new THREE.SphereGeometry(0.06, 10, 8), '#f4f6fb', [0, 0.27, 0]));
  } else if (acc === 'lentes') {
    for (const x of [-0.075, 0.075]) cabeza.add(malla(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16), '#111', [x, 0.025, 0.19]).rotateX(Math.PI / 2));
    cabeza.add(malla(new THREE.BoxGeometry(0.06, 0.012, 0.012), '#111', [0, 0.04, 0.2]));
  } else if (acc === 'bufanda') {
    g.add(malla(new THREE.TorusGeometry(0.13, 0.05, 8, 16), '#2ec4b6', [0, 1.38, 0]).rotateX(Math.PI / 2));
    g.add(malla(new THREE.BoxGeometry(0.09, 0.28, 0.04), '#2ec4b6', [0.07, 1.22, 0.16]));
  } else if (acc === 'mochila') {
    g.add(malla(new THREE.BoxGeometry(0.3, 0.38, 0.16), '#ffbe0b', [0, 1.08, -0.22]));
  } else if (acc === 'corona') {
    cabeza.add(corona(0.13, 0.2));
  }
  g.userData = { piernas, brazos, cabeza };
  return g;
}

// ---------- perro (mediano ≈ 0,75 m de alto, mirando a +z) ----------
export function crearPerro(c) {
  const O = OPCIONES.perro, pelaje = O.pelaje[c.pelaje] ?? O.pelaje[0];
  const oscuro = '#' + new THREE.Color(pelaje).multiplyScalar(0.55).getHexString();
  const g = new THREE.Group(), cuerpo = new THREE.Group();
  const tronco = malla(new THREE.CapsuleGeometry(0.15, 0.36, 6, 14), pelaje, [0, 0.42, 0]);
  tronco.rotation.x = Math.PI / 2;
  cuerpo.add(tronco);
  if (c.manchas) for (const [x, y, z, r] of [[0.1, 0.5, 0.08, 0.08], [-0.09, 0.47, -0.12, 0.09], [0.04, 0.55, -0.2, 0.07]]) {
    const m = malla(new THREE.SphereGeometry(r, 12, 8), oscuro, [x, y, z]);
    m.scale.set(1, 0.5, 1.2);
    cuerpo.add(m);
  }
  const patas = [[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.2], [0.09, -0.2]].map(([x, z]) =>
    pivote([x, 0.36, z], malla(new THREE.CylinderGeometry(0.045, 0.04, 0.34, 8), pelaje, [0, -0.17, 0])));
  cuerpo.add(...patas);
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 0.62, 0.32);
  cabeza.add(malla(new THREE.SphereGeometry(0.14, 20, 14), pelaje));
  const hocico = malla(new THREE.CapsuleGeometry(0.07, 0.08, 4, 10), pelaje, [0, -0.04, 0.14]);
  hocico.rotation.x = Math.PI / 2;
  cabeza.add(hocico);
  cabeza.add(malla(new THREE.SphereGeometry(0.035, 10, 8), '#1b1b1f', [0, -0.02, 0.25]));
  for (const x of [-0.06, 0.06]) cabeza.add(malla(new THREE.SphereGeometry(0.022, 10, 8), '#1b1b1f', [x, 0.04, 0.12]));
  for (const lado of [-1, 1]) {
    if (c.orejas === 'paradas') {
      const o = malla(new THREE.ConeGeometry(0.05, 0.13, 8), oscuro, [lado * 0.08, 0.15, -0.02]);
      o.rotation.z = -lado * 0.25;
      cabeza.add(o);
    } else {
      const o = malla(new THREE.SphereGeometry(0.07, 12, 8), oscuro, [lado * 0.13, 0, -0.02]);
      o.scale.set(0.45, 1.25, 0.8);
      cabeza.add(o);
    }
  }
  cuerpo.add(cabeza);
  const cola = pivote([0, 0.5, -0.32], malla(new THREE.CylinderGeometry(0.025, 0.035, 0.24, 8), pelaje, [0, 0.12, 0]));
  cola.rotation.x = -0.7;
  cuerpo.add(cola);

  const acc = c.accesorio;
  if (acc === 'bandana') {
    const b = malla(new THREE.ConeGeometry(0.1, 0.16, 3), '#e63946', [0, 0.5, 0.3]);
    b.rotation.x = Math.PI;
    cuerpo.add(b);
  } else if (acc === 'collar') {
    cuerpo.add(malla(new THREE.TorusGeometry(0.1, 0.022, 8, 18), '#f6c445', [0, 0.54, 0.26], ORO).rotateX(Math.PI / 2.6));
  } else if (acc === 'sombrero') {
    cabeza.add(malla(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 16), '#2b2d42', [0, 0.13, 0]));
    cabeza.add(malla(new THREE.CylinderGeometry(0.065, 0.07, 0.11, 16), '#2b2d42', [0, 0.19, 0]));
  } else if (acc === 'capa') {
    const capa = malla(new THREE.PlaneGeometry(0.3, 0.42), '#8338ec', [0, 0.59, -0.04], { side: THREE.DoubleSide });
    capa.rotation.x = -Math.PI / 2 + 0.12;
    cuerpo.add(capa);
  } else if (acc === 'corona') {
    cabeza.add(corona(0.08, 0.13));
  }
  g.add(cuerpo);
  g.scale.setScalar({ pequeno: 0.72, mediano: 1, grande: 1.3 }[c.tamano] ?? 1);
  g.userData = { patas, cola, cuerpo };
  return g;
}

// Animación: `fase` avanza con la distancia recorrida; `mov` (0–1) indica cuánto se está caminando.
export function animarPersona(p, fase, mov, t) {
  const { piernas, brazos, cabeza } = p.userData, s = Math.sin(fase) * 0.55 * mov;
  piernas[0].rotation.x = s; piernas[1].rotation.x = -s;
  brazos[0].rotation.x = -s * 0.8; brazos[1].rotation.x = s * 0.8;
  p.position.y = Math.abs(Math.cos(fase)) * 0.03 * mov + Math.sin(t * 2) * 0.004;
  cabeza.rotation.y = Math.sin(t * 0.7) * 0.15 * (1 - mov);
}

export function animarPerro(d, fase, mov, t) {
  const { patas, cola, cuerpo } = d.userData, s = Math.sin(fase * 1.4) * 0.6 * mov;
  patas[0].rotation.x = s; patas[3].rotation.x = s; patas[1].rotation.x = -s; patas[2].rotation.x = -s;
  cola.rotation.z = Math.sin(t * (mov > 0.2 ? 14 : 8)) * 0.6;
  cuerpo.position.y = Math.abs(Math.cos(fase * 1.4)) * 0.025 * mov;
}
