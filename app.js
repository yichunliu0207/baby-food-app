import { initializeApp } from "https://www.gstatic.com/firebasejs/10.17.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.17.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

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
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  window.firebaseDB = db;

  /* ===== DOM ===== */
  const loginPage = document.getElementById('loginPage');
  const calendarPage = document.getElementById('calendarPage');
  const detailPage = document.getElementById('detailPage');

  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');

  const FIXED_PASSWORD = "0808";

  // 登入事件
  loginBtn.addEventListener('click', () => {
    const pw = (loginPassword.value || '').trim();
    if (pw === FIXED_PASSWORD) {
      loginError.classList.add('hidden');
      alert('登入成功');
      loginPage.classList.remove('active');
      calendarPage.classList.add('active');
    } else {
      loginError.classList.remove('hidden');
    }
  });

  loginPassword.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // 你可以在這裡繼續加上日曆和詳細紀錄功能
  // 現在登入已經可以正常使用
});
