// Seguimiento de un paseo: GPS real (filtrado) o simulación. Geometría pura arriba, el rastreador abajo.

const R = 6371000;
const rad = x => (x * Math.PI) / 180;

// Distancia en metros entre dos puntos [lon, lat] (haversine)
export function distancia([lon1, lat1], [lon2, lat2]) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Rumbo en grados (0 = norte, 90 = este) de a hacia b
export function rumbo([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const largoRuta = ruta => ruta.slice(1).reduce((s, p, i) => s + distancia(ruta[i], p), 0);

// Filtro de lecturas GPS: ignora las imprecisas, el temblor estando quieto y los saltos imposibles.
export const FILTRO = { precisionMax: 30, movimientoMin: 4, velocidadMax: 7 };
export function aceptarLectura(ultima, nueva, f = FILTRO) {
  if (nueva.precision > f.precisionMax) return false;
  if (!ultima) return true;
  const d = distancia(ultima.punto, nueva.punto), dt = (nueva.t - ultima.t) / 1000;
  if (d < Math.max(f.movimientoMin, nueva.precision * 0.3)) return false;
  return dt > 0 && d / dt <= f.velocidadMax;
}

// Ruta de demostración: Plaza de la Independencia → Parque Ecuador → vuelta (Concepción)
export const RUTA_DEMO = [
  [-73.0502, -36.8271], [-73.0505, -36.8300], [-73.0507, -36.8330], [-73.0475, -36.8334],
  [-73.0444, -36.8321], [-73.0447, -36.8291], [-73.0475, -36.8280], [-73.0502, -36.8271],
];

// Punto a `m` metros de recorrido a lo largo de una ruta (para la simulación)
export function puntoEnRuta(ruta, m) {
  const total = largoRuta(ruta);
  m = ((m % total) + total) % total;
  for (let i = 1; i < ruta.length; i++) {
    const tramo = distancia(ruta[i - 1], ruta[i]);
    if (m <= tramo) { const u = m / tramo; return [ruta[i - 1][0] + (ruta[i][0] - ruta[i - 1][0]) * u, ruta[i - 1][1] + (ruta[i][1] - ruta[i - 1][1]) * u]; }
    m -= tramo;
  }
  return ruta[ruta.length - 1];
}

// ---------- rastreador ----------
// fuente: 'gps' o 'simulacion'. Llama onPosicion({punto, rumbo, precision}) con cada lectura útil
// (también estando quieto, para ubicar el avatar) y suma la distancia mientras se graba un paseo.
export class Rastreador {
  constructor({ onPosicion, onError }) {
    this.onPosicion = onPosicion; this.onError = onError;
    this.grabando = false; this.ultima = null; this.ruta = []; this.distancia = 0; this.inicio = 0; this.velSim = 1;
  }

  iniciar(fuente = 'gps') {
    this.detenerFuente();
    this.fuente = fuente;
    this.ultima = null;
    if (fuente === 'simulacion') {
      let m = 0;
      // en simulación solo se avanza (a 1,4 m/s × velSim) mientras hay un paseo en curso
      const paso = () => { if (this.grabando) m += 1.4 * this.velSim; this.lectura({ punto: puntoEnRuta(RUTA_DEMO, m), precision: 5, t: Date.now() }); };
      paso();
      this.timer = setInterval(paso, 1000);
    } else if ('geolocation' in navigator) {
      this.watch = navigator.geolocation.watchPosition(
        p => this.lectura({ punto: [p.coords.longitude, p.coords.latitude], precision: p.coords.accuracy, t: p.timestamp }),
        e => this.onError?.(e), { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
    } else this.onError?.({ code: 0, message: 'Este dispositivo no tiene GPS disponible' });
  }

  detenerFuente() {
    clearInterval(this.timer);
    if (this.watch !== undefined) navigator.geolocation.clearWatch(this.watch);
    this.watch = undefined;
  }

  lectura(l) {
    const anterior = this.ultima;
    if (!aceptarLectura(anterior, l)) {
      if (!anterior && l.precision <= 80) this.onPosicion({ ...l, rumbo: null }); // ubicación aproximada inicial
      return;
    }
    if (this.grabando && anterior) { this.distancia += distancia(anterior.punto, l.punto); this.ruta.push(l.punto); }
    this.ultima = l;
    this.onPosicion({ ...l, rumbo: anterior ? rumbo(anterior.punto, l.punto) : null });
  }

  comenzarPaseo() {
    this.grabando = true; this.distancia = 0; this.inicio = Date.now();
    this.ruta = this.ultima ? [this.ultima.punto] : [];
  }

  terminarPaseo(zancada) {
    this.grabando = false;
    const fin = Date.now();
    return {
      inicio: this.inicio, fin, duracion: Math.round((fin - this.inicio) / 1000), distancia: Math.round(this.distancia),
      pasos: Math.round(this.distancia / zancada), ruta: this.ruta.map(([a, b]) => [+a.toFixed(6), +b.toFixed(6)]),
    };
  }
}
