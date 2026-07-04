const EARTH_RADIUS_KM = 6371;
const MAX_DISTANCE_POINTS = 5000;
const DISTANCE_DECAY_KM = 800;
const COUNTRY_POINTS = 1000;
const LINE_POINTS = 2000;
const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function normalize(str) {
  return (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "");
}

export function textMatches(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  return na.length > 0 && na === nb;
}

export function computeScore({ location, guessCountry, guessLine, guessLat, guessLng }) {
  const distanceKm = haversineDistanceKm(location.lat, location.lng, guessLat, guessLng);
  const distancePoints = Math.max(
    0,
    Math.round(MAX_DISTANCE_POINTS * Math.exp(-distanceKm / DISTANCE_DECAY_KM))
  );
  const countryCorrect = textMatches(guessCountry, location.country);
  const lineCorrect = textMatches(guessLine, location.name);
  const countryPoints = countryCorrect ? COUNTRY_POINTS : 0;
  const linePoints = lineCorrect ? LINE_POINTS : 0;
  const total = distancePoints + countryPoints + linePoints;

  return {
    distanceKm,
    distancePoints,
    countryCorrect,
    countryPoints,
    lineCorrect,
    linePoints,
    total,
  };
}
