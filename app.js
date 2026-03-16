let currentBuff="monday";
let selectedSlot=null;
let cancelSlot=null;
const ADMIN_PASSWORD="2737admin";
const grid=document.getElementById("slots");
const svsDate=new Date("2026-03-23T00:00:00Z");
let bookingOpen=false;

// ==================== SVS COUNTDOWN ====================
function updateCountdown(){
    let now=new Date();
    let diff=svsDate-now;
    if(diff<0){document.getElementById("countdown").innerText="SVS has started!"; return;}
    let d=Math.floor(diff/(1000*60*60*24));
    let h=Math.floor((diff/(1000*60*60))%24);
    let m=Math.floor((diff/(1000*60))%60);
    document.getElementById("countdown").innerText="SVS begins in "+d+"d "+h+"h "+m+"m";
}
setInterval(updateCountdown,60000);
updateCountdown();

// ==================== FIRESTORE SETTINGS LISTENER ====================
db.collection("settings").doc("booking").onSnapshot(doc=>{
    if(doc.exists){
        bookingOpen=doc.data().open;
        loadSlots();
    }
});

// ==================== LOAD SLOTS ====================
function loadSlots(){
    db.collection("slots").onSnapshot(snapshot=>{
        let data={};
        snapshot.forEach(doc=>{data[doc.id]=doc.data()});
        generateSlots(data);
        updateCounts(data);
        updateRanking(data);
    });
}

// ==================== SWITCH BUFF ====================
function switchBuff(buff){
    currentBuff=buff;
    document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
    document.querySelector(`.tabs button[onclick="switchBuff('${buff}')"]`).classList.add("active");
    loadSlots();
}

// ==================== GENERATE SLOTS ====================
function generateSlots(data){
    grid.innerHTML="";
    for(let h=0;h<24;h++){
        for(let m=0;m<60;m+=30){
            let startUTC=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
            let endM=m+30,endH=h;if(endM==60){endM=0;endH++;}
            let endUTC=String(endH).padStart(2,"0")+":"+String(endM).padStart(2,"0");
            let localStart=new Date(); localStart.setUTCHours(h,m);
            let localEnd=new Date(); localEnd.setUTCHours(endH,endM);
            let localStartStr=localStart.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            let localEndStr=localEnd.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            let id=currentBuff+"_"+startUTC;
            let div=document.createElement("div");
            let slot=data[id];
            div.classList.remove("selected");

            if(!bookingOpen){
                div.className="slot locked";
                div.innerHTML="<div class='timeRow'><div class='timeUTC'>"+startUTC+" - "+endUTC+" UTC</div><div class='statusReserved'>Locked</div></div><div class='timeLocal'>"+localStartStr+" - "+localEndStr+"</div>";
            } else if(!slot){
                div.className="slot available";
                div.innerHTML="<div class='timeRow'><div class='timeUTC'>"+startUTC+" - "+endUTC+" UTC</div><div class='statusAvailable'>Available</div></div><div class='timeLocal'>"+localStartStr+" - "+localEndStr+"</div>";
                div.onclick=()=>{openModal(id); highlightSlot(div);}
            } else{
                div.className="slot reserved";
                div.innerHTML="<div class='timeRow'><div class='timeUTC'>"+startUTC+" - "+endUTC+" UTC</div><div class='statusReserved'>Reserved</div></div><div class='timeLocal'>"+localStartStr+" - "+localEndStr+"</div><div class='bookingInfo'>["+slot.alliance+"] "+slot.player+" ("+slot.days+")</div>";
                div.onclick=()=>{openCancelModal(id); highlightSlot(div);}
            }
            grid.appendChild(div);
        }
    }
}

function highlightSlot(div){
    document.querySelectorAll(".slot").forEach(s=>s.classList.remove("selected"));
    div.classList.add("selected");
}

// ==================== COUNTS ====================
function updateCounts(data){
    let reserved=0;
    for(let key in data){ if(key.startsWith(currentBuff)) reserved++; }
    let total=48;
    let r=document.getElementById("reservedCount"); let a=document.getElementById("availableCount");
    if(r) r.innerText="Reserved "+reserved;
    if(a) a.innerText="Available "+(total-reserved);
}

