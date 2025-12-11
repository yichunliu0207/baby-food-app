/* Baby Food Journal - A style (multi entry per day)
   - fixed password: 0808
   - default month: 2025/12
   - data stored in localStorage under key: babyFood_entries_v1
*/

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

const FIXED_PASSWORD = '0808';
const STORAGE_KEY = 'babyFood_entries_v1';

/* ===== state ===== */
let stateYear = 2025;
let stateMonth = 11; // 0-indexed (11 -> December)
let currentDetailDate = '';
let entries = {}; // { "YYYY-MM-DD": [ {id, name, allergy, createdAt}, ... ] }

/* ===== utils ===== */
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : {};
  }catch(e){
    console.error('load error', e);
    entries = {};
  }
}
function saveToStorage(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }catch(e){ console.error('save error', e) }
}
function formatDateStr(y,m,d){
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function uid(){
  return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

/* ===== login ===== */
loginBtn.addEventListener('click', ()=>{
  const pw = (loginPassword.value || '').trim();
  if(pw === FIXED_PASSWORD){
    loginError.classList.add('hidden');
    alert('登入成功');
    showPage(calendarPage);
    loadFromStorage();
    renderCalendar();
  }else{
    loginError.classList.remove('hidden');
  }
});
// also allow Enter key on password
loginPassword.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') loginBtn.click();
});

/* ===== page switching ===== */
function showPage(pageEl){
  [loginPage, calendarPage, detailPage].forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
}

/* ===== calendar rendering ===== */
prevMonth.addEventListener('click', ()=> changeMonth(-1));
nextMonth.addEventListener('click', ()=> changeMonth(1));

function changeMonth(delta){
  stateMonth += delta;
  if(stateMonth < 0){ stateMonth = 11; stateYear -= 1; }
  if(stateMonth > 11){ stateMonth = 0; stateYear += 1; }
  renderCalendar();
}

function renderCalendar(){
  monthYear.innerText = `${stateYear} 年 ${stateMonth + 1} 月`;
  calendarGrid.innerHTML = '';

  const firstOffset = new Date(stateYear, stateMonth, 1).getDay();
  const lastDay = new Date(stateYear, stateMonth + 1, 0);
  const totalDays = lastDay.getDate();

  // fill blanks
  for(let i=0;i<firstOffset;i++){
    const blank = document.createElement('div');
    blank.className = 'empty';
    calendarGrid.appendChild(blank);
  }

  for(let d=1; d<= totalDays; d++){
    const cell = document.createElement('div');
    const dateStr = formatDateStr(stateYear, stateMonth+1, d);

    const dateNum = document.createElement('div');
    dateNum.className = 'date-num';
    dateNum.innerText = d;
    cell.appendChild(dateNum);

    if(entries[dateStr] && entries[dateStr].length > 0){
      entries[dateStr].forEach(item => {
        const span = document.createElement('span');
        span.className = 'food-list-bullet';
        span.innerText = '• ' + (item.allergy ? (item.name + '❗') : item.name);
        if(item.allergy) span.style.color = '#d0443a';
        cell.appendChild(span);
      });
    }

    cell.addEventListener('click', ()=> openDetail(dateStr));
    calendarGrid.appendChild(cell);
  }
}

/* ===== detail page (multi items) ===== */
function openDetail(dateStr){
  currentDetailDate = dateStr;
  detailDateEl.innerText = dateStr;
  foodInput.value = '';
  allergyCheck.checked = false;
  renderFoodList();
  showPage(detailPage);
}

function renderFoodList(){
  foodList.innerHTML = '';
  const list = entries[currentDetailDate] || [];
  list.forEach(item => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'food-item-left';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'food-name';
    nameSpan.innerText = item.name || '(未命名)';
    if(item.allergy) nameSpan.classList.add('allergy');

    left.appendChild(nameSpan);

    li.appendChild(left);

    const actions = document.createElement('div');
    actions.className = 'food-actions';

    const editBtn = document.createElement('button');
    editBtn.innerText = '編輯';
    editBtn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      foodInput.value = item.name;
      allergyCheck.checked = !!item.allergy;
      addFoodBtn.dataset.editId = item.id;
    });

    const delBtn = document.createElement('button');
    delBtn.innerText = '刪除';
    delBtn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(confirm('確定刪除此筆紀錄？')){
        deleteFoodItem(item.id);
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);

    foodList.appendChild(li);
  });

  if(list.length === 0){
    const p = document.createElement('p');
    p.className = 'small-muted';
    p.innerText = '今日尚無紀錄，請新增一筆。';
    foodList.appendChild(p);
  }
}

function deleteFoodItem(id){
  const list = entries[currentDetailDate] || [];
  entries[currentDetailDate] = list.filter(i => i.id !== id);
  if(entries[currentDetailDate].length === 0) delete entries[currentDetailDate];
  saveToStorage();
  renderFoodList();
  renderCalendar();
}

/* add or update item */
addFoodBtn.addEventListener('click', ()=>{
  const name = (foodInput.value || '').trim();
  const allergy = !!allergyCheck.checked;
  if(!name){
    alert('請輸入食物名稱');
    return;
  }
  if(!entries[currentDetailDate]) entries[currentDetailDate] = [];

  const editId = addFoodBtn.dataset.editId;
  if(editId){
    const idx = entries[currentDetailDate].findIndex(x=>x.id === editId);
    if(idx >= 0){
      entries[currentDetailDate][idx].name = name;
      entries[currentDetailDate][idx].allergy = allergy;
      entries[currentDetailDate][idx].updatedAt = Date.now();
    }
    delete addFoodBtn.dataset.editId;
  } else {
    const item = { id: uid(), name, allergy, createdAt: Date.now() };
    entries[currentDetailDate].push(item);
  }

  saveToStorage();
  renderFoodList();
  renderCalendar();
  foodInput.value = '';
  allergyCheck.checked = false;
});

/* clear input */
clearInputBtn.addEventListener('click', ()=>{
  foodInput.value = '';
  allergyCheck.checked = false;
  delete addFoodBtn.dataset.editId;
});

/* back to calendar */
backBtn.addEventListener('click', ()=>{
  showPage(calendarPage);
});

/* initial load */
showPage(loginPage);
loadFromStorage();
