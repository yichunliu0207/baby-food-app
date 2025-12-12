// app.js (module)
// 注意：請到 Firebase 控制台 > 專案設定 複製 web app 的 config 填入下方 firebaseConfig
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query
} from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

/* -------------------------
  在這裡放你的 firebaseConfig
  範例:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXX",
  appId: "1:XXX:web:XXX"
};
--------------------------*/
const firebaseConfig = {
  // <-- 把這整個物件換成你的 Firebase 設定
};

if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.warn("請在 app.js 補上 firebaseConfig（從 Firebase 控制台取得），且啟用 Cloud Firestore。");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---- UI references ---- */
const loginView = document.getElementById('login-view');
const calendarView = document.getElementById('calendar-view');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const backToLoginBtn = document.getElementById('back-to-login');

const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const weekdaysEl = document.getElementById('weekdays');
const calendarGrid = document.getElementById('calendar-grid');

const overlay = document.getElementById('info-overlay');
const infoDateEl = document.getElementById('info-date');
const foodsListEl = document.getElementById('foods-list');
const addFoodBtn = document.getElementById('add-food');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeOverlayBtn = document.getElementById('close-overlay');

/* ---- state ---- */
let currentYear = 2025;
let currentMonth = 11; // 0-based month => 11 means December 2025 (要求預設 2025/12)
let mealsCache = {}; // { 'YYYY-MM-DD': [{name, allergy}] }

/* ---- EVENTS: login ---- */
loginBtn.addEventListener('click', () => {
  const val = passwordInput.value.trim();
  if (val === '0808') {
    alert('登入成功');
    goToCalendar();
  } else {
    alert('密碼錯誤，請重新輸入');
    passwordInput.value = '';
    passwordInput.focus();
  }
});
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

backToLoginBtn.addEventListener('click', () => {
  // 清除登入欄位
  passwordInput.value = '';
  showView('login');
});

/* ---- NAVIGATION ---- */
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  if (id === 'login') loginView.classList.add('active');
  if (id === 'calendar') calendarView.classList.add('active');
}

function goToCalendar() {
  showView('calendar');
  renderCalendar();
  subscribeMeals(); // start listening Firestore
}

/* ---- Weekdays header (Sun-Sat) ---- */
const weekdayNames = ['日','一','二','三','四','五','六'];
function renderWeekdays(){
  weekdaysEl.innerHTML = '';
  weekdayNames.forEach(n=>{
    const div = document.createElement('div');
    div.textContent = n;
    weekdaysEl.appendChild(div);
  });
}

/* ---- Calendar render ---- */
function renderCalendar(){
  renderWeekdays();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  monthLabel.textContent = `${currentYear} 年 ${currentMonth + 1} 月`;

  // calculate leading blanks (weekday of first day: 0=Sun..6=Sat)
  const lead = firstDay.getDay();
  const totalCells = lead + lastDay.getDate();
  calendarGrid.innerHTML = '';

  for (let i=0; i<lead; i++){
    const blank = document.createElement('div');
    blank.className = 'day empty';
    blank.style.visibility = 'hidden';
    calendarGrid.appendChild(blank);
  }

  for (let d=1; d<=lastDay.getDate(); d++){
    const dateStr = formatDate(currentYear, currentMonth + 1, d); // YYYY-MM-DD
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.dataset.date = dateStr;

    const dateNum = document.createElement('div');
    dateNum.className = 'date';
    dateNum.textContent = d;
    dayEl.appendChild(dateNum);

    const foodsContainer = document.createElement('div');
    foodsContainer.className = 'foods';
    const foods = mealsCache[dateStr] || [];
    foods.slice(0,3).forEach(item=>{
      const f = document.createElement('div');
      f.className = 'food-item';
      if (item.allergy) {
        f.classList.add('food-allergy');
        f.innerHTML = `${escapeHtml(item.name)} <span class="food-warning">⚠️</span>`;
      } else {
        f.textContent = item.name;
      }
      foodsContainer.appendChild(f);
    });
    if (foods.length > 3) {
      const more = document.createElement('div');
      more.className = 'food-item muted small';
      more.textContent = `還有 ${foods.length - 3} 項...`;
      foodsContainer.appendChild(more);
    }

    dayEl.appendChild(foodsContainer);

    // click to open info page
    dayEl.addEventListener('click', () => openInfo(dateStr));
    calendarGrid.appendChild(dayEl);
  }
}

