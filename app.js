let currentBuff = "monday";
let selectedSlot = null;
const ADMIN_PASSWORD = "2737admin";
let adminAuthenticated = false;
let bookingOpen = false;
const svsDate = new Date("2026-03-23T00:00:00Z");
const grid = document.getElementById("slots");

const dbRef = window.db || firebase.firestore();

let bookingUnsubscribe = null;
let slotsUnsubscribe = null;

function updateCountdown() {
  const now = new Date();
  const diff = svsDate - now;

  if (diff <= 0) {
    document.getElementById("countdown").innerText = "SVS has begun";
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);

  document.getElementById("countdown").innerText = `SVS begins in ${d}d ${h}h ${m}m`;
}

function padTime(h, m) {
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }
  h = h % 24;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function setActiveTab() {
  const buttons = document.querySelectorAll(".tabs button");
  buttons.forEach((btn) => btn.classList.remove("active"));

  if (currentBuff === "monday" && buttons[0]) buttons[0].classList.add("active");
  if (currentBuff === "tuesday" && buttons[1]) buttons[1].classList.add("active");
  if (currentBuff === "thursday" && buttons[2]) buttons[2].classList.add("active");
}

function clearSelection() {
  document.querySelectorAll(".slot").forEach((slot) => {
    slot.classList.remove("selected", "highlightAvailable", "highlightReserved");
  });
}

function highlightSlot(div, isAvailable) {
  clearSelection();
  div.classList.add("selected");
  div.classList.add(isAvailable ? "highlightAvailable" : "highlightReserved");
}

function switchBuff(buff) {
  currentBuff = buff;
  setActiveTab();
  loadSlots();
}

function openReserveModal(id) {
  selectedSlot = id;
  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("alliance").value = "";
  document.getElementById("player").value = "";
  document.getElementById("daysSaved").value = "";
  document.getElementById("password").value = "";
  clearSelection();
}

function openCancelModal(id) {
  selectedSlot = id;
  document.getElementById("cancelModal").classList.add("show");
}

function closeCancelModal() {
  document.getElementById("cancelModal").classList.remove("show");
  document.getElementById("cancelPassword").value = "";
  clearSelection();
}

function openAdmin() {
  document.getElementById("adminPanel").classList.add("show");
}

function closeAdmin() {
  document.getElementById("adminPanel").classList.remove("show");
}

function adminLogin() {
  const pw = document.getElementById("adminPass").value;
  if (pw === ADMIN_PASSWORD) {
    adminAuthenticated = true;
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminControls").style.display = "flex";
  } else {
    alert("관리자 비밀번호가 틀렸습니다.");
  }
}

function setBooking(isOpen) {
  if (!adminAuthenticated) return;

  dbRef.collection("settings").doc("booking").set({ open: isOpen }, { merge: true })
    .then(() => {
      alert(isOpen ? "예약이 열렸습니다." : "예약이 잠겼습니다.");
    })
    .catch((error) => {
      console.error(error);
      alert("설정 변경 중 오류가 발생했습니다.");
    });
}

function clearAll() {
  if (!adminAuthenticated) return;
  if (!confirm("전체 예약을 삭제할까요?")) return;

  dbRef.collection("slots").get()
    .then((snapshot) => {
      const batch = dbRef.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
      alert("전체 예약이 삭제되었습니다.");
    })
    .catch((error) => {
      console.error(error);
      alert("전체 삭제 중 오류가 발생했습니다.");
    });
}

function updateCounts(data) {
  let reserved = 0;
  let available = 0;

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const id = `${currentBuff}_${padTime(h, m)}`;
      if (data[id]) reserved++;
      else available++;
    }
  }

  document.getElementById("availableCount").innerText = `Available ${available}`;
  document.getElementById("reservedCount").innerText = `Reserved ${reserved}`;
}

function updateTopSpeedups(data) {
  const allSlots = Object.values(data)
    .filter((slot) => slot && slot.daysSaved !== undefined && slot.daysSaved !== null && slot.daysSaved !== "")
    .sort((a, b) => Number(b.daysSaved) - Number(a.daysSaved))
    .slice(0, 6);

  let html = '<div class="rankingTitle">Top Speed-ups</div>';

  if (allSlots.length === 0) {
    html += '<div class="rankingItem">No data yet</div>';
  } else {
    allSlots.forEach((slot, idx) => {
      html += `<div class="rankingItem"><span>${idx + 1}</span> ${slot.player || "-"} (${slot.daysSaved})</div>`;
    });
  }

  document.getElementById("rankingBox").innerHTML = html;
}

