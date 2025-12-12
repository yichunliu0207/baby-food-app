// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config（你提供的設定）
const firebaseConfig = {
  apiKey: "AIzaSyCaROQQYrURslG8NRbuxT2-tQIXxMLQ-W0",
  authDomain: "babyfoodapp-3422a.firebaseapp.com",
  projectId: "babyfoodapp-3422a",
  storageBucket: "babyfoodapp-3422a.firebasestorage.app",
  messagingSenderId: "40274639672",
  appId: "1:40274639672:web:fba3f7b56a558b24e51fcd",
  measurementId: "G-L2815BV781"
};

// Init firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------------------
// 1. 登入邏輯
// ------------------------
document.getElementById("loginBtn").addEventListener("click", function () {
  const input = document.getElementById("password").value;
  if (input === "0808") {
    alert("登入成功");
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("calendarPage").style.display = "block";
    loadCalendar();
  } else {
    alert("密碼錯誤，請重新輸入");
  }
});

// ------------------------
// 2. 產生日曆
// ------------------------
let current = new Date();
let selectedDate = null;

function loadCalendar() {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  document.getElementById("monthLabel").textContent = `${year} / ${month + 1}`;

  const calendar = document.getElementById("calendarDays");
  calendar.innerHTML = "";

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div class="empty"></div>`;
  }

  for (let d = 1; d <= days; d++) {
    const fullDate = `${year}-${month + 1}-${d}`;

    const dayBox = document.createElement("div");
    dayBox.classList.add("day");
    dayBox.innerHTML = `
      <span class="dateNum">${d}</span>
      <div class="foodList" id="food-${fullDate}"></div>
    `;

    dayBox.addEventListener("click", () => openEditor(fullDate));
    calendar.appendChild(dayBox);

    loadDailyData(fullDate);
  }
}

// 上 / 下 月
document.getElementById("prevMonth").addEventListener("click", () => {
  current.setMonth(current.getMonth() - 1);
  loadCalendar();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  current.setMonth(current.getMonth() + 1);
  loadCalendar();
});

// ------------------------
// 3. 開啟內頁編輯
// ------------------------
async function openEditor(dateKey) {
  selectedDate = dateKey;

  document.getElementById("calendarPage").style.display = "none";
  document.getElementById("editPage").style.display = "block";
  document.getElementById("editDateTitle").textContent = dateKey;

  // 讀取 Firestore
  const ref = doc(db, "babyFood", dateKey);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    document.getElementById("foodInput").value = snap.data().food || "";
    document.getElementById("allergyCheck").checked = snap.data().allergy || false;
  } else {
    document.getElementById("foodInput").value = "";
    document.getElementById("allergyCheck").checked = false;
  }
}

// ------------------------
// 4. 儲存到 Firestore
// ------------------------
document.getElementById("saveBtn").addEventListener("click", async () => {
  const food = document.getElementById("foodInput").value.trim();
  const allergy = document.getElementById("allergyCheck").checked;

  if (!selectedDate) return;

  await setDoc(doc(db, "babyFood", selectedDate), {
    food: food,
    allergy: allergy
  });

  alert("已儲存");

  document.getElementById("editPage").style.display = "none";
  document.getElementById("calendarPage").style.display = "block";

  loadCalendar();
});

// 返回
document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("editPage").style.display = "none";
  document.getElementById("calendarPage").style.display = "block";
});

// ------------------------
// 5. 讀取每日資料並顯示在日曆中
// ------------------------
async function loadDailyData(dateKey) {
  const ref = doc(db, "babyFood", dateKey);
  const snap = await getDoc(ref);

  const div = document.getElementById(`food-${dateKey}`);
  if (!div) return;

  if (snap.exists()) {
    const data = snap.data();
    let label = data.food;

    if (data.allergy) {
      label = `<span style="color:red;">${label} ⚠️</span>`;
    }
    div.innerHTML = label;
  } else {
    div.innerHTML = "";
  }
}
