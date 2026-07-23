(function(){
  bootstrapPage(null);
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";

  const CACHE_KEY = "trip_weather_cache"; // { regionId: { fetchedAt, current, daily } }

  const WCODE = {
    0: ["בהיר לגמרי", "sun"], 1: ["בהיר בעיקר", "sun"], 2: ["מעונן חלקית", "cloud"], 3: ["מעונן", "cloud"],
    45: ["ערפל", "cloud"], 48: ["ערפל קופא", "cloud"],
    51: ["טפטוף קל", "rain"], 53: ["טפטוף", "rain"], 55: ["טפטוף חזק", "rain"],
    56: ["טפטוף קופא", "rain"], 57: ["טפטוף קופא חזק", "rain"],
    61: ["גשם קל", "rain"], 63: ["גשם", "rain"], 65: ["גשם חזק", "rain"],
    66: ["גשם קופא", "rain"], 67: ["גשם קופא חזק", "rain"],
    71: ["שלג קל", "rain"], 73: ["שלג", "rain"], 75: ["שלג חזק", "rain"], 77: ["גרגירי שלג", "rain"],
    80: ["ממטרים קלים", "rain"], 81: ["ממטרים", "rain"], 82: ["ממטרים חזקים", "rain"],
    85: ["ממטרי שלג", "rain"], 86: ["ממטרי שלג חזקים", "rain"],
    95: ["סופת רעמים", "rain"], 96: ["רעמים וברד", "rain"], 99: ["רעמים וברד חזקים", "rain"]
  };
  function wxInfo(code){ return WCODE[code] || ["לא ידוע", "cloud"]; }

  function formatShortDate(iso){
    const d = new Date(iso + "T12:00:00");
    const days = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
    return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}`;
  }

  let regions = [];
  let activeRegion = null;

  loadTripData().then(data => {
    regions = data.weatherRegions || [];
    const params = new URLSearchParams(location.search);
    const requested = params.get("region");
    activeRegion = regions.find(r => r.id === requested) || regions[0];
    renderTabs();
    loadRegion(activeRegion);
  }).catch(() => {
    document.getElementById("wxContent").innerHTML = `<div class="empty">${ICONS.empty}<p>לא ניתן לטעון את רשימת המיקומים.</p></div>`;
  });

  function renderTabs(){
    document.getElementById("wxTabs").innerHTML = regions.map(r => `
      <button class="wx-tab ${r.id === activeRegion.id ? "is-active" : ""}" data-region="${r.id}">${r.label}</button>
    `).join("");
    document.querySelectorAll(".wx-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        activeRegion = regions.find(r => r.id === btn.getAttribute("data-region"));
        document.querySelectorAll(".wx-tab").forEach(t => t.classList.remove("is-active"));
        btn.classList.add("is-active");
        loadRegion(activeRegion);
      });
    });
  }

  async function loadRegion(region){
    const content = document.getElementById("wxContent");
    content.innerHTML = `<div class="empty"><p>טוען תחזית ל${region.label}…</p></div>`;
    const cacheAll = readJSON(CACHE_KEY, {});
    const cached = cacheAll[region.id];

    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("bad response");
      const json = await res.json();
      const record = { fetchedAt: Date.now(), current: json.current_weather, daily: json.daily };
      cacheAll[region.id] = record;
      writeJSON(CACHE_KEY, cacheAll);
      render(region, record, true);
    } catch(e){
      if (cached){
        render(region, cached, false);
      } else {
        content.innerHTML = `<div class="empty">${ICONS.wifiOff}<p>אין חיבור לאינטרנט ואין תחזית שמורה עדיין עבור ${region.label}.<br>יש להתחבר לאינטרנט פעם אחת כדי לטעון תחזית.</p></div>`;
      }
    }
  }

  function render(region, record, isFresh){
    const content = document.getElementById("wxContent");
    const cur = record.current;
    const daily = record.daily;
    const [curDesc, curIconKey] = cur ? wxInfo(cur.weathercode) : ["", "cloud"];

    let html = "";
    if (cur){
      html += `
        <div class="wx-now">
          <div class="faint" style="color:inherit;opacity:.75;">${region.label} · עכשיו</div>
          <div class="wx-now__temp">${Math.round(cur.temperature)}°</div>
          <div class="wx-now__desc">${curDesc} · רוח ${Math.round(cur.windspeed)} קמ"ש</div>
        </div>
      `;
    }

    if (daily && daily.time){
      html += `<div class="card"><div class="wx-days">`;
      html += daily.time.map((date, i) => {
        const [desc, iconKey] = wxInfo(daily.weathercode[i]);
        const rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;
        return `
          <div class="wx-day">
            <div class="wx-day__date">${formatShortDate(date)}</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="wx-day__icon">${ICONS[iconKey]}</span>
              <span class="faint">${desc}</span>
            </div>
            <div class="wx-day__rain">${rain !== null ? "☔ " + rain + "%" : ""}</div>
            <div class="wx-day__temps">${Math.round(daily.temperature_2m_max[i])}°<span>/${Math.round(daily.temperature_2m_min[i])}°</span></div>
          </div>
        `;
      }).join("");
      html += `</div></div>`;
    }

    const updated = new Date(record.fetchedAt);
    const updatedStr = `${updated.getDate()}.${updated.getMonth()+1} ${String(updated.getHours()).padStart(2,"0")}:${String(updated.getMinutes()).padStart(2,"0")}`;
    html += `<div class="wx-updated">${isFresh ? "עודכן הרגע" : "מוצג מהעדכון האחרון"} · ${updatedStr}</div>`;

    content.innerHTML = html;
  }
})();
