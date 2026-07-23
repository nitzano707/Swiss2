(function(){
  bootstrapPage("hotels.html");
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";

  const CODE_KEY = "trip_access_codes"; // { hotelId: "1234" } — stored only in this browser, never in trip.json

  loadTripData().then(data => {
    const { hotels } = data;
    const codes = readJSON(CODE_KEY, {});

    document.getElementById("hotelsList").innerHTML = hotels.map(h => `
      <div class="hotel-card">
        <div class="hotel-card__top">
          <div>
            <div class="hotel-card__name">${h.name}</div>
            <div class="faint">${h.address}</div>
          </div>
          <span class="badge">${h.dates}</span>
        </div>

        <dl class="kv">
          <dt>צ'ק־אין</dt><dd>${h.checkin || "—"}</dd>
          ${h.checkout ? `<dt>צ'ק־אאוט</dt><dd>${h.checkout}</dd>` : ""}
          <dt>חניה</dt><dd>${h.parking || "—"}</dd>
          ${h.contactLabel ? `<dt>איש קשר</dt><dd>${h.contactLabel}</dd>` : ""}
        </dl>

        <div class="gap-8" style="margin-bottom:10px;">
          <a class="btn btn--sm" href="${wazeUrl(h.address)}" target="_blank" rel="noopener">${ICONS.waze} Waze</a>
          <a class="btn btn--sm" href="${gmapsUrl(h.address)}" target="_blank" rel="noopener">${ICONS.pin} Maps</a>
          <button class="btn btn--sm" data-copy-text="${h.address.replace(/"/g,'&quot;')}">${ICONS.copy} העתק כתובת</button>
          ${h.contact ? `<a class="btn btn--sm" href="tel:${h.contact.replace(/\s/g,'')}">${ICONS.phone} התקשר</a>` : ""}
          ${h.whatsapp ? `<a class="btn btn--sm" href="https://wa.me/${h.whatsapp.replace(/[^\d]/g,'')}" target="_blank" rel="noopener">${ICONS.whatsapp} WhatsApp</a>` : ""}
        </div>

        ${h.notes ? `<p class="subtle" style="margin:0 0 10px;">${h.notes}</p>` : ""}

        <div class="access-field">
          <label style="display:block;margin-bottom:6px;font-weight:700;color:var(--ink-soft);">קוד כניסה / הערה פרטית (נשמר רק במכשיר הזה)</label>
          <input type="text" data-code-id="${h.id}" value="${(codes[h.id] || "").replace(/"/g,'&quot;')}" placeholder="לא הוזן עדיין"
            style="width:100%;border:1px solid var(--line);border-radius:6px;padding:8px 10px;background:var(--bg);color:var(--ink);font-family:inherit;font-size:14px;">
        </div>
      </div>
    `).join("");

    document.querySelectorAll("[data-copy-text]").forEach(btn => {
      btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy-text"), btn));
    });
    document.querySelectorAll("[data-code-id]").forEach(input => {
      let t;
      input.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const all = readJSON(CODE_KEY, {});
          all[input.getAttribute("data-code-id")] = input.value;
          writeJSON(CODE_KEY, all);
        }, 350);
      });
    });
  });
})();
