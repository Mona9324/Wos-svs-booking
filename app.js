const allianceColors={}

const colorList=[
"#9db4ff",
"#ffb6b6",
"#ffd6a5",
"#caffbf",
"#bdb2ff",
"#ffc6ff"
]

function getAllianceColor(tag){

if(!allianceColors[tag]){

let color=getAllianceColor(data.alliance)

div.innerHTML=`<b>${time} UTC</b>
<br>${local} Local
<br><span style="color:${color}">[${data.alliance}]</span> ${data.player}`

}

return allianceColors[tag]

}


let currentBuff="construction"

const grid=document.getElementById("slots")

const svsDate=new Date("2030-03-23T00:00:00Z")

let selectedSlot=null

function countdown(){

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
`SVS begins in ${d}d ${h}h ${m}m`

}

setInterval(countdown,60000)
countdown()

function generateSlots(){

grid.innerHTML=""

for(let h=0;h<24;h++){

for(let m=0;m<60;m+=30){

let time=
String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")
let utcDate = new Date()
utcDate.setUTCHours(h)
utcDate.setUTCMinutes(m)

let local = utcDate.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit'
})

  
let id=currentBuff+"_"+time

let div=document.createElement("div")

db.collection("slots").doc(id).onSnapshot(doc=>{

let data=doc.data()

if(!data){

div.className="slot available"

div.innerHTML=`<b>${time} UTC</b><br>${local} Local<br>Available`

div.onclick=()=>openModal(id)

}else{

div.className="slot reserved"

div.innerHTML=`<b>${time} UTC</b><br>${local} Local<br>[${data.alliance}] ${data.player}`

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

let pass=prompt("Cancel password")

if(pass!==password){

alert("Wrong password")
return

}

db.collection("slots").doc(id).delete()

}

function switchBuff(buff){

currentBuff=buff
generateSlots()

}

const canvas=document.getElementById("snow")
const ctx=canvas.getContext("2d")

canvas.width=window.innerWidth
canvas.height=window.innerHeight

let snowflakes=[]

for(let i=0;i<100;i++){
snowflakes.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
r:Math.random()*3+1,
d:Math.random()*1
})
}

function drawSnow(){

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.fillStyle="white"
ctx.beginPath()

for(let i=0;i<snowflakes.length;i++){

let f=snowflakes[i]

ctx.moveTo(f.x,f.y)
ctx.arc(f.x,f.y,f.r,0,Math.PI*2,true)

}

ctx.fill()
moveSnow()

}

function moveSnow(){

for(let i=0;i<snowflakes.length;i++){

let f=snowflakes[i]

f.y+=f.d
f.x+=Math.sin(f.y*0.01)

if(f.y>canvas.height){
f.y=0
f.x=Math.random()*canvas.width
}

}

}

setInterval(drawSnow,33)

generateSlots()
