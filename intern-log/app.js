(() => {
  const STORAGE_KEY = "sprig-intern-log-v1";

  const els = {
    prevDay: document.getElementById("prevDay"),
    nextDay: document.getElementById("nextDay"),
    dateLabel: document.getElementById("dateLabel"),
    datePicker: document.getElementById("datePicker"),
    weekdayLabel: document.getElementById("weekdayLabel"),
    dayTitle: document.getElementById("dayTitle"),
    dayHint: document.getElementById("dayHint"),
    todoForm: document.getElementById("todoForm"),
    todoInput: document.getElementById("todoInput"),
    todoList: document.getElementById("todoList"),
    todoEmpty: document.getElementById("todoEmpty"),
    todoCount: document.getElementById("todoCount"),
    doneForm: document.getElementById("doneForm"),
    doneInput: document.getElementById("doneInput"),
    doneList: document.getElementById("doneList"),
    doneEmpty: document.getElementById("doneEmpty"),
    doneCount: document.getElementById("doneCount"),
    noteInput: document.getElementById("noteInput"),
    jumpToday: document.getElementById("jumpToday"),
    copyDay: document.getElementById("copyDay"),
    saveStatus: document.getElementById("saveStatus"),
    toast: document.getElementById("toast"),
    moods: [...document.querySelectorAll(".mood")],
  };

  let selectedDate = todayKey();
  let store = loadStore();
  let toastTimer = null;
  let noteTimer = null;

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
    els.saveStatus.textContent = "Saved on this device";
  }

  function emptyDay() {
    return { todos: [], dones: [], note: "", mood: "" };
  }

  function dayData(key = selectedDate) {
    if (!store.days[key]) store.days[key] = emptyDay();
    return store.days[key];
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
    const date = parseKey(key);
    const isToday = key === todayKey();
    const isYesterday = key === shiftDay(todayKey(), -1);
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
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
      ? "Plant a to-do, check off what you finished, and keep a soft note for your internship days."
      : "Flip through past days anytime — everything stays on this device.";

    els.nextDay.disabled = isToday;
    els.nextDay.style.opacity = isToday ? "0.35" : "1";
  }

  function checkIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
      const li = document.createElement("li");
      li.className = `item ${kind === "done" || item.done ? "done-item" : ""} ${item.done ? "is-checked" : ""}`;
      li.dataset.id = item.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "check";
      check.setAttribute(
        "aria-label",
        item.done || kind === "done" ? "Mark as not done" : "Mark as done"
      );
      check.innerHTML = checkIcon();

      const text = document.createElement("p");
      text.className = "item-text";
      text.textContent = item.text;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.setAttribute("aria-label", "Delete item");
      del.innerHTML = "×";

      check.addEventListener("click", () => toggleItem(kind, item.id));
      del.addEventListener("click", () => removeItem(kind, item.id));

      li.append(check, text, del);
      listEl.appendChild(li);
    });
  }

  function renderMoodAndNote() {
    const data = dayData();
    els.noteInput.value = data.note || "";
    els.moods.forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.mood === data.mood ? "true" : "false");
    });
  }

  function render() {
    updateChrome();
    renderList("todo");
    renderList("done");
    renderMoodAndNote();
  }

  function addItem(kind, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const data = dayData();
    const entry = {
      id: uid(),
      text: trimmed,
      done: kind === "done",
      createdAt: Date.now(),
    };
    if (kind === "todo") data.todos.unshift(entry);
    else data.dones.unshift(entry);
    saveStore();
    renderList(kind);
  }

  function removeItem(kind, id) {
    const data = dayData();
    if (kind === "todo") data.todos = data.todos.filter((i) => i.id !== id);
    else data.dones = data.dones.filter((i) => i.id !== id);
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
      const idx = data.dones.findIndex((i) => i.id !== undefined && i.id === id);
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
    render();
  }

  function buildSummary() {
    const data = dayData();
    const date = parseKey(selectedDate);
    const title = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const moodMap = {
      sunny: "sunny",
      steady: "steady",
      cloudy: "cloudy",
      tired: "tired",
    };

    const lines = [
      `Sprig — ${title}`,
      data.mood ? `Mood: ${moodMap[data.mood] || data.mood}` : null,
      "",
      "Done:",
      ...(data.dones.length
        ? data.dones.map((i) => `- ${i.text}`)
        : ["- (none yet)"]),
      "",
      "To do:",
      ...(data.todos.length
        ? data.todos.map((i) => `- ${i.text}`)
        : ["- (none yet)"]),
    ];

    if (data.note?.trim()) {
      lines.push("", "Note:", data.note.trim());
    }

    return lines.filter((line) => line !== null).join("\n");
  }

  async function copySummary() {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Day summary copied");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast("Day summary copied");
    }
  }

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
    addItem("todo", els.todoInput.value);
    els.todoInput.value = "";
    els.todoInput.focus();
  });

  els.doneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem("done", els.doneInput.value);
    els.doneInput.value = "";
    els.doneInput.focus();
  });

  els.noteInput.addEventListener("input", () => {
    dayData().note = els.noteInput.value;
    els.saveStatus.textContent = "Saving…";
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      saveStore();
    }, 250);
  });

  els.moods.forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = dayData();
      data.mood = data.mood === btn.dataset.mood ? "" : btn.dataset.mood;
      saveStore();
      renderMoodAndNote();
    });
  });

  els.jumpToday.addEventListener("click", () => setDate(todayKey()));
  els.copyDay.addEventListener("click", copySummary);

  // Seed a gentle first-run example for today only when empty
  if (!localStorage.getItem(STORAGE_KEY)) {
    const today = dayData(todayKey());
    today.todos = [
      {
        id: uid(),
        text: "Ask my mentor one clarifying question",
        done: false,
        createdAt: Date.now(),
      },
    ];
    today.dones = [
      {
        id: uid(),
        text: "Opened Sprig and started my intern log 🌱",
        done: true,
        createdAt: Date.now(),
      },
    ];
    today.note = "First day in the log. Tiny steps count.";
    today.mood = "sunny";
    saveStore();
  }

  render();
})();
