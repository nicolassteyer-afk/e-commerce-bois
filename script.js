import * as THREE from "three";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const products = [
  {
    name: "Boite de Table",
    material: "Noyer ancien",
    number: "01",
    price: "120 EUR",
    page: "produit-boite.html",
    description: "Petite boite du quotidien en bois ancien, pensee pour les bijoux, les cles ou les petits objets.",
    shape: "box",
    displayScale: 0.98,
    startRotation: -0.72,
    color: 0x8f552d,
    theme: "theme-bowl",
  },
  {
    name: "Planche Service",
    material: "Chene recupere",
    number: "02",
    price: "95 EUR",
    page: "produit-planche.html",
    description: "Planche de service en bois ancien, avec poignee douce et trou de suspension discret.",
    shape: "board",
    displayScale: 0.76,
    startRotation: -0.72,
    color: 0xb9793c,
    theme: "theme-tray",
  },
  {
    name: "Pot Tourne",
    material: "Frene ancien",
    number: "03",
    price: "150 EUR",
    page: "produit-pot.html",
    description: "Petit pot tourne a la main, concu pour accueillir quelques tiges seches ou rester seul.",
    shape: "pot",
    displayScale: 0.88,
    startRotation: -0.48,
    color: 0xc49358,
    theme: "theme-totem",
  },
];

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 1.2, 7.4);

const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0xfff4df, 0x57412f, 2.4));

