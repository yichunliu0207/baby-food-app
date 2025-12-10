// Firebase 初始化
const firebaseConfig = {
  apiKey: "AIzaSyCaROQQYrURslG8NRbuxT2-tQIXxMLQ-W0",
  authDomain: "babyfoodapp-3422a.firebaseapp.com",
  projectId: "babyfoodapp-3422a",
  storageBucket: "babyfoodapp-3422a.firebasestorage.app",
  messagingSenderId: "40274639672",
  appId: "1:40274639672:web:fba3f7b56a558b24e51fcd",
  measurementId: "G-L2815BV781"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM
const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const addPage = document.getElementById("addPage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// 監聽登入狀態
auth.onAuthStateChanged(user => {
  if(user){
    showPage(mainPage);
    // TODO: load calendar
  }else{
    showPage(loginPage);
  }
});

loginBtn.onclick = () => {
  const email = loginEmail.value;
  const pw = loginPassword.value;
  if(!email || !pw){ alert("請輸入 Email 和密碼"); return; }

  auth.signInWithEmailAndPassword(email,pw)
  .then(()=>{ console.log("登入成功"); })
  .catch(err=>{
    // 若登入失敗 → 建立帳號
    if(confirm("登入失敗，要建立帳號嗎？")){
      auth.createUserWithEmailAndPassword(email,pw)
      .then(()=>alert("已建立帳號並登入"))
      .catch(e=>alert("建立帳號失敗: "+e.message));
    }else{
      alert("登入失敗: "+err.message);
    }
  });
};

logoutBtn.onclick = () => { auth.signOut(); };

// 顯示頁面
function showPage(pg){
  loginPage.classList.add("hidden");
  mainPage.classList.add("hidden");
  addPage.classList.add("hidden");
  pg.classList.remove("hidden");
}

// TODO: 日曆 / 新增紀錄功能可保留你原本邏輯
