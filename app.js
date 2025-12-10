// DOM
const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const addPage = document.getElementById("addPage");

const loginPasswordInput = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

const FIXED_PASSWORD = "20250808";

// 顯示頁面
function showPage(pg) {
  loginPage.classList.add("hidden");
  mainPage.classList.add("hidden");
  addPage.classList.add("hidden");
  pg.classList.remove("hidden");
}

// 登入按鈕
loginBtn.onclick = () => {
  const pw = loginPasswordInput.value;
  if (pw === FIXED_PASSWORD) {
    loginError.classList.add("hidden");
    showPage(mainPage);
  } else {
    loginError.classList.remove("hidden");
  }
};

// 登出按鈕
logoutBtn.onclick = () => {
  loginPasswordInput.value = "";
  showPage(loginPage);
};

// 預設顯示登入頁
showPage(loginPage);

// TODO: 保留你原本的日曆、新增紀錄功能
