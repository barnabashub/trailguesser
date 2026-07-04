export async function loadGameData() {
  const [locationsRes, countriesRes] = await Promise.all([
    fetch("data/locations.json"),
    fetch("data/countries.json"),
  ]);
  if (!locationsRes.ok || !countriesRes.ok) {
    throw new Error("Nem sikerült betölteni a játék adatait (data/locations.json, data/countries.json).");
  }
  const locations = await locationsRes.json();
  const countries = await countriesRes.json();
  return { locations, countries };
}

export function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
