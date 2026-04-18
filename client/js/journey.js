const trackMap = {
  detox: "Detox & Rebalance",
  stress: "Stress & Sleep Recovery",
  weight: "Metabolism & Weight Support",
  immunity: "Immunity & Vitality Boost"
};

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

const params = new URLSearchParams(window.location.search);
const initialTrack = params.get("track");

let currentStep = 1;
const maxStep = 4;
let selectedTrack = trackMap[initialTrack] ? initialTrack : "";

const steps = document.querySelectorAll(".step");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const submitJourneyBtn = document.getElementById("submitJourneyBtn");
const statusBanner = document.getElementById("statusBanner");
const selectedTrackBadge = document.getElementById("selectedTrackBadge");
const summaryCard = document.getElementById("summaryCard");
const optionButtons = document.querySelectorAll("#goalOptions .option-btn");
const form = document.getElementById("journeyForm");

function showStatus(message, type = "error") {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner show ${type}`;
}

function clearStatus() {
  statusBanner.className = "status-banner";
  statusBanner.textContent = "";
}

function setSelectedOption(value) {
  selectedTrack = value;
  optionButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });

  const label = trackMap[selectedTrack] || "Not chosen yet";
  selectedTrackBadge.textContent = `Selected: ${label}`;
}

function validateStep(step) {
  if (step === 1) {
    if (!selectedTrack) {
      showStatus("Please choose one pathway to continue.");
      return false;
    }
  }

  if (step === 2) {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    if (!name || !email) {
      showStatus("Name and email are required.");
      return false;
    }
  }

  return true;
}

function renderSummary() {
  const summaryData = [
    ["Selected Path", trackMap[selectedTrack] || "-"],
    ["Full Name", document.getElementById("name").value.trim() || "-"],
    ["Age", document.getElementById("age").value.trim() || "-"],
    ["Email", document.getElementById("email").value.trim() || "-"],
    ["Phone", document.getElementById("phone").value.trim() || "-"],
    ["Sleep Pattern", document.getElementById("sleepPattern").value || "-"],
    ["Availability", document.getElementById("availability").value || "-"],
    ["Main Concern", document.getElementById("mainConcern").value.trim() || "-"]
  ];

  summaryCard.innerHTML = summaryData
    .map(
      ([label, value]) =>
        `<div class="summary-line"><div class="summary-label">${label}</div><div class="summary-value">${value}</div></div>`
    )
    .join("");
}

function updateStepUI() {
  steps.forEach((stepEl) => {
    const stepNo = Number(stepEl.dataset.step);
    stepEl.classList.toggle("active", stepNo === currentStep);
  });

  const percent = (currentStep / maxStep) * 100;
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `Step ${currentStep} of ${maxStep}`;

  backBtn.disabled = currentStep === 1;
  const isReview = currentStep === maxStep;
  nextBtn.classList.toggle("hidden", isReview);
  submitJourneyBtn.classList.toggle("hidden", !isReview);

  if (isReview) {
    renderSummary();
  }
}

async function submitJourneyRequest() {
  let whatsappUrl = "";

  const payload = {
    track: selectedTrack,
    trackLabel: trackMap[selectedTrack] || null,
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value.trim() || null,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim() || null,
    sleepPattern: document.getElementById("sleepPattern").value || null,
    availability: document.getElementById("availability").value || null,
    mainConcern: document.getElementById("mainConcern").value.trim() || null
  };

  submitJourneyBtn.disabled = true;
  submitJourneyBtn.textContent = "Submitting...";
  clearStatus();

  try {
    const response = await fetch(`${API_BASE}/api/journey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to submit your journey.");
    }

    whatsappUrl = data.whatsappUrl || "";

    showStatus("Journey submitted successfully. Opening WhatsApp for instant booking...", "success");
    form.reset();
    setSelectedOption("");
    currentStep = 1;
    updateStepUI();

    setTimeout(() => {
      if (whatsappUrl) {
        window.location.href = whatsappUrl;
      } else {
        window.location.href = "chatbot.html#register";
      }
    }, 1200);
  } catch (error) {
    showStatus(normalizeApiError(error, "Something went wrong. Please try again."));
  } finally {
    submitJourneyBtn.disabled = false;
    submitJourneyBtn.textContent = "Submit Journey";
  }
}

optionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setSelectedOption(btn.dataset.value);
    clearStatus();
  });
});

backBtn.addEventListener("click", () => {
  clearStatus();
  if (currentStep > 1) {
    currentStep -= 1;
    updateStepUI();
  }
});

nextBtn.addEventListener("click", () => {
  clearStatus();
  if (!validateStep(currentStep)) {
    return;
  }

  if (currentStep < maxStep) {
    currentStep += 1;
    updateStepUI();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  if (!validateStep(1) || !validateStep(2)) {
    return;
  }

  await submitJourneyRequest();
});

if (selectedTrack) {
  setSelectedOption(selectedTrack);
}

updateStepUI();
