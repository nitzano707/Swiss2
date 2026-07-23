(function(){
  bootstrapPage("index.html");

  document.getElementById("iconToday").innerHTML = ICONS.pin;
  document.getElementById("iconDays").innerHTML = ICONS.days;
  document.getElementById("iconHotels").innerHTML = ICONS.hotel;
  document.getElementById("iconParking").innerHTML = ICONS.parking;
  document.getElementById("iconInfo").innerHTML = ICONS.info;

  loadTripData().then(data => {
    const { trip, days, hotels } = data;

    document.getElementById("heroTitle").textContent = trip.title;
    document.getElementById("heroDates").textContent =
      `${formatDateHe(trip.startDate)} – ${formatDateHe(trip.endDate)}`;

    const current = getCurrentDay(days);
    const status = dayStatus(current, days);
    const hotel = hotels.find(h => h.id === current.hotelId);

    const eyebrow = document.getElementById("heroEyebrow");
    if (status === "today") eyebrow.textContent = `יום ${current.id} מתוך ${days.length} · היום`;
    else if (status === "past") eyebrow.textContent = "הטיול הסתיים — סיכום";
    else eyebrow.textContent = "הטיול טרם החל";

    const board = document.getElementById("board");
    board.innerHTML = `
      <div class="board__row"><span class="board__label">${status === "today" ? "היום" : "יום קרוב"}</span><span class="board__value">${formatDateHe(current.date)} — ${current.title}</span></div>
      ${hotel ? `<div class="board__row"><span class="board__label">לינה הלילה</span><span class="board__value">${hotel.name}</span></div>` : ""}
      <div class="board__row"><span class="board__label">יציאה מתוכננת</span><span class="board__value">${current.departure || "—"}</span></div>
    `;

    document.getElementById("todayLink").href = `day.html?id=${current.id}`;
    document.getElementById("todayLinkLabel").textContent =
      status === "today" ? "היום בטיול — פתח" : (status === "past" ? "היום האחרון בטיול" : "היום הראשון בטיול");

    if (current.weather){
      const box = document.getElementById("weatherNote");
      box.style.display = "block";
      box.innerHTML = `
        <div class="eyebrow">מזג אוויר ליום ${current.id}</div>
        <div class="weather-box" style="border:none;padding:0;">
          ${ICONS.cloud}
          <p>${current.weather}</p>
        </div>
      `;
    }
  }).catch(() => {
    document.getElementById("heroEyebrow").textContent = "לא ניתן לטעון נתונים — בדוק חיבור לאינטרנט בפעם הראשונה";
  });
})();
