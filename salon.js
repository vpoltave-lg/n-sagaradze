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

function setupPhotoViewer() {
  const stillPhotos = document.querySelectorAll(".plate:not([data-motion]) .frame img");
  if (!stillPhotos.length) return;

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
    // Додайте data-color-src до зображення, коли кольоровий файл буде в репозиторії.
    largePhoto.src = photo.dataset.colorSrc || photo.dataset.fullSrc || photo.currentSrc || photo.src;
    largePhoto.alt = photo.alt;
    dialog.showModal();
  }

  stillPhotos.forEach((photo) => {
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", `Відкрити фотографію: ${photo.alt}`);
  });

  document.addEventListener("click", (event) => {
    const photo = event.target.closest?.(".plate:not([data-motion]) .frame img");
    if (photo) openPhoto(photo);
  });

  document.addEventListener("keydown", (event) => {
    const photo = event.target.closest?.(".plate:not([data-motion]) .frame img");
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
