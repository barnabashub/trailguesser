import { loadGameData, shuffle } from "./data.js";
import { computeScore } from "./scoring.js";
import { createGuessMap, createRevealMap } from "./map.js";
import * as viewer from "./viewer.js";

const el = (id) => document.getElementById(id);

let allLocations = [];
let countries = [];
let roundLocations = [];
let currentRoundIndex = 0;
let totalScore = 0;
let roundResults = [];
let currentGuess = null;
let lastSceneState = { index: 0, total: 0, isEmbed: false };

let guessMapCtrl = null;
let revealMapCtrl = null;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  el(id).classList.remove("hidden");
}

function populateRoundCountOptions() {
  const select = el("round-count");
  select.innerHTML = "";
  const total = allLocations.length;
  const candidates = [5, 10, total].filter((n) => n > 0 && n <= total);
  const unique = Array.from(new Set(candidates)).sort((a, b) => a - b);

  unique.forEach((n) => {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = n === total ? `Összes helyszín (${n})` : `${n} helyszín`;
    select.appendChild(opt);
  });
  select.value = String(total);
}

function populateCountryDatalist() {
  const list = el("datalist-country");
  list.innerHTML = "";
  countries
    .slice()
    .sort((a, b) => a.localeCompare(b, "hu"))
    .forEach((country) => {
      const opt = document.createElement("option");
      opt.value = country;
      list.appendChild(opt);
    });
}

function populateLineDatalist() {
  const list = el("datalist-line");
  list.innerHTML = "";
  const names = Array.from(new Set(allLocations.map((loc) => loc.name))).sort((a, b) =>
    a.localeCompare(b, "hu")
  );
  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    list.appendChild(opt);
  });
}

function updateHeaderScore() {
  el("header-score-value").textContent = String(totalScore);
  el("round-running-score").textContent = String(totalScore);
}

function startGame() {
  const count = parseInt(el("round-count").value, 10);
  roundLocations = shuffle(allLocations).slice(0, count);
  currentRoundIndex = 0;
  totalScore = 0;
  roundResults = [];

  el("header-score").classList.remove("hidden");
  updateHeaderScore();
  showScreen("screen-round");
  loadRound();
}

function loadRound() {
  const location = roundLocations[currentRoundIndex];

  el("round-index").textContent = String(currentRoundIndex + 1);
  el("round-total").textContent = String(roundLocations.length);
  el("input-country").value = "";
  el("input-line").value = "";
  currentGuess = null;
  el("btn-submit-guess").disabled = true;

  guessMapCtrl.reset();
  viewer.mountViewer(location, { onSceneChange: handleSceneChange });

  requestAnimationFrame(() => guessMapCtrl.invalidateSize());
}

function handleSceneChange(state) {
  lastSceneState = state;
  const nav = el("viewer-nav");
  if (state.isEmbed) {
    nav.classList.add("hidden");
    return;
  }
  nav.classList.remove("hidden");
  el("btn-scene-prev").disabled = !viewer.canStepPrev();
  el("btn-scene-next").disabled = !viewer.canStepNext();
  el("scene-indicator").textContent = `${state.index + 1} / ${state.total}`;
}

function submitGuess() {
  if (!currentGuess) return;
  const location = roundLocations[currentRoundIndex];

  const score = computeScore({
    location,
    guessCountry: el("input-country").value,
    guessLine: el("input-line").value,
    guessLat: currentGuess.lat,
    guessLng: currentGuess.lng,
  });

  roundResults.push({ location, score });
  totalScore += score.total;
  updateHeaderScore();
  showReveal(location, score);
}

function setResultRow(prefix, correct, points) {
  const tag = el(`score-${prefix}-result`);
  tag.textContent = correct ? "Eltalálva" : "Nem talált";
  tag.className = "result-tag" + (correct ? " correct" : "");
  el(`score-${prefix}-points`).textContent = `+${points}`;
}

function showReveal(location, score) {
  el("reveal-image").src = location.revealImage;
  el("reveal-name").textContent = location.name;
  el("reveal-country").textContent = location.country;

  setResultRow("country", score.countryCorrect, score.countryPoints);
  setResultRow("line", score.lineCorrect, score.linePoints);

  el("score-distance-result").textContent = `${Math.round(score.distanceKm)} km`;
  el("score-distance-result").className = "result-tag";
  el("score-distance-points").textContent = `+${score.distancePoints}`;
  el("score-round-total").textContent = `${score.total} pont`;

  const guess = currentGuess;
  showScreen("screen-reveal");
  requestAnimationFrame(() => {
    revealMapCtrl.invalidateSize();
    revealMapCtrl.show({
      actualLat: location.lat,
      actualLng: location.lng,
      guessLat: guess.lat,
      guessLng: guess.lng,
    });
  });
}

function nextRound() {
  currentRoundIndex += 1;
  if (currentRoundIndex >= roundLocations.length) {
    showFinal();
  } else {
    showScreen("screen-round");
    loadRound();
  }
}

function showFinal() {
  el("header-score").classList.add("hidden");
  el("final-score-value").textContent = String(totalScore);

  const container = el("final-summary");
  container.innerHTML = "";
  roundResults.forEach((result) => {
    const row = document.createElement("div");
    row.className = "final-summary-row";
    row.innerHTML = `
      <div class="name">${result.location.name}<small>${result.location.country}</small></div>
      <div class="points">${result.score.total} pont</div>
    `;
    container.appendChild(row);
  });

  showScreen("screen-final");
}

function restartToStart() {
  showScreen("screen-start");
}

async function init() {
  const data = await loadGameData();
  allLocations = data.locations;
  countries = data.countries;

  populateRoundCountOptions();
  populateCountryDatalist();
  populateLineDatalist();

  guessMapCtrl = createGuessMap("guess-map");
  guessMapCtrl.onGuessPlaced((lat, lng) => {
    currentGuess = { lat, lng };
    el("btn-submit-guess").disabled = false;
  });

  revealMapCtrl = createRevealMap("reveal-map");

  el("btn-start").addEventListener("click", startGame);
  el("btn-scene-prev").addEventListener("click", () => viewer.stepPrev());
  el("btn-scene-next").addEventListener("click", () => viewer.stepNext());
  el("btn-submit-guess").addEventListener("click", submitGuess);
  el("btn-next-round").addEventListener("click", nextRound);
  el("btn-restart").addEventListener("click", restartToStart);
}

init().catch((err) => {
  console.error(err);
  alert("Hiba történt a játék betöltésekor: " + err.message);
});
