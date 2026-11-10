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
(() => {
  const supportsWebp = (() => {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext && canvas.toDataURL("image/webp").startsWith("data:image/webp");
  })();

  if (!supportsWebp) return;

  const images = [...document.querySelectorAll("img[src]")].filter((img) => {
    const src = (img.getAttribute("src") || "").toLowerCase();
    return src.includes("atelier/") && /\.(jpe?g|png)$/.test(src);
  });

  images.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;

    const webpSrc = src.replace(/\.(jpe?g|png)$/i, ".webp");
    const probe = new Image();

    probe.onload = () => {
      img.src = webpSrc;
      img.loading = "lazy";
      img.decoding = "async";
    };

    probe.onerror = () => {
      // keep original
    };

    probe.src = webpSrc;
  });
})();
