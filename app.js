// ===== Firebase 初始化 =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCaROQQYrURslG8NRbuxT2-tQIXxMLQ-W0",
  authDomain: "babyfoodapp-3422a.firebaseapp.com",
  projectId: "babyfoodapp-3422a",
  storageBucket: "babyfoodapp-3422a.firebasestorage.app",
  messagingSenderId: "40274639672",
  appId: "1:40274639672:web:fba3f7b56a558b24e51fcd",
  measurementId: "G-L2815BV781"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM 元素 =====
const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const addPage = document.getElementById("addPage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelAddBtn = document.getElementById("cancelAddBtn");

const calendarDiv = document.getElementById("calendar");
const currentMonthEl = document.getElementById("currentMonth");

const foodDate = document.getElementById("foodDate");
const foodCategory = document.getElementById("foodCategory");
const foodTexture = document.getElementById("foodTexture");
const foodAllergy = document.getElementById("foodAllergy");
const foodRating = document.getElementById("foodRating");

// ===== 登入 / 登出 =====
loginBtn.onclick = () => {
  const email = loginEmail.value;
  const password = loginPassword.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => { alert("登入成功！"); })
    .catch(err => alert("登入失敗：" + err.message));
};

logoutBtn.onclick = () => {
  signOut(auth);
};

// ===== 登入狀態監聽 =====
onAuthStateChanged(auth, user => {
  if(user){
    showPage(mainPage);
    loadCalendar();
  } else {
    showPage(loginPage);
  }
});

// ===== 顯示頁面 =====
function showPage(page){
  loginPage.classList.add("hidden");
  mainPage.classList.add("hidden");
  addPage.classList.add("hidden");
  page.classList.remove("hidden");
}

// ===== 日曆 =====
let today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

async function loadCalendar(){
  calendarDiv.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const days = new Date(currentYear, currentMonth +1, 0).getDate();

  currentMonthEl.textContent = `${currentYear} 年 ${currentMonth+1} 月`;

  // 取出紀錄
  const allRecords = await getDocs(query(collection(db, "foods")));
  const datesWithRecord = [];
  allRecords.forEach(doc => {
    datesWithRecord.push(doc.data().date);
  });

  for(let i=0; i<firstDay; i++){
    calendarDiv.innerHTML += "<div></div>";
  }

  for(let d=1; d<=days; d++){
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const cell = document.createElement("div");
    cell.textContent = d;
    if(datesWithRecord.includes(dateStr)) cell.classList.add("hasRecord");

    cell.onclick = () => {
      foodDate.value = dateStr;
      showPage(addPage);
    };
    calendarDiv.appendChild(cell);
  }
}

// ===== 新增紀錄按鈕 =====
addBtn.onclick = () => {
  foodDate.value = new Date().toISOString().split("T")[0];
  showPage(addPage);
};

// ===== 儲存紀錄 =====
saveBtn.onclick = async () => {
  if(!foodDate.value) { alert("請選擇日期"); return; }
  await addDoc(collection(db,"foods"),{
    date: foodDate.value,
    category: foodCategory.value,
    texture: foodTexture.value,
    allergy: foodAllergy.value || "無",
    rating: Number(foodRating.value),
    createdAt: Date.now()
  });
  alert("紀錄已儲存！");
  showPage(mainPage);
  loadCalendar();
};

// ===== 取消新增 =====
cancelAddBtn.onclick = () => showPage(mainPage);
