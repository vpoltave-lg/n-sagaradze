const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function bind(plate) {
  const src = plate.dataset.motion;
  if (!src) return;

  const opening = plate.querySelector(".opening") || plate.querySelector(".oval-opening");
  const meta = plate.querySelector(".slip-meta");
  const stillMeta = meta ? meta.textContent : "";
  let video = null;
  let failed = false;

  function stop() {
    plate.classList.remove("is-live");
    if (meta && !failed) meta.textContent = stillMeta;
    if (!video) return;
    video.pause();
    video.remove();
    video = null;
  }

  function play() {
    if (failed || reduceQuery.matches || !opening) return;
    if (!video) {
      video = document.createElement("video");
      video.className = "plate-video";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.src = src;
      video.addEventListener("playing", function () {
        video.classList.add("is-on");
      });
      video.addEventListener("error", function () {
        failed = true;
        stop();
        if (meta) meta.textContent = "";
      });
      opening.appendChild(video);
    }
    plate.classList.add("is-live");
    if (meta) meta.textContent = "";
    video.play().catch(function () {});
  }

  plate.addEventListener("mouseenter", function () {
    if (fineQuery.matches) play();
  });
  plate.addEventListener("mouseleave", function () {
    if (fineQuery.matches) stop();
  });

  const observer = new IntersectionObserver(
    function (entries) {
      const entry = entries[0];
      if (fineQuery.matches || reduceQuery.matches) return;
      if (entry.isIntersecting) play();
      else stop();
    },
    { rootMargin: "-28% 0px -28% 0px", threshold: 0.2 }
  );
  observer.observe(plate);

  fineQuery.addEventListener("change", function () {
    if (reduceQuery.matches) stop();
  });
  reduceQuery.addEventListener("change", function () {
    if (reduceQuery.matches) stop();
  });
}

document.querySelectorAll(".plate[data-motion]").forEach(bind);

const legacyColorPhotoNames = new Map([
  ["Gurian in national clothes.jpg", ["Gurian_in_national_clothes.jpg"]]
]);

function atelierFile(name) {
  return "atelier/" + encodeURIComponent(name).replace(/'/g, "%27");
}

function getPhotoFileName(src) {
  if (!src) return "";
  try {
    return decodeURIComponent(new URL(src, document.baseURI).pathname.split("/").pop());
  } catch (error) {
    return decodeURIComponent(src.split("/").pop());
  }
}

function getColorPhotoCandidates(photo) {
  const originalSrc = photo.dataset.originalSrc || photo.currentSrc || photo.src;
  const fileName = getPhotoFileName(originalSrc);
  const match = fileName.match(/^(.*)\.(jpe?g|png|webp)$/i);
  if (!match) return [];

  const originalBase = match[1];
  const extension = match[2].toLowerCase();
  const underscored = originalBase.trim().replace(/\s+/g, "_");
  const cleaned = underscored.replace(/,/g, "").replace(/_-_/g, "-").replace(/in_national/g, "in-national");
  const bases = [];
  [originalBase, underscored, cleaned].forEach(function (base) {
    if (bases.indexOf(base) === -1) bases.push(base);
  });
  const extensions = [];
  [extension, "jpg", "jpeg", "png", "webp"].forEach(function (ext) {
    if (extensions.indexOf(ext) === -1) extensions.push(ext);
  });

  const names = [];
  (legacyColorPhotoNames.get(fileName) || []).forEach(function (name) {
    names.push(name);
  });
  bases.forEach(function (base) {
    names.push(base + "_c." + extension);
  });
  bases.forEach(function (base) {
    extensions.forEach(function (ext) {
      if (ext !== extension) names.push(base + "_c." + ext);
    });
  });

  const urls = [];
  names.forEach(function (name) {
    const url = atelierFile(name);
    if (urls.indexOf(url) === -1) urls.push(url);
  });
  return urls;
}

function firstLoaded(urls) {
  return new Promise(function (resolve) {
    if (!urls.length) {
      resolve("");
      return;
    }
    let pending = urls.length;
    let settled = false;
    urls.forEach(function (url) {
      const probe = new Image();
      const timer = setTimeout(function () {
        finish(false);
      }, 4000);
      function finish(ok) {
        if (settled) return;
        clearTimeout(timer);
        if (ok) {
          settled = true;
          resolve(url);
          return;
        }
        pending -= 1;
        if (pending === 0) {
          settled = true;
          resolve("");
        }
      }
      probe.onload = function () {
        finish(probe.naturalWidth > 0);
      };
      probe.onerror = function () {
        finish(false);
      };
      probe.src = url;
    });
  });
}

function setupPhotoViewer() {
  const photos = document.querySelectorAll(".plate .frame img");
  if (!photos.length) return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "photo-viewer.css";
  document.head.appendChild(stylesheet);

  const dialog = document.createElement("dialog");
  dialog.className = "photo-viewer";
  dialog.setAttribute("aria-label", "Перегляд фотографії");

  const closeButton = document.createElement("button");
  closeButton.className = "photo-viewer-close";
  closeButton.type = "button";
  closeButton.textContent = "Закрити";
  closeButton.setAttribute("aria-label", "Закрити фотографію");

  const largePhoto = document.createElement("img");
  largePhoto.className = "photo-viewer-image";
  dialog.append(closeButton, largePhoto);
  document.body.appendChild(dialog);

  let ticket = 0;

  function openPhoto(photo) {
    const fallbackSrc = photo.dataset.originalSrc || photo.currentSrc || photo.src;
    const candidates = getColorPhotoCandidates(photo);
    const current = ++ticket;
    largePhoto.alt = photo.alt;
    largePhoto.removeAttribute("src");
    dialog.showModal();

    if (!candidates.length) {
      largePhoto.src = fallbackSrc;
      return;
    }

    firstLoaded(candidates).then(function (url) {
      if (current !== ticket || !dialog.open) return;
      largePhoto.src = url || fallbackSrc;
    });
  }

  photos.forEach(function (photo) {
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", "Відкрити фотографію: " + photo.alt);
  });

  document.addEventListener("click", function (event) {
    const frame = event.target.closest && event.target.closest(".plate .frame");
    const photo = frame && frame.querySelector("img");
    if (photo) openPhoto(photo);
  });

  document.addEventListener("keydown", function (event) {
    const frame = event.target.closest && event.target.closest(".plate .frame");
    const photo = frame && frame.querySelector("img");
    if (photo && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openPhoto(photo);
    }
  });

  closeButton.addEventListener("click", function () {
    dialog.close();
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
}

setupPhotoViewer();

(function () {
  let supportsWebp = false;
  try {
    const canvas = document.createElement("canvas");
    supportsWebp = typeof canvas.toDataURL === "function" && canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (error) {
    supportsWebp = false;
  }
  if (!supportsWebp) return;

  document.querySelectorAll("img[src]").forEach(function (img) {
    const originalSrc = img.getAttribute("src");
    if (!originalSrc) return;
    const normalizedSrc = originalSrc.toLowerCase();
    if (normalizedSrc.indexOf("atelier/") === -1 || !/\.(jpe?g|png)$/.test(normalizedSrc)) return;

    img.dataset.originalSrc = originalSrc;
    img.addEventListener("error", function () {
      img.src = originalSrc;
    }, { once: true });
    img.decoding = "async";
    img.src = originalSrc.replace(/\.(jpe?g|png)$/i, ".webp");
  });
})();