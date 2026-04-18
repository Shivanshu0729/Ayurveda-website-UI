window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
  }, 1800);
});

function getApiBase() {
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (window.location.protocol === "file:") return "http://localhost:3000";
  if (isLocalHost && window.location.port && window.location.port !== "3000") {
    return "http://localhost:3000";
  }
  return "";
}

const API_BASE = getApiBase();

function normalizeApiError(error, fallbackMessage) {
  const raw = String(error?.message || "");
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError") || raw.includes("Load failed")) {
    return "API server is offline. Start backend with: npm start";
  }
  return raw || fallbackMessage;
}

const cursor = document.getElementById("cursor");
const cursorFollower = document.getElementById("cursorFollower");

if (cursor && cursorFollower) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    setTimeout(() => {
      cursorFollower.style.left = e.clientX + "px";
      cursorFollower.style.top = e.clientY + "px";
    }, 80);
  });

  document.querySelectorAll("a, button, input, select, textarea").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.style.width = "14px";
      cursor.style.height = "14px";
      cursorFollower.style.transform = "translate(-50%, -50%) scale(1.5)";
    });
    el.addEventListener("mouseleave", () => {
      cursor.style.width = "8px";
      cursor.style.height = "8px";
      cursorFollower.style.transform = "translate(-50%, -50%) scale(1)";
    });
  });
}

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 60) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// Close mobile nav on link click
navLinks.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

const particleContainer = document.getElementById("particles");
if (particleContainer) {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    p.style.bottom = Math.random() * 30 + "px";
    p.style.setProperty("--dur", 6 + Math.random() * 10 + "s");
    p.style.setProperty("--delay", Math.random() * 8 + "s");
    particleContainer.appendChild(p);
  }
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHero3D() {
  const canvas = document.getElementById("hero3dCanvas");
  if (!canvas || typeof THREE === "undefined" || prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.2, 6.5);

  const ambient = new THREE.AmbientLight(0xf6e4b1, 0.9);
  scene.add(ambient);

  const pointA = new THREE.PointLight(0xd7b86b, 1.1, 18);
  pointA.position.set(3, 3, 4);
  scene.add(pointA);

  const pointB = new THREE.PointLight(0xffe7ba, 0.9, 18);
  pointB.position.set(-3, -2, 3);
  scene.add(pointB);

  const ring = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.12, 0.28, 130, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xc9a84c,
      metalness: 0.75,
      roughness: 0.22,
      transmission: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2
    })
  );
  ring.position.set(1.45, 0.3, -0.2);
  scene.add(ring);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.04, 24, 180),
    new THREE.MeshBasicMaterial({ color: 0xf5d690, transparent: true, opacity: 0.7 })
  );
  halo.rotation.x = Math.PI / 2.4;
  halo.position.set(1.45, 0.25, -0.2);
  scene.add(halo);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({
      color: 0xefd493,
      emissive: 0x5a430e,
      emissiveIntensity: 0.2,
      metalness: 0.35,
      roughness: 0.4
    })
  );
  core.position.set(-1.8, -0.35, 0.3);
  scene.add(core);

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = 220;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xe8cc83,
      size: 0.028,
      transparent: true,
      opacity: 0.75
    })
  );
  scene.add(dust);

  let mx = 0;
  let my = 0;

  function handleMouseMove(event) {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    mx = (x - 0.5) * 2;
    my = (y - 0.5) * 2;
  }

  hero.addEventListener("mousemove", handleMouseMove);

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    ring.rotation.x = 0.3 + t * 0.18;
    ring.rotation.y = t * 0.23;
    ring.position.y = 0.3 + Math.sin(t * 1.2) * 0.14;

    halo.rotation.z = t * 0.22;
    halo.position.y = 0.25 + Math.cos(t * 1.1) * 0.1;

    core.rotation.x = t * 0.4;
    core.rotation.y = t * 0.3;
    core.position.y = -0.35 + Math.cos(t * 1.6) * 0.12;

    dust.rotation.y = t * 0.03;
    dust.rotation.x = t * 0.02;

    camera.position.x += ((mx * 0.4) - camera.position.x) * 0.03;
    camera.position.y += ((-my * 0.2) - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

initHero3D();

const tiltCards = document.querySelectorAll("[data-tilt]");
if (tiltCards.length && !prefersReducedMotion && window.innerWidth > 768) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (event.clientX - cx) / (rect.width / 2);
      const dy = (event.clientY - cy) / (rect.height / 2);

      const rotateY = dx * 8;
      const rotateX = dy * -8;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, parseInt(delay));
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

const regForm = document.getElementById("regForm");
const successBanner = document.getElementById("successBanner");
const submitBtn = document.getElementById("submitBtn");