const floor = new THREE.Mesh(new THREE.CircleGeometry(3.6, 96), new THREE.ShadowMaterial({ opacity: 0.14 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.28;
floor.receiveShadow = true;
scene.add(floor);

let activeIndex = 0;
let activeObject = null;
let targetRotation = -0.82;
let dragStart = null;
let startRotation = 0;
let objectReveal = 0;
let heroSwipeStart = null;

function woodTexture(size = 1024) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, "#4f210d");
  base.addColorStop(0.25, "#8a431d");
  base.addColorStop(0.55, "#c07635");
  base.addColorStop(0.82, "#673015");
  base.addColorStop(1, "#381507");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    const drift = Math.sin(y * 0.012) * 28 + Math.sin(y * 0.031) * 9;
    ctx.strokeStyle = `rgba(42, 16, 5, ${0.07 + (Math.sin(y * 0.05) + 1) * 0.035})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -20; x <= size + 20; x += 18) {
      const wave = Math.sin(x * 0.018 + y * 0.025) * 7 + Math.sin(x * 0.055) * 2.4;
      const px = x + drift + wave;
      if (x === -20) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 24; i += 1) {
    const cx = size * (0.12 + Math.random() * 0.76);
    const cy = size * (0.12 + Math.random() * 0.76);
    const rx = size * (0.018 + Math.random() * 0.032);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.random() - 0.5) * 0.8);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    g.addColorStop(0, "rgba(35, 13, 4, 0.34)");
    g.addColorStop(0.48, "rgba(91, 37, 12, 0.18)");
    g.addColorStop(1, "rgba(255, 210, 142, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, rx * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.45, 0.9);
  texture.anisotropy = 16;
  return texture;
}

function woodMaterial(color, texture = woodTexture()) {
  return new THREE.MeshPhysicalMaterial({
    color,
    map: texture,
    roughness: 0.64,
    metalness: 0.02,
    clearcoat: 0.18,
    clearcoatRoughness: 0.7,
    bumpMap: texture,
    bumpScale: 0.012,
  });
}

function roundedBox(width, height, depth, radius, segments) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSize: radius * 0.42,
    bevelThickness: radius * 0.42,
    bevelSegments: segments,
    curveSegments: segments,
  });
  geometry.center();
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function buildBox(product) {
  const group = new THREE.Group();
  const texture = woodTexture();
  const material = woodMaterial(product.color, texture);
  const dark = new THREE.MeshStandardMaterial({ color: 0x4d2410, roughness: 0.82 });
  const base = new THREE.Mesh(roundedBox(2.18, 0.5, 1.24, 0.18, 28), material);
  const cavity = new THREE.Mesh(roundedBox(1.56, 0.085, 0.72, 0.1, 22), woodMaterial(0xa7622c, texture));
  const lid = new THREE.Mesh(roundedBox(2.05, 0.16, 1.1, 0.14, 28), material);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 48), dark);
  base.position.y = -0.1;
  cavity.position.y = 0.2;
  lid.position.set(0.22, 0.47, -0.18);
  lid.rotation.z = -0.085;
  handle.position.set(0.2, 0.62, -0.2);
  group.add(base, cavity, lid, handle);
  group.rotation.set(-0.1, -0.18, 0.03);
  group.scale.set(1.08, 1.08, 1.08);
  return group;
}

function buildBoard(product) {
  const group = new THREE.Group();
  const texture = woodTexture();
  texture.repeat.set(1.85, 0.58);
  const material = woodMaterial(product.color, texture);
  const shape = new THREE.Shape();
  shape.moveTo(-1.24, -0.5);
  shape.lineTo(0.64, -0.5);
  shape.bezierCurveTo(0.9, -0.5, 1.05, -0.38, 1.12, -0.22);
  shape.bezierCurveTo(1.95, -0.1, 1.95, 0.1, 1.12, 0.22);
  shape.bezierCurveTo(1.05, 0.38, 0.9, 0.5, 0.64, 0.5);
  shape.lineTo(-1.24, 0.5);
  shape.bezierCurveTo(-1.58, 0.5, -1.66, 0.28, -1.66, 0);
  shape.bezierCurveTo(-1.66, -0.28, -1.58, -0.5, -1.24, -0.5);
  const hole = new THREE.Path();
  hole.absellipse(1.46, 0, 0.085, 0.085, 0, Math.PI * 2);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.052, bevelSegments: 22, curveSegments: 36 });
  geometry.center();
  geometry.rotateX(Math.PI / 2);
  const board = new THREE.Mesh(geometry, material);
  const groove = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.008, 8, 160), new THREE.MeshStandardMaterial({ color: 0x5a2d12, roughness: 0.84 }));
  groove.scale.x = 1.55;
  groove.scale.y = 0.52;
  groove.rotation.x = Math.PI / 2;
  groove.position.set(-0.22, 0.13, 0);
  group.add(board, groove);
  group.rotation.set(-0.78, -0.18, 0.04);
  group.scale.set(1.08, 1.08, 1.08);
  return group;
}

function buildPot(product) {
  const group = new THREE.Group();
  const texture = woodTexture();
  texture.repeat.set(1.1, 1.35);
  const material = woodMaterial(product.color, texture);
  const radiusAt = (t) => {
    const waist = Math.exp(-Math.pow((t - 0.48) / 0.22, 2)) * 0.08;
    const shoulder = Math.exp(-Math.pow((t - 0.67) / 0.22, 2)) * 0.2;
    const foot = Math.exp(-Math.pow((t - 0.08) / 0.16, 2)) * 0.1;
    const neck = Math.exp(-Math.pow((t - 0.94) / 0.16, 2)) * 0.26;
    return Math.max(0.24, 0.42 + foot + shoulder - waist - neck);
  };
  const points = [];
  for (let i = 0; i <= 42; i += 1) {
    const t = i / 42;
    points.push(new THREE.Vector2(radiusAt(t), -0.82 + t * 1.64));
  }
  const outer = new THREE.Mesh(new THREE.LatheGeometry(points, 160), material);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.56, 128, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a1308, roughness: 0.9, side: THREE.DoubleSide }));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.034, 20, 160), material);
  inner.position.y = 0.52;
  lip.position.y = 0.8;
  lip.rotation.x = Math.PI / 2;
  group.add(outer, inner, lip);
  group.rotation.set(-0.04, -0.18, 0.02);
  group.scale.set(1.18, 1.18, 1.18);
  return group;
}

function buildProduct(product) {
  const group = new THREE.Group();
  const mesh = product.shape === "box" ? buildBox(product) : product.shape === "board" ? buildBoard(product) : buildPot(product);
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.add(mesh);
  return group;
}

function setProduct(index) {
  activeIndex = (index + products.length) % products.length;
  const product = products[activeIndex];
  const experience = document.querySelector("#experience");
  const animatedText = [document.querySelector(".product-copy"), document.querySelector(".product-meta")];
  if (activeObject) scene.remove(activeObject);
  targetRotation = product.startRotation ?? targetRotation;
  experience.classList.remove("theme-bowl", "theme-tray", "theme-totem");
  experience.classList.add(product.theme);
  activeObject = buildProduct(product);
  activeObject.rotation.y = targetRotation;
  activeObject.position.set(window.innerWidth < 820 ? 1.24 : window.innerWidth < 950 ? 1.56 : 1.42, window.innerWidth < 820 ? 0.16 : -0.08, 0);
  objectReveal = 0;
  activeObject.scale.setScalar(0.001);
  scene.add(activeObject);
  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-description").textContent = product.description;
  document.querySelector("#product-number").textContent = product.number;
  document.querySelector("#product-material").textContent = product.material;
  document.querySelector("#switch-label").textContent = `${String(activeIndex + 1).padStart(2, "0")} / 03`;
  document.querySelector("#buy-button").textContent = `Acheter - ${product.price}`;
  document.querySelector("#product-link").setAttribute("href", product.page);
  animatedText.forEach((element) => {
    element.classList.remove("is-changing");
    void element.offsetWidth;
    element.classList.add("is-changing");
  });
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 720 ? 9.1 : 7.4;
  camera.lookAt(width < 820 ? 0 : 0.55, 0, 0);
  camera.updateProjectionMatrix();
  if (activeObject) {
    activeObject.position.x = width < 820 ? 1.24 : width < 950 ? 1.56 : 1.42;
    activeObject.position.y = width < 820 ? 0.16 : -0.08;
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (activeObject) {
    const targetScale = (window.innerWidth < 820 ? 0.58 : window.innerWidth < 950 ? 0.64 : 0.72) * (products[activeIndex].displayScale || 1);
    objectReveal += (1 - objectReveal) * 0.075;
    activeObject.rotation.y += (targetRotation - activeObject.rotation.y) * 0.08;
    targetRotation += 0.0016;
    activeObject.scale.setScalar(targetScale * (1 - Math.pow(1 - objectReveal, 3)));
  }
  renderer.render(scene, camera);
}

function onPointerDown(event) {
  dragStart = event.clientX;
  startRotation = targetRotation;
  canvas.setPointerCapture(event.pointerId);
}
function onPointerMove(event) {
  if (dragStart === null) return;
  targetRotation = startRotation + (event.clientX - dragStart) * 0.012;
}
function onPointerUp() { dragStart = null; }

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);

const experience = document.querySelector("#experience");
experience.addEventListener("touchstart", (event) => {
  heroSwipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
experience.addEventListener("touchend", (event) => {
  if (!heroSwipeStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - heroSwipeStart.x;
  const dy = event.changedTouches[0].clientY - heroSwipeStart.y;
  heroSwipeStart = null;
  if (Math.abs(dx) < 84 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  setProduct(dx < 0 ? activeIndex + 1 : activeIndex - 1);
}, { passive: true });
experience.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaX) < 34 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
  event.preventDefault();
  setProduct(event.deltaX > 0 ? activeIndex + 1 : activeIndex - 1);
}, { passive: false });

document.querySelector("#prev-product").addEventListener("click", (event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); setProduct(activeIndex - 1); });
document.querySelector("#next-product").addEventListener("click", (event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); setProduct(activeIndex + 1); });

const panels = { cart: document.querySelector("#cart-panel"), search: document.querySelector("#search-panel"), menu: document.querySelector("#menu-panel") };
const overlay = document.querySelector(".overlay");
const cart = [];
function openPanel(name) {
  Object.values(panels).forEach((panel) => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); });
  panels[name].classList.add("is-open");
  panels[name].setAttribute("aria-hidden", "false");
  overlay.classList.add("is-open");
}
function closePanels() {
  Object.values(panels).forEach((panel) => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); });
  overlay.classList.remove("is-open");
}
function renderCart() {
  document.querySelector("#cart-count").textContent = cart.length;
  const cartItems = document.querySelector("#cart-items");
  if (!cart.length) { cartItems.className = "empty"; cartItems.textContent = "Looks like you haven't added anything yet."; return; }
  cartItems.className = "";
  cartItems.innerHTML = cart.map((item) => `<div class="cart-line"><span>${item}</span><strong>1</strong></div>`).join("");
}

document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => openPanel(button.dataset.panel)));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closePanels));
document.querySelectorAll(".menu-panel a").forEach((link) => link.addEventListener("click", closePanels));
document.querySelectorAll("[data-jump-product]").forEach((button) => button.addEventListener("click", () => { setProduct(Number(button.dataset.jumpProduct)); window.scrollTo({ top: 0, behavior: "smooth" }); }));
document.querySelectorAll("[data-strip-product]").forEach((card) => card.addEventListener("click", () => { setProduct(Number(card.dataset.stripProduct)); window.scrollTo({ top: 0, behavior: "smooth" }); }));
document.querySelector("#buy-button").addEventListener("click", () => { cart.push(products[activeIndex].name); renderCart(); openPanel("cart"); });
document.querySelector(".contact-form")?.addEventListener("submit", (event) => { event.preventDefault(); const note = document.querySelector("#form-note"); if (note) note.textContent = "Message prepare. Le formulaire sera branche a l'etape suivante."; });

document.body.classList.add("intro-active");
document.querySelector("#enter-button").addEventListener("click", () => { document.querySelector("#intro").classList.add("is-hidden"); document.body.classList.remove("intro-active"); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanels(); if (event.key === "ArrowLeft") setProduct(activeIndex - 1); if (event.key === "ArrowRight") setProduct(activeIndex + 1); });

window.addEventListener("resize", resize);
resize();
setProduct(0);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

animate();
