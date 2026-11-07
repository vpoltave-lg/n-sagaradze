const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function bind(plate) {
  const src = plate.dataset.motion;
  if (!src) return;
  const opening = plate.querySelector(".opening .oval-opening");
  let video = null;
  let failed = false;

  function stop() {
    plate.classList.remove("is-live");
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
      // Убрано autoplay = true, чтобы контролировать запуск строго через .play()
      video.src = src;
      
      video.addEventListener("playing", () => {
        video.classList.add("is-on");
      });
      
      video.addEventListener("error", () => {
        failed = true;
        stop();
      });
      
      opening.appendChild(video);
    }
    
    plate.classList.add("is-live");
    
    // Безопасный запуск видео
    video.play().catch((err) => {
      console.warn("Video play prevented:", err);
    });
  }

  // Обработчики для десктопов (мышь)
  plate.addEventListener("mouseenter", () => {
    if (fineQuery.matches) play();
  });
  plate.addEventListener("mouseleave", () => {
    if (fineQuery.matches) stop();
  });

  // Обработчик для мобильных (скролл)
  const observer = new IntersectionObserver(
    ([entry]) => {
      // Если устройство с мышью ИЛИ включено уменьшение движения — автоплей по скроллу не нужен
      if (fineQuery.matches || reduceQuery.matches) return;
      if (entry.isIntersecting) play();
      else stop();
    },
    { rootMargin: "-28% 0px -28% 0px", threshold: 0.2 },
  );
  observer.observe(plate);

  // Сброс при изменении системных настроек
  const halt = () => {
    if (reduceQuery.matches || !fineQuery.matches) stop();
  };
  fineQuery.addEventListener("change", halt);
  reduceQuery.addEventListener("change", halt);
}

document.querySelectorAll(".plate[data-motion]").forEach(bind);
