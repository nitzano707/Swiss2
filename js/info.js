(function(){
  bootstrapPage("info.html");
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";

  loadTripData().then(data => {
    const { trip, info } = data;

    document.getElementById("flightReturn").textContent =
      `${trip.flightReturn.route} · ${formatDateHe(trip.flightReturn.date)} · ${trip.flightReturn.time}`;

    const sections = [
      {
        title: "מספרי חירום",
        body: `<ul>${info.emergency.map(e => `<li><strong>${e.label}:</strong> ${e.value}</li>`).join("")}</ul>`
      },
      {
        title: "רכב שכור",
        body: `<ul>
          <li><strong>חברה:</strong> ${info.car.company}${info.car.driver ? " · " + info.car.driver : ""}</li>
          ${info.car.bookingRef ? `<li>${info.car.bookingRef}</li>` : ""}
          ${info.car.vehicle ? `<li><strong>הרכב:</strong> ${info.car.vehicle}</li>` : ""}
          <li><strong>איסוף:</strong> ${info.car.pickup}</li>
          <li><strong>החזרה:</strong> ${info.car.dropoff}</li>
          ${info.car.insurance ? `<li><strong>ביטוח והשתתפות עצמית:</strong> ${info.car.insurance}</li>` : ""}
          ${info.car.fuel ? `<li><strong>מדיניות דלק:</strong> ${info.car.fuel}</li>` : ""}
          ${info.car.payment ? `<li><strong>אמצעי תשלום:</strong> ${info.car.payment}</li>` : ""}
          ${info.car.documents ? `<li><strong>מסמכים נדרשים:</strong> ${info.car.documents}</li>` : ""}
          ${info.car.contact ? `<li><strong>טלפונים:</strong> ${info.car.contact}</li>` : ""}
          <li>${info.car.notes}</li>
        </ul>`
      },
      { title: "מדבקת כבישים (ויניאטה)", body: `<ul><li>${info.vignette}</li></ul>` },
      { title: "מעברי גבול", body: `<ul><li>${info.borderCrossing}</li></ul>` },
      {
        title: "שבת",
        body: `<ul>
          <li><strong>הדלקת נרות:</strong> ${info.shabbat.candleLighting}</li>
          <li>${info.shabbat.notes}</li>
        </ul>`
      },
      {
        title: "אוכל כשר",
        body: `<ul>
          <li><strong>${info.kosher.place}</strong> — ${info.kosher.address}</li>
          <li>${info.kosher.notes}</li>
        </ul>`
      },
      {
        title: "טיסות",
        body: `<ul>
          <li><strong>הלוך:</strong> ${info.flights.outbound}</li>
          <li><strong>חזור:</strong> ${info.flights.return}</li>
        </ul>`
      },
      {
        title: "מה עוד צריך להשלים",
        body: `<ul>${info.openItems.map(i => `<li>${i}</li>`).join("")}</ul>`
      }
    ];

    document.getElementById("accList").innerHTML = sections.map((s, i) => `
      <div class="acc" data-acc-idx="${i}">
        <button class="acc__head">
          <span>${s.title}</span>
          ${ICONS.chevronDown}
        </button>
        <div class="acc__body">${s.body}</div>
      </div>
    `).join("");

    document.querySelectorAll(".acc__head").forEach(head => {
      head.addEventListener("click", () => {
        head.closest(".acc").classList.toggle("is-open");
      });
    });
  });
})();
