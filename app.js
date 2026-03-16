let currentBuff="monday";
let selectedSlot=null;
const ADMIN_PASSWORD="2737admin";
let adminAuthenticated=false;
let bookingOpen=false;
const svsDate=new Date("2026-03-23T00:00:00Z");
const grid=document.getElementById("slots");

// Firebase 초기화 (firebase.js에서 db 정의)
const db=firebase.firestore();

// Countdown
function updateCountdown(){
    let now=new Date();
    let diff=svsDate-now;
    let d=Math.floor(diff/(1000*60*60*24));
    let h=Math.floor((diff/(1000*60*60))%24);
    let m=Math.floor((diff/(1000*60))%60);
    document.getElementById("countdown").innerText=`SVS begins in ${d}d ${h}h ${m}m`;
}
setInterval(updateCountdown,60000);
updateCountdown();

function padTime(h,m){if(m>=60){h++;m-=60;} h%=24; return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");}

// Tabs
function switchBuff(buff){
    currentBuff=buff;
    document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
    document.getElementById(`tab-${buff}`).classList.add("active");
    loadSlots();
}

// Load slots
function loadSlots(){
    db.collection("settings").doc("booking").onSnapshot(doc=>{
        bookingOpen = doc.exists ? doc.data().open : false;
        db.collection("slots").onSnapshot(snapshot=>{
            let data={};
            snapshot.forEach(doc=>data[doc.id]=doc.data());
            generateSlots(data);
            updateCounts(data);
            updateTopSpeedups(data);
        });
    });
}

// Generate slots
function generateSlots(data){
    grid.innerHTML="";
    for(let h=0;h<24;h++){
        for(let m=0;m<60;m+=30){
            let utcTime=padTime(h,m);
            let localDate=new Date();
            localDate.setUTCHours(h,m);
            let localTime=localDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            let id=currentBuff+"_"+utcTime;
            let div=document.createElement("div");
            div.id=id;
            div.classList.add("slot");
            div.style.minHeight="120px";

            let slot=data[id];

            if(!bookingOpen){
                div.classList.add("locked");
                div.innerHTML=`<b>${utcTime} - ${padTime(h,m+30)} UTC</b><br>${localTime}<br>🔒`;
            }else if(!slot){
                div.classList.add("available");
                div.innerHTML=`<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h,m+30)} UTC</span><span class='statusAvailable'>Available</span></div><div class='timeLocal'>${localTime}</div>`;
                div.onclick=()=>{highlightSlot(div,true); openReserveModal(id);}
            }else{
                div.classList.add("reserved");
                div.innerHTML=`<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h,m+30)} UTC</span><span class='statusReserved'>Reserved</span></div><div class='timeLocal'>${localTime}</div><div class='bookingInfo'>[${slot.alliance}] ${slot.player} (${slot.daysSaved})</div>`;
                div.onclick=()=>{highlightSlot(div,false); openCancelModal(id);}
            }
            grid.appendChild(div);
        }
    }
}

// Highlight
function highlightSlot(div,isAvailable){
    document.querySelectorAll(".slot").forEach(s=>s.classList.remove("selected","highlightAvailable","highlightReserved"));
    div.classList.add("selected");
    if(isAvailable) div.classList.add("highlightAvailable");
    else div.classList.add("highlightReserved");
}

// Modal
function openReserveModal(id){ selectedSlot=id; document.getElementById("modal").style.display="flex";}
function closeModal(){ document.getElementById("modal").style.display="none";}
function openCancelModal(id){ selectedSlot=id; document.getElementById("cancelModal").style.display="flex";}
function closeCancelModal(){ document.getElementById("cancelModal").style.display="none";}

// Counts
function updateCounts(data){
    let available=0,reserved=0;
    for(let k in data){ if(data[k] && data[k].player) reserved++; else available++; }
    document.getElementById("availableCount").innerText="Available "+available;
    document.getElementById("reservedCount").innerText="Reserved "+reserved;
}

// Ranking
function updateTopSpeedups(data){
    const rankingBox=document.getElementById("rankingBox");
    rankingBox.innerHTML="";
    let allSlots=Object.values(data).filter(s=>s&&s.daysSaved).sort((a,b)=>b.daysSaved-a.daysSaved);
    allSlots.slice(0,6).forEach((s,idx)=>{
        let div=document.createElement("div");
        div.className="rankingItem";
        div.innerHTML=`<span>${idx+1}</span> ${s.player} (${s.daysSaved})`;
        rankingBox.appendChild(div);
    });
}

loadSlots();

// Reserve / Cancel buttons
document.getElementById("reserveBtn").addEventListener("click", ()=>{
    if(!selectedSlot) return;
    const alliance=document.getElementById("alliance").value;
    const player=document.getElementById("player").value;
    const daysSaved=document.getElementById("daysSaved").value;
    const password=document.getElementById("password").value;
    db.collection("slots").doc(selectedSlot).set({alliance,player,daysSaved,password}).then(()=>{
        closeModal();
        loadSlots();
    });
});

document.getElementById("cancelBtn").addEventListener("click", ()=>{
    if(!selectedSlot) return;
    const cancelPassword=document.getElementById("cancelPassword").value;
    db.collection("slots").doc(selectedSlot).get().then(doc=>{
        if(doc.exists && doc.data().password===cancelPassword){
            db.collection("slots").doc(selectedSlot).delete().then(()=>{
                closeCancelModal();
                loadSlots();
            });
        }else{
            alert("Password incorrect");
        }
    });
});

// Snow
const canvas=document.getElementById("snow");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const flakes=[];
for(let i=0;i<200;i++) flakes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,radius:Math.random()*3+1,speed:Math.random()*0.7+0.3});
function drawSnow(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    flakes.forEach(f=>{
        ctx.beginPath();
        ctx.arc(f.x,f.y,f.radius,0,Math.PI*2);
        ctx.fillStyle="white";
        ctx.fill();
        f.y+=f.speed;
        if(f.y>canvas.height){f.y=0;f.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(drawSnow);
}
drawSnow();
window.addEventListener("resize",()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
