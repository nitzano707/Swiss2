/* ==========================================================================
   לוגיקה משותפת לכל הדפים: תמה, אחסון מקומי, תאריכים, ניווט תחתון, מצב אופליין
   ========================================================================== */

const STORAGE_KEYS = {
  theme: "trip_theme",
  doneStops: "trip_done_stops",   // { "1": [0,2], "3": [1] }
  doneDays: "trip_done_days",     // { "1": true }
  notes: "trip_notes",            // { "1": "טקסט חופשי" }
  weatherPlan: "trip_weather_plan" // { "4": "A" }
};

/* ---------------- Theme ---------------- */
function initTheme(){
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

function toggleTheme(){
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE_KEYS.theme, next);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.innerHTML = next === "dark" ? ICONS.sun : ICONS.moon;
}

/* ---------------- Generic JSON localStorage helpers ---------------- */
function readJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function writeJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* storage full/unavailable */ }
}

/* ---------------- Day / stop completion ---------------- */
function isDayDone(dayId){
  const all = readJSON(STORAGE_KEYS.doneDays, {});
  return !!all[dayId];
}
function setDayDone(dayId, val){
  const all = readJSON(STORAGE_KEYS.doneDays, {});
  all[dayId] = val;
  writeJSON(STORAGE_KEYS.doneDays, all);
}
function getDoneStops(dayId){
  const all = readJSON(STORAGE_KEYS.doneStops, {});
  return all[dayId] || [];
}
function toggleStopDone(dayId, idx){
  const all = readJSON(STORAGE_KEYS.doneStops, {});
  const arr = all[dayId] || [];
  const pos = arr.indexOf(idx);
  if (pos > -1) arr.splice(pos, 1); else arr.push(idx);
  all[dayId] = arr;
  writeJSON(STORAGE_KEYS.doneStops, all);
  return arr.includes(idx);
}
function getNote(dayId){
  const all = readJSON(STORAGE_KEYS.notes, {});
  return all[dayId] || "";
}
function setNote(dayId, text){
  const all = readJSON(STORAGE_KEYS.notes, {});
  all[dayId] = text;
  writeJSON(STORAGE_KEYS.notes, all);
}
function getChosenPlan(dayId){
  const all = readJSON(STORAGE_KEYS.weatherPlan, {});
  return all[dayId] || null;
}
function setChosenPlan(dayId, planIndex){
  const all = readJSON(STORAGE_KEYS.weatherPlan, {});
  all[dayId] = planIndex;
  writeJSON(STORAGE_KEYS.weatherPlan, all);
}

/* ---------------- Date helpers ---------------- */
function todayStr(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function formatDateHe(iso){
  const [y,m,d] = iso.split("-");
  return `${parseInt(d)}.${parseInt(m)}.${y}`;
}

/* Returns the current trip day object: matches today's date, else the next
   upcoming day, else the last day if the trip is over, else the first day
   if it hasn't started. */
function getCurrentDay(days){
  const t = todayStr();
  let exact = days.find(d => d.date === t);
  if (exact) return exact;
  const upcoming = days.filter(d => d.date > t).sort((a,b)=>a.date.localeCompare(b.date));
  if (upcoming.length) return upcoming[0];
  return days[days.length - 1];
}
function dayStatus(day, days){
  const t = todayStr();
  if (day.date === t) return "today";
  if (day.date < t) return "past";
  return "future";
}

const MODE_ICON = { car: ICONS.car, bike: ICONS.bike, boat: ICONS.boat, flight: ICONS.plane };
const MODE_LABEL = { car: "רכב", bike: "אופניים", boat: "שיט", flight: "טיסה" };

/* ---------------- Navigation links ---------------- */
function wazeUrl(address){ return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`; }
function gmapsUrl(address){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`; }

function copyText(text, btnEl){
  const done = () => {
    if (!btnEl) return;
    const original = btnEl.innerHTML;
    btnEl.innerHTML = ICONS.check + " הועתק";
    setTimeout(()=>{ btnEl.innerHTML = original; }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, cb){
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  document.body.removeChild(ta);
  if (cb) cb();
}

/* ---------------- Bottom nav ---------------- */
function renderBottomNav(active){
  const items = [
    { href: "index.html", icon: ICONS.home, label: "היום" },
    { href: "days.html", icon: ICONS.days, label: "ימים" },
    { href: "hotels.html", icon: ICONS.hotel, label: "מלונות" },
    { href: "parking.html", icon: ICONS.parking, label: "חניה" },
    { href: "info.html", icon: ICONS.info, label: "מידע" }
  ];
  const nav = document.createElement("nav");
  nav.className = "bottomnav";
  nav.innerHTML = items.map(it => `
    <a href="${it.href}" class="${it.href === active ? "is-active" : ""}">
      ${it.icon}
      <span>${it.label}</span>
    </a>`).join("");
  document.body.appendChild(nav);
}

/* ---------------- Offline indicator ---------------- */
function initOfflinePill(){
  const pill = document.createElement("div");
  pill.className = "offline-pill";
  pill.id = "offlinePill";
  pill.textContent = "אין חיבור לאינטרנט — מציג נתונים שמורים";
  document.body.appendChild(pill);
  function update(){ pill.classList.toggle("is-visible", !navigator.onLine); }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

/* ---------------- Data loading ---------------- */
async function loadTripData(){
  const res = await fetch("data/trip.json");
  if (!res.ok) throw new Error("failed to load trip data");
  return res.json();
}

/* ---------------- Service worker ---------------- */
function registerServiceWorker(){
  if ("serviceWorker" in navigator){
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(()=>{});
    });
  }
}

/* ---------------- Page bootstrap ---------------- */
function bootstrapPage(active){
  initTheme();
  initOfflinePill();
  renderBottomNav(active);
  registerServiceWorker();
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn){
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    themeBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    themeBtn.addEventListener("click", toggleTheme);
  }
}
