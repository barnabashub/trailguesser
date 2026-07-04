/* global pannellum */

let viewerInstance = null;
let currentScenes = [];
let currentSceneIndex = 0;
let onSceneChange = null;

function notifySceneChange() {
  if (onSceneChange) {
    onSceneChange({
      index: currentSceneIndex,
      total: currentScenes.length,
      isEmbed: currentScenes.length === 0,
    });
  }
}

function resolveEmbedUrl(embed) {
  if (embed.provider === "mapillary" && embed.imageKey) {
    return `https://www.mapillary.com/embed?image_key=${encodeURIComponent(embed.imageKey)}&style=photo`;
  }
  if (embed.url) return embed.url;
  return "about:blank";
}

export function mountViewer(location, callbacks = {}) {
  onSceneChange = callbacks.onSceneChange || null;
  destroyViewer();

  const panoramaEl = document.getElementById("viewer-panorama");
  const embedWrap = document.getElementById("viewer-embed-wrap");
  const embedFrame = document.getElementById("viewer-embed");

  if (location.embed) {
    panoramaEl.classList.add("hidden");
    embedWrap.classList.remove("hidden");
    embedFrame.src = resolveEmbedUrl(location.embed);
    currentScenes = [];
    currentSceneIndex = 0;
    notifySceneChange();
    return;
  }

  embedWrap.classList.add("hidden");
  embedFrame.src = "about:blank";
  panoramaEl.classList.remove("hidden");

  currentScenes = location.scenes || [];
  currentSceneIndex = 0;

  const scenes = {};
  currentScenes.forEach((imagePath, i) => {
    scenes[`s${i}`] = {
      type: "equirectangular",
      panorama: imagePath,
    };
  });

  viewerInstance = pannellum.viewer("viewer-panorama", {
    default: {
      firstScene: "s0",
      sceneFadeDuration: 400,
      autoLoad: true,
      showControls: true,
      compass: false,
      hfov: 100,
    },
    scenes,
  });

  notifySceneChange();
}

export function canStepPrev() {
  return currentScenes.length > 0 && currentSceneIndex > 0;
}

export function canStepNext() {
  return currentScenes.length > 0 && currentSceneIndex < currentScenes.length - 1;
}

export function stepPrev() {
  if (!canStepPrev()) return;
  currentSceneIndex -= 1;
  goToCurrentScene();
}

export function stepNext() {
  if (!canStepNext()) return;
  currentSceneIndex += 1;
  goToCurrentScene();
}

function goToCurrentScene() {
  if (!viewerInstance) return;
  const yaw = viewerInstance.getYaw();
  const pitch = viewerInstance.getPitch();
  viewerInstance.loadScene(`s${currentSceneIndex}`, pitch, yaw);
  notifySceneChange();
}

export function destroyViewer() {
  if (viewerInstance) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
}
