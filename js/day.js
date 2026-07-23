(function(){
  bootstrapPage(null); // no nav item highlighted directly, but keep bottom nav
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>ימים</span>";

  const params = new URLSearchParams(location.search);
  const requestedId = parseInt(params.get("id"), 10);

  loadTripData().then(data => {
    const { days, hotels } = data;
    const day = days.find(d => d.id === requestedId) || getCurrentDay(days);
    renderDay(day, days, hotels);
  }).catch(() => {
    document.getElementById("app").innerHTML = `
      <div class="empty">${ICONS.empty}<p>לא ניתן לטעון את נתוני היום. יש לפתוח את האתר פעם אחת עם אינטרנט כדי לשמור אותו אופליין.</p></div>`;
  });

  function scheduleRouteline(schedule){
    return `<div class="routeline">${schedule.map(s => `
      <div class="routeline__item">
        <span class="routeline__dot"></span>
        ${s.time ? `<div class="routeline__time">${s.time}</div>` : ""}
        <div class="routeline__text">${s.activity}</div>
      </div>`).join("")}</div>`;
  }

  function renderDay(day, days, hotels){
    document.getElementById("topTitle").textContent = `יום ${day.id} · ${formatDateHe(day.date)}`;
    const status = dayStatus(day, days);
    const hotel = hotels.find(h => h.id === day.hotelId);
    const idx = days.findIndex(d => d.id === day.id);
    const prev = days[idx - 1];
    const next = days[idx + 1];

    let html = "";

    // Hero
    html += `
      <div class="card">
        <div class="flex-between mb-0" style="margin-bottom:6px;">
          <span class="badge">${day.weekday} · ${formatDateHe(day.date)}</span>
          <span class="badge" style="background:transparent;color:var(--ink-faint);">${MODE_ICON[day.transportMode] || ""} ${MODE_LABEL[day.transportMode] || ""}</span>
        </div>
        <h1 class="display" style="margin-bottom:4px;">${day.title}</h1>
        <p class="subtle" style="margin:0;">${day.routeSummary}</p>
      </div>

      <div class="stat-row">
        <div class="stat"><b>${day.departure || "—"}</b><span>יציאה</span></div>
        <div class="stat"><b>${day.returnTime || "—"}</b><span>חזרה</span></div>
        <div class="stat"><b style="font-size:13px;">${hotel ? hotel.name.split(" ").slice(0,2).join(" ") : "—"}</b><span>לינה</span></div>
      </div>
    `;

    // Shabbat / candle lighting note
    if (day.candleLighting){
      html += `<div class="notice"><strong>הדלקת נרות:</strong> ${day.candleLighting}</div>`;
    }
    if (day.isShabbat){
      html += `<div class="notice">שבת — ללא רכב, ללא תחבורה ציבורית וללא צילום/ניווט. השתמשו בעמוד הזה ובכתובות שנשמרו מראש לפני כניסת השבת.</div>`;
    }

    // Site highlights (photos + descriptions)
    if (day.highlights && day.highlights.length){
      html += `<div class="eyebrow">כדאי להכיר — האתרים של היום</div>`;
      html += day.highlights.map(h => `
        <div class="highlight-card">
          <img src="${h.image}" alt="${h.name}" loading="lazy"
               onerror="this.closest('.highlight-card').classList.add('img-failed')">
          <div class="highlight-card__body">
            <div class="highlight-card__name">${h.name}</div>
            <p class="highlight-card__desc">${h.description}</p>
            <a class="highlight-card__credit" href="${h.sourceUrl}" target="_blank" rel="noopener">תמונה: Wikimedia Commons · ${h.license}</a>
          </div>
        </div>
      `).join("");
    }

    // Weather
    if (day.weather){
      html += `
        <div class="eyebrow">מזג אוויר</div>
        <div class="weather-box">${ICONS.cloud}<p>${day.weather}</p></div>
        <a class="btn btn--sm" href="weather.html?region=${day.weatherRegion || ''}" style="margin-bottom:14px;">${ICONS.cloud} תחזית עדכנית בזמן אמת</a>
      `;
    }

    // Flexible weather-dependent day (e.g. 29.7)
    if (day.isFlexibleDay){
      const chosen = getChosenPlan(day.id);
      html += `
        <div class="eyebrow">בחירת תוכנית — החלטה בשעה ${day.decisionTime}</div>
        <div class="notice">בדקו את הראות ומצב מזג האוויר בבוקר, ואז בחרו את התוכנית המתאימה. הבחירה נשמרת במכשיר שלכם.</div>
        <div class="plan-tabs">
          ${day.weatherPlans.map((p, i) => `
            <button class="plan-tab ${chosen === i ? "is-active" : ""}" data-plan-idx="${i}">${p.planLabel}</button>
          `).join("")}
        </div>
        <div id="planPanels">
          ${day.weatherPlans.map((p, i) => `
            <div class="plan-panel ${chosen === i ? "is-active" : ""}" data-panel-idx="${i}">
              <p class="faint" style="margin:0 0 10px;">תנאים: ${p.condition}</p>
              ${scheduleRouteline(p.schedule)}
            </div>
          `).join("")}
        </div>
      `;
    } else {
      html += `<div class="eyebrow">לוח זמנים</div>` + scheduleRouteline(day.schedule);
    }

    // Stops / navigation
    if (day.stops && day.stops.length){
      html += `<div class="eyebrow">תחנות וניווט</div>`;
      html += day.stops.map((stop, i) => {
        const isDone = getDoneStops(day.id).includes(i);
        return `
        <div class="stop">
          <div class="stop__name">${stop.name}</div>
          <div class="stop__addr">${stop.wazeAddress}</div>
          <div class="stop__actions">
            <a class="btn btn--primary btn--sm" href="${wazeUrl(stop.wazeAddress)}" target="_blank" rel="noopener">${ICONS.waze} Waze</a>
            <a class="btn btn--sm" href="${gmapsUrl(stop.wazeAddress)}" target="_blank" rel="noopener">${ICONS.pin} Maps</a>
            <button class="btn btn--sm" data-copy-text="${stop.wazeAddress.replace(/"/g,'&quot;')}">${ICONS.copy} העתק</button>
            <button class="btn btn--sm ${isDone ? "btn--done" : ""}" data-stop-idx="${i}">${ICONS.check} ${isDone ? "הושלם" : "סמן כהושלם"}</button>
          </div>
        </div>`;
      }).join("");
    }

    // Important notes
    if (day.important && day.important.length){
      html += `
        <div class="eyebrow">הערות חשובות</div>
        <div class="notice"><ul>${day.important.map(t => `<li>${t}</li>`).join("")}</ul></div>
      `;
    }

    // Rain plan
    if (day.rainPlan){
      html += `
        <div class="eyebrow">תוכנית חלופית לגשם</div>
        <div class="card" style="border-color:var(--red);">${day.rainPlan}</div>
      `;
    }

    // Personal notes
    html += `
      <div class="eyebrow">הערות אישיות</div>
      <div class="card">
        <textarea id="notesInput" rows="3" placeholder="הערה אישית ליום הזה — נשמר רק במכשיר שלך"
          style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg);color:var(--ink);font-family:inherit;font-size:14px;resize:vertical;">${getNote(day.id)}</textarea>
      </div>
    `;

    // Mark day complete + prev/next nav
    html += `
      <button class="btn ${isDayDone(day.id) ? "btn--done" : "btn--primary"} btn--full" id="dayCompleteBtn" style="margin-bottom:14px;">
        ${ICONS.check} ${isDayDone(day.id) ? "היום סומן כהושלם" : "סמן את היום כהושלם"}
      </button>
      <div class="flex-between">
        ${prev ? `<a class="btn" href="day.html?id=${prev.id}">${ICONS.back} יום ${prev.id}</a>` : `<span></span>`}
        ${next ? `<a class="btn" href="day.html?id=${next.id}">יום ${next.id} ${ICONS.back.replace('M15 19l-7-7 7-7','M9 19l7-7-7-7')}</a>` : `<span></span>`}
      </div>
    `;

    document.getElementById("app").innerHTML = html;
    wireEvents(day);
  }

  function wireEvents(day){
    document.querySelectorAll("[data-copy-text]").forEach(btn => {
      btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy-text"), btn));
    });
    document.querySelectorAll("[data-stop-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-stop-idx"), 10);
        const nowDone = toggleStopDone(day.id, idx);
        btn.classList.toggle("btn--done", nowDone);
        btn.innerHTML = `${ICONS.check} ${nowDone ? "הושלם" : "סמן כהושלם"}`;
      });
    });
    document.querySelectorAll("[data-plan-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-plan-idx"), 10);
        setChosenPlan(day.id, i);
        document.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("is-active"));
        btn.classList.add("is-active");
        document.querySelectorAll(".plan-panel").forEach(p => {
          p.classList.toggle("is-active", parseInt(p.getAttribute("data-panel-idx"),10) === i);
        });
      });
    });
    const notesInput = document.getElementById("notesInput");
    if (notesInput){
      let t;
      notesInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => setNote(day.id, notesInput.value), 400);
      });
    }
    const completeBtn = document.getElementById("dayCompleteBtn");
    if (completeBtn){
      completeBtn.addEventListener("click", () => {
        const nowDone = !isDayDone(day.id);
        setDayDone(day.id, nowDone);
        completeBtn.className = `btn ${nowDone ? "btn--done" : "btn--primary"} btn--full`;
        completeBtn.innerHTML = `${ICONS.check} ${nowDone ? "היום סומן כהושלם" : "סמן את היום כהושלם"}`;
      });
    }
  }
})();
