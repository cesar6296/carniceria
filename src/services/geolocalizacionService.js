function normalizar(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Coordenadas aproximadas por ciudad; no representan domicilios particulares.
const ciudades = {
  culiacan: { lat: 24.8091, lng: -107.394, pais: 'México' },
  hermosillo: { lat: 29.0729, lng: -110.9559, pais: 'México' },
  monterrey: { lat: 25.6866, lng: -100.3161, pais: 'México' },
  saltillo: { lat: 25.438, lng: -100.9737, pais: 'México' },
  'ciudad de mexico': { lat: 19.4326, lng: -99.1332, pais: 'México' },
  cdmx: { lat: 19.4326, lng: -99.1332, pais: 'México' },
  guadalajara: { lat: 20.6597, lng: -103.3496, pais: 'México' },
  'oaxaca de juarez': { lat: 17.0732, lng: -96.7266, pais: 'México' },
  oaxaca: { lat: 17.0732, lng: -96.7266, pais: 'México' },
  merida: { lat: 20.9674, lng: -89.5926, pais: 'México' }
};

// Solo se usa como aproximación cuando el usuario sí proporcionó un país.
const paises = {
  mexico: { lat: 23.6345, lng: -102.5528, nombre: 'México' },
  rusia: { lat: 61.524, lng: 105.3188, nombre: 'Rusia' },
  'estados unidos': { lat: 37.0902, lng: -95.7129, nombre: 'Estados Unidos' },
  usa: { lat: 37.0902, lng: -95.7129, nombre: 'Estados Unidos' },
  canada: { lat: 56.1304, lng: -106.3468, nombre: 'Canadá' },
  espana: { lat: 40.4637, lng: -3.7492, nombre: 'España' },
  francia: { lat: 46.2276, lng: 2.2137, nombre: 'Francia' },
  alemania: { lat: 51.1657, lng: 10.4515, nombre: 'Alemania' },
  brasil: { lat: -14.235, lng: -51.9253, nombre: 'Brasil' },
  argentina: { lat: -38.4161, lng: -63.6167, nombre: 'Argentina' },
  colombia: { lat: 4.5709, lng: -74.2973, nombre: 'Colombia' },
  japon: { lat: 36.2048, lng: 138.2529, nombre: 'Japón' },
  china: { lat: 35.8617, lng: 104.1954, nombre: 'China' },
  'reino unido': { lat: 55.3781, lng: -3.436, nombre: 'Reino Unido' }
};

function obtenerUbicacion(datos = {}) {
  const ciudad = datos.ciudad ? String(datos.ciudad).trim() : '';
  const pais = datos.pais ? String(datos.pais).trim() : '';
  const ciudadConocida = ciudades[normalizar(ciudad)];

  const tieneCoordenadas = datos.latitud !== undefined
    && datos.latitud !== null
    && datos.longitud !== undefined
    && datos.longitud !== null
    && datos.latitud !== ''
    && datos.longitud !== ''
    && Number.isFinite(Number(datos.latitud))
    && Number.isFinite(Number(datos.longitud));

  if (tieneCoordenadas) {
    return {
      ciudad: ciudad || null,
      pais: pais || null,
      lat: Number(datos.latitud),
      lng: Number(datos.longitud),
      precision: 'coordenadas_proporcionadas'
    };
  }

  if (ciudadConocida) {
    return {
      ciudad: ciudad || null,
      pais: ciudadConocida.pais,
      lat: ciudadConocida.lat,
      lng: ciudadConocida.lng,
      precision: 'ciudad'
    };
  }

  const paisConocido = paises[normalizar(pais)];
  if (paisConocido) {
    return {
      ciudad: ciudad || null,
      pais: paisConocido.nombre,
      lat: paisConocido.lat,
      lng: paisConocido.lng,
      precision: 'pais'
    };
  }

  return {
    ciudad: ciudad || null,
    pais: pais || null,
    lat: null,
    lng: null,
    precision: 'sin_ubicacion'
  };
}

module.exports = { obtenerUbicacion };
