const progress = document.createElement("div");
progress.className = "scroll-progress";
document.body.appendChild(progress);

const splitTargets = document.querySelectorAll(
  ".section-heading h2, .story-line h2, .contact-copy h2, .page-hero h1, .scroll-chapter h2"
);

splitTargets.forEach((target) => {
  if (target.dataset.split === "true") return;
  const words = target.textContent.trim().split(/\s+/);
  target.textContent = "";
  words.forEach((word, index) => {
    const line = document.createElement("span");
    const inner = document.createElement("span");
    line.className = "kinetic-line";
    inner.textContent = word + (index === words.length - 1 ? "" : " ");
    line.appendChild(inner);
    target.appendChild(line);
  });
  target.dataset.split = "true";
});

const immersiveObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll(".kinetic-line").forEach((line) => line.classList.add("is-visible"));
    });
  },
  { rootMargin: "0px 0px -16% 0px", threshold: 0.18 }
);

document
  .querySelectorAll(".section-heading, .story-line, .contact-copy, .page-hero, .scroll-chapter, .detail-rail")
  .forEach((element) => immersiveObserver.observe(element));

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const amount = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
  document.body.classList.toggle("has-scrolled", window.scrollY > 96);
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();