function generateSlots(data) {
  grid.innerHTML = "";

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const utcTime = padTime(h, m);
      const id = `${currentBuff}_${utcTime}`;
      const slot = data[id];

      const localDate = new Date();
      localDate.setUTCHours(h, m, 0, 0);
      const localTime = localDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      const div = document.createElement("div");
      div.className = "slot";

      if (!bookingOpen) {
        div.classList.add("locked");
        div.innerHTML = `
          <div class="timeRow">
            <span class="timeUTC">${utcTime} - ${padTime(h, m + 30)} UTC</span>
          </div>
          <div class="timeLocal">${localTime}</div>
          <div class="bookingInfo">🔒 Booking Closed</div>
        `;
      } else if (!slot) {
        div.classList.add("available");
        div.innerHTML = `
          <div class="timeRow">
            <span class="timeUTC">${utcTime} - ${padTime(h, m + 30)} UTC</span>
            <span class="statusAvailable">Available</span>
          </div>
          <div class="timeLocal">${localTime}</div>
          <div class="bookingInfo">&nbsp;</div>
        `;
        div.onclick = () => {
          highlightSlot(div, true);
          openReserveModal(id);
        };
      } else {
        div.classList.add("reserved");
        div.innerHTML = `
          <div class="timeRow">
            <span class="timeUTC">${utcTime} - ${padTime(h, m + 30)} UTC</span>
            <span class="statusReserved">Reserved</span>
          </div>
          <div class="timeLocal">${localTime}</div>
          <div class="bookingInfo">[${slot.alliance}] ${slot.player} (${slot.daysSaved})</div>
        `;
        div.onclick = () => {
          highlightSlot(div, false);
          openCancelModal(id);
        };
      }

      grid.appendChild(div);
    }
  }
}

function attachRealtimeListeners() {
  if (slotsUnsubscribe) {
    slotsUnsubscribe();
    slotsUnsubscribe = null;
  }

  if (bookingUnsubscribe) {
    bookingUnsubscribe();
    bookingUnsubscribe = null;
  }

  bookingUnsubscribe = dbRef.collection("settings").doc("booking").onSnapshot(
    (doc) => {
      bookingOpen = doc.exists ? Boolean(doc.data().open) : false;

      if (slotsUnsubscribe) slotsUnsubscribe();

      slotsUnsubscribe = dbRef.collection("slots").onSnapshot(
        (snapshot) => {
          const data = {};
          snapshot.forEach((docItem) => {
            data[docItem.id] = docItem.data();
          });

          generateSlots(data);
          updateCounts(data);
          updateTopSpeedups(data);
        },
        (error) => {
          console.error("slots onSnapshot error:", error);
        }
      );
    },
    (error) => {
      console.error("booking onSnapshot error:", error);
    }
  );
}

function loadSlots() {
  attachRealtimeListeners();
}

function confirmBooking() {
  if (!selectedSlot) return;

  const alliance = document.getElementById("alliance").value.trim();
  const player = document.getElementById("player").value.trim();
  const daysSaved = document.getElementById("daysSaved").value.trim();
  const password = document.getElementById("password").value;

  if (!alliance || !player || !daysSaved || !password) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  dbRef.collection("slots").doc(selectedSlot).set({
    alliance,
    player,
    daysSaved: Number(daysSaved),
    password
  })
    .then(() => {
      closeModal();
    })
    .catch((error) => {
      console.error(error);
      alert("예약 중 오류가 발생했습니다.");
    });
}

function confirmCancel() {
  if (!selectedSlot) return;

  const cancelPassword = document.getElementById("cancelPassword").value;

  dbRef.collection("slots").doc(selectedSlot).get()
    .then((doc) => {
      if (!doc.exists) {
        alert("예약 정보를 찾을 수 없습니다.");
        return;
      }

      if (doc.data().password !== cancelPassword) {
        alert("Password incorrect");
        return;
      }

      return dbRef.collection("slots").doc(selectedSlot).delete().then(() => {
        closeCancelModal();
      });
    })
    .catch((error) => {
      console.error(error);
      alert("취소 중 오류가 발생했습니다.");
    });
}

/* blue snow */
const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d");
const flakes = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initSnow() {
  resizeCanvas();
  flakes.length = 0;

  for (let i = 0; i < 180; i++) {
    flakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.6 + 0.8,
      speedY: Math.random() * 0.9 + 0.3,
      speedX: Math.random() * 0.4 - 0.2
    });
  }
}

function drawSnow() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  flakes.forEach((f) => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(170, 210, 255, 0.85)";
    ctx.fill();

    f.y += f.speedY;
    f.x += f.speedX;

    if (f.y > canvas.height + 5) {
      f.y = -5;
      f.x = Math.random() * canvas.width;
    }

    if (f.x < -5) f.x = canvas.width + 5;
    if (f.x > canvas.width + 5) f.x = -5;
  });

  requestAnimationFrame(drawSnow);
}

window.addEventListener("resize", resizeCanvas);
setInterval(updateCountdown, 60000);

/* default */
updateCountdown();
setActiveTab();
initSnow();
drawSnow();
loadSlots();
