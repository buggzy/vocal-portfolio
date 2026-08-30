const header = document.querySelector(".site-header");
const mediaTriggers = [...document.querySelectorAll(".media-trigger")];
const player = document.querySelector(".global-player");
const playerAudio = document.querySelector(".global-player-audio");
const playerVideo = document.querySelector(".global-player-video");
const playerMediaElements = [playerAudio, playerVideo];
const playerArt = document.querySelector(".global-player-art");
const playerTitle = document.querySelector(".global-player-title");
const playerLabel = document.querySelector(".global-player-label");
const playerDuration = document.querySelector(".global-player-duration");
const playerClose = document.querySelector(".global-player-close");
let activeTrigger = null;

const updateHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const markActive = (trigger) => {
  mediaTriggers.forEach((item) => {
    const isActive = item === trigger;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
  activeTrigger = trigger;
};

const closePlayer = () => {
  playerMediaElements.forEach((media) => media.pause());
  player.classList.remove("is-open");
  player.setAttribute("aria-hidden", "true");
  markActive(null);
};

mediaTriggers.forEach((trigger) => {
  trigger.setAttribute("aria-pressed", "false");

  trigger.addEventListener("click", () => {
    const isVideo = trigger.dataset.kind === "video";
    const playerMedia = isVideo ? playerVideo : playerAudio;
    const isCurrent = playerMedia.dataset.src === trigger.dataset.src;

    if (isCurrent && !playerMedia.paused) {
      playerMedia.pause();
      return;
    }

    playerMediaElements.forEach((media) => {
      if (media !== playerMedia) {
        media.pause();
      }
    });

    if (!isCurrent) {
      playerMedia.src = trigger.dataset.src;
      playerMedia.dataset.src = trigger.dataset.src;

      if (isVideo) {
        playerMedia.poster = trigger.dataset.poster || "";
      }

      playerMedia.load();
    }

    player.classList.toggle("is-video", isVideo);
    player.classList.toggle("is-audio", !isVideo);
    player.classList.add("is-open");
    player.setAttribute("aria-hidden", "false");

    playerArt.src = trigger.dataset.poster || "assets/images/hero.jpg";
    playerTitle.textContent = trigger.dataset.title;
    playerLabel.textContent = trigger.dataset.label;
    playerDuration.textContent = trigger.dataset.duration;
    markActive(trigger);

    playerMedia.play().catch(() => {
      // The native controls remain available if autoplay is blocked.
    });
  });
});

playerClose.addEventListener("click", closePlayer);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && player.classList.contains("is-open")) {
    closePlayer();
  }
});

const revealTargets = document.querySelectorAll(
  ".intro-grid, .section-heading, .song-card, .cover-image, .cover-copy, .video-card, .about-photo, .about-copy",
);

if ("IntersectionObserver" in window) {
  revealTargets.forEach((target) => target.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealTargets.forEach((target) => observer.observe(target));
}
