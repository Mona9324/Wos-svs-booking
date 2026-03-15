let currentBuff="construction"
let selectedSlot=null

const ADMIN_PASSWORD="2737admin"

const grid=document.getElementById("slots")

const svsDate=new Date("2026-03-23T00:00:00Z")

function updateCountdown(){

let now=new Date()

let diff=svsDate-now

if(diff<0){

document.getElementById("countdown").innerHTML="SVS Started!"
return

}

let d=Math.floor(diff/(1000*60*60*24))
let h=Math.floor((diff/(1000*60*60))%24)
let m=Math.floor((diff/(1000*60))%60)

document.getElementById("countdown").innerHTML=
"SVS begins in "+d+"d "+h+"h "+m+"m"

}

setInterval(updateCountdown,60000)
updateCountdown()

function generateSlots(){

grid.innerHTML=""

for(let h=0;h<24;h++){

for(let m=0;m<60;m+=30){

let time=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")

let id=currentBuff+"_"+time

let div=document.createElement("div")

let utcDate=new Date()
utcDate.setUTCHours(h)
utcDate.setUTCMinutes(m)

let local=utcDate.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit'
})

db.collection("slots").doc(id).onSnapshot(doc=>{

let data=doc.data()

if(!data){

div.className="slot available"

div.innerHTML="<b>"+time+" UTC</b><br>"+local+" Local<br>Available"

div.onclick=()=>openModal(id)

}else{

div.className="slot reserved"

div.innerHTML="<b>"+time+" UTC</b><br>"+local+" Local<br>"+data.alliance+" - "+data.player

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

function updateStats(){

db.collection("slots").onSnapshot(snapshot=>{

let counts={}

snapshot.forEach(doc=>{

let data=doc.data()

if(!counts[data.alliance]){
counts[data.alliance]=0
}

counts[data.alliance]++

})

let html=""

for(let a in counts){
html+=a+" : "+counts[a]+" slots<br>"
}

document.getElementById("stats").innerHTML=html

})

}

function updateCounts(){

db.collection("slots").onSnapshot(snapshot=>{

let reserved=snapshot.size
let total=48
let available=total-reserved

document.getElementById("reservedCount").innerText=available
document.getElementById("availableCount").innerText=reserved

})

}

generateSlots()
updateStats()
updateCounts()
