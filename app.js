let currentBuff="monday";
let selectedSlot=null;
const ADMIN_PASSWORD="2737admin";
let adminAuthenticated=false;
let bookingOpen=false;
const svsDate=new Date("2026-03-23T00:00:00Z");
const grid=document.getElementById("slots");

// Countdown
function updateCountdown(){
    let now=new Date();
    let diff=svsDate-now;
    let d=Math.floor(diff/(1000*60*60*24));
    let h=Math.floor((diff/(1000*60*60))%24);
    let m=Math.floor((diff/(1000*60))%60);
    document.getElementById("countdown").innerHTML=
        "SVS begins in "+d+"d "+h+"h "+m+"m";
}
setInterval(updateCountdown,60000);
updateCountdown();

// Load slots
db.collection("settings").doc("booking").onSnapshot(doc=>{
    if(doc.exists) bookingOpen=doc.data().open;
    loadSlots();
});

function loadSlots(){
    db.collection("slots").onSnapshot(snapshot=>{
        let data={};
        snapshot.forEach(doc=>{data[doc.id]=doc.data();});
        generateSlots(data);
        updateCounts(data);
    });
}

// Tabs
function switchBuff(buff){
    currentBuff=buff;
    document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
    event.target.classList.add("active");
    loadSlots();
}

// Slots
function generateSlots(data){
    grid.innerHTML="";
    for(let h=0;h<24;h++){
        for(let m=0;m<60;m+=30){
            let utcTime=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
            let localDate=new Date();
            localDate.setUTCHours(h,m);
            let localTime=localDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            let id=currentBuff+"_"+utcTime;
            let div=document.createElement("div"); div.id=id;
            let slot=data[id];

            if(!bookingOpen){
                div.className="slot locked";
                div.innerHTML="<b>"+utcTime+" - "+padTime(h,m+30)+" UTC</b><br>"+localTime+"<br>🔒";
            }else if(!slot){
                div.className="slot available";
                div.innerHTML=`<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h,m+30)} UTC</span><span class='statusAvailable'>Available</span></div><div class='timeLocal'>${localTime}</div>`;
                div.onclick=()=>slotClicked(id,'available');
            }else{
                div.className="slot reserved";
                div.innerHTML=`<div class='timeRow'><span class='timeUTC'>${utcTime} - ${padTime(h,m+30)} UTC</span><span class='statusReserved'>Reserved</span></div>
                <div class='timeLocal'>${localTime}</div>
                <div class='bookingInfo'>${slot.alliance} - ${slot.player} (${slot.days} days)</div>
                <div class='rankingInfo'>Rank: ${slot.rank ? slot.rank : '-'}</div>`;
                div.onclick=()=>slotClicked(id,'reserved',slot);
            }
            grid.appendChild(div);
        }
    }
}

function padTime(h,m){if(m>=60){h+=1;m-=60;}if(h>=24) h-=24;return String(h).padStart(2,'0')+":"+String(m).padStart(2,'0');}

// Slot click
function slotClicked(slotId,type,slotData=null){
    document.querySelectorAll('.slot').forEach(el=>el.classList.remove('selected'));
    const div=document.getElementById(slotId); div.classList.add('selected');
    if(type==='available') openModal(slotId);
    else if(type==='reserved') openCancelModal(slotId,slotData);
}

// Booking modal
function openModal(id){selectedSlot=id;document.getElementById("modal").style.display="flex";}
function closeModal(){document.getElementById("modal").style.display="none";}
function confirmBooking(){
    let alliance=document.getElementById("alliance").value;
    let player=document.getElementById("player").value;
    let password=document.getElementById("password").value;
    let days=document.getElementById("daysSaved").value;
    db.collection("slots").doc(selectedSlot).set({alliance,player,password,days});
    closeModal();
}

// Cancel modal
let cancelSlot=null; let cancelData=null;
function openCancelModal(id,data){cancelSlot=id;cancelData=data;document.getElementById("cancelModal").style.display="flex";}
function closeCancelModal(){document.getElementById("cancelModal").style.display="none";}
function confirmCancel(){
    let inputPass=document.getElementById("cancelPassword").value;
    if(inputPass===cancelData.password){db.collection("slots").doc(cancelSlot).delete();closeCancelModal();}
    else alert("Password incorrect");
}

// Admin
function openAdmin(){document.getElementById("adminPanel").style.display="block";}
function closeAdmin(){document.getElementById("adminPanel").style.display="none";}
function adminLogin(){
    let pass=document.getElementById("adminPass").value;
    if(pass!==ADMIN_PASSWORD){alert("비밀번호 틀림"); return;}
    adminAuthenticated=true;
    document.getElementById("adminLogin").style.display="none";
    document.getElementById("adminControls").style.display="block";
}
function setBooking(state){
    if(!adminAuthenticated){alert("관리자 로그인 필요");return;}
    db.collection("settings").doc("booking").set({open:state});
}
function clearAll(){
    if(!adminAuthenticated){alert("관리자 로그인 필요");return;}
    if(!confirm("모든 예약 삭제?")) return;
    db.collection("slots").get().then(snapshot=>{snapshot.forEach(doc=>doc.ref.delete());});
}

// Counts
function updateCounts(data){
    let reserved=0;
    for(let key in data) if(key.startsWith(currentBuff)) reserved++;
    let total=48;
    document.getElementById("reservedCount").innerText="Reserved "+reserved;
    document.getElementById("availableCount").innerText="Available "+(total-reserved);
}

// Top Speed-ups
function loadSpeedups(){
    db.collection("speedups").orderBy("speed","desc").limit(6).onSnapshot(snapshot=>{
        const data=[]; snapshot.forEach(doc=>data.push(doc.data())); updateRanking(data);
    });
}
function updateRanking(speedups){
    const box=document.getElementById('rankingBox'); if(!box) return;
    box.innerHTML='<b>Top Speed-ups</b><div style="display:flex; justify-content:center; gap:20px; margin-top:4px;">'+
        '<div>'+speedups.slice(0,3).map((p,i)=>{const trophies=['🥇','🥈','🥉'];return `<div>${trophies[i]} ${p.name} (${p.speed})</div>`;}).join('')+'</div>'+
        '<div>'+speedups.slice(3,6).map((p,i)=>{const colors=['#a0d8f0','#90c8e0','#80b8d0']; return `<div style="display:inline-block;background:${colors[i]};border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;margin-bottom:2px;">${i+4}</div> ${p.name} (${p.speed})`;}).join('')+'</div>'+
        '</div>';
}
loadSpeedups();

// Snow
const canvas=document.getElementById("snow"); const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
let snowflakes=[]; for(let i=0;i<80;i++){ snowflakes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3+1,d:Math.random()+1});}
function drawSnow(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#a0d8ff";ctx.beginPath();for(let i=0;i<snowflakes.length;i++){let f=snowflakes[i];ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,f.r,0,Math.PI*2,true);}ctx.fill();moveSnow();}
function moveSnow(){for(let i=0;i<snowflakes.length;i++){let f=snowflakes[i];f.y+=Math.pow(f.d,2)+1;if(f.y>canvas.height){snowflakes[i]={x:Math.random()*canvas.width,y:0,r:f.r,d:f.d};}}}
setInterval(drawSnow,33);

// Default Monday
document.querySelectorAll(".tabs button")[0].classList.add("active");