// ==================== TOP SPEED-UPS ====================
function updateRanking(data){
    let list=[];
    for(let key in data){
        if(!key.startsWith(currentBuff)) continue;
        let slot=data[key];
        let days=parseInt(slot.days);
        if(!isNaN(days)) list.push({alliance:slot.alliance,player:slot.player,days:days});
    }
    list.sort((a,b)=>b.days-a.days);
    let leftHTML="", rightHTML="";
    for(let i=0;i<list.length&&i<6;i++){
        let p=list[i];
        let medal="";
        if(i==0) medal="🥇";
        else if(i==1) medal="🥈";
        else if(i==2) medal="🥉";
        else medal="<span style='display:inline-block;width:20px;height:20px;border-radius:50%;background:#a0e7ff;color:white;text-align:center;font-size:12px;margin-right:2px;'>"+(i+1)+"</span>";
        if(i<3) leftHTML+=medal+" ["+p.alliance+"] "+p.player+" ("+p.days+")<br>";
        else rightHTML+=medal+" ["+p.alliance+"] "+p.player+" ("+p.days+")<br>";
    }
    let el=document.getElementById("ranking");
    if(el) el.innerHTML="<div style='float:left'>"+leftHTML+"</div><div style='float:right'>"+rightHTML+"</div>";
}

// ==================== BOOKING ====================
function openModal(id){selectedSlot=id; document.getElementById("modal").style.display="flex";}
function closeModal(){document.getElementById("modal").style.display="none";}
function confirmBooking(){
    let alliance=document.getElementById("alliance").value.toUpperCase();
    let player=document.getElementById("player").value;
    let password=document.getElementById("password").value;
    let days=document.getElementById("daysSaved").value;
    if(!alliance||!player||!password){alert("Please fill all fields"); return;}
    db.collection("slots").doc(selectedSlot).set({alliance,player,password,days});
    closeModal();
}

// ==================== CANCEL ====================
function openCancelModal(id){cancelSlot=id; document.getElementById("cancelPassword").value=""; document.getElementById("cancelModal").style.display="flex";}
function closeCancelModal(){document.getElementById("cancelModal").style.display="none";}
function confirmCancel(){
    let pass=document.getElementById("cancelPassword").value;
    db.collection("slots").doc(cancelSlot).get().then(doc=>{
        if(!doc.exists) return;
        let data=doc.data();
        if(pass!==data.password){alert("Wrong password"); return;}
        db.collection("slots").doc(cancelSlot).delete();
        closeCancelModal();
    });
}

// ==================== ADMIN ====================
function openAdmin(){document.getElementById("adminPanel").style.display="block";}
function closeAdmin(){document.getElementById("adminPanel").style.display="none";}
function adminLogin(){
    let pass=document.getElementById("adminPass").value;
    if(pass!==ADMIN_PASSWORD){alert("비밀번호 틀림"); return;}
    document.getElementById("adminLogin").style.display="none";
    document.getElementById("adminControls").style.display="block";
}
function setBooking(state){db.collection("settings").doc("booking").set({open:state}); bookingOpen=state;}
function clearAll(){if(!confirm("모든 예약 삭제?")) return; db.collection("slots").get().then(snapshot=>snapshot.forEach(doc=>doc.ref.delete()));}

// ==================== SNOW ====================
const canvas=document.getElementById("snow");
const ctx=canvas.getContext("2d");
function resizeSnow(){canvas.width=window.innerWidth; canvas.height=window.innerHeight;}
resizeSnow(); window.addEventListener("resize",resizeSnow);
let snowflakes=[];
for(let i=0;i<100;i++){snowflakes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3+1,d:Math.random()+1});}
function drawSnow(){ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#cfe8ff"; ctx.beginPath(); for(let f of snowflakes){ctx.moveTo(f.x,f.y); ctx.arc(f.x,f.y,f.r,0,Math.PI*2,true);} ctx.fill(); moveSnow();}
function moveSnow(){for(let i=0;i<snowflakes.length;i++){let f=snowflakes[i]; f.y+=Math.pow(f.d,2)+1; if(f.y>canvas.height){snowflakes[i]={x:Math.random()*canvas.width,y:0,r:f.r,d:f.d};}}}
setInterval(drawSnow,30);
