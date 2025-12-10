// Firebase 初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
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

// DOM
const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const addPage = document.getElementById("addPage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
// 新增註冊按鈕 (若你有 UI)
// const signUpBtn = document.getElementById("signUpBtn");
const logoutBtn = document.getElementById("logoutBtn");

// 監聽登入狀態
onAuthStateChanged(auth, user => {
  if (user) {
    showPage(mainPage);
    loadCalendar();
  } else {
    showPage(loginPage);
  }
});

loginBtn.onclick = () => {
  const email = loginEmail.value;
  const pw = loginPassword.value;
  if (!email || !pw) { alert("請輸入 Email 和密碼"); return; }

  signInWithEmailAndPassword(auth, email, pw)
    .then(() => {
      console.log("登入成功");
    })
    .catch(err => {
      // 若登入失敗，可提示是否要註冊
      if (confirm("登入失敗，是否建立新帳號？")) {
        createUserWithEmailAndPassword(auth, email, pw)
          .then(() => {
            alert("已建立帳號並登入");
          })
          .catch(e => alert("建立帳號失敗："+ e.message));
      } else {
        alert("登入失敗："+ err.message);
      }
    });
};

logoutBtn.onclick = () => {
  signOut(auth);
};

// 顯示頁面
function showPage(pg) {
  loginPage.classList.add("hidden");
  mainPage.classList.add("hidden");
  addPage.classList.add("hidden");
  pg.classList.remove("hidden");
}

// 以下日曆、新增紀錄、Firestore 儲存略 — 可保留你原本程式
