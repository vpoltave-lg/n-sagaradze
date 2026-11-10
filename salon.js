const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function bind(plate) {
  const src = plate.dataset.motion;
  if (!src) return;

  // Безпечний вибір: шукаємо .opening, якщо немає — .oval-opening
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
      video.addEventListener("playing", () => {
        video.classList.add("is-on");
      });
      video.addEventListener("error", () => {
        failed = true;
        stop();
        if (meta) meta.textContent = "";
      });
      opening.appendChild(video);
    }
    plate.classList.add("is-live");
    if (meta) meta.textContent = "";
    video.play().catch(() => {});
  }

  plate.addEventListener("mouseenter", () => {
    if (fineQuery.matches) play();
  });
  plate.addEventListener("mouseleave", () => {
    if (fineQuery.matches) stop();
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (fineQuery.matches || reduceQuery.matches) return;
      if (entry.isIntersecting) play();
      else stop();
    },
    { rootMargin: "-28% 0px -28% 0px", threshold: 0.2 },
  );
  observer.observe(plate);

  const halt = () => {
    if (reduceQuery.matches) stop();
  };
  fineQuery.addEventListener("change", halt);
  reduceQuery.addEventListener("change", halt);
}

document.querySelectorAll(".plate[data-motion]").forEach(bind);

// Standard color-file naming: original filename with spaces changed to underscores,
// followed by _c before the extension. Keep aliases for the already-uploaded files
// whose names predate this convention.
const legacyColorPhotoNames = new Map([
  ["Gurian in national clothes.jpg", ["Gurian_in_national_clothes.jpg"]],
  [
    "Telemak Gurieli in national clothes.jpg",
    ["Telemak_Gurieli_in_national _clothes_c.jpg"],
  ],
]);

function getPhotoFileName(src) {
  if (!src) return "";
  try {
    return decodeURIComponent(new URL(src, document.baseURI).pathname.split("/").pop());
  } catch {
    return decodeURIComponent(src.split("/").pop());
  }
}

function getColorPhotoCandidates(photo) {
  const originalSrc = photo.dataset.originalSrc || photo.currentSrc || photo.src;
  const fileName = getPhotoFileName(originalSrc);
  const match = fileName.match(/^(.*)\.(jpe?g|png|webp)$/i);
  if (!match) return [];

  const [, originalBase, originalExtension] = match;
  const normalizedBase = originalBase.replace(/\s+/g, "_");
  const extensions = [originalExtension.toLowerCase(), "jpg", "jpeg", "png", "webp"];
  const uniqueExtensions = [...new Set(extensions)];
  const candidates = (legacyColorPhotoNames.get(fileName) || []).map(
    (name) => `atelier/${name.split("/").map(encodeURIComponent).join("/")}`,
  );

  uniqueExtensions.forEach((extension) => {
    const colorName = `${normalizedBase}_c.${extension}`;
    candidates.push(`atelier/${encodeURIComponent(colorName)}`);
  });

  return [...new Set(candidates)];
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

  function openPhoto(photo) {
    const fallbackSrc = photo.currentSrc || photo.src;
    const candidates = getColorPhotoCandidates(photo);
    let candidateIndex = 0;

    largePhoto.onerror = null;
    largePhoto.alt = photo.alt;

    if (!candidates.length) {
      largePhoto.src = photo.dataset.fullSrc || fallbackSrc;
    } else {
      largePhoto.onerror = () => {
        if (candidateIndex < candidates.length) {
          largePhoto.src = candidates[candidateIndex++];
          return;
        }
        largePhoto.onerror = null;
        largePhoto.src = photo.dataset.fullSrc || fallbackSrc;
      };
      largePhoto.src = candidates[candidateIndex++];
    }

    dialog.showModal();
  }

  photos.forEach((photo) => {
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", `Відкрити фотографію: ${photo.alt}`);
  });

  document.addEventListener("click", (event) => {
    const photo = event.target.closest?.(".plate .frame img");
    if (photo) openPhoto(photo);
  });

  document.addEventListener("keydown", (event) => {
    const photo = event.target.closest?.(".plate .frame img");
    if (photo && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openPhoto(photo);
    }
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

setupPhotoViewer();

(() => {
  const supportsWebp = (() => {
    try {
      const canvas = document.createElement("canvas");
      return (
        typeof canvas.toDataURL === "function" &&
        canvas.toDataURL("image/webp").startsWith("data:image/webp")
      );
    } catch {
      return false;
    }
  })();

  if (!supportsWebp) return;

  const images = document.querySelectorAll("img[src]");

  images.forEach((img) => {
    const originalSrc = img.getAttribute("src");
    if (!originalSrc) return;

    const normalizedSrc = originalSrc.toLowerCase();
    if (!normalizedSrc.includes("atelier/") || !/\.(jpe?g|png)$/.test(normalizedSrc)) {
      return;
    }

    // Keep the original file path for color-photo lookup in the viewer.
    img.dataset.originalSrc = originalSrc;
    const webpSrc = originalSrc.replace(/\.(jpe?g|png)$/i, ".webp");

    // Если WebP отсутствует или не загрузился, оставляем исходное изображение.
    img.addEventListener(
      "error",
      () => {
        img.src = originalSrc;
      },
      { once: true },
    );

    img.decoding = "async";
    img.src = webpSrc;
  });
})();
