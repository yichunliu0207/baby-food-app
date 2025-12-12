// Firebase init
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
const db = firebase.firestore();

// DOM
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

const FIXED_PASSWORD = '0808';
let stateYear = 2025;
let stateMonth = 11;
let currentDetailDate = '';

// 顯示頁面
function showPage(pageEl){
  [loginPage, calendarPage, detailPage].forEach(p=>p.classList.remove('active'));
  pageEl.classList.add('active');
}

// 日期格式化
function formatDateStr(y,m,d){
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// uid
function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// 登入
loginBtn.addEventListener('click', ()=>{
  const pw = (loginPassword.value||'').trim();
  if(pw === FIXED_PASSWORD){
    loginError.classList.add('hidden');
    alert('登入成功');
    showPage(calendarPage);
    renderCalendar();
  } else {
    loginError.classList.remove('hidden');
  }
});
loginPassword.addEventListener('keydown', e=>{ if(e.key==='Enter') loginBtn.click(); });

// 月份切換
prevMonth.addEventListener('click', ()=> changeMonth(-1));
nextMonth.addEventListener('click', ()=> changeMonth(1));
function changeMonth(delta){
  stateMonth += delta;
  if(stateMonth<0){ stateMonth=11; stateYear--; }
  if(stateMonth>11){ stateMonth=0; stateYear++; }
  renderCalendar();
}

// 渲染日曆
async function renderCalendar(){
  monthYear.innerText = `${stateYear} 年 ${stateMonth+1} 月`;
  calendarGrid.innerHTML = '';

  const firstOffset = new Date(stateYear,stateMonth,1).getDay();
  const totalDays = new Date(stateYear,stateMonth+1,0).getDate();

  // 空白格
  for(let i=0;i<firstOffset;i++){
    const blank = document.createElement('div');
    blank.className='empty';
    calendarGrid.appendChild(blank);
  }

  // 取得當月資料
  const docsSnap = await db.collection('entries').get();
  const map = {};
  docsSnap.forEach(doc=>{ map[doc.id]=doc.data().foods||[]; });

  for(let d=1;d<=totalDays;d++){
    const cell = document.createElement('div');
    const dateStr = formatDateStr(stateYear,stateMonth+1,d);
    const dateNum = document.createElement('div');
    dateNum.className='date-num'; dateNum.innerText=d;
    cell.appendChild(dateNum);

    if(map[dateStr] && map[dateStr].length){
      map[dateStr].forEach(item=>{
        const span = document.createElement('span');
        span.className='food-list-bullet';
        span.innerText = '• ' + (item.allergy ? item.name+' ▲' : item.name);
        if(item.allergy) span.style.color='#d0443a';
        cell.appendChild(span);
      });
    }

    cell.addEventListener('click', ()=> openDetail(dateStr));
    calendarGrid.appendChild(cell);
  }
}

// 打開詳細頁
async function openDetail(dateStr){
  currentDetailDate = dateStr;
  detailDateEl.innerText = dateStr;
  foodInput.value=''; allergyCheck.checked=false;
  showPage(detailPage);

  const docRef = db.collection('entries').doc(dateStr);
  const snap = await docRef.get();
  foodList.innerHTML='';

  if(snap.exists && snap.data().foods.length){
    snap.data().foods.forEach(item=>{
      const li = document.createElement('li');
      const left = document.createElement('div'); left.className='food-item-left';
      const nameSpan = document.createElement('span'); nameSpan.className='food-name';
      nameSpan.innerText = item.name;
      if(item.allergy) nameSpan.classList.add('allergy');
      left.appendChild(nameSpan); li.appendChild(left);

      const actions = document.createElement('div'); actions.className='food-actions';
      const delBtn = document.createElement('button'); delBtn.innerText='刪除';
      delBtn.addEventListener('click', async ev=>{
        ev.stopPropagation();
        if(!confirm('確定刪除此筆紀錄？')) return;
        const newItems = snap.data().foods.filter(x=>x.id!==item.id);
        await docRef.set({foods:newItems});
        openDetail(currentDetailDate);
      });
      actions.appendChild(delBtn); li.appendChild(actions);
      foodList.appendChild(li);
    });
  } else {
    const p=document.createElement('p'); p.className='small-muted'; p.innerText='今日尚無紀錄';
    foodList.appendChild(p);
  }
}

// 新增副食品
addFoodBtn.addEventListener('click', async ()=>{
  const name = (foodInput.value||'').trim();
  if(!name) return alert('請輸入食物名稱');
  const allergy = allergyCheck.checked;
  const docRef = db.collection('entries').doc(currentDetailDate);
  const snap = await docRef.get();
  const items = snap.exists ? snap.data().foods : [];
  items.push({id:uid(), name, allergy, createdAt:Date.now()});
  await docRef.set({foods:items});
  foodInput.value=''; allergyCheck.checked=false;
  openDetail(currentDetailDate);
});

// 清空
clearInputBtn.addEventListener('click', ()=>{
  foodInput.value=''; allergyCheck.checked=false;
});

// 回日曆
backBtn.addEventListener('click', ()=> showPage(calendarPage));

// 初始頁面
showPage(loginPage);
