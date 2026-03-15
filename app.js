let currentBuff="monday"
let selectedSlot=null

const ADMIN_PASSWORD="2737admin"

let adminAuthenticated=false
let bookingOpen=false

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

db.collection("settings").doc("booking").onSnapshot(doc=>{

if(doc.exists){
bookingOpen=doc.data().open
}

loadSlots()

})

function loadSlots(){

db.collection("slots").onSnapshot(snapshot=>{

let data={}
snapshot.forEach(doc=>{
data[doc.id]=doc.data()
})

generateSlots(data)
updateCounts(data)

})

}

function switchBuff(buff){

currentBuff=buff
loadSlots()

}

function generateSlots(data){

grid.innerHTML=""

for(let h=0;h<24;h++){
for(let m=0;m<60;m+=30){

let time=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")

let id=currentBuff+"_"+time

let div=document.createElement("div")

let slot=data[id]

if(!bookingOpen){

div.className="slot locked"
div.innerHTML="<b>"+time+"</b><br>🔒 Locked"

}else if(!slot){

div.className="slot available"
div.innerHTML="<b>"+time+"</b><br>Available"

div.onclick=()=>openModal(id)

}else{

div.className="slot reserved"

div.innerHTML="<b>"+time+"</b><br>"+slot.alliance+" - "+slot.player

div.title="Alliance: "+slot.alliance+"\nPlayer: "+slot.player

}

grid.appendChild(div)

}
}

}

function updateCounts(data){

let reserved=0

for(let key in data){
if(key.startsWith(currentBuff)) reserved++
}

let total=48

document.getElementById("reservedCount").innerText=reserved
document.getElementById("availableCount").innerText=total-reserved

}

function openModal(id){

selectedSlot=id
document.getElementById("modal").style.display="flex"

}

function closeModal(){

document.getElementById("modal").style.display="none"

}

function getMinDaysRequired(){

let now=new Date()
let diff=(svsDate-now)/(1000*60*60*24)

if(diff<=1) return 0
if(diff<=2) return 15
if(diff<=3) return 30

return 999

}

function confirmBooking(){

let alliance=document.getElementById("alliance").value
let player=document.getElementById("player").value
let password=document.getElementById("password").value
let days=parseInt(document.getElementById("Speed-up").value)

let required=getMinDaysRequired()

if(days<required){

alert("You need "+required+" days saved")

return

}

let slotName=selectedSlot.split("_")[1]

let text=
slotName+" UTC\n"+
alliance+" - "+player

document.getElementById("copyText").innerText=text

document.getElementById("copyBox").style.display="block"

db.collection("slots").doc(selectedSlot).set({

alliance,
player,
password

})

closeModal()

}

function copyDiscord(){

let text=document.getElementById("copyText").innerText

navigator.clipboard.writeText(text)

alert("Copied for Discord")

}

function openAdmin(){

document.getElementById("adminPanel").style.display="block"

}

function closeAdmin(){

document.getElementById("adminPanel").style.display="none"

}

function adminLogin(){

let pass=document.getElementById("adminPass").value

if(pass!==ADMIN_PASSWORD){

alert("Wrong password")
return

}

adminAuthenticated=true

document.getElementById("adminLogin").style.display="none"
document.getElementById("adminControls").style.display="block"

}

function setBooking(state){

if(!adminAuthenticated){
alert("Admin login required")
return
}

db.collection("settings").doc("booking").set({
open:state
})

}

function clearAll(){

if(!adminAuthenticated){
alert("Admin login required")
return
}

if(!confirm("Delete ALL bookings?")) return

db.collection("slots").get().then(snapshot=>{

snapshot.forEach(doc=>{
doc.ref.delete()
})

})

}
