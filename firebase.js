const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "svs-booking-4a785.firebaseapp.com",
  projectId: "svs-booking-4a785",
  storageBucket: "svs-booking-4a785.firebasestorage.app",
  messagingSenderId: "815196694859",
  appId: "1:815196694859:web:eb39b55526841c248860ce"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.db = firebase.firestore();
