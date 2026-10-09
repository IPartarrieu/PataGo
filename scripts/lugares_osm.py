"""Descarga desde OpenStreetMap (Overpass) las áreas verdes, veterinarias y tiendas de mascotas de
Concepción y genera docs/data/lugares.geojson, que la app carga como archivo estático (sin API en vivo).

Uso: python3 scripts/lugares_osm.py
"""
import json
import math
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

BBOX = (-36.875, -73.115, -36.76, -72.99)  # sur, oeste, norte, este (Concepción y alrededores)
MIN_AREA_SIN_NOMBRE = 3000                  # m²: áreas verdes sin nombre más chicas se omiten
OUT = Path(__file__).resolve().parents[1] / 'docs' / 'data' / 'lugares.geojson'

b = ','.join(map(str, BBOX))
QUERY = f"""[out:json][timeout:60];(
  way["leisure"~"^(park|garden|dog_park)$"]({b}); relation["leisure"~"^(park|garden|dog_park)$"]({b});
  nwr["amenity"="veterinary"]({b}); nwr["shop"="pet"]({b});
);out geom tags;"""


SERVIDORES = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']


def overpass(query, intentos=3):
    """Consulta Overpass; si un servidor está saturado (429/504), reintenta y prueba el espejo."""
    error = None
    for k in range(intentos):
        for url in SERVIDORES:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': query}).encode(),
                                         headers={'User-Agent': 'PataGo-prototipo/0.1'})
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.load(r)['elements']
            except OSError as e:
                error = e
        time.sleep(10 * (k + 1))
    raise RuntimeError(f'Overpass no respondió: {error}')


def puntos(e):
    if e['type'] == 'node':
        return [(e['lon'], e['lat'])]
    if e['type'] == 'way':
        return [(p['lon'], p['lat']) for p in e.get('geometry', [])]
    return [(p['lon'], p['lat']) for m in e.get('members', []) if m.get('role') == 'outer' for p in m.get('geometry', [])]


def area_m2(pts):
    """Área aproximada (fórmula del zapato en metros locales)."""
    if len(pts) < 3:
        return 0.0
    lat0 = math.radians(sum(p[1] for p in pts) / len(pts))
    xy = [(math.radians(lon) * 6371000 * math.cos(lat0), math.radians(lat) * 6371000) for lon, lat in pts]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(xy, xy[1:] + xy[:1]))) / 2


def main():
    features = []
    for e in overpass(QUERY):
        t, pts = e.get('tags', {}), puntos(e)
        if not pts:
            continue
        lon, lat = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
        if t.get('amenity') == 'veterinary':
            tipo = 'veterinaria'
        elif t.get('shop') == 'pet':
            tipo = 'tienda'
        else:
            tipo = 'perros' if t.get('leisure') == 'dog_park' else 'area_verde'
        props = {'tipo': tipo, 'nombre': t.get('name')}
        if tipo == 'area_verde':
            props['area'] = round(area_m2(pts))
            if not props['nombre'] and props['area'] < MIN_AREA_SIN_NOMBRE:
                continue
        for k_osm, k in [('opening_hours', 'horario'), ('phone', 'telefono'), ('contact:phone', 'telefono'),
                         ('addr:street', 'calle'), ('addr:housenumber', 'numero'), ('website', 'web')]:
            if t.get(k_osm) and k not in props:
                props[k] = t[k_osm]
        features.append({'type': 'Feature', 'properties': props,
                         'geometry': {'type': 'Point', 'coordinates': [round(lon, 6), round(lat, 6)]}})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'type': 'FeatureCollection', 'fuente': '© OpenStreetMap contributors (ODbL)',
                               'features': features}, ensure_ascii=False, separators=(',', ':')))
    print(OUT, len(features), dict(Counter(f['properties']['tipo'] for f in features)))


if __name__ == '__main__':
    main()
