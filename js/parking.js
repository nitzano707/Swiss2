(function(){
  bootstrapPage("parking.html");
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";

  loadTripData().then(data => {
    const { parking } = data;
    document.getElementById("parkingList").innerHTML = parking.map(p => `
      <div class="card parking-card">
        <div class="parking-card__top">
          <div>
            <div class="parking-card__name">${p.name}</div>
            <div class="faint">${p.location}</div>
          </div>
          ${p.price ? `<span class="parking-card__price">${p.price}</span>` : ""}
        </div>
        ${p.hours ? `<p class="subtle" style="margin:4px 0 0;">שעות: ${p.hours}</p>` : ""}
        ${p.notes ? `<p class="subtle" style="margin:4px 0 10px;">${p.notes}</p>` : `<div style="margin-bottom:2px;"></div>`}
        <div class="gap-8">
          <a class="btn btn--primary btn--sm" href="${wazeUrl(p.wazeQuery)}" target="_blank" rel="noopener">${ICONS.waze} Waze</a>
          <a class="btn btn--sm" href="${gmapsUrl(p.wazeQuery)}" target="_blank" rel="noopener">${ICONS.pin} Maps</a>
          <button class="btn btn--sm" data-copy-text="${p.wazeQuery.replace(/"/g,'&quot;')}">${ICONS.copy} העתק</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll("[data-copy-text]").forEach(btn => {
      btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy-text"), btn));
    });
  });
})();
