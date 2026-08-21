import {
  CATEGORIES,
  COUNTRIES,
  PRESETS,
  YEARS,
  addDays,
  allOccurrences,
  categoryById,
  countryByCode,
  fromISODate,
  toISODate,
} from "./data.js?v=2";

const STORAGE_KEY = "lantern-festival-calendar-v1";

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedISO: toISODate(new Date()),
  countries: ["SG"],
  categories: CATEGORIES.map((category) => category.id),
  query: "",
};

const els = {
  year: document.getElementById("year"),
  search: document.getElementById("search"),
  presets: document.getElementById("presets"),
  countryPills: document.getElementById("countryPills"),
  countrySearch: document.getElementById("countrySearch"),
  viewingLabel: document.getElementById("viewingLabel"),
  categoryPills: document.getElementById("categoryPills"),
  clearCountries: document.getElementById("clearCountries"),
  pipeline: document.getElementById("pipeline"),
  monthTitle: document.getElementById("monthTitle"),
  monthGrid: document.getElementById("monthGrid"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  todayBtn: document.getElementById("todayBtn"),
  dayCard: document.getElementById("dayCard"),
  upcomingCard: document.getElementById("upcomingCard"),
  dialog: document.getElementById("detailDialog"),
  dialogInner: document.getElementById("dialogInner"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    if (Array.isArray(saved.countries) && saved.countries.length) {
      state.countries = saved.countries;
    }
    if (Array.isArray(saved.categories) && saved.categories.length) {
      state.categories = saved.categories;
    }
  } catch {
    /* ignore broken localStorage */
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      countries: state.countries,
      categories: state.categories,
    }),
  );
}

function todayISO() {
  return toISODate(new Date());
}

function clampYear(year) {
  if (YEARS.includes(year)) return year;
  if (year < YEARS[0]) return YEARS[0];
  return YEARS[YEARS.length - 1];
}

