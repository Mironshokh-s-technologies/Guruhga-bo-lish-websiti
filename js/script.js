// Ruxsat etilgan maksimal odamlar soni (baraban o'qilishi uchun 100 qildim)
const MAX_PEOPLE = 100;

// ---------- Elementlar ----------
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const countForm = document.getElementById("countForm");
const namesForm = document.getElementById("namesForm");
const peopleInput = document.getElementById("peopleCount");
const groupInput = document.getElementById("groupCount");
const nameInputs = document.getElementById("nameInputs");
const backBtn = document.getElementById("backBtn");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const messageBox = document.getElementById("message");
const winnerText = document.getElementById("winnerText");
const teamsBox = document.getElementById("teams");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

// ---------- Holat ----------
let peopleCount = 0;
let groupCount = 0;
let teamSize = 0;     // har bir komandadagi odamlar soni
let leftover = 0;     // komandasiz qoladiganlar soni
let remaining = [];   // barabanda qolgan ismlar
let teams = [];       // komandalar
let assigned = 0;     // nechta odam taqsimlangan
let rotation = 0;     // baraban burilish burchagi (radian)
let spinning = false;
let lightsPhase = 0;

const TWO_PI = Math.PI * 2;

// ---------- Yordamchi funksiyalar ----------
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "message " + type;
}

function hideMessage() {
  messageBox.className = "message hidden";
  messageBox.textContent = "";
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

// ---------- 1-qadam: sonlar ----------
countForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hideMessage();

  const people = parseInt(peopleInput.value, 10);
  const groups = parseInt(groupInput.value, 10);

  if (!Number.isInteger(people) || !Number.isInteger(groups) || people < 1 || groups < 1) {
    showMessage("Iltimos, to'g'ri musbat butun sonlarni kiriting.", "error");
    return;
  }

  if (people > MAX_PEOPLE || groups > people) {
    showMessage("Uzur ammo siz aytayotgan odamlar soni juda ko'p", "error");
    return;
  }

  peopleCount = people;
  groupCount = groups;
  teamSize = Math.floor(people / groups);
  leftover = people % groups;

  buildNameInputs();
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
});

// ---------- 2-qadam: ismlar ----------
function buildNameInputs() {
  nameInputs.innerHTML = "";
  for (let i = 0; i < peopleCount; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 30;
    input.placeholder = (i + 1) + "-odamning ismi";
    input.required = true;
    nameInputs.appendChild(input);
  }
  nameInputs.firstChild.focus();
}

backBtn.addEventListener("click", function () {
  hideMessage();
  step2.classList.add("hidden");
  step1.classList.remove("hidden");
});

namesForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hideMessage();

  const names = Array.from(nameInputs.querySelectorAll("input")).map((i) => i.value.trim());

  if (names.some((n) => n === "")) {
    showMessage("Iltimos, hamma odamning ismini kiriting.", "error");
    return;
  }

  const lower = names.map((n) => n.toLowerCase());
  if (new Set(lower).size !== lower.length) {
    showMessage("Ismlar takrorlanmasligi kerak. Iltimos, farqlantiring (masalan: Ali A., Ali B.).", "error");
    return;
  }

  startGame(names);
});

// ---------- 3-qadam: baraban ----------
function startGame(names) {
  remaining = names.slice();
  teams = Array.from({ length: groupCount }, () => []);
  assigned = 0;
  rotation = 0;
  spinning = false;

  step2.classList.add("hidden");
  step3.classList.remove("hidden");
  winnerText.className = "winner hidden";
  spinBtn.disabled = false;

  renderTeams();
  drawWheel();
}

resetBtn.addEventListener("click", function () {
  if (spinning) return;
  hideMessage();
  step3.classList.add("hidden");
  step1.classList.remove("hidden");
});

// ---------- Barabanni chizish ----------
function segmentColor(i, n) {
  return "hsl(" + Math.round((i * 360) / n) + ", 90%, 52%)";
}

