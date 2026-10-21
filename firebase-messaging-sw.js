importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAQ7ZLQijLmy6CdVCO9rfWqX2HdvR4oXA4",
  authDomain: "aisyarah--space.firebaseapp.com",
  databaseURL: "https://aisyarah--space-default-rtdb.firebaseio.com",
  projectId: "aisyarah--space",
  storageBucket: "aisyarah--space.firebasestorage.app",
  messagingSenderId: "710773966476",
  appId: "1:710773966476:web:f1a96947769d8374d35da9",
  measurementId: "G-RQ9E2M5KBF"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Aisyarah Space";
  const options = {
    body: payload.notification?.body || "Ada sesuatu yang baru ♡",
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  };

  self.registration.showNotification(title, options);
});
