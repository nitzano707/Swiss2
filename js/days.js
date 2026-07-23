(function(){
  bootstrapPage("days.html");
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";

  loadTripData().then(data => {
    const { days } = data;
    const current = getCurrentDay(days);

    const doneCount = days.filter(d => isDayDone(d.id)).length;
    document.getElementById("statRow").innerHTML = `
      <div class="stat"><b>${days.length}</b><span>ימים</span></div>
      <div class="stat"><b>${doneCount}</b><span>הושלמו</span></div>
      <div class="stat"><b>יום ${current.id}</b><span>נוכחי</span></div>
    `;

    const list = document.getElementById("daysList");
    list.innerHTML = days.map(day => {
      const status = dayStatus(day, days);
      const done = isDayDone(day.id);
      const dotClass = status === "today" ? "status-dot--today" : (done ? "status-dot--done" : "");
      return `
      <li>
        <a class="day-card ${status === "today" ? "day-card--today" : ""}" href="day.html?id=${day.id}">
          <div class="day-card__num">
            <b>${day.id}</b>
            <span>${formatDateHe(day.date)}</span>
          </div>
          <div class="day-card__body">
            <div class="day-card__title">${day.title}</div>
            <div class="day-card__route">${day.routeSummary}</div>
            <div class="day-card__meta">
              <span class="mode">${MODE_ICON[day.transportMode] || ""} ${MODE_LABEL[day.transportMode] || ""}</span>
              <span class="status-dot ${dotClass}"></span>
              <span>${status === "today" ? "היום" : status === "past" ? (done ? "הושלם" : "עבר") : "עתידי"}</span>
            </div>
          </div>
        </a>
      </li>`;
    }).join("");
  });
})();
