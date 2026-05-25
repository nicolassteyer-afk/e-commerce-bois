import * as THREE from "three";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

const products = [
  {
    name: "Boite de Table",
    material: "Noyer ancien",
    number: "01",
    price: "120 EUR",
    description:
      "Petite boite du quotidien en bois ancien, pensee pour les bijoux, les cles ou les petits objets.",
    shape: "woodBox",
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
    description:
      "Planche de service en bois ancien, avec poignee douce et trou de suspension discret.",
    shape: "servingBoard",
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
    description:
      "Petit pot tourne a la main, concu pour accueillir quelques tiges seches ou rester seul.",
    shape: "turnedPot",
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
let targetRotation = -0.82;
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
  return new THREE.MeshPhysicalMaterial({
    color,
    map: makeWoodTexture(color),
    roughness: 0.68,
    metalness: 0.02,
    clearcoat: 0.16,
    clearcoatRoughness: 0.7,
  });
}

function createDetailedWoodTexture(size = 1024) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, "#4f210d");
  base.addColorStop(0.28, "#7f3b19");
  base.addColorStop(0.55, "#a45b2a");
  base.addColorStop(0.82, "#683015");
  base.addColorStop(1, "#421908");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    const drift = Math.sin(y * 0.012) * 28 + Math.sin(y * 0.031) * 9;
    const lineAlpha = 0.07 + (Math.sin(y * 0.05) + 1) * 0.035;
    ctx.strokeStyle = `rgba(48, 20, 7, ${lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = -20; x <= size + 20; x += 18) {
      const wave = Math.sin(x * 0.018 + y * 0.025) * 7 + Math.sin(x * 0.055) * 2.4;
      const px = x + drift + wave;
      if (x === -20) {
        ctx.moveTo(px, y);
      } else {
        ctx.lineTo(px, y);
      }
    }

    ctx.stroke();
  }

  for (let x = 0; x < size; x += 7) {
    const alpha = 0.08 + Math.random() * 0.08;
    ctx.strokeStyle = `rgba(38, 15, 5, ${alpha})`;
    ctx.lineWidth = 0.7 + Math.random() * 0.9;
    ctx.beginPath();

    for (let y = -20; y <= size + 20; y += 18) {
      const drift = Math.sin(y * 0.014 + x * 0.03) * 10 + Math.sin(y * 0.038) * 3;
      const px = x + drift;
      if (y === -20) {
        ctx.moveTo(px, y);
      } else {
        ctx.lineTo(px, y);
      }
    }

    ctx.stroke();
  }

  for (let i = 0; i < 34; i += 1) {
    const cx = size * (0.1 + Math.random() * 0.8);
    const cy = size * (0.12 + Math.random() * 0.76);
    const rx = size * (0.018 + Math.random() * 0.035);
    const ry = rx * (0.35 + Math.random() * 0.4);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.random() - 0.5) * 0.8);
    const knot = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    knot.addColorStop(0, "rgba(37, 14, 4, 0.34)");
    knot.addColorStop(0.42, "rgba(94, 39, 12, 0.18)");
    knot.addColorStop(1, "rgba(255, 210, 142, 0)");
    ctx.fillStyle = knot;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const glow = ctx.createRadialGradient(size * 0.48, size * 0.5, 20, size * 0.48, size * 0.5, size * 0.72);
  glow.addColorStop(0, "rgba(255, 216, 156, 0.18)");
  glow.addColorStop(0.56, "rgba(255, 216, 156, 0.04)");
  glow.addColorStop(1, "rgba(36, 14, 5, 0.16)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.55, 0.9);
  texture.anisotropy = 16;
  return texture;
}

function createEndGrainTexture(size = 512) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const center = size / 2;

  ctx.fillStyle = "#8b481f";
  ctx.fillRect(0, 0, size, size);

  for (let radius = 18; radius < center * 0.95; radius += 10 + Math.sin(radius) * 3) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.08; a += 0.05) {
      const wobble = Math.sin(a * 5 + radius * 0.08) * 3 + Math.sin(a * 11) * 1.2;
      const x = center + Math.cos(a) * (radius + wobble);
      const y = center + Math.sin(a) * (radius + wobble);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(48, 20, 7, ${radius % 24 < 12 ? 0.28 : 0.14})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * center * 0.72;
    const length = 18 + Math.random() * 48;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    ctx.strokeStyle = "rgba(54, 22, 8, 0.16)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(center, center, center * 0.25, center, center, center);
  vignette.addColorStop(0, "rgba(255, 212, 145, 0.18)");
  vignette.addColorStop(1, "rgba(36, 14, 5, 0.2)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.anisotropy = 16;
  return texture;
}

function organicWood(product) {
  const group = new THREE.Group();
  const woodTexture = createDetailedWoodTexture();
  const endTexture = createEndGrainTexture();
  const sideGeometry = new THREE.CylinderGeometry(0.72, 0.78, 2.55, 192, 36, false);

  const sideMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    color: 0xc47a37,
    roughness: 0.64,
    metalness: 0.02,
    bumpMap: woodTexture,
    bumpScale: 0.014,
  });

  const endMaterial = new THREE.MeshStandardMaterial({
    map: endTexture,
    color: 0xb86d32,
    roughness: 0.7,
    metalness: 0.01,
    bumpMap: endTexture,
    bumpScale: 0.012,
  });

  const side = new THREE.Mesh(sideGeometry, [sideMaterial, endMaterial, endMaterial]);
  side.rotation.z = Math.PI / 2;
  side.castShadow = true;
  side.receiveShadow = true;
  group.add(side);

  group.scale.set(0.88, 0.76, 0.76);
  group.rotation.y = -0.38;
  return group;
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

function woodBox(product) {
  const group = new THREE.Group();
  const woodTexture = createDetailedWoodTexture(1024);
  woodTexture.repeat.set(1.2, 0.8);

  const darkWood = new THREE.MeshPhysicalMaterial({
    map: woodTexture,
    color: product.color,
    roughness: 0.62,
    metalness: 0.02,
    clearcoat: 0.18,
    clearcoatRoughness: 0.68,
    bumpMap: woodTexture,
    bumpScale: 0.012,
  });

  const endTexture = createEndGrainTexture(512);
  const innerWood = new THREE.MeshPhysicalMaterial({
    map: endTexture,
    color: 0xa7622c,
    roughness: 0.66,
    metalness: 0.01,
    clearcoat: 0.16,
    clearcoatRoughness: 0.62,
    bumpMap: endTexture,
    bumpScale: 0.01,
  });

  const base = new THREE.Mesh(roundedBox(2.18, 0.5, 1.24, 0.18, 28), darkWood);
  base.position.y = -0.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const cavity = new THREE.Mesh(roundedBox(1.56, 0.085, 0.72, 0.1, 22), innerWood);
  cavity.position.y = 0.2;
  cavity.castShadow = true;
  cavity.receiveShadow = true;
  group.add(cavity);

  const lid = new THREE.Mesh(roundedBox(2.05, 0.16, 1.1, 0.14, 28), darkWood);
  lid.position.set(0.22, 0.47, -0.18);
  lid.rotation.z = -0.085;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  const lidLine = new THREE.Mesh(roundedBox(1.78, 0.018, 0.86, 0.095, 18), innerWood);
  lidLine.position.set(0.2, 0.57, -0.18);
  lidLine.rotation.z = -0.085;
  lidLine.castShadow = true;
  group.add(lidLine);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.18, 48),
    new THREE.MeshStandardMaterial({
      color: 0x5a2d13,
      roughness: 0.72,
      metalness: 0.01,
    })
  );
  handle.position.set(0.2, 0.62, -0.2);
  handle.castShadow = true;
  group.add(handle);

  group.rotation.set(-0.1, -0.18, 0.03);
  group.scale.set(1.08, 1.08, 1.08);
  return group;
}

function servingBoard(product) {
  const group = new THREE.Group();
  const texture = createDetailedWoodTexture(1024);
  texture.repeat.set(1.85, 0.58);
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    color: product.color,
    roughness: 0.66,
    metalness: 0.01,
    clearcoat: 0.14,
    clearcoatRoughness: 0.72,
    bumpMap: texture,
    bumpScale: 0.012,
  });

  const shape = new THREE.Shape();
  shape.moveTo(-1.24, -0.5);
  shape.lineTo(0.64, -0.5);
  shape.bezierCurveTo(0.9, -0.5, 1.05, -0.38, 1.12, -0.22);
  shape.bezierCurveTo(1.24, -0.2, 1.39, -0.18, 1.55, -0.13);
  shape.bezierCurveTo(1.95, -0.02, 1.95, 0.02, 1.55, 0.13);
  shape.bezierCurveTo(1.39, 0.18, 1.24, 0.2, 1.12, 0.22);
  shape.bezierCurveTo(1.05, 0.38, 0.9, 0.5, 0.64, 0.5);
  shape.lineTo(-1.24, 0.5);
  shape.bezierCurveTo(-1.58, 0.5, -1.66, 0.28, -1.66, 0);
  shape.bezierCurveTo(-1.66, -0.28, -1.58, -0.5, -1.24, -0.5);

  const hole = new THREE.Path();
  hole.absellipse(1.46, 0, 0.085, 0.085, 0, Math.PI * 2);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.052,
    bevelSegments: 22,
    curveSegments: 36,
  });
  geometry.center();
  geometry.rotateX(Math.PI / 2);

  const board = new THREE.Mesh(geometry, material);
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  const topHighlight = new THREE.Mesh(
    roundedBox(2.35, 0.012, 0.64, 0.16, 22),
    new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xd3924c,
      roughness: 0.6,
      metalness: 0.01,
      clearcoat: 0.12,
      clearcoatRoughness: 0.66,
      transparent: true,
      opacity: 0.5,
    })
  );
  topHighlight.position.set(-0.22, 0.11, 0);
  topHighlight.castShadow = false;
  group.add(topHighlight);

  const grooveMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a2d12,
    roughness: 0.84,
  });
  const groove = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.008, 8, 160), grooveMaterial);
  groove.scale.x = 1.55;
  groove.scale.y = 0.52;
  groove.rotation.x = Math.PI / 2;
  groove.position.set(-0.22, 0.13, 0);
  groove.castShadow = true;
  group.add(groove);

  group.rotation.set(-0.78, -0.18, 0.04);
  group.scale.set(1.08, 1.08, 1.08);
  return group;
}

function turnedPot(product) {
  const group = new THREE.Group();
  const texture = createDetailedWoodTexture(1024);
  texture.repeat.set(1.1, 1.35);
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    color: product.color,
    roughness: 0.68,
    metalness: 0.01,
    clearcoat: 0.14,
    clearcoatRoughness: 0.76,
    bumpMap: texture,
    bumpScale: 0.018,
  });

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
    const y = -0.82 + t * 1.64;
    points.push(new THREE.Vector2(radiusAt(t), y));
  }

  const outer = new THREE.Mesh(new THREE.LatheGeometry(points, 160), material);
  outer.geometry.computeVertexNormals();
  outer.castShadow = true;
  outer.receiveShadow = true;
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.42, 0.56, 128, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x2a1308,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })
  );
  inner.position.y = 0.52;
  inner.castShadow = true;
  group.add(inner);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.034, 20, 160),
    new THREE.MeshPhysicalMaterial({
      map: texture,
      color: product.color,
      roughness: 0.54,
      clearcoat: 0.24,
      clearcoatRoughness: 0.56,
    })
  );
  lip.position.y = 0.8;
  lip.rotation.x = Math.PI / 2;
  lip.castShadow = true;
  group.add(lip);

  const grooveMaterial = new THREE.MeshStandardMaterial({
    color: 0x542710,
    roughness: 0.88,
    transparent: true,
    opacity: 0.38,
  });

  [0.22, 0.36, 0.5, 0.64, 0.78].forEach((t, index) => {
    const y = -0.82 + t * 1.64;
    const radius = radiusAt(t) * 1.002;
    const groove = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.012 + index * 0.001, 160, 1, true),
      grooveMaterial
    );
    groove.position.y = y;
    groove.castShadow = false;
    group.add(groove);
  });

  group.rotation.set(-0.04, -0.18, 0.02);
  group.scale.set(1.18, 1.18, 1.18);
  return group;
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
  const mesh =
    product.shape === "woodBox"
      ? woodBox(product)
      : product.shape === "organicWood"
        ? organicWood(product)
        : product.shape === "servingBoard"
          ? servingBoard(product)
          : product.shape === "turnedPot"
            ? turnedPot(product)
      : product.shape === "bowl"
        ? bowl(product)
        : product.shape === "tray"
          ? tray(product)
          : totem(product);
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
    activeObject.position.x = width < 820 ? 1.24 : width < 950 ? 1.56 : 1.42;
    activeObject.position.y = width < 820 ? 0.16 : -0.08;
    activeObject.scale.setScalar((width < 820 ? 0.58 : width < 950 ? 0.64 : 0.72) * (products[activeIndex].displayScale || 1));
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (activeObject) {
    const targetScale =
      (window.innerWidth < 820 ? 0.58 : window.innerWidth < 950 ? 0.64 : 0.72) *
      (products[activeIndex].displayScale || 1);
    objectReveal += (1 - objectReveal) * 0.075;
    const easedReveal = 1 - Math.pow(1 - objectReveal, 3);
    activeObject.rotation.y += (targetRotation - activeObject.rotation.y) * 0.08;
    targetRotation += 0.0016;
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

document.querySelector("#prev-product").addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setProduct(activeIndex - 1);
});
document.querySelector("#next-product").addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setProduct(activeIndex + 1);
});

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
