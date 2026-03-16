let currentBuff = "monday";
let selectedSlot = null;
const ADMIN_PASSWORD = "2737admin";
let adminAuthenticated = false;
let bookingOpen = false;
const svsDate = new Date("2026-03-23T00:00:00Z");
const grid = document.getElementById("slots");

// Countdown
function updateCountdown() {
    let now = new Date();
    let diff = svsDate - now;
    let d = Math.floor(diff / (1000 * 60 * 60 * 24));
    let h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let m = Math.floor((diff / (1000 * 60)) % 60);
    document.getElementById("countdown").innerHTML = "SVS begins in " + d + "d " + h + "h " + m + "m";
}
setInterval(updateCountdown, 60000);
updateCountdown();

// Tabs
function switchBuff(buff) {
    currentBuff = buff;
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");
    loadSlots();
}

// Load Slots
function loadSlots() {
    db.collection("settings").doc("booking").onSnapshot(doc => {
        bookingOpen = doc.exists ? doc.data().open : false;
        db.collection("slots").onSnapshot(snapshot => {
            let data = {};
            snapshot.forEach(doc => { data[doc.id] = doc.data(); });
            generateSlots(data);
            updateCounts(data);
            updateTopSpeedups(data);
        });
    });
}

// Helper: Pad time
function padTime(h, m) {
    if (m >= 60) { h++; m -= 60; }
    h %= 24;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

// Generate Slots
function generateSlots(data) {
    grid.innerHTML = "";
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            let utcTime = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
            let localDate = new Date();
            localDate.setUTCHours(h, m);
            let localTime = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let id = currentBuff + "_" + utcTime;
            let div = document.createElement("div");
            div.id = id;

            let slot = data[id];

            if (!bookingOpen) {
                div.className = "slot locked";
                div.innerHTML = `<b>${utcTime} - ${padTime(h, m + 30)} UTC</b><br>${localTime}<br>🔒`;
            } else if (!slot) {
                div.className = "slot available";
                div.innerHTML = `<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h, m + 30)} UTC</span><span class='statusAvailable'>Available</span></div><div class='timeLocal'>${localTime}</div>`;
                div.onclick = () => highlightSlot(div, 'available');
            } else {
                div.className = "slot reserved";
                div.innerHTML = `<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h, m + 30)} UTC</span><span class='statusReserved'>Reserved</span></div><div class='timeLocal'>${localTime}</div>
                <div class='bookingInfo'>${slot.alliance || ""} ${slot.player || ""}</div>`;
                div.onclick = () => highlightSlot(div, 'reserved');
            }
            grid.appendChild(div);
        }
    }
}

// Highlight slot on click
function highlightSlot(div, type) {
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected", "highlightAvailable", "highlightReserved"));
    div.classList.add("selected", type === "available" ? "highlightAvailable" : "highlightReserved");
    selectedSlot = div.id;
}

// Update Available/Reserved counts
function updateCounts(data) {
    let available = 0, reserved = 0;
    for (let k in data) {
        if (k.startsWith(currentBuff)) reserved++; else available++;
    }
    document.getElementById("availableCount").innerText = "Available " + available;
    document.getElementById("reservedCount").innerText = "Reserved " + reserved;
}

// Update Top Speed-ups
function updateTopSpeedups(data) {
    const rankingBox = document.getElementById("rankingBox");
    rankingBox.innerHTML = "";
    let allSlots = Object.values(data).filter(s => s && s.daysSaved);
    allSlots.sort((a, b) => b.daysSaved - a.daysSaved);
    allSlots.slice(0, 6).forEach((s, idx) => {
        let div = document.createElement("div");
        div.className = "rankingItem";
        if (idx < 3) div.innerHTML = `<span>${idx+1}</span> ${s.player || ""} (${s.daysSaved})`;
        else div.innerHTML = `<span>${idx+1}</span> ${s.player || ""} (${s.daysSaved})`;
        rankingBox.appendChild(div);
    });
}

loadSlots();
