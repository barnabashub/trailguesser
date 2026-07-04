/* global L */

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "assets/vendor/leaflet/images/marker-icon-2x.png",
  iconUrl: "assets/vendor/leaflet/images/marker-icon.png",
  shadowUrl: "assets/vendor/leaflet/images/marker-shadow.png",
});

const EUROPE_CENTER = [50, 15];
const EUROPE_ZOOM = 4;
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap közreműködők";

export function createGuessMap(containerId) {
  const map = L.map(containerId, { worldCopyJump: true }).setView(EUROPE_CENTER, EUROPE_ZOOM);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

  let marker = null;
  let onGuess = null;

  map.on("click", (e) => {
    setMarker(e.latlng.lat, e.latlng.lng);
    if (onGuess) onGuess(e.latlng.lat, e.latlng.lng);
  });

  function setMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }
  }

  return {
    onGuessPlaced(cb) {
      onGuess = cb;
    },
    reset() {
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      map.setView(EUROPE_CENTER, EUROPE_ZOOM);
    },
    invalidateSize() {
      map.invalidateSize();
    },
  };
}

export function createRevealMap(containerId) {
  const map = L.map(containerId, { worldCopyJump: true }).setView(EUROPE_CENTER, EUROPE_ZOOM);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

  const actualIcon = L.divIcon({ className: "pin", html: "📍", iconSize: [28, 28] });
  const guessIcon = L.divIcon({ className: "pin", html: "🚩", iconSize: [28, 28] });

  return {
    show({ actualLat, actualLng, guessLat, guessLng }) {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
      });
      L.marker([actualLat, actualLng], { icon: actualIcon }).addTo(map);
      L.marker([guessLat, guessLng], { icon: guessIcon }).addTo(map);
      L.polyline(
        [
          [actualLat, actualLng],
          [guessLat, guessLng],
        ],
        { color: "#f2a444", weight: 3, dashArray: "6 6" }
      ).addTo(map);

      const bounds = L.latLngBounds([
        [actualLat, actualLng],
        [guessLat, guessLng],
      ]).pad(0.4);
      map.fitBounds(bounds, { maxZoom: 9 });
    },
    invalidateSize() {
      map.invalidateSize();
    },
  };
}
