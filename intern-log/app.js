(() => {
  const STORAGE_KEY = "sprig-intern-log-v1";
  const VIEW_KEY = "sprig-view-v1";

  const els = {
    tabDashboard: document.getElementById("tabDashboard"),
    tabDay: document.getElementById("tabDay"),
    viewDashboard: document.getElementById("viewDashboard"),
    viewDay: document.getElementById("viewDay"),
    openToday: document.getElementById("openToday"),
    copyWeek: document.getElementById("copyWeek"),
    backDashboard: document.getElementById("backDashboard"),
    statDays: document.getElementById("statDays"),
    statDone: document.getElementById("statDone"),
    statTodo: document.getElementById("statTodo"),
    statStreak: document.getElementById("statStreak"),
    weekStrip: document.getElementById("weekStrip"),
    weekDoneCount: document.getElementById("weekDoneCount"),
    openTodoList: document.getElementById("openTodoList"),
    openTodoEmpty: document.getElementById("openTodoEmpty"),
    openTodoCount: document.getElementById("openTodoCount"),
    recentList: document.getElementById("recentList"),
    recentEmpty: document.getElementById("recentEmpty"),
    prevDay: document.getElementById("prevDay"),
    nextDay: document.getElementById("nextDay"),
    dateLabel: document.getElementById("dateLabel"),
    datePicker: document.getElementById("datePicker"),
    weekdayLabel: document.getElementById("weekdayLabel"),
    dayTitle: document.getElementById("dayTitle"),
    dayHint: document.getElementById("dayHint"),
    todoForm: document.getElementById("todoForm"),
    todoInput: document.getElementById("todoInput"),
    todoDetail: document.getElementById("todoDetail"),
    todoList: document.getElementById("todoList"),
    todoEmpty: document.getElementById("todoEmpty"),
    todoCount: document.getElementById("todoCount"),
    doneForm: document.getElementById("doneForm"),
    doneInput: document.getElementById("doneInput"),
    doneDetail: document.getElementById("doneDetail"),
    doneList: document.getElementById("doneList"),
    doneEmpty: document.getElementById("doneEmpty"),
    doneCount: document.getElementById("doneCount"),
    stickyForm: document.getElementById("stickyForm"),
    stickyTitle: document.getElementById("stickyTitle"),
    stickyBody: document.getElementById("stickyBody"),
    stickyBoard: document.getElementById("stickyBoard"),
    stickyEmpty: document.getElementById("stickyEmpty"),
    saveSticky: document.getElementById("saveSticky"),
    swatches: [...document.querySelectorAll(".swatch")],
    jumpToday: document.getElementById("jumpToday"),
    copyDay: document.getElementById("copyDay"),
    saveStatus: document.getElementById("saveStatus"),
    toast: document.getElementById("toast"),
    moods: [...document.querySelectorAll(".mood")],
  };

  let selectedDate = todayKey();
  let currentView = localStorage.getItem(VIEW_KEY) === "day" ? "day" : "dashboard";
  let store = loadStore();
  let toastTimer = null;
  let stickyColor = "butter";
  const openEditors = new Set();

  function todayKey() {
    return formatKey(new Date());
  }

  function formatKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftDay(key, delta) {
    const date = parseKey(key);
    date.setDate(date.getDate() + delta);
    return formatKey(date);
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { days: {} };
      const parsed = JSON.parse(raw);
      return parsed?.days ? parsed : { days: {} };
    } catch {
      return { days: {} };
    }
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    if (els.saveStatus) els.saveStatus.textContent = "Saved on this device";
  }

  function emptyDay() {
    return { todos: [], dones: [], note: "", mood: "", stickies: [] };
  }

  function dayData(key = selectedDate) {
    if (!store.days[key]) store.days[key] = emptyDay();
    const day = store.days[key];
    if (!Array.isArray(day.stickies)) day.stickies = [];
    // Migrate old single note into a sticky once
    if (day.note && day.note.trim() && day.stickies.length === 0) {
      day.stickies.push({
        id: uid(),
        title: "Day note",
        body: day.note.trim(),
        color: "butter",
        createdAt: Date.now(),
      });
      day.note = "";
      saveStore();
    }
    return day;
  }

  function peekDay(key) {
    const day = store.days[key];
    if (!day) return emptyDay();
    if (!Array.isArray(day.stickies)) day.stickies = [];
    return day;
  }

  function dayHasContent(day) {
    return Boolean(
      (day.todos && day.todos.length) ||
        (day.dones && day.dones.length) ||
        (day.stickies && day.stickies.length) ||
        (day.note && day.note.trim()) ||
        day.mood
    );
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    requestAnimationFrame(() => {
      els.toast.classList.add("show");
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove("show");
      setTimeout(() => {
        els.toast.hidden = true;
      }, 320);
    }, 2600);
  }

  function prettyDate(key) {
    const isToday = key === todayKey();
    const isYesterday = key === shiftDay(todayKey(), -1);
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return parseKey(key).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function moodLabel(mood) {
    return mood || "no mood";
  }

  function setView(view) {
    currentView = view === "day" ? "day" : "dashboard";
    localStorage.setItem(VIEW_KEY, currentView);

    const isDash = currentView === "dashboard";
    els.viewDashboard.hidden = !isDash;
    els.viewDay.hidden = isDash;
    els.tabDashboard.setAttribute("aria-selected", isDash ? "true" : "false");
    els.tabDay.setAttribute("aria-selected", isDash ? "false" : "true");

    if (isDash) renderDashboard();
    else renderDay();
  }

  function openDay(key) {
    selectedDate = key > todayKey() ? todayKey() : key;
    setView("day");
  }

  function contentKeys() {
    return Object.keys(store.days)
      .filter((key) => dayHasContent(store.days[key]))
      .sort((a, b) => (a < b ? 1 : -1));
  }

  function computeStreak() {
    let streak = 0;
    let cursor = todayKey();
    if (!dayHasContent(peekDay(cursor))) {
      cursor = shiftDay(cursor, -1);
    }
    while (dayHasContent(peekDay(cursor))) {
      streak += 1;
      cursor = shiftDay(cursor, -1);
    }
    return streak;
  }

  function weekKeys() {
    const end = todayKey();
    const keys = [];
    for (let i = 6; i >= 0; i -= 1) keys.push(shiftDay(end, -i));
    return keys;
  }

  function renderDashboard() {
    const keys = contentKeys();
    let totalDone = 0;
    let totalTodo = 0;
    const openItems = [];

    keys.forEach((key) => {
      const day = peekDay(key);
      totalDone += day.dones.length;
      totalTodo += day.todos.length;
      day.todos.forEach((item) => {
        openItems.push({
          key,
          text: item.text,
          detail: item.detail || "",
          id: item.id,
        });
      });
    });

    els.statDays.textContent = String(keys.length);
    els.statDone.textContent = String(totalDone);
    els.statTodo.textContent = String(totalTodo);
    els.statStreak.textContent = String(computeStreak());

    const week = weekKeys();
    let weekDone = 0;
    els.weekStrip.innerHTML = "";
    week.forEach((key) => {
      const day = peekDay(key);
      const done = day.dones.length;
      const todo = day.todos.length;
      weekDone += done;
      const activity =
        done +
        todo +
        (day.stickies?.length || 0) +
        (day.note?.trim() ? 1 : 0) +
        (day.mood ? 1 : 0);
      const height = activity === 0 ? 0.18 : Math.min(1, 0.28 + activity * 0.16);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `week-day${key === todayKey() ? " is-today" : ""}${
        activity === 0 ? " is-empty" : ""
      }`;
      btn.setAttribute(
        "aria-label",
        `${prettyDate(key)}: ${done} done, ${todo} to-do`
      );
      btn.innerHTML = `
        <span class="week-label">${parseKey(key).toLocaleDateString(undefined, {
          weekday: "short",
        })}</span>
        <span class="week-bar" style="transform: scaleY(${height})"></span>
        <span class="week-count">${done}</span>
      `;
      btn.addEventListener("click", () => openDay(key));
      els.weekStrip.appendChild(btn);
    });
    els.weekDoneCount.textContent = `${weekDone} done`;

    els.openTodoList.innerHTML = "";
    els.openTodoCount.textContent = String(openItems.length);
    els.openTodoEmpty.hidden = openItems.length > 0;
    openItems.slice(0, 8).forEach((item) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dash-item";
      btn.innerHTML = `
        <div>
          <p class="dash-item-title"></p>
          <p class="dash-item-meta"></p>
        </div>
        <span class="dash-item-side">open</span>
      `;
      btn.querySelector(".dash-item-title").textContent = item.text;
      const meta = item.detail?.trim()
        ? `${prettyDate(item.key)} · ${item.detail.trim()}`
        : prettyDate(item.key);
      btn.querySelector(".dash-item-meta").textContent = meta;
      btn.addEventListener("click", () => openDay(item.key));
      li.appendChild(btn);
      els.openTodoList.appendChild(li);
    });

    els.recentList.innerHTML = "";
    els.recentEmpty.hidden = keys.length > 0;
    keys.slice(0, 8).forEach((key) => {
      const day = peekDay(key);
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dash-item";
      btn.innerHTML = `
        <div>
          <p class="dash-item-title"></p>
          <p class="dash-item-meta"></p>
        </div>
        <span class="dash-item-side"></span>
      `;
      btn.querySelector(".dash-item-title").textContent = prettyDate(key);
      btn.querySelector(".dash-item-meta").textContent = `${day.dones.length} done · ${
        day.todos.length
      } to-do · ${moodLabel(day.mood)}`;
      btn.querySelector(".dash-item-side").textContent = parseKey(key).toLocaleDateString(
        undefined,
        { weekday: "short" }
      );
      btn.addEventListener("click", () => openDay(key));
      li.appendChild(btn);
      els.recentList.appendChild(li);
    });
  }

  function updateChrome() {
    const date = parseKey(selectedDate);
    const isToday = selectedDate === todayKey();

    els.dateLabel.textContent = prettyDate(selectedDate);
    els.datePicker.value = selectedDate;
    els.weekdayLabel.textContent = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    els.dayTitle.textContent = isToday
      ? "What grew today?"
      : prettyDate(selectedDate) === "Yesterday"
        ? "What grew yesterday?"
        : "How did this day grow?";

    els.dayHint.textContent = isToday
      ? "Plant a to-do, pin a sticky reminder, and keep track of what grew today."
      : "Flip through past days anytime — everything stays on this device.";

    els.nextDay.disabled = isToday;
    els.nextDay.style.opacity = isToday ? "0.35" : "1";
  }

  function checkIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function formatItemLine(item, mark = "-") {
    const detail = (item.detail || "").trim();
    return detail
      ? `${mark} ${item.text}\n  ${detail.replace(/\n/g, "\n  ")}`
      : `${mark} ${item.text}`;
  }

  function renderList(kind) {
    const data = dayData();
    const items = kind === "todo" ? data.todos : data.dones;
    const listEl = kind === "todo" ? els.todoList : els.doneList;
    const emptyEl = kind === "todo" ? els.todoEmpty : els.doneEmpty;
    const countEl = kind === "todo" ? els.todoCount : els.doneCount;

    listEl.innerHTML = "";
    countEl.textContent = String(items.length);
    emptyEl.hidden = items.length > 0;

    items.forEach((item) => {
      if (typeof item.detail !== "string") item.detail = "";
      const isOpen = openEditors.has(item.id);
      const li = document.createElement("li");
      li.className = `item ${kind === "done" || item.done ? "done-item" : ""} ${
        item.done ? "is-checked" : ""
      }${isOpen ? " is-open" : ""}`;
      li.dataset.id = item.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "check";
      check.setAttribute(
        "aria-label",
        item.done || kind === "done" ? "Mark as not done" : "Mark as done"
      );
      check.innerHTML = checkIcon();

      const main = document.createElement("div");
      main.className = "item-main";

      const top = document.createElement("div");
      top.className = "item-top";

      const text = document.createElement("p");
      text.className = "item-text";
      text.textContent = item.text;

      const detailBtn = document.createElement("button");
      detailBtn.type = "button";
      detailBtn.className = "detail-btn";
      detailBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      detailBtn.textContent = isOpen
        ? "Close"
        : item.detail?.trim()
          ? "Edit info"
          : "Add info";

      top.append(text, detailBtn);
      main.appendChild(top);

      if (!isOpen && item.detail?.trim()) {
        const preview = document.createElement("p");
        preview.className = "item-detail-preview";
        preview.textContent = item.detail.trim();
        main.appendChild(preview);
      }

      if (isOpen) {
        const editor = document.createElement("div");
        editor.className = "item-editor";

        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.className = "item-edit-title";
        titleInput.maxLength = 200;
        titleInput.value = item.text;
        titleInput.setAttribute("aria-label", "Task title");

        const detailInput = document.createElement("textarea");
        detailInput.className = "item-edit-detail";
        detailInput.rows = 3;
        detailInput.maxLength = 1000;
        detailInput.value = item.detail || "";
        detailInput.placeholder = "Add notes, links, blockers, next steps…";
        detailInput.setAttribute("aria-label", "Task details");

        const actions = document.createElement("div");
        actions.className = "item-editor-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "add-btn";
        saveBtn.textContent = "Save info";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "ghost-btn";
        cancelBtn.textContent = "Cancel";

        const saveEdits = () => {
          const nextTitle = titleInput.value.trim();
          if (!nextTitle) {
            showToast("Task needs a title");
            titleInput.focus();
            return;
          }
          item.text = nextTitle;
          item.detail = detailInput.value.trim();
          openEditors.delete(item.id);
          saveStore();
          renderList(kind);
          showToast("Task info saved");
        };

        saveBtn.addEventListener("click", saveEdits);
        cancelBtn.addEventListener("click", () => {
          openEditors.delete(item.id);
          renderList(kind);
        });
        titleInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveEdits();
          }
        });

        actions.append(saveBtn, cancelBtn);
        editor.append(titleInput, detailInput, actions);
        main.appendChild(editor);
        requestAnimationFrame(() => detailInput.focus());
      }

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.setAttribute("aria-label", "Delete item");
      del.innerHTML = "×";

      check.addEventListener("click", () => toggleItem(kind, item.id));
      del.addEventListener("click", () => removeItem(kind, item.id));
      detailBtn.addEventListener("click", () => {
        if (openEditors.has(item.id)) openEditors.delete(item.id);
        else openEditors.add(item.id);
        renderList(kind);
      });

      li.append(check, main, del);
      listEl.appendChild(li);
    });
  }

  function renderMood() {
    const data = dayData();
    els.moods.forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.mood === data.mood ? "true" : "false");
    });
  }

  function renderStickies() {
    const data = dayData();
    els.stickyBoard.innerHTML = "";
    els.stickyEmpty.hidden = data.stickies.length > 0;

    data.stickies.forEach((sticky) => {
      const note = document.createElement("article");
      note.className = `sticky-note sticky-card color-${sticky.color || "butter"}`;

      if (sticky.title?.trim()) {
        const title = document.createElement("h3");
        title.className = "sticky-card-title";
        title.textContent = sticky.title.trim();
        note.appendChild(title);
      }

      const body = document.createElement("p");
      body.className = "sticky-card-body";
      body.textContent = sticky.body || "";
      note.appendChild(body);

      const foot = document.createElement("div");
      foot.className = "sticky-card-foot";

      const time = document.createElement("span");
      time.className = "sticky-card-time";
      time.textContent = new Date(sticky.createdAt || Date.now()).toLocaleTimeString(
        undefined,
        { hour: "numeric", minute: "2-digit" }
      );

      const del = document.createElement("button");
      del.type = "button";
      del.className = "sticky-delete";
      del.setAttribute("aria-label", "Delete sticky");
      del.textContent = "×";
      del.addEventListener("click", () => {
        data.stickies = data.stickies.filter((s) => s.id !== sticky.id);
        saveStore();
        renderStickies();
        showToast("Sticky removed");
      });

      foot.append(time, del);
      note.appendChild(foot);
      els.stickyBoard.appendChild(note);
    });
  }

  function renderDay() {
    updateChrome();
    renderList("todo");
    renderList("done");
    renderMood();
    renderStickies();
    syncComposerColor();
  }

  function syncComposerColor() {
    els.stickyForm.className = `sticky-composer sticky-note color-${stickyColor}`;
    els.swatches.forEach((swatch) => {
      const active = swatch.dataset.color === stickyColor;
      swatch.classList.toggle("is-active", active);
      swatch.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function saveStickyReminder() {
    const body = els.stickyBody.value.trim();
    if (!body) {
      showToast("Write something on the sticky first");
      els.stickyBody.focus();
      return;
    }
    const data = dayData();
    data.stickies.unshift({
      id: uid(),
      title: els.stickyTitle.value.trim(),
      body,
      color: stickyColor,
      createdAt: Date.now(),
    });
    saveStore();
    els.stickyTitle.value = "";
    els.stickyBody.value = "";
    renderStickies();
    showToast("Sticky saved");
    els.stickyBody.focus();
  }

  function refresh() {
    if (currentView === "dashboard") renderDashboard();
    else renderDay();
  }

  function addItem(kind, text, detail = "") {
    const trimmed = text.trim();
    if (!trimmed) return;
    const data = dayData();
    const entry = {
      id: uid(),
      text: trimmed,
      detail: detail.trim(),
      done: kind === "done",
      createdAt: Date.now(),
    };
    if (kind === "todo") data.todos.unshift(entry);
    else data.dones.unshift(entry);
    if (entry.detail) openEditors.delete(entry.id);
    saveStore();
    renderList(kind);
  }

  function removeItem(kind, id) {
    const data = dayData();
    if (kind === "todo") data.todos = data.todos.filter((i) => i.id !== id);
    else data.dones = data.dones.filter((i) => i.id !== id);
    openEditors.delete(id);
    saveStore();
    renderList(kind);
  }

  function toggleItem(kind, id) {
    const data = dayData();

    if (kind === "todo") {
      const idx = data.todos.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const [item] = data.todos.splice(idx, 1);
      item.done = true;
      data.dones.unshift(item);
    } else {
      const idx = data.dones.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const [item] = data.dones.splice(idx, 1);
      item.done = false;
      data.todos.unshift(item);
    }

    saveStore();
    renderList("todo");
    renderList("done");
  }

  function setDate(key) {
    const max = todayKey();
    selectedDate = key > max ? max : key;
    renderDay();
  }

  function buildDaySummary(key = selectedDate) {
    const data = peekDay(key);
    const title = parseKey(key).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const lines = [
      `Sprig — ${title}`,
      data.mood ? `Mood: ${data.mood}` : null,
      "",
      "Done:",
      ...(data.dones.length
        ? data.dones.map((i) => formatItemLine(i, "-"))
        : ["- (none yet)"]),
      "",
      "To do:",
      ...(data.todos.length
        ? data.todos.map((i) => formatItemLine(i, "-"))
        : ["- (none yet)"]),
    ];

    if (data.stickies?.length) {
      lines.push("", "Stickies:");
      data.stickies.forEach((s) => {
        lines.push(s.title?.trim() ? `- ${s.title.trim()}: ${s.body}` : `- ${s.body}`);
      });
    } else if (data.note?.trim()) {
      lines.push("", "Note:", data.note.trim());
    }

    return lines.filter((line) => line !== null).join("\n");
  }

  function buildWeekSummary() {
    const lines = ["Sprig — week summary", ""];
    weekKeys().forEach((key) => {
      const day = peekDay(key);
      if (!dayHasContent(day)) return;
      lines.push(prettyDate(key));
      if (day.dones.length) {
        day.dones.forEach((i) => {
          lines.push(`  ✓ ${i.text}`);
          if (i.detail?.trim()) lines.push(`    ${i.detail.trim().replace(/\n/g, "\n    ")}`);
        });
      }
      if (day.todos.length) {
        day.todos.forEach((i) => {
          lines.push(`  ○ ${i.text}`);
          if (i.detail?.trim()) lines.push(`    ${i.detail.trim().replace(/\n/g, "\n    ")}`);
        });
      }
      if (day.stickies?.length) {
        day.stickies.forEach((s) => {
          lines.push(
            s.title?.trim() ? `  ❏ ${s.title.trim()}: ${s.body}` : `  ❏ ${s.body}`
          );
        });
      }
      lines.push("");
    });
    if (lines.length <= 2) lines.push("(No logged days this week yet.)");
    return lines.join("\n").trim();
  }

  async function copyText(text, toastMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(toastMessage);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast(toastMessage);
    }
  }

  els.tabDashboard.addEventListener("click", () => setView("dashboard"));
  els.tabDay.addEventListener("click", () => setView("day"));
  els.openToday.addEventListener("click", () => openDay(todayKey()));
  els.backDashboard.addEventListener("click", () => setView("dashboard"));
  els.copyWeek.addEventListener("click", () =>
    copyText(buildWeekSummary(), "Week summary copied")
  );

  els.prevDay.addEventListener("click", () => setDate(shiftDay(selectedDate, -1)));
  els.nextDay.addEventListener("click", () => {
    if (selectedDate < todayKey()) setDate(shiftDay(selectedDate, 1));
  });

  els.dateLabel.addEventListener("click", () => {
    els.datePicker.showPicker?.();
    els.datePicker.focus();
    els.datePicker.click();
  });

  els.datePicker.addEventListener("change", () => {
    if (els.datePicker.value) setDate(els.datePicker.value);
  });

  els.todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem("todo", els.todoInput.value, els.todoDetail.value);
    els.todoInput.value = "";
    els.todoDetail.value = "";
    els.todoInput.focus();
  });

  els.doneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem("done", els.doneInput.value, els.doneDetail.value);
    els.doneInput.value = "";
    els.doneDetail.value = "";
    els.doneInput.focus();
  });

  els.stickyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveStickyReminder();
  });

  els.swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      stickyColor = swatch.dataset.color || "butter";
      syncComposerColor();
    });
  });

  els.moods.forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = dayData();
      data.mood = data.mood === btn.dataset.mood ? "" : btn.dataset.mood;
      saveStore();
      renderMood();
    });
  });

  els.jumpToday.addEventListener("click", () => setDate(todayKey()));
  els.copyDay.addEventListener("click", () =>
    copyText(buildDaySummary(), "Day summary copied")
  );

  // Seed a gentle first-run example for today only when empty
  if (!localStorage.getItem(STORAGE_KEY)) {
    const today = dayData(todayKey());
    const yesterday = dayData(shiftDay(todayKey(), -1));
    today.todos = [
      {
        id: uid(),
        text: "Ask my mentor one clarifying question",
        detail: "About the code review process and how tickets get prioritized.",
        done: false,
        createdAt: Date.now(),
      },
    ];
    today.dones = [
      {
        id: uid(),
        text: "Opened Sprig and started my intern log",
        detail: "Using the dashboard to track daily wins.",
        done: true,
        createdAt: Date.now(),
      },
    ];
    today.stickies = [
      {
        id: uid(),
        title: "Reminder",
        body: "Send standup notes before 10am.",
        color: "butter",
        createdAt: Date.now(),
      },
    ];
    today.mood = "sunny";

    yesterday.dones = [
      {
        id: uid(),
        text: "Set up my intern tools",
        detail: "Slack, email, and repo access sorted.",
        done: true,
        createdAt: Date.now() - 86400000,
      },
    ];
    yesterday.stickies = [
      {
        id: uid(),
        title: "Getting oriented",
        body: "Tiny steps count.",
        color: "mint",
        createdAt: Date.now() - 86400000,
      },
    ];
    yesterday.mood = "steady";
    saveStore();
  }

  setView(currentView);
})();
