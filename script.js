const GROQ_MODEL = "llama-3.1-8b-instant";

window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
  }, 1800);
});

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
  regForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Animate button
    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    setTimeout(() => {
      // Show success
      successBanner.classList.add("show");

      // Reset button
      submitBtn.innerHTML = `<span id="btnText">Submit Application</span>
        <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>`;
      submitBtn.disabled = false;

      // Clear all fields
      regForm.querySelectorAll("input, select").forEach((el) => {
        el.value = "";
      });

      // Hide success after 5 seconds
      setTimeout(() => {
        successBanner.classList.remove("show");
      }, 5000);
    }, 1200);
  });
}

const chatToggle = document.getElementById("chatToggle");
const chatWindow = document.getElementById("chatWindow");
const chatClose = document.getElementById("chatClose");
const chatbox = document.getElementById("chatbox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Open / close chatbot
chatToggle.addEventListener("click", () => {
  document.body.classList.toggle("chat-open");
});
chatClose.addEventListener("click", () => {
  document.body.classList.remove("chat-open");
});

// Enable/disable send button based on input
chatInput.addEventListener("input", () => {
  chatInput.style.height = "38px";
  chatInput.style.height = chatInput.scrollHeight + "px";
  const hasText = chatInput.value.trim().length > 0;
  sendBtn.classList.toggle("active", hasText);
});

// Send on Enter (not Shift+Enter)
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (chatInput.value.trim()) sendMessage();
  }
});

sendBtn.addEventListener("click", () => {
  if (chatInput.value.trim()) sendMessage();
});

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

  fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a warm, conversational Ayurveda guide for Ayurveda Kendra. 
          Respond naturally to whatever the user says. Answer ONLY what they specifically ask. 
          Do NOT list out treatments or give a welcome speech unless explicitly asked. 
          If they just say 'Hi', just say hello back and ask how you can help. 
          Keep replies short (1-3 sentences). Occasionally use 🙏 or 🌿. 
          Gently mention the registration form only if they want to book or need personalized advice. 
          No medical diagnoses.`
        },
        {
          role: "user",
          content: msg
        }
      ]
    })
  })
  .then(async (res) => {
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || "Unknown API Error");
    }
    return res.json();
  })
  .then((data) => {
    thinkingLi.remove(); 
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const reply = data.choices[0].message.content.trim();
      createBubble(reply, "incoming");
    } else {
      throw new Error("Received empty response from AI");
    }
  })
  .catch((error) => {
    console.error("Groq API Error:", error);
    thinkingLi.remove();
    createBubble(`⚠️ Error: ${error.message}`, "incoming");
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

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  themeIcon.textContent = "dark_mode"; 
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  
  if (document.body.classList.contains("light-mode")) {
    themeIcon.textContent = "dark_mode";
    localStorage.setItem("theme", "light");
  } else {
    themeIcon.textContent = "light_mode";
    localStorage.setItem("theme", "dark");
  }
});