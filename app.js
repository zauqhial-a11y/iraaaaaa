import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQ7ZLQijLmy6CdVCO9rfWqX2HdvR4oXA4",
  authDomain: "aisyarah--space.firebaseapp.com",
  databaseURL: "https://aisyarah--space-default-rtdb.firebaseio.com",
  projectId: "aisyarah--space",
  storageBucket: "aisyarah--space.firebasestorage.app",
  messagingSenderId: "710773966476",
  appId: "1:710773966476:web:f1a96947769d8374d35da9",
  measurementId: "G-RQ9E2M5KBF"
};

// Public VAPID key from Firebase Cloud Messaging > Web Push certificates
const VAPID_KEY = "BF4BGMgj4icb_SjyXUE_Zey_so0Lmip3ur3kmV1r0uaGG59tqlRE3TCp6iEdLTa5rCwYx2UdWGHdY4CVjRAEcRo";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let currentUser = localStorage.getItem("aisyarah_user") || "";
let db = null;
let messaging = null;

function toast(message){
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("toast-show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("toast-show"), 2300);
}

function firebaseReady(){
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_API_KEY";
}

function setConnection(online, text){
  const el = $("#connectionStatus");
  el.classList.toggle("online", online);
  el.querySelector("span").textContent = text;
}

async function setupNotifications(app, auth){
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("Browser tidak mendukung Web Push.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast("Notif belum diizinkan di browser.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      toast("Token notif belum tersedia.");
      return;
    }

    // Simpan token perangkat yang sedang dipakai.
    await set(ref(db, `aisyarah_space/fcmTokens/${auth.currentUser.uid}`), {
      token,
      by: currentUser,
      updatedAt: Date.now()
    });

    onMessage(messaging, payload => {
      const title = payload.notification?.title || "Aisyarah Space";
      const body = payload.notification?.body || "Ada sesuatu yang baru ♡";
      toast(`${title}: ${body}`);

      // Saat aplikasi sedang terbuka, tampilkan juga notif browser.
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "./icon-192.png"
        });
      }
    });

    console.log("FCM aktif. Token tersimpan.");
    toast("Notifikasi berhasil diaktifkan 🔔");
  } catch (error) {
    console.error("FCM error:", error);
    toast("Notif gagal diaktifkan. Cek izin browser.");
  }
}

async function initFirebase(){
  if(!firebaseReady()){
    setConnection(false, "Firebase belum dipasang");
    toast("Firebase belum dipasang. Isi firebaseConfig di app.js.");
    return;
  }

  try{
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getDatabase(app);
    await signInAnonymously(auth);
    setConnection(true, "tersambung");
    bindSharedData();
    await setupNotifications(app, auth);
  }catch(error){
    console.error(error);
    setConnection(false, "koneksi gagal");
    toast("Firebase gagal tersambung. Cek config, Anonymous Auth, dan Database Rules.");
  }
}

function bindSharedData(){
  onValue(ref(db, "aisyarah_space/moods"), snap => renderMoods(snap.val() || {}));
  onValue(ref(db, "aisyarah_space/notes"), snap => renderNotes(snap.val() || {}));
  onValue(ref(db, "aisyarah_space/memories"), snap => renderMemories(snap.val() || {}));
  onValue(ref(db, "aisyarah_space/plans"), snap => renderPlans(snap.val() || {}));
}

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c] || c));
}

function dateTime(ms){
  return new Date(ms).toLocaleString("id-ID", {dateStyle:"medium", timeStyle:"short"});
}

function dateOnly(ms){
  return new Date(ms).toLocaleDateString("id-ID", {dateStyle:"medium"});
}

function renderMoods(data){
  const items = Object.values(data).sort((a,b)=>(b.time||0)-(a.time||0));
  $("#moodList").innerHTML = items.length
    ? items.slice(0,20).map(x => `
      <div class="item">
        <span>${esc(x.emoji)} <b>${esc(x.mood)}</b> — ${esc(x.by)}</span>
        <small>${dateTime(x.time)}</small>
      </div>`).join("")
    : `<div class="empty">Belum ada mood.</div>`;

  const latest = items[0];
  $("#latestMood").innerHTML = latest
    ? `${esc(latest.emoji)} <b>${esc(latest.by)}</b> lagi <b>${esc(latest.mood)}</b>`
    : "Belum ada mood.";
}

