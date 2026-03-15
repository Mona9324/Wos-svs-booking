let currentBuff="construction"

const grid=document.getElementById("slots")

const svsDate=new Date("2026-03-23T00:00:00Z")

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

let div=document.createElement("div")

div.className="slot"

div.innerHTML=`<b>${time} UTC</b> <br>Available`

grid.appendChild(div)

}

}

}

function switchBuff(buff){

currentBuff=buff
generateSlots()

}

generateSlots()
