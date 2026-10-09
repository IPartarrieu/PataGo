// Capa personalizada de MapLibre que dibuja con three.js al avatar y su perro sobre el mapa 3D.
import * as THREE from 'three';
import { crearPersona, crearPerro, animarPersona, animarPerro } from './avatars.js';

const ALTO_PX = 105;   // alto aproximado del avatar en pantalla, a cualquier zoom (como en Pokémon Go)
const ALTO_M = 1.78;   // alto real del modelo en metros

export class CapaAvatares {
  constructor(posInicial) {
    this.id = 'avatares';
    this.type = 'custom';
    this.renderingMode = '3d';
    this.pos = [...posInicial];     // posición dibujada (se acerca suavemente al objetivo)
    this.objetivo = [...posInicial];
    this.rumbo = 200;               // grados, 0 = norte
    this.rumboObjetivo = 200;
    this.fase = 0;
    this.mov = 0;
    this.t0 = performance.now();
    this.tPrev = this.t0;
  }

  onAdd(map, gl) {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6);
    sol.position.set(-2, 6, 4);
    this.scene.add(sol);
    this.grupo = new THREE.Group();
    this.scene.add(this.grupo);
    // sombras simples bajo los personajes
    const sombra = (r, x, z) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.01, z);
      return m;
    };
    this.grupo.add(sombra(0.32, 0, 0), sombra(0.36, 0.85, 0.45));
    this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    if (this.pendiente) this.setModelos(...this.pendiente);
  }

  setModelos(cfgPersona, cfgPerro) {
    if (!this.grupo) { this.pendiente = [cfgPersona, cfgPerro]; return; }
    for (const m of [this.persona, this.perro, this.correa]) if (m) this.grupo.remove(m);
    this.persona = crearPersona(cfgPersona);
    this.perro = crearPerro(cfgPerro);
    this.perro.position.set(0.85, 0, 0.45); // a un costado y un poco adelante
    // correa: de la mano al cuello del perro
    const e = this.perro.scale.x;
    const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.3, 0.82, 0.05), new THREE.Vector3(0.6, 0.45, 0.3), new THREE.Vector3(0.85, 0.55 * e, 0.45 + 0.28 * e));
    this.correa = new THREE.Mesh(new THREE.TubeGeometry(curva, 16, 0.012, 6), new THREE.MeshStandardMaterial({ color: 0xe63946 }));
    this.grupo.add(this.persona, this.perro, this.correa);
    this.map?.triggerRepaint();
  }

  // Nueva posición (y rumbo, si se conoce) desde el GPS o la simulación
  irA(punto, rumbo) {
    if (!this.conPosicion) { this.pos = [...punto]; this.conPosicion = true; }
    this.objetivo = [...punto];
    if (rumbo != null) this.rumboObjetivo = rumbo;
  }

  render(gl, matrix) {
    const ahora = performance.now(), dtReal = (ahora - this.tPrev) / 1000, dt = Math.min(0.1, dtReal), t = (ahora - this.t0) / 1000;
    this.tPrev = ahora;
    // acercamiento suave a la posición objetivo (las lecturas llegan ~1 por segundo). Usa el tiempo real,
    // así no se queda atrás si el teléfono dibuja pocos cuadros; si quedó muy lejos (>40 m), salta.
    const mLat = 111195, mLon = mLat * Math.cos((this.pos[1] * Math.PI) / 180), antes = this.pos;
    const brecha = Math.hypot((this.objetivo[0] - antes[0]) * mLon, (this.objetivo[1] - antes[1]) * mLat);
    const k = brecha > 40 ? 1 : 1 - Math.exp(-dtReal / 0.55);
    this.pos = [antes[0] + (this.objetivo[0] - antes[0]) * k, antes[1] + (this.objetivo[1] - antes[1]) * k];
    const v = k === 1 ? 0 : Math.hypot((this.pos[0] - antes[0]) * mLon, (this.pos[1] - antes[1]) * mLat) / Math.max(dtReal, 1e-3);
    this.mov += ((v > 0.25 ? 1 : 0) - this.mov) * (1 - Math.exp(-dt / 0.25));
    this.fase += v * dt * 5.2;
    const dr = ((this.rumboObjetivo - this.rumbo + 540) % 360) - 180;
    this.rumbo += dr * (1 - Math.exp(-dt / 0.3));

    if (this.persona) {
      animarPersona(this.persona, this.fase, this.mov, t);
      animarPerro(this.perro, this.fase, this.mov, t);
    }
    // el modelo mira a +z; con esta transformación +x = este y +z = sur, así que rotar π − rumbo lo orienta
    this.grupo.rotation.y = Math.PI - (this.rumbo * Math.PI) / 180;

    const merc = maplibregl.MercatorCoordinate.fromLngLat(this.pos, 0);
    const mpp = (40075016.686 * Math.cos((this.pos[1] * Math.PI) / 180)) / (512 * 2 ** this.map.getZoom());
    const s = merc.meterInMercatorCoordinateUnits() * Math.max(1, (ALTO_PX * mpp) / ALTO_M);
    const l = new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z)
      .scale(new THREE.Vector3(s, -s, s))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}
