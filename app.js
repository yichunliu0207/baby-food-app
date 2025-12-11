import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.17.1/firebase-firestore.js";

const db = window.firebaseDB;

/* ===== DOM ===== */
const loginPage = document.getElementById('loginPage');
const calendarPage = document.getElementById('calendarPage');
const detailPage = document.getElementById('detailPage');

const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const monthYear = document.getElementById('monthYear');
const calendarGrid = document.getElementById('calendarGrid');

const detailDateEl = document.getElementById('detailDate');
const foodInput = document.getElementById('foodInput');
const allergyCheck = document.getElementById('allergyCheck');
const addFoodBtn = document.getElementById('addFoodBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const foodList = document.getElementById('foodList');
const backBtn = document.getElementById('backBtn');

const FIXED_PASSWORD = "0808";
let stateYear = 2025;
let stateMonth = 11;
let currentDetailDate = '';
let unsubscribeDetail = null;

/* ===== LOGIN ===== */
loginBtn.addEventListener('click', () => {
  const pw = (loginPassword.value || '').trim();
  if (pw === FIXED_PASSWORD) {
    loginError.classList.add('hidden');
    alert('登入成功');
    showPage(calendarPage);
    renderCalendar();
  } else {
    loginError.classList.remove('hidden');
  }
});
loginPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') loginBtn.click();
});

/* ===== Page Switching ===== */
function showPage(pageEl) {
  [loginPage, calendarPage, detailPage].forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
}

/* ===== Calendar ===== */
prevMonth.addEventListener('click', () => changeMonth(-1));
nextMonth.addEventListener('click', () => changeMonth(1));

function changeMonth(delta) {
  stateMonth += delta;
  if (stateMonth < 0) { stateMonth = 11; stateYear--; }
  if (stateMonth > 11) { stateMonth = 0; stateYear++; }
  renderCalendar();
}

async function renderCalendar() {
  monthYear.innerText = `${stateYear} 年 ${stateMonth + 1} 月`;
  calendarGrid.innerHTML = '';

  const firstOffset = new Date(stateYear, stateMonth, 1).getDay();
  const totalDays = new Date(stateYear, stateMonth + 1, 0).getDate();

  for (let i = 0; i < firstOffset; i++) {
    const blank = document.createElement('div'); blank.className = 'empty';
    calendarGrid.appendChild(blank);
  }

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    const dateStr = `${stateYear}-${String(stateMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dateNum = document.createElement('div'); dateNum.className = 'date-num'; dateNum.innerText = d;
    cell.appendChild(dateNum);

    const docRef = doc(db, 'entries', dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const items = snap.data().foods;
      items.forEach(item => {
        const span = document.createElement('span'); span.className = 'food-list-bullet';
        span.innerText = '• ' + (item.allergy ? (item.name + '❗') : item.name);
        if (item.allergy) span.style.color = '#d0443a';
        cell.appendChild(span);
      });
    }

    cell.addEventListener('click', () => openDetail(dateStr));
    calendarGrid.appendChild(cell);
  }
}

/* ===== Detail Page ===== */
async function openDetail(dateStr) {
  currentDetailDate = dateStr;
  detailDateEl.innerText = dateStr;
  foodInput.value = ''; allergyCheck.checked = false;
  showPage(detailPage);

  if (unsubscribeDetail) unsubscribeDetail(); unsubscribeDetail = null;

  const docRef = doc(db, 'entries', dateStr);
  unsubscribeDetail = onSnapshot(docRef, (snap) => {
    foodList.innerHTML = '';
    if (snap.exists()) {
      const items = snap.data().foods;
      items.forEach(item => {
        const li = document.createElement('li');
        const left = document.createElement('div'); left.className = 'food-item-left';
        const nameSpan = document.createElement('span'); nameSpan.className = 'food-name';
        nameSpan.innerText = item.name;
        if (item.allergy) nameSpan.classList.add('allergy');
        left.appendChild(nameSpan); li.appendChild(left);

        const actions = document.createElement('div'); actions.className = 'food-actions';
        const delBtn = document.createElement('button'); delBtn.innerText = '刪除';
        delBtn.addEventListener('click', async () => {
          const newItems = snap.data().foods.filter(x => x.id !== item.id);
          await setDoc(docRef, { foods: newItems });
        });
        actions.appendChild(delBtn); li.appendChild(actions);
        foodList.appendChild(li);
      });
    } else {
      const p = document.createElement('p'); p.className = 'small-muted'; p.innerText = '今日尚無紀錄';
      foodList.appendChild(p);
    }
  });
}

addFoodBtn.addEventListener('click', async () => {
  const name = (foodInput.value || '').trim();
  if (!name) return alert('請輸入食物名稱');
  const allergy = allergyCheck.checked;
  const docRef = doc(db, 'entries', currentDetailDate);
  const snap = await getDoc(docRef);
  const items = snap.exists() ? snap.data().foods : [];
  items.push({ id: Date.now().toString(), name, allergy });
  await setDoc(docRef, { foods: items });
  foodInput.value = ''; allergyCheck.checked = false;
});

clearInputBtn.addEventListener('click', () => {
  foodInput.value = ''; allergyCheck.checked = false;
});

backBtn.addEventListener('click', () => { showPage(calendarPage); });
