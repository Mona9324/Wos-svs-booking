let bookingLocked=true
db.collection("settings").doc("booking").onSnapshot(doc=>{

if(doc.exists){

bookingLocked=doc.data().locked

generateSlots()

}

})

let currentBuff="monday"
let selectedSlot=null

const ADMIN_PASSWORD="2737admin"

const DAY1_OPEN=new Date("2026-03-20T12:00:00Z")
const DAY2_OPEN=new Date("2026-03-21T12:00:00Z")

const svsDate=new Date("2026-03-23T00:00:00Z")

const grid=document.getElementById("slots")

function updateCountdown(){

let now=new Date()
let diff=svsDate-now

let d=Math.floor(diff/(1000*60*60*24))
let h=Math.floor((diff/(1000*60*60))%24)
let m=Math.floor((diff/(1000*60))%60)

document.getElementById("countdown").innerHTML=
"SVS begins in "+d+"d "+h+"h "+m+"m"

}

setInterval(updateCountdown,60000)
updateCountdown()

function switchBuff(buff){

currentBuff=buff
generateSlots()
updateCounts()

}

function generateSlots(){

grid.innerHTML=""

for(let h=0;h<24;h++){

for(let m=0;m<60;m+=30){

let time=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")

let id=currentBuff+"_"+time

let div=document.createElement("div")

let now=new Date()

let locked=false

if(currentBuff==="monday" && now<DAY1_OPEN) locked=true
if(currentBuff!=="monday" && now<DAY2_OPEN) locked=true

db.collection("slots").doc(id).onSnapshot(doc=>{

let data=doc.data()

if(locked){

div.className="slot locked"
div.innerHTML="<b>"+time+" UTC</b><br>🔒 Locked"

}else if(!data){

div.className="slot available"
div.innerHTML="<b>"+time+" UTC</b><br>Available"

div.onclick=()=>openModal(id)

}else{

div.className="slot reserved"
div.innerHTML="<b>"+time+" UTC</b><br>"+data.alliance+" - "+data.player

div.onclick=()=>cancelSlot(id,data.password)

}

})

grid.appendChild(div)

}

}

}

function openModal(id){

selectedSlot=id
document.getElementById("modal").style.display="flex"

}

function closeModal(){

document.getElementById("modal").style.display="none"

}

function confirmBooking(){

let alliance=document.getElementById("alliance").value
let player=document.getElementById("player").value
let password=document.getElementById("password").value

db.collection("slots").doc(selectedSlot).set({
alliance,
player,
password
})

closeModal()

}

function cancelSlot(id,password){

let pass=prompt("Enter password")

if(pass===ADMIN_PASSWORD){
db.collection("slots").doc(id).delete()
return
}

if(pass!==password){
alert("Wrong password")
return
}

db.collection("slots").doc(id).delete()

}

function adminLogin(){

let pass=prompt("Admin Password")

if(pass!==ADMIN_PASSWORD){

alert("Wrong Password")
return

}

let slot=prompt("Enter Slot ID to delete")

db.collection("slots").doc(slot).delete()

}

function updateCounts(){

db.collection("slots").onSnapshot(snapshot=>{

let reserved=0

snapshot.forEach(doc=>{

if(doc.id.startsWith(currentBuff)) reserved++

})

let total=48

document.getElementById("reservedCount").innerText=reserved
document.getElementById("availableCount").innerText=total-reserved

})

}

generateSlots()
updateCounts()

const canvas=document.getElementById("snow")
const ctx=canvas.getContext("2d")

canvas.width=window.innerWidth
canvas.height=window.innerHeight

let snow=[]

for(let i=0;i<120;i++){

snow.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
r:Math.random()*3,
d:Math.random()*1
})

}

function drawSnow(){

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.fillStyle="rgba(200,220,255,0.8)"

ctx.beginPath()

for(let i=0;i<snow.length;i++){

let f=snow[i]

ctx.moveTo(f.x,f.y)
ctx.arc(f.x,f.y,f.r,0,Math.PI*2)

}

ctx.fill()

snow.forEach(f=>{

f.y+=f.d

if(f.y>canvas.height){

f.y=0
f.x=Math.random()*canvas.width

}

})

}

setInterval(drawSnow,33)

function toggleLock(){

let pass=prompt("Admin Password")

if(pass!==ADMIN_PASSWORD){

alert("Wrong password")
return

}

bookingLocked=!bookingLocked

db.collection("settings").doc("booking").set({

locked:bookingLocked

})

}