/* ---- Month navigation ---- */
prevMonthBtn.addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});

/* ---- INFO / EDIT overlay ---- */
let activeDate = null;

function openInfo(dateStr){
  activeDate = dateStr;
  infoDateEl.textContent = dateStr;
  foodsListEl.innerHTML = '';
  const items = (mealsCache[dateStr] && Array.isArray(mealsCache[dateStr])) ? mealsCache[dateStr] : [];
  if (items.length === 0) {
    addFoodRow(); // start with one empty
  } else {
    items.forEach(it => addFoodRow(it.name, it.allergy));
  }
  overlay.classList.remove('hidden');
}

function closeInfo(){
  overlay.classList.add('hidden');
  activeDate = null;
}

// create a food row UI
function addFoodRow(name = '', allergy = false){
  const row = document.createElement('div');
  row.className = 'food-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '食物名稱';
  input.value = name;
  row.appendChild(input);

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = allergy;
  label.appendChild(checkbox);
  const span = document.createElement('span');
  span.textContent = '過敏';
  label.appendChild(span);
  row.appendChild(label);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-food';
  removeBtn.innerHTML = '🗑';
  removeBtn.title = '移除該項';
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
  row.appendChild(removeBtn);

  foodsListEl.appendChild(row);
}

addFoodBtn.addEventListener('click', ()=> addFoodRow());

saveBtn.addEventListener('click', async () => {
  if (!activeDate) return;
  // collect all rows
  const rows = Array.from(foodsListEl.querySelectorAll('.food-row'));
  const items = [];
  rows.forEach(r=>{
    const name = r.querySelector('input[type="text"]').value.trim();
    const allergy = r.querySelector('input[type="checkbox"]').checked;
    if (name) items.push({ name, allergy });
  });
  // save to firestore under doc id = activeDate
  try {
    const docRef = doc(db, 'meals', activeDate);
    await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
    // update local cache immediately
    mealsCache[activeDate] = items;
    renderCalendar();
    closeInfo();
  } catch (err) {
    console.error(err);
    alert('儲存失敗，請稍後再試');
  }
});

cancelBtn.addEventListener('click', () => {
  closeInfo();
});
closeOverlayBtn.addEventListener('click', () => {
  closeInfo();
});

/* ---- Firestore sync ---- */
let unsubscribe = null;
function subscribeMeals(){
  // Observe all docs in 'meals'. 若擔心效能，可改為只監聽當月範圍。
  if (unsubscribe) return;
  const q = query(collection(db, 'meals'));
  unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      const data = docSnap.data();
      mealsCache[id] = (data && data.items) ? data.items : [];
    });
    // also remove local keys not in snapshot
    // build set of ids
    const snapshotIds = new Set(snapshot.docs.map(d=>d.id));
    Object.keys(mealsCache).forEach(k => { if (!snapshotIds.has(k)) delete mealsCache[k]; });
    renderCalendar();
  }, err => {
    console.error('Firestore 監聽錯誤', err);
  });
}

/* ---- UTIL ---- */
function formatDate(y,m,d){
  const mm = m.toString().padStart(2,'0');
  const dd = d.toString().padStart(2,'0');
  return `${y}-${mm}-${dd}`;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

/* ---- initial setup ---- */
renderWeekdays();
// UI: hide calendar view initially
showView('login');

// Ensure clicks outside overlay don't close it inadvertently
overlay.addEventListener('click', (e)=> {
  if (e.target === overlay) {
    // closeInfo();
  }
});