function shiftMonth(delta) {
  const date = new Date(state.year, state.month + delta, 1);
  if (!YEARS.includes(date.getFullYear())) return;
  state.year = date.getFullYear();
  state.month = date.getMonth();
  els.year.value = String(state.year);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(fromISO, toISO) {
  const from = startOfDay(fromISODate(fromISO));
  const to = startOfDay(fromISODate(toISO));
  return Math.round((to - from) / 86400000);
}

function formatLong(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRange(occ) {
  if (occ.startISO === occ.endISO) return formatLong(occ.startISO);
  const start = fromISODate(occ.startISO);
  const end = fromISODate(occ.endISO);
  const startLabel = start.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

function sameCountries(a, b) {
  return a.length === b.length && a.every((code) => b.includes(code));
}

function setCountries(codes) {
  const next = [...new Set(codes)].filter((code) => countryByCode(code));
  state.countries = next.length ? next : ["SG"];
  saveState();
}

function viewingText() {
  if (sameCountries(state.countries, COUNTRIES.map((country) => country.code))) {
    return "Now showing: all countries";
  }
  if (state.countries.length === 1) {
    const country = countryByCode(state.countries[0]);
    return `Now showing: ${country?.flag || ""} ${country?.name || state.countries[0]} only`;
  }
  return `Now showing: ${state.countries
    .map((code) => countryByCode(code)?.name)
    .filter(Boolean)
    .join(", ")}`;
}

function matchesCountry(festival) {
  return festival.countries.some((code) => state.countries.includes(code));
}

function matchesCategory(festival) {
  return state.categories.includes(festival.category);
}

function matchesQuery(festival) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    festival.name,
    festival.summary,
    ...(festival.alsoKnownAs || []),
    ...(festival.hashtags || []),
    ...(festival.contentHooks || []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function filteredOccurrences(year = state.year) {
  return allOccurrences(year)
    .filter(
      (occ) =>
        matchesCountry(occ.festival) &&
        matchesCategory(occ.festival) &&
        matchesQuery(occ.festival),
    )
    .sort((a, b) => a.startISO.localeCompare(b.startISO));
}

function windowLabel(daysUntil, leadDays, endISO = null) {
  if (daysUntil < 0 && endISO && endISO >= todayISO()) {
    return { key: "today", text: "On now" };
  }
  if (daysUntil === 0) return { key: "today", text: "Today" };
  if (daysUntil < 0) return { key: "past", text: "Passed" };
  if (daysUntil <= 6) return { key: "week", text: "This week" };
  if (daysUntil <= leadDays) return { key: "plan", text: "Plan now" };
  if (daysUntil <= 60) return { key: "horizon", text: "On the horizon" };
  return { key: "later", text: `${daysUntil} days` };
}

function uniqueByFestival(occurrences) {
  const seen = new Set();
  return occurrences.filter((occ) => {
    if (seen.has(occ.festival.id)) return false;
    seen.add(occ.festival.id);
    return true;
  });
}

function visibleCountriesFor(festival) {
  return festival.countries.filter((code) => state.countries.includes(code));
}

function isPublicHoliday(festival) {
  return (festival.publicHolidayIn || []).some((code) =>
    state.countries.includes(code),
  );
}

function flagList(codes) {
  return codes
    .map((code) => countryByCode(code))
    .filter(Boolean)
    .map((country) => country.flag)
    .join(" ");
}

function renderYearSelect() {
  const nowYear = new Date().getFullYear();
  els.year.innerHTML = YEARS.map(
    (year) =>
      `<option value="${year}">${year}${year === nowYear ? " · now" : ""}</option>`,
  ).join("");
  els.year.value = String(state.year);
}

function renderPresets() {
  els.presets.innerHTML = PRESETS.map((preset) => {
    const active =
      preset.countries.length === state.countries.length &&
      preset.countries.every((code) => state.countries.includes(code));
    return `<button type="button" class="chip" data-preset="${preset.id}" aria-pressed="${active}">${preset.label}</button>`;
  }).join("");
}

function renderCountryPills() {
  if (els.viewingLabel) {
    const count = uniqueByFestival(filteredOccurrences()).length;
    els.viewingLabel.textContent = `${viewingText()} · ${count} festivals in ${state.year}`;
  }
  const q = (els.countrySearch?.value || "").trim().toLowerCase();
  const visible = COUNTRIES.filter((country) => {
    if (!q) return true;
    return (
      country.name.toLowerCase().includes(q) ||
      country.code.toLowerCase().includes(q)
    );
  });
  if (!visible.length) {
    els.countryPills.innerHTML = '<span class="muted">No countries match that search.</span>';
    return;
  }
  els.countryPills.innerHTML = visible
    .map((country) => {
      const active = state.countries.includes(country.code);
      return `<button type="button" class="chip" data-country="${country.code}" aria-pressed="${active}">${country.flag} ${country.name}</button>`;
    })
    .join("");
}

function renderCategories() {
  els.categoryPills.innerHTML = CATEGORIES.map((category) => {
    const active = state.categories.includes(category.id);
    return `<button type="button" class="pill ${active ? "active" : ""}" data-category="${category.id}">
      <span class="dot" style="background:${category.color}"></span>${category.label}
    </button>`;
  }).join("");
}

function pipelineItems() {
  const today = todayISO();
  return uniqueByFestival(filteredOccurrences())
    .map((occ) => {
      const daysUntil = diffDays(today, occ.startISO);
      const label = windowLabel(daysUntil, occ.festival.leadDays, occ.endISO);
      return { occ, daysUntil, label };
    })
    .filter((item) => item.occ.endISO >= today && item.daysUntil <= 60)
    .slice(0, 8);
}

function renderPipeline() {
  const items = pipelineItems();
  if (!items.length) {
    els.pipeline.innerHTML = `
      <h2>Content pipeline</h2>
      <p class="pipeline-empty">Nothing in the next 60 days for this filter. Jump months, or add a country.</p>`;
    return;
  }
  els.pipeline.innerHTML = `
    <h2>Plan these next</h2>
    <p class="muted">${viewingText()}. Festivals in the next 60 days.</p>
    <div class="pipeline-list">
      ${items
        .map(({ occ, daysUntil, label }) => {
          const when =
            daysUntil < 0
              ? "happening now"
              : daysUntil === 0
                ? "today"
                : daysUntil === 1
                  ? "tomorrow"
                  : `in ${daysUntil} days`;
          return `<button type="button" class="plan-card" data-open="${occ.festival.id}" data-date="${occ.startISO}">
            <span class="badge ${label.key}">${label.text}</span>
            <h3>${occ.festival.name}</h3>
            <p class="muted">${formatRange(occ)} · ${when}</p>
            <p class="muted">${occ.festival.contentHooks[0]}</p>
          </button>`;
        })
        .join("")}
    </div>`;
}

function monthCells() {
  const first = new Date(state.year, state.month, 1);
  const startOffset = first.getDay();
  const cells = [];
  const cursor = new Date(state.year, state.month, 1 - startOffset);
  for (let i = 0; i < 42; i += 1) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function occsOnDay(iso) {
  return filteredOccurrences().filter((occ) => occ.dates.includes(iso));
}

function renderCalendar() {
  const title = new Date(state.year, state.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  els.monthTitle.textContent = title;
  const today = todayISO();
  els.monthGrid.innerHTML = monthCells()
    .map((date) => {
      const iso = toISODate(date);
      const inMonth = date.getMonth() === state.month;
      const occs = uniqueByFestival(occsOnDay(iso));
      const named = occs.filter(
        (occ) => occ.days <= 5 || occ.startISO === iso || occ.endISO === iso,
      );
      const names = named
        .slice(0, 2)
        .map(
          (occ) =>
            `<span class="day-fest">${flagList(visibleCountriesFor(occ.festival))} ${occ.festival.name}</span>`,
        )
        .join("");
      const extra =
        named.length > 2 ? `<span class="day-fest">+${named.length - 2} more</span>` : "";
      const dots = occs
        .slice(0, 5)
        .map((occ) => {
          const color = categoryById(occ.festival.category)?.color || "#c46b3a";
          return `<span class="dot" style="background:${color}"></span>`;
        })
        .join("");
      const cls = [
        "day",
        inMonth ? "" : "out",
        iso === today ? "today" : "",
        iso === state.selectedISO ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<button type="button" class="${cls}" data-iso="${iso}">
        <span class="day-num">${date.getDate()}</span>
        ${names}${extra}
        <span class="dots">${dots}</span>
      </button>`;
    })
    .join("");
}

function occButton(occ, extraClass = "") {
  const cat = categoryById(occ.festival.category);
  const holiday = isPublicHoliday(occ.festival)
    ? '<span class="ph-tag">Public holiday</span>'
    : "";
  const flags = flagList(visibleCountriesFor(occ.festival));
  return `<button type="button" class="fest-item ${extraClass}" data-open="${occ.festival.id}" data-date="${occ.startISO}">
    <div class="flags">${flags} ${holiday}</div>
    <h3>${occ.festival.name}</h3>
    <p class="muted">${formatRange(occ)} · ${cat?.label || ""}</p>
  </button>`;
}

function renderDayCard() {
  const occs = uniqueByFestival(occsOnDay(state.selectedISO));
  const heading = formatLong(state.selectedISO);
  if (!occs.length) {
    els.dayCard.innerHTML = `
      <h2>${heading}</h2>
      <p class="muted">No matching festivals on this day. Pick another date, or widen the country filter.</p>`;
    return;
  }
  els.dayCard.innerHTML = `
    <h2>${heading}</h2>
    <div class="fest-list">${occs.map((occ) => occButton(occ)).join("")}</div>`;
}

function renderUpcoming() {
  const today = todayISO();
  const upcoming = uniqueByFestival(filteredOccurrences())
    .filter((occ) => occ.endISO >= today)
    .slice(0, 10);
  if (!upcoming.length) {
    els.upcomingCard.innerHTML = `
      <h2>Upcoming</h2>
      <p class="muted">No upcoming festivals in ${state.year} for this filter.</p>`;
    return;
  }
  els.upcomingCard.innerHTML = `
    <h2>Upcoming</h2>
    <div class="fest-list">
      ${upcoming
        .map((occ) => {
          const days = diffDays(today, occ.startISO);
          const when =
            days <= 0 ? "On now / today" : days === 1 ? "Tomorrow" : `In ${days} days`;
          return occButton(occ).replace(
            "</h3>",
            `</h3><p class="muted">${when}</p>`,
          );
        })
        .join("")}
    </div>`;
}

function briefText(occ) {
  const festival = occ.festival;
  const countries = visibleCountriesFor(festival)
    .map((code) => countryByCode(code)?.name)
    .filter(Boolean)
    .join(", ");
  return [
    `${festival.name} — ${formatRange(occ)}`,
    countries ? `Markets: ${countries}` : "",
    festival.alsoKnownAs?.length
      ? `Also known as: ${festival.alsoKnownAs.join(", ")}`
      : "",
    "",
    festival.summary,
    "",
    "Why it matters for content:",
    festival.whyItMatters,
    "",
    "Hooks:",
    ...festival.contentHooks.map((hook) => `- ${hook}`),
    "",
    `Visuals: ${festival.visuals.join(", ")}`,
    `Hashtags: ${festival.hashtags.join(" ")}`,
    `Suggested start: ${festival.leadDays} days before (${formatLong(toISODate(addDays(fromISODate(occ.startISO), -festival.leadDays)))})`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function openDetail(festivalId, iso) {
  const occ =
    filteredOccurrences().find(
      (item) => item.festival.id === festivalId && item.dates.includes(iso),
    ) ||
    allOccurrences(state.year).find(
      (item) => item.festival.id === festivalId && item.startISO === iso,
    ) ||
    allOccurrences(state.year).find((item) => item.festival.id === festivalId);
  if (!occ) return;
  const festival = occ.festival;
  const cat = categoryById(festival.category);
  const daysUntil = diffDays(todayISO(), occ.startISO);
  const label = windowLabel(daysUntil, festival.leadDays, occ.endISO);
  const holiday = isPublicHoliday(festival)
    ? '<p class="ph-tag">Public holiday in a selected country</p>'
    : "";
  els.dialogInner.innerHTML = `
    <div class="dialog-head">
      <div>
        <span class="badge ${label.key}">${label.text}</span>
        <h2>${festival.name}</h2>
        <p class="muted">${formatRange(occ)} · ${cat?.label || ""}</p>
        ${holiday}
      </div>
      <button type="button" class="close-btn" data-close aria-label="Close">×</button>
    </div>
    <p>${festival.summary}</p>
    <p><strong>Why it matters:</strong> ${festival.whyItMatters}</p>
    <p class="muted">Also known as: ${festival.alsoKnownAs.length ? festival.alsoKnownAs.join(", ") : "—"}</p>
    <p class="muted">Countries: ${festival.countries.map((code) => `${countryByCode(code)?.flag || ""} ${countryByCode(code)?.name || code}`).join(" · ")}</p>
    <p><strong>Content hooks</strong></p>
    <ul class="hooks">${festival.contentHooks.map((hook) => `<li>${hook}</li>`).join("")}</ul>
    <div class="chip-row">
      ${festival.visuals.map((visual) => `<span class="soft-chip">${visual}</span>`).join("")}
    </div>
    <p class="muted">${festival.hashtags.join(" ")}</p>
    <button type="button" class="copy-btn" data-copy>Copy content brief</button>
  `;
  els.dialog.showModal();
  const copyBtn = els.dialogInner.querySelector("[data-copy]");
  copyBtn.addEventListener("click", async () => {
    const text = briefText(occ);
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Copy failed — select the text instead";
    }
  });
}

function jumpTo(iso) {
  const date = fromISODate(iso);
  state.year = clampYear(date.getFullYear());
  state.month = date.getMonth();
  state.selectedISO = iso;
  els.year.value = String(state.year);
  render();
}

function render() {
  renderPresets();
  renderCountryPills();
  renderCategories();
  renderPipeline();
  renderCalendar();
  renderDayCard();
  renderUpcoming();
}

function bind() {
  els.year.addEventListener("change", () => {
    state.year = Number(els.year.value);
    if (fromISODate(state.selectedISO).getFullYear() !== state.year) {
      state.selectedISO = toISODate(new Date(state.year, state.month, 1));
    }
    render();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    render();
  });

  els.presets.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = PRESETS.find((item) => item.id === button.dataset.preset);
    if (!preset) return;
    setCountries(preset.countries);
    render();
  });

  els.countryPills.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country]");
    if (!button) return;
    const code = button.dataset.country;
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    if (additive) {
      if (state.countries.includes(code)) {
        setCountries(state.countries.filter((item) => item !== code));
      } else {
        setCountries([...state.countries, code]);
      }
    } else {
      setCountries([code]);
    }
    render();
  });

  els.countrySearch.addEventListener("input", () => {
    renderCountryPills();
  });

  els.clearCountries.addEventListener("click", () => {
    setCountries(["SG"]);
    if (els.countrySearch) els.countrySearch.value = "";
    render();
  });

  els.categoryPills.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    const id = button.dataset.category;
    if (state.categories.includes(id)) {
      if (state.categories.length === 1) return;
      state.categories = state.categories.filter((item) => item !== id);
    } else {
      state.categories.push(id);
    }
    saveState();
    render();
  });

  els.prevMonth.addEventListener("click", () => {
    shiftMonth(-1);
    render();
  });

  els.nextMonth.addEventListener("click", () => {
    shiftMonth(1);
    render();
  });

  els.todayBtn.addEventListener("click", () => {
    const now = new Date();
    state.year = clampYear(now.getFullYear());
    state.month = now.getMonth();
    state.selectedISO = todayISO();
    els.year.value = String(state.year);
    render();
  });

  els.monthGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-iso]");
    if (!button) return;
    state.selectedISO = button.dataset.iso;
    const date = fromISODate(state.selectedISO);
    state.year = date.getFullYear();
    state.month = date.getMonth();
    els.year.value = String(state.year);
    render();
  });

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    if (open) {
      openDetail(open.dataset.open, open.dataset.date || state.selectedISO);
    }
    if (event.target.closest("[data-close]")) {
      els.dialog.close();
    }
  });

  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) els.dialog.close();
  });
}

function init() {
  loadState();
  const now = new Date();
  state.year = clampYear(now.getFullYear());
  state.month = now.getMonth();
  state.selectedISO = todayISO();
  renderYearSelect();
  bind();
  render();
}

init();