function renderNotes(data){
  const items = Object.values(data).sort((a,b)=>(b.time||0)-(a.time||0));
  $("#noteList").innerHTML = items.length
    ? items.map(x => `
      <article class="note">
        <div class="from">Ditulis oleh ${esc(x.by)}</div>
        <p>${esc(x.text)}</p>
        <small>${dateTime(x.time)}</small>
      </article>`).join("")
    : `<div class="empty">Belum ada surat. Mungkin sekarang waktunya menulis satu. ♡</div>`;

  const latest = items[0];
  $("#latestNote").textContent = latest
    ? `${latest.by}: “${latest.text.slice(0,90)}${latest.text.length>90?"…":""}”`
    : "Belum ada surat.";
}

function renderMemories(data){
  const items = Object.values(data).sort((a,b)=>(b.time||0)-(a.time||0));
  $("#memoryList").innerHTML = items.length
    ? items.map(x => `
      <article class="memory">
        <small>${esc(x.by)} · ${dateOnly(x.time)}</small>
        <h4>${esc(x.title)}</h4>
        <p>${esc(x.text)}</p>
      </article>`).join("")
    : `<div class="empty">Belum ada kenangan yang disimpan.</div>`;
}

function renderPlans(data){
  const entries = Object.entries(data).sort(([,a],[,b])=>(a.time||0)-(b.time||0));
  $("#planList").innerHTML = entries.length
    ? entries.map(([id,x]) => `
      <div class="plan ${x.done ? "done" : ""}">
        <button class="check" data-plan="${esc(id)}">${x.done ? "✓" : ""}</button>
        <span>${esc(x.text)}</span>
      </div>`).join("")
    : `<div class="empty">Belum ada rencana. Tambahkan satu. ✦</div>`;

  $$(".check").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.plan;
      const item = data[id];
      if(item) togglePlan(id, item);
    };
  });
}

async function save(path, data){
  if(!db){
    toast("Database belum tersambung.");
    return;
  }
  try{
    await push(ref(db, path), data);
    toast("Tersimpan untuk kita ♡");
  }catch(error){
    console.error(error);
    toast("Gagal menyimpan. Cek Firebase Rules.");
  }
}

async function togglePlan(id, item){
  if(!db) return toast("Database belum tersambung.");
  try{
    await set(ref(db, `aisyarah_space/plans/${id}`), {...item, done: !item.done});
  }catch(error){
    console.error(error);
    toast("Gagal mengubah rencana.");
  }
}

function enterAs(name){
  currentUser = name;
  localStorage.setItem("aisyarah_user", name);
  $("#welcome").classList.add("hidden");
  $("#roleName").textContent = name;
  $("#greeting").textContent = `Untuk ${name} ♡`;
  initFirebase();
}

$$(".who button").forEach(btn => btn.addEventListener("click", () => enterAs(btn.dataset.user)));

if(currentUser){
  $("#welcome").classList.add("hidden");
  $("#roleName").textContent = currentUser;
  $("#greeting").textContent = `Untuk ${currentUser} ♡`;
  initFirebase();
}

$$(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".nav").forEach(n => n.classList.remove("active"));
    btn.classList.add("active");
    $$(".page").forEach(p => p.classList.remove("active"));
    $("#" + btn.dataset.page).classList.add("active");
    $("#pageTitle").textContent = btn.querySelector("span:last-child").textContent;
    window.scrollTo({top:0, behavior:"smooth"});
  });
});

$$("#moodPicker button").forEach(btn => {
  btn.addEventListener("click", () => {
    const emoji = btn.textContent.trim().split(" ")[0];
    save("aisyarah_space/moods", {
      mood: btn.dataset.mood,
      emoji,
      by: currentUser,
      time: Date.now()
    });
  });
});

$("#noteText").addEventListener("input", e => {
  $("#noteCount").textContent = `${e.target.value.length}/500`;
});

$("#sendNote").addEventListener("click", () => {
  const text = $("#noteText").value.trim();
  if(!text) return toast("Tulis suratnya dulu ♡");
  save("aisyarah_space/notes", {text, by:currentUser, time:Date.now()});
  $("#noteText").value = "";
  $("#noteCount").textContent = "0/500";
});

$("#addMemory").addEventListener("click", () => {
  const title = $("#memoryTitle").value.trim();
  const text = $("#memoryText").value.trim();
  if(!title || !text) return toast("Isi judul dan ceritanya dulu.");
  save("aisyarah_space/memories", {title, text, by:currentUser, time:Date.now()});
  $("#memoryTitle").value = "";
  $("#memoryText").value = "";
});

$("#addPlan").addEventListener("click", () => {
  const text = $("#planText").value.trim();
  if(!text) return toast("Tulis rencananya dulu.");
  save("aisyarah_space/plans", {text, by:currentUser, time:Date.now(), done:false});
  $("#planText").value = "";
});
