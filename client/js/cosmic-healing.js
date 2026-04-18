const cosmicThemeToggle = document.getElementById("cosmicThemeToggle");
const cosmicThemeIcon = document.getElementById("cosmicThemeIcon");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function applyCosmicTheme(theme) {
  const useLight = theme === "light";
  document.body.classList.toggle("light-mode", useLight);
  localStorage.setItem("theme", useLight ? "light" : "dark");
  if (cosmicThemeIcon) {
    cosmicThemeIcon.textContent = useLight ? "dark_mode" : "light_mode";
  }
}

function resolveInitialTheme() {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode");

  if (modeParam === "day") return "light";
  if (modeParam === "night") return "dark";

  return localStorage.getItem("theme") === "light" ? "light" : "dark";
}

applyCosmicTheme(resolveInitialTheme());

if (cosmicThemeToggle) {
  cosmicThemeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("light-mode") ? "dark" : "light";
    applyCosmicTheme(next);
  });
}

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const tiltCards = document.querySelectorAll("[data-tilt]");
if (!reducedMotion && window.innerWidth > 900) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -9}deg) rotateY(${x * 10}deg) translateZ(0)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  });
}

function initCosmicScene() {
  const canvas = document.getElementById("cosmicCanvas");
  if (!canvas || typeof THREE === "undefined" || reducedMotion) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 7;

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const point = new THREE.PointLight(0xffcb7b, 1.25, 20);
  point.position.set(2.4, 2.1, 4.4);
  scene.add(point);

  const ring = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.45, 0.18, 220, 22),
    new THREE.MeshPhysicalMaterial({
      color: 0xe6b766,
      metalness: 0.76,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.16
    })
  );
  ring.position.set(-1.8, 0.2, -0.8);
  scene.add(ring);

  const sphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 1),
    new THREE.MeshStandardMaterial({
      color: 0x8b7bff,
      emissive: 0x2b2467,
      emissiveIntensity: 0.45,
      metalness: 0.3,
      roughness: 0.4
    })
  );
  sphere.position.set(2.1, -0.8, -1.2);
  scene.add(sphere);

  const starsGeometry = new THREE.BufferGeometry();
  const count = 280;
  const values = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    values[i * 3] = (Math.random() - 0.5) * 18;
    values[i * 3 + 1] = (Math.random() - 0.5) * 10;
    values[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(values, 3));

  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
      color: 0xffe3ba,
      size: 0.03,
      opacity: 0.8,
      transparent: true
    })
  );
  scene.add(stars);

  let mx = 0;
  let my = 0;
  window.addEventListener("mousemove", (event) => {
    mx = (event.clientX / window.innerWidth - 0.5) * 2;
    my = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    ring.rotation.x = t * 0.22;
    ring.rotation.y = t * 0.24;

    sphere.rotation.y = t * 0.35;
    sphere.rotation.z = t * 0.2;
    sphere.position.y = -0.8 + Math.sin(t * 1.3) * 0.18;

    stars.rotation.y = t * 0.04;

    camera.position.x += (mx * 0.45 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.22 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -0.6);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

initCosmicScene();
