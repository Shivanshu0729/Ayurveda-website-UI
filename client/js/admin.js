const adminTokenInput = document.getElementById("adminToken");
const resultLimitSelect = document.getElementById("resultLimit");
const loadBtn = document.getElementById("loadBtn");
const loadStatus = document.getElementById("loadStatus");
const tableBody = document.getElementById("tableBody");

const statTotal = document.getElementById("statTotal");
const statDetox = document.getElementById("statDetox");
const statStress = document.getElementById("statStress");
const statWeight = document.getElementById("statWeight");
const statImmunity = document.getElementById("statImmunity");

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

function formatDate(dateText) {
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function setStatus(text, isError = false) {
  loadStatus.textContent = text;
  loadStatus.style.color = isError ? "#ff8f8f" : "rgba(246, 244, 238, 0.72)";
}

function renderStats(totals) {
  statTotal.textContent = totals?.total ?? 0;
  statDetox.textContent = totals?.detox ?? 0;
  statStress.textContent = totals?.stress ?? 0;
  statWeight.textContent = totals?.weight ?? 0;
  statImmunity.textContent = totals?.immunity ?? 0;
}

function renderTable(items) {
  if (!items || items.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No submissions found.</td></tr>';
    return;
  }

  tableBody.innerHTML = items
    .map((item) => {
      const concern = item.mainConcern || "-";
      const conciseConcern = concern.length > 120 ? `${concern.slice(0, 120)}...` : concern;
      return `
        <tr>
          <td>${formatDate(item.submittedAt)}</td>
          <td>${item.name || "-"}</td>
          <td>${item.trackLabel || item.track || "-"}</td>
          <td>${item.email || "-"}</td>
          <td>${item.phone || "-"}</td>
          <td>${conciseConcern}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadJourneyData() {
  const token = adminTokenInput.value.trim();
  const limit = Number(resultLimitSelect.value || 50);

  const params = new URLSearchParams({ limit: String(limit) });
  if (token) {
    params.set("token", token);
  }

  setStatus("Loading requests...");
  loadBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/journey?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to fetch journey submissions.");
    }

    renderStats(data.totals);
    renderTable(data.items);
    setStatus(`Loaded ${data.items.length} request(s).`);
  } catch (error) {
    renderStats({ total: 0, detox: 0, stress: 0, weight: 0, immunity: 0 });
    renderTable([]);
    setStatus(normalizeApiError(error, "Request failed."), true);
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadJourneyData);
window.addEventListener("load", loadJourneyData);
