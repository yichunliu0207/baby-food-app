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
let currentDetailUnsub = null;

// Show page
function showPage(pageEl){
  [loginPage, calendarPage, detailPage].forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
}

// Format date
function formatDateStr(y,m,d){
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// UID helper
function uid(){ return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// Login
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
loginPassword.addEventListener('keydown', e => { if(e.key==='Enter') loginBtn.click(); });

// Calendar navigation
prevMonth.addEventListener('click', ()=> changeMonth(-1));
nextMonth.addEventListener('click', ()=> changeMonth(1));
function changeMonth(delta){
  stateMonth += delta;
  if(stateMonth<0){ stateMonth=11; stateYear-=1; }
  if(stateMonth>11){ stateMonth=0; stateYear+=1; }
  renderCalendar();
}

// Render calendar
async function renderCalendar(){
  monthYear.innerText = `${stateYear} 年 ${stateMonth+1} 月`;
  calendarGrid.innerHTML = '';
  const firstOffset = new Date(stateYear,stateMonth,1).getDay();
  const totalDays = new Date(stateYear,stateMonth+1,0).getDate();

  for(let i=0;i<firstOffset;i++){
    const blank = document.createElement('div'); blank.className='empty'; calendarGrid.appendChild(blank);
  }

  const docsSnap = await db.collection('entries').get();
  const map = {};
  docsSnap.forEach(doc => { map[doc.id] = doc.data().foods || []; });

  for(let d=1; d<=totalDays; d++){
    const cell = document.createElement('div');
    const dateStr = formatDateStr(stateYear,stateMonth+1,d);
    const dateNum = document.createElement('div'); dateNum.className='date-num'; dateNum.innerText = d;
    cell.appendChild(dateNum);

    if(map[dateStr] && map[dateStr].length){
      map[dateStr].forEach(item => {
        const span = document.createElement('span');
        span.className='food-list-bullet';
        span.innerText = '• '+ (item.allergy ? (item.name+' ▲') : item.name);
        if(item.allergy) span.style.color='#d0443a';
        cell.appendChild(span);
      });
    }

    cell.addEventListener('click', ()=> openDetail(dateStr));
    calendarGrid.appendChild(cell);
  }
}

// Open detail
async function openDetail(dateStr){
  currentDetailDate = dateStr;
  detailDateEl.innerText = dateStr;
  foodInput.value=''; allergyCheck.checked=false;
  showPage(detailPage);
  if(currentDetailUnsub) currentDetailUnsub(); currentDetailUnsub=null;

  const docRef = db.collection('entries').doc(dateStr);
  currentDetailUnsub = docRef.onSnapshot(snap=>{
    foodList.innerHTML='';
    if(snap.exists){
      const items = snap.data().foods || [];
      if(items.length===0){
        const p = document.createElement('p'); p.className='small-muted'; p.innerText='今日尚無紀錄';
        foodList.appendChild(p);
      } else {
        items.forEach(item=>{
          const li=document.createElement('li');
          const left=document.createElement('div'); left.className='food-item-left';
          const nameSpan=document.createElement('span'); nameSpan.className='food-name';
          nameSpan.innerText=item.name;
          if(item.allergy) nameSpan.classList.add('allergy');
          left.appendChild(nameSpan); li.appendChild(left);

          const actions=document.createElement('div'); actions.className='food-actions';
          const delBtn=document.createElement('button'); delBtn.innerText='刪除';
          delBtn.addEventListener('click', async ev=>{
            ev.stopPropagation();
            if(!confirm('確定刪除此筆紀錄？')) return;
            const newItems=(snap.data().foods||[]).filter(x=>x.id!==item.id);
            await docRef.set({foods:newItems});
          });
          actions.appendChild(delBtn); li.appendChild(actions);
          foodList.appendChild(li);
        });
      }
    } else {
      const p=document.createElement('p'); p.className='small-muted'; p.innerText='今日尚無紀錄';
      foodList.appendChild(p);
    }
  });
}

// Add food
addFoodBtn.addEventListener('click', async ()=>{
  const name=(foodInput.value||'').trim();
  if(!name) return alert('請輸入食物名稱');
  const allergy=!!allergyCheck.checked;
  const docRef=db.collection('entries').doc(currentDetailDate);
  const snap=await docRef.get();
  const items=snap.exists ? (snap.data().foods||[]) : [];
  items.push({id:uid(), name, allergy, createdAt:Date.now()});
  await docRef.set({foods:items});
  foodInput.value=''; allergyCheck.checked=false;
});

// Clear input
clearInputBtn.addEventListener('click', ()=>{
  foodInput.value=''; allergyCheck.checked=false;
});

// Back
backBtn.addEventListener('click', ()=> showPage(calendarPage));

// Initial page
showPage(loginPage);
