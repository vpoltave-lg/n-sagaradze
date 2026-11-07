const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function bind(plate) {
  const src = plate.dataset.motion;
  if (!src) return;
  const opening = plate.querySelector(".opening, .oval-opening");
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
