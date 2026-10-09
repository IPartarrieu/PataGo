# PataGo 🐾

Pasea a tu perro como en un juego: tu avatar y el de tu perro caminan por un **mapa 3D de Concepción**, cada paseo suma kilómetros, rachas de días seguidos y **medallas** que desbloquean accesorios para los avatares.

🔗 **App:** [ipartarrieu.github.io/PataGo](https://ipartarrieu.github.io/PataGo/) · [modo simulación](https://ipartarrieu.github.io/PataGo/?sim=1) (para probar sin GPS)

📱 **Instalar en iPhone:** ábrela en Safari → Compartir → *Agregar a pantalla de inicio*.

## Etapa 1 (esta versión): prototipo personal

- **Mapa 3D** con edificios (MapLibre + OpenFreeMap / OpenStreetMap), sin claves ni costos.
- **Avatares personalizables** (persona y perro) dibujados con three.js sobre el mapa, con animación de caminata.
- **Registro de paseos** con GPS: distancia, tiempo, ritmo, pasos estimados y recorrido en el mapa.
- **Meta diaria, rachas y 14 medallas**; 10 de ellas desbloquean accesorios (gorro, bandana, capa, corona…).
- **Cerca de ti:** áreas verdes, veterinarias y tiendas de mascotas de Concepción, con enlace a Google Maps (horarios).
- **PWA:** instalable, funciona sin conexión y guarda los mosaicos del mapa que ya viste.
- Los datos quedan **solo en el teléfono** (localStorage), con exportar/importar respaldo.

**Límite conocido (iOS):** una app web no puede seguir el GPS con la pantalla bloqueada ni leer el podómetro. Durante el paseo la app mantiene la pantalla encendida y estima los pasos a partir de la distancia (zancada de 0,72 m).

## Próximas etapas

2. **Usuarios** (Firebase, plan gratuito): cuentas, perfiles de perros, paseadores cerca en tiempo real, amigos, modo silencioso.
3. **Opcional:** app nativa (Capacitor) para paseos con pantalla bloqueada y pasos reales desde Salud.

## Estructura

| Archivo | Qué hace |
|---|---|
| `docs/index.html` | Interfaz (mapa a pantalla completa, barra inferior, paneles) |
| `docs/js/main.js` | Une todo: mapa, lugares, paseo, paneles |
| `docs/js/scene.js` | Capa three.js sobre MapLibre que dibuja los avatares |
| `docs/js/avatars.js` | Modelos 3D de la persona y el perro, opciones y accesorios |
| `docs/js/walk.js` | GPS filtrado, distancia, simulación |
| `docs/js/progress.js` | Estadísticas, rachas, medallas, premios y guardado |
| `docs/data/lugares.geojson` | Lugares de Concepción (generado con `scripts/lugares_osm.py`) |
| `docs/sw.js` | Service worker (sin conexión) |

```bash
node tests/logic.test.mjs          # tests de la lógica
python3 scripts/lugares_osm.py     # actualizar lugares desde OpenStreetMap
cd docs && python3 -m http.server  # correr en local → http://localhost:8000/?sim=1
```

Datos de mapa y lugares: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors · mosaicos de [OpenFreeMap](https://openfreemap.org).
