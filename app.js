import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* Firestore initialized in index.html */
const db = window.db;

/* ---------------- DOM 元素 ---------------- */
const loginPage = document.getElementById("loginPage");
const calendarPage = document.getElementById("calendarPage");
const infoPage = document.getElementById("infoPage");

const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");

const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

const foodInput = document.getElementById("foodInput");
const allergyCheckbox = document.getElementById("allergyCheckbox");
const saveBtn = document.getElementById("saveBtn");
const backBtn = document.getElementById("backBtn");

const infoDateTitle = document.getElementById("infoDateTitle");

/* ---------------- 登入功能 ---------------- */
loginBtn.addEventListener("click", () => {
    if (passwordInput.value === "0808") {
        alert("登入成功");
        loginPage.classList.add("hidden");
        calendarPage.classList.remove("hidden");
        renderCalendar();
    } else {
        alert("密碼錯誤，請重新輸入");
    }
});

/* ---------------- 日曆功能 ---------------- */
let current = new Date();

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();

    monthTitle.textContent = `${year} / ${month + 1}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.innerHTML += `<div></div>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${month + 1}-${d}`;
        const cell = document.createElement("div");
        cell.innerHTML = `<strong>${d}</strong>`;

        loadDayData(dateStr, cell);
        cell.addEventListener("click", () => openInfoPage(dateStr));

        calendarGrid.appendChild(cell);
    }
}

prevMonth.onclick = () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
};

nextMonth.onclick = () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
};

/* ---------------- 載入資料到日曆 ---------------- */
async function loadDayData(dateStr, cell) {
    const ref = doc(db, "foods", dateStr);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const data = snap.data();

        let html = "";
        data.foods.forEach(f => {
            html += `<div class="food-item ${f.allergy ? "allergy" : ""}">
                        ${f.name} ${f.allergy ? "⚠️" : ""}
                     </div>`;
        });

        cell.innerHTML += html;
    }
}

/* ---------------- 資訊頁 ---------------- */
let selectedDate = "";

async function openInfoPage(dateStr) {
    selectedDate = dateStr;
    infoDateTitle.textContent = `日期：${dateStr}`;

    const ref = doc(db, "foods", dateStr);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const data = snap.data();
        foodInput.value = data.foods.map(f => f.name).join("，");
        allergyCheckbox.checked = data.foods.some(f => f.allergy);
    } else {
        foodInput.value = "";
        allergyCheckbox.checked = false;
    }

    calendarPage.classList.add("hidden");
    infoPage.classList.remove("hidden");
}

/* ---------------- 儲存 ---------------- */
saveBtn.onclick = async () => {
    const foods = foodInput.value
        .split("，")
        .map(v => v.trim())
        .filter(v => v.length > 0);

    const allergy = allergyCheckbox.checked;

    const foodArr = foods.map(name => ({
        name,
        allergy
    }));

    await setDoc(doc(db, "foods", selectedDate), { foods: foodArr });

    alert("已儲存");

    infoPage.classList.add("hidden");
    calendarPage.classList.remove("hidden");
    renderCalendar();
};

/* ---------------- 回上頁 ---------------- */
backBtn.onclick = () => {
    infoPage.classList.add("hidden");
    calendarPage.classList.remove("hidden");
};
