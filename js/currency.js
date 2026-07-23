(function(){
  bootstrapPage(null);
  document.getElementById("backIcon").innerHTML = ICONS.back + "<span>בית</span>";
  document.getElementById("fxSwap").innerHTML = ICONS.chevronDown;
  document.getElementById("refreshIcon").innerHTML = ICONS.cloud;

  const RATES_KEY = "trip_fx_rates"; // { CHF: 3.9, EUR: 4.2, fetchedAt: 169... }
  const FALLBACK_RATES = { CHF: 3.9, EUR: 4.2 }; // approximate — used only until a live fetch succeeds

  const amount1 = document.getElementById("fxAmount1");
  const amount2 = document.getElementById("fxAmount2");
  const ccy1 = document.getElementById("fxCcy1");
  const ccy2 = document.getElementById("fxCcy2");
  const rateCHFInput = document.getElementById("rateCHF");
  const rateEURInput = document.getElementById("rateEUR");
  const updatedEl = document.getElementById("ratesUpdated");

  let rates = readJSON(RATES_KEY, null) || { ...FALLBACK_RATES, fetchedAt: null };
  rateCHFInput.value = rates.CHF;
  rateEURInput.value = rates.EUR;
  showUpdated();

  function ilsPerUnit(ccy){
    if (ccy === "ILS") return 1;
    return Number(ccy === "CHF" ? rateCHFInput.value : rateEURInput.value) || 0;
  }
  function convert(amount, from, to){
    const ils = amount * ilsPerUnit(from);
    return ilsPerUnit(to) ? ils / ilsPerUnit(to) : 0;
  }
  function round(n){
    return Math.round(n * 100) / 100;
  }
  function showUpdated(){
    if (!rates.fetchedAt){
      updatedEl.textContent = "שערים ראשוניים משוערים — לחצו \"עדכן שערים\" כשיש אינטרנט";
      return;
    }
    const d = new Date(rates.fetchedAt);
    updatedEl.textContent = `שערי ECB עודכנו לאחרונה: ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  function recalcFrom1(){
    amount2.value = round(convert(Number(amount1.value) || 0, ccy1.value, ccy2.value));
  }
  function recalcFrom2(){
    amount1.value = round(convert(Number(amount2.value) || 0, ccy2.value, ccy1.value));
  }

  amount1.addEventListener("input", recalcFrom1);
  ccy1.addEventListener("change", recalcFrom1);
  amount2.addEventListener("input", recalcFrom2);
  ccy2.addEventListener("change", recalcFrom2);
  rateCHFInput.addEventListener("input", () => { rates.CHF = Number(rateCHFInput.value) || 0; writeJSON(RATES_KEY, rates); recalcFrom1(); });
  rateEURInput.addEventListener("input", () => { rates.EUR = Number(rateEURInput.value) || 0; writeJSON(RATES_KEY, rates); recalcFrom1(); });

  document.getElementById("fxSwap").addEventListener("click", () => {
    const c1 = ccy1.value, c2 = ccy2.value;
    ccy1.value = c2; ccy2.value = c1;
    recalcFrom1();
  });

  document.getElementById("refreshRates").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const original = btn.innerHTML;
    btn.innerHTML = "טוען שערים…";
    btn.disabled = true;
    try{
      const [chfRes, eurRes] = await Promise.all([
        fetch("https://api.frankfurter.app/latest?from=CHF&to=ILS"),
        fetch("https://api.frankfurter.app/latest?from=EUR&to=ILS")
      ]);
      const chfJson = await chfRes.json();
      const eurJson = await eurRes.json();
      rates = { CHF: chfJson.rates.ILS, EUR: eurJson.rates.ILS, fetchedAt: Date.now() };
      writeJSON(RATES_KEY, rates);
      rateCHFInput.value = round(rates.CHF);
      rateEURInput.value = round(rates.EUR);
      showUpdated();
      recalcFrom1();
    } catch(err){
      updatedEl.textContent = "אין חיבור לאינטרנט כרגע — מוצגים השערים השמורים.";
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  });

  // initial calc + auto-refresh on load if online
  recalcFrom1();
  if (navigator.onLine) document.getElementById("refreshRates").click();
})();