if (regForm) {
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("f-name").value.trim();
    const age = document.getElementById("f-age").value.trim();
    const gender = document.getElementById("f-gender").value;
    const locality = document.getElementById("f-locality").value.trim();
    const email = document.getElementById("f-email").value.trim();
    const phone = document.getElementById("f-phone").value.trim();

    if (!name || !email) {
      successBanner.textContent = "Please provide your name and email to continue.";
      successBanner.classList.add("show", "error");
      setTimeout(() => successBanner.classList.remove("show", "error"), 5000);
      return;
    }

    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, locality, email, phone })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit the form.");

      successBanner.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Namaste! We'll reach out to you within 24 hours 🙏`;
      successBanner.classList.add("show");

      regForm.querySelectorAll("input, select").forEach((el) => {
        el.value = "";
      });
    } catch (error) {
      successBanner.textContent = `⚠️ ${normalizeApiError(error, "Unable to submit the form.")}`;
      successBanner.classList.add("show", "error");
    } finally {
      submitBtn.innerHTML = `<span id="btnText">Submit Application</span>
        <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>`;
      submitBtn.disabled = false;
      setTimeout(() => successBanner.classList.remove("show", "error"), 5000);
    }
  });
}

const chatToggle = document.getElementById("chatToggle");
const chatWindow = document.getElementById("chatWindow");
const chatClose = document.getElementById("chatClose");
const chatbox = document.getElementById("chatbox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

document.addEventListener(
  "submit",
  (event) => {
    if (event.target && event.target.id === "regForm") {
      return;
    }

    if (event.target && typeof event.target.closest === "function" && event.target.closest(".chatbot-window")) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true
);

// Open / close chatbot
if (chatToggle) {
  chatToggle.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.toggle("chat-open");
  });
}

if (chatClose) {
  chatClose.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.remove("chat-open");
  });
}

// Enable/disable send button based on input
if (chatInput && sendBtn) {
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "38px";
    chatInput.style.height = chatInput.scrollHeight + "px";
    const hasText = chatInput.value.trim().length > 0;
    sendBtn.classList.toggle("active", hasText);
  });
}

// Send on Enter (not Shift+Enter)
if (chatInput) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.value.trim()) sendMessage();
    }
  });
}

if (sendBtn) {
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (chatInput && chatInput.value.trim()) sendMessage();
  });
}

function createBubble(text, type) {
  const li = document.createElement("li");
  li.className = "chat " + type;

  if (type === "incoming") {
    li.innerHTML = `
      <div class="chat-avatar-sm">
        <span class="material-symbols-outlined" style="font-size:14px;">spa</span>
      </div>
      <div class="bubble">${text}</div>`;
  } else {
    li.innerHTML = `<div class="bubble">${text}</div>`;
  }

  chatbox.appendChild(li);
  chatbox.scrollTop = chatbox.scrollHeight;
  return li;
}

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  createBubble(msg, "outgoing");
  chatInput.value = "";
  chatInput.style.height = "38px";
  sendBtn.classList.remove("active");

  const thinkingLi = createBubble("Thinking...", "incoming");
  const thinkingBubble = thinkingLi.querySelector(".bubble");
  if (thinkingBubble) thinkingBubble.classList.add("thinking");

  fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: msg })
  })
  .then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      let errData = {};
      try {
        errData = JSON.parse(text);
      } catch (err) {
        // ignore parse error, fallback to raw text
      }
      throw new Error(errData.error?.message || text || "Unknown API Error");
    }

    const data = await res.json();
    if (!data || !data.reply) {
      throw new Error("Received empty response from AI");
    }
    return data.reply;
  })
  .then((reply) => {
    thinkingLi.remove();
    createBubble(reply, "incoming");
  })
  .catch((error) => {
    console.error("Groq API Error:", error);
    thinkingLi.remove();
    createBubble(`⚠️ Error: ${normalizeApiError(error, "Unable to reach chat API")}`, "incoming");
  });
}
const sections = document.querySelectorAll("section[id]");
const navLinkEls = document.querySelectorAll(".nav-link");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinkEls.forEach((link) => {
          link.style.color = "";
          if (link.getAttribute("href") === "#" + entry.target.id) {
            link.style.color = "var(--gold)";
          }
        });
      }
    });
  },
  { threshold: 0.5 }
);

sections.forEach((section) => sectionObserver.observe(section));

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  const useLight = theme === "light";
  document.body.classList.toggle("light-mode", useLight);

  if (themeIcon) {
    themeIcon.textContent = useLight ? "dark_mode" : "light_mode";
  }

  localStorage.setItem("theme", useLight ? "light" : "dark");
}

applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");

function toggleTheme() {
  const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
  applyTheme(nextTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}
