import * as THREE from "three";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

const products = [
  {
    name: "Coupe Racine",
    material: "Noyer ancien",
    number: "01",
    price: "120 EUR",
    description:
      "Piece tournee a la main dans un bois de recuperation tres ancien, conservee avec ses marques naturelles.",
    shape: "bowl",
    color: 0x8f552d,
    theme: "theme-bowl",
  },
  {
    name: "Plateau Cepage",
    material: "Chene recupere",
    number: "02",
    price: "95 EUR",
    description:
      "Plateau bas, ponce lentement, huile naturellement et pense pour garder les accidents du bois.",
    shape: "tray",
    color: 0xb9793c,
    theme: "theme-tray",
  },
  {
    name: "Totem Lisiere",
    material: "Frene ancien",
    number: "03",
    price: "150 EUR",
    description:
      "Objet sculptural unique, taille dans une chute ancienne puis poli pour reveler les fibres claires.",
    shape: "totem",
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

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.6, 96),
  new THREE.ShadowMaterial({ opacity: 0.14 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.28;
floor.receiveShadow = true;
scene.add(floor);

let activeIndex = 0;
let activeObject = null;
let targetRotation = 0;
let dragStart = null;
let startRotation = 0;
let objectReveal = 0;

function makeWoodTexture(baseColor) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d");
  const base = `#${baseColor.toString(16).padStart(6, "0")}`;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 4) {
    const wave = Math.sin(y * 0.045) * 16 + Math.sin(y * 0.012) * 30;
    ctx.strokeStyle = `rgba(45, 24, 11, ${0.09 + (y % 24) / 260})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + wave * 0.08);
    for (let x = 0; x < 512; x += 18) {
      ctx.lineTo(x, y + Math.sin((x + wave) * 0.03) * 5);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.7, 1.2);
  return texture;
}

function woodMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    map: makeWoodTexture(color),
    roughness: 0.48,
    metalness: 0.02,
  });
}

function bowl(product) {
  const points = [
    new THREE.Vector2(0.18, -0.62),
    new THREE.Vector2(1.08, -0.56),
    new THREE.Vector2(1.45, -0.28),
    new THREE.Vector2(1.55, 0.18),
    new THREE.Vector2(1.38, 0.44),
    new THREE.Vector2(0.55, 0.58),
    new THREE.Vector2(0.18, 0.5),
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 128), woodMaterial(product.color));
  mesh.scale.set(1.16, 1.16, 1.16);
  return mesh;
}

function tray(product) {
  const group = new THREE.Group();
  const material = woodMaterial(product.color);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.75, 0.22, 128), material);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.12, 18, 128), material);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.14;
  base.castShadow = true;
  rim.castShadow = true;
  group.add(base, rim);
  group.scale.set(1, 0.82, 1);
  return group;
}

function totem(product) {
  const group = new THREE.Group();
  const material = woodMaterial(product.color);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.82, 1.8, 96), material);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.72, 96, 48), material);
  top.scale.y = 1.18;
  top.position.y = 1.16;
  lower.castShadow = true;
  top.castShadow = true;
  group.add(lower, top);
  group.position.y = -0.25;
  return group;
}

function buildProduct(product) {
  const group = new THREE.Group();
  const mesh = product.shape === "bowl" ? bowl(product) : product.shape === "tray" ? tray(product) : totem(product);
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

  if (activeObject) {
    scene.remove(activeObject);
  }

  experience.classList.remove("theme-bowl", "theme-tray", "theme-totem");
  experience.classList.add(product.theme);

  activeObject = buildProduct(product);
  activeObject.rotation.y = targetRotation;
  activeObject.position.set(window.innerWidth < 820 ? 0 : 1.05, window.innerWidth < 820 ? 0.16 : -0.08, 0);
  objectReveal = 0;
  activeObject.scale.setScalar(0.001);
  scene.add(activeObject);

  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-description").textContent = product.description;
  document.querySelector("#product-number").textContent = product.number;
  document.querySelector("#product-material").textContent = product.material;
  document.querySelector("#switch-label").textContent = `${String(activeIndex + 1).padStart(2, "0")} / 03`;
  document.querySelector("#buy-button").textContent = `Acheter - ${product.price}`;

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
  camera.position.x = width < 720 ? 0 : 0;
  camera.lookAt(width < 820 ? 0 : 0.55, 0, 0);
  camera.updateProjectionMatrix();
  if (activeObject) {
    activeObject.position.x = width < 820 ? 0 : 1.05;
    activeObject.position.y = width < 820 ? 0.16 : -0.08;
    activeObject.scale.setScalar(width < 820 ? 0.58 : 0.78);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (activeObject) {
    const targetScale = window.innerWidth < 820 ? 0.58 : 0.78;
    objectReveal += (1 - objectReveal) * 0.075;
    const easedReveal = 1 - Math.pow(1 - objectReveal, 3);
    activeObject.rotation.y += (targetRotation - activeObject.rotation.y) * 0.08;
    activeObject.rotation.y += 0.003;
    activeObject.scale.setScalar(targetScale * easedReveal);
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

function onPointerUp() {
  dragStart = null;
}

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);

document.querySelector("#prev-product").addEventListener("click", () => setProduct(activeIndex - 1));
document.querySelector("#next-product").addEventListener("click", () => setProduct(activeIndex + 1));

const panels = {
  cart: document.querySelector("#cart-panel"),
  search: document.querySelector("#search-panel"),
  menu: document.querySelector("#menu-panel"),
};
const overlay = document.querySelector(".overlay");
const cart = [];

function openPanel(name) {
  Object.values(panels).forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  panels[name].classList.add("is-open");
  panels[name].setAttribute("aria-hidden", "false");
  overlay.classList.add("is-open");
}

function closePanels() {
  Object.values(panels).forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  overlay.classList.remove("is-open");
}

function renderCart() {
  document.querySelector("#cart-count").textContent = cart.length;
  const cartItems = document.querySelector("#cart-items");
  if (!cart.length) {
    cartItems.className = "empty";
    cartItems.textContent = "Looks like you haven't added anything yet.";
    return;
  }
  cartItems.className = "";
  cartItems.innerHTML = cart.map((item) => `<div class="cart-line"><span>${item}</span><strong>1</strong></div>`).join("");
}

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closePanels);
});

document.querySelector("#buy-button").addEventListener("click", () => {
  cart.push(products[activeIndex].name);
  renderCart();
  openPanel("cart");
});

document.body.classList.add("intro-active");
document.querySelector("#enter-button").addEventListener("click", () => {
  document.querySelector("#intro").classList.add("is-hidden");
  document.body.classList.remove("intro-active");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanels();
  if (event.key === "ArrowLeft") setProduct(activeIndex - 1);
  if (event.key === "ArrowRight") setProduct(activeIndex + 1);
});

window.addEventListener("resize", resize);
resize();
setProduct(0);
animate();
