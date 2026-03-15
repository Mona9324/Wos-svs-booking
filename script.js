// firebase config

const firebaseConfig = {

apiKey: "AIzaSyD-ctq-wOobkLAQtGb7keGIOQZBiH05f5M",
  authDomain: "wos-svs-booking.firebaseapp.com",
  databaseURL: "https://wos-svs-booking-default-rtdb.firebaseio.com",
  projectId: "wos-svs-booking",
  storageBucket: "wos-svs-booking.firebasestorage.app",
  messagingSenderId: "549903983993",
  appId: "1:549903983993:web:88211254094f0036c57ba8"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const grid = document.getElementById("grid");

const slotCount = 16;



// 슬롯 생성

for(let i=1;i<=slotCount;i++){

const div = document.createElement("div");

div.className="slot available";

div.dataset.slot=i;

div.innerText="Slot "+i;

grid.appendChild(div);

}



// 클릭 이벤트

document.querySelectorAll(".slot").forEach(slot=>{

slot.addEventListener("click",()=>{

const id = slot.dataset.slot;

db.ref("slots/"+id).once("value",snapshot=>{

const data = snapshot.val();


// 이미 예약됨

if(data){

const password = prompt("Enter password to cancel");

if(password===data.password){

db.ref("slots/"+id).remove();

}else{

alert("Wrong password");

}

}

// 예약

else{

const name = prompt("Name");

if(!name)return;

const alliance = prompt("Alliance");

if(!alliance)return;

const password = prompt("Set password");

if(!password)return;

db.ref("slots/"+id).set({

name:name,

alliance:alliance,

password:password

});

}

});

});

});




// 실시간 업데이트

db.ref("slots").on("value",snapshot=>{

document.querySelectorAll(".slot").forEach(slot=>{

const id = slot.dataset.slot;

const data = snapshot.child(id).val();

if(data){

slot.classList.remove("available");

slot.classList.add("booked");

slot.innerHTML=

data.name+"<br>"+data.alliance;

}

else{

slot.classList.remove("booked");

slot.classList.add("available");

slot.innerText="Slot "+id;

}

});

});