function drawWheel() {
  const W = canvas.width;
  const cx = W / 2;
  const cy = W / 2;
  const outerR = 290; // tashqi oltin hoshiya
  const wheelR = 250; // rangli qism
  const n = remaining.length;

  ctx.clearRect(0, 0, W, W);

  // --- Oltin hoshiya ---
  const rim = ctx.createLinearGradient(0, 0, W, W);
  rim.addColorStop(0, "#ffd54a");
  rim.addColorStop(0.5, "#ff9800");
  rim.addColorStop(1, "#e65100");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, TWO_PI);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#7a2e00";
  ctx.stroke();

  // --- Rangli bo'laklar ---
  if (n > 0) {
    const arc = TWO_PI / n;
    for (let i = 0; i < n; i++) {
      const start = rotation + i * arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelR, start, start + arc);
      ctx.closePath();
      ctx.fillStyle = segmentColor(i, n);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#5a1a00";
      ctx.stroke();

      // Ism yozuvi
      let fontSize = 28;
      let maxChars = 14;
      if (n > 8) { fontSize = 22; maxChars = 13; }
      if (n > 16) { fontSize = 16; maxChars = 11; }
      if (n > 30) { fontSize = 12; maxChars = 9; }
      if (n > 60) { fontSize = 9; maxChars = 7; }

      let name = remaining[i];
      if (name.length > maxChars) name = name.slice(0, maxChars - 1) + "…";

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + fontSize + "px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.fillText(name, wheelR - 20, 0);
      ctx.restore();
    }
  }

  // --- Lampochkalar ---
  const bulbs = 18;
  for (let i = 0; i < bulbs; i++) {
    const a = (i / bulbs) * TWO_PI;
    const bx = cx + Math.cos(a) * 270;
    const by = cy + Math.sin(a) * 270;
    const on = spinning ? (i + lightsPhase) % 2 === 0 : true;

    const g = ctx.createRadialGradient(bx, by, 1, bx, by, 14);
    g.addColorStop(0, on ? "#ffffff" : "#ffe9a8");
    g.addColorStop(0.5, on ? "#fff3b0" : "#d99a2b");
    g.addColorStop(1, "rgba(255,200,50,0)");
    ctx.beginPath();
    ctx.arc(bx, by, on ? 14 : 9, 0, TWO_PI);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // --- Markaziy tugma ---
  const hub = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, 50);
  hub.addColorStop(0, "#fff176");
  hub.addColorStop(1, "#f57c00");
  ctx.beginPath();
  ctx.arc(cx, cy, 48, 0, TWO_PI);
  ctx.fillStyle = hub;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#8a3b00";
  ctx.stroke();

  // --- Qizil ko'rsatkich (tepada) ---
  ctx.beginPath();
  ctx.moveTo(cx - 30, 6);
  ctx.lineTo(cx + 30, 6);
  ctx.lineTo(cx, 78);
  ctx.closePath();
  ctx.fillStyle = "#e53935";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffb300";
  ctx.lineJoin = "round";
  ctx.stroke();
}

// ---------- Aylantirish ----------
spinBtn.addEventListener("click", spin);

function spin() {
  if (spinning) return;
  if (remaining.length <= leftover) return;

  hideMessage();
  winnerText.className = "winner hidden";
  spinning = true;
  spinBtn.disabled = true;
  resetBtn.disabled = true;

  const n = remaining.length;
  const arc = TWO_PI / n;
  const winnerIndex = Math.floor(Math.random() * n);

  // Ko'rsatkich tepada (-90 daraja). G'olib bo'lagi aynan shu yerga kelishi kerak.
  const jitter = (Math.random() - 0.5) * arc * 0.7;
  const target = -Math.PI / 2 - (winnerIndex + 0.5) * arc + jitter;
  const delta = mod(target - rotation, TWO_PI);
  const extraTurns = 5 + Math.floor(Math.random() * 3);

  const startRot = rotation;
  const finalRot = rotation + extraTurns * TWO_PI + delta;
  const duration = 5000;
  const startTime = performance.now();

  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    rotation = startRot + (finalRot - startRot) * eased;
    lightsPhase = Math.floor(now / 120) % 2;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      rotation = mod(finalRot, TWO_PI);
      spinning = false;
      resetBtn.disabled = false;
      onSpinEnd(winnerIndex);
    }
  }
  requestAnimationFrame(frame);
}

function onSpinEnd(winnerIndex) {
  const name = remaining[winnerIndex];
  const teamIndex = assigned % groupCount;

  teams[teamIndex].push(name);
  remaining.splice(winnerIndex, 1);
  assigned++;

  winnerText.textContent = "🎉 " + name + " → " + (teamIndex + 1) + "-komandaga tushdi!";
  winnerText.className = "winner";

  renderTeams();
  rotation = 0;
  drawWheel();

  // Hamma komandalar to'ldimi?
  if (remaining.length === leftover) {
    spinBtn.disabled = true;
    if (leftover > 0) {
      const names = remaining.join(" va ");
      showMessage(
        "Nima " + names + " ni eshik qisganmi uni ham qoshvollaring kuchsiz komanda bo'lsa",
        "warn"
      );
    } else {
      showMessage("Hamma odam komandalarga teng bo'lib bo'lindi! ✅", "success");
    }
  } else {
    spinBtn.disabled = false;
  }
}

// ---------- Komandalarni ko'rsatish ----------
function renderTeams() {
  let html = "";
  for (let g = 0; g < groupCount; g++) {
    const members = teams[g]
      .map((n) => '<span class="member">' + escapeHtml(n) + "</span>")
      .join("");
    html +=
      '<div class="team-card">' +
      "<h3>" + (g + 1) + "-komanda</h3>" +
      '<div class="size">' + teams[g].length + " / " + teamSize + " odam</div>" +
      '<div class="members">' + members + "</div>" +
      "</div>";
  }
  teamsBox.innerHTML = html;
}