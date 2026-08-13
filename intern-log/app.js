(() => {
  const STORAGE_KEY = "sprig-intern-log-v1";
  const VIEW_KEY = "sprig-view-v1";
  const NOTES_TAB_KEY = "sprig-notes-tab-v1";

  const TOOL_OPTIONS = [
    ["", "Tool / file type"],
    ["figma", "Figma"],
    ["gdoc", "Google Doc"],
    ["gsheets", "Google Sheets"],
    ["photoshop", "Photoshop"],
    ["illustrator", "Illustrator"],
    ["notion", "Notion"],
    ["slack", "Slack"],
    ["github", "GitHub"],
    ["miro", "Miro"],
    ["drive", "Drive"],
    ["other", "Other"],
  ];

  const TOOL_LABELS = Object.fromEntries(TOOL_OPTIONS.filter(([v]) => v));

  const els = {
    tabDashboard: document.getElementById("tabDashboard"),
    tabDay: document.getElementById("tabDay"),
    tabNotes: document.getElementById("tabNotes"),
    viewDashboard: document.getElementById("viewDashboard"),
    viewDay: document.getElementById("viewDay"),
    viewNotes: document.getElementById("viewNotes"),
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
    todoTool: document.getElementById("todoTool"),
    todoFile: document.getElementById("todoFile"),
    todoDetail: document.getElementById("todoDetail"),
    todoList: document.getElementById("todoList"),
    todoEmpty: document.getElementById("todoEmpty"),
    todoCount: document.getElementById("todoCount"),
    doneForm: document.getElementById("doneForm"),
    doneInput: document.getElementById("doneInput"),
    doneTool: document.getElementById("doneTool"),
    doneFile: document.getElementById("doneFile"),
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
    notesTabLinks: document.getElementById("notesTabLinks"),
    notesTabStickies: document.getElementById("notesTabStickies"),
    notesTabConsolidated: document.getElementById("notesTabConsolidated"),
    notesPanelLinks: document.getElementById("notesPanelLinks"),
    notesPanelStickies: document.getElementById("notesPanelStickies"),
    notesPanelConsolidated: document.getElementById("notesPanelConsolidated"),
    linkForm: document.getElementById("linkForm"),
    linkTitle: document.getElementById("linkTitle"),
    linkTool: document.getElementById("linkTool"),
    linkUrl: document.getElementById("linkUrl"),
    linksList: document.getElementById("linksList"),
    linksEmpty: document.getElementById("linksEmpty"),
    linksCount: document.getElementById("linksCount"),
    allStickiesBoard: document.getElementById("allStickiesBoard"),
    allStickiesEmpty: document.getElementById("allStickiesEmpty"),
    allStickiesCount: document.getElementById("allStickiesCount"),
    noteForm: document.getElementById("noteForm"),
    noteTitle: document.getElementById("noteTitle"),
    noteBody: document.getElementById("noteBody"),
    consolidatedList: document.getElementById("consolidatedList"),
    consolidatedEmpty: document.getElementById("consolidatedEmpty"),
    copyNotes: document.getElementById("copyNotes"),
    jumpToday: document.getElementById("jumpToday"),
    copyDay: document.getElementById("copyDay"),
    saveStatus: document.getElementById("saveStatus"),
    toast: document.getElementById("toast"),
    moods: [...document.querySelectorAll(".mood")],
  };

  let selectedDate = todayKey();
  const savedView = localStorage.getItem(VIEW_KEY);
  let currentView = ["dashboard", "day", "notes"].includes(savedView) ? savedView : "dashboard";
  let notesTab = localStorage.getItem(NOTES_TAB_KEY) || "links";
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
      if (!raw) return { days: {}, links: [], notes: [] };
      const parsed = JSON.parse(raw);
      return {
        days: parsed?.days && typeof parsed.days === "object" ? parsed.days : {},
        links: Array.isArray(parsed?.links) ? parsed.links : [],
        notes: Array.isArray(parsed?.notes) ? parsed.notes : [],
      };
    } catch {
      return { days: {}, links: [], notes: [] };
    }
  }

  function toolLabel(tool) {
    return TOOL_LABELS[tool] || "";
  }

  function looksLikeUrl(value) {
    return /^https?:\/\//i.test((value || "").trim());
  }

  function toolSelectHtml(selected = "") {
    return TOOL_OPTIONS.map(
      ([value, label]) =>
        `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`
    ).join("");
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
    currentView = ["dashboard", "day", "notes"].includes(view) ? view : "dashboard";
    localStorage.setItem(VIEW_KEY, currentView);

    els.viewDashboard.hidden = currentView !== "dashboard";
    els.viewDay.hidden = currentView !== "day";
    els.viewNotes.hidden = currentView !== "notes";
    els.tabDashboard.setAttribute("aria-selected", currentView === "dashboard" ? "true" : "false");
    els.tabDay.setAttribute("aria-selected", currentView === "day" ? "true" : "false");
    els.tabNotes.setAttribute("aria-selected", currentView === "notes" ? "true" : "false");

    if (currentView === "dashboard") renderDashboard();
    else if (currentView === "day") renderDay();
    else renderNotes();
  }

  function setNotesTab(tab) {
    notesTab = ["links", "stickies", "consolidated"].includes(tab) ? tab : "links";
    localStorage.setItem(NOTES_TAB_KEY, notesTab);
    els.notesPanelLinks.hidden = notesTab !== "links";
    els.notesPanelStickies.hidden = notesTab !== "stickies";
    els.notesPanelConsolidated.hidden = notesTab !== "consolidated";
    els.notesTabLinks.setAttribute("aria-selected", notesTab === "links" ? "true" : "false");
    els.notesTabStickies.setAttribute("aria-selected", notesTab === "stickies" ? "true" : "false");
    els.notesTabConsolidated.setAttribute(
      "aria-selected",
      notesTab === "consolidated" ? "true" : "false"
    );
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
          tool: item.tool || "",
          file: item.file || "",
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
      const bits = [prettyDate(item.key)];
      if (item.tool) bits.push(toolLabel(item.tool));
      if (item.file?.trim()) bits.push(item.file.trim());
      else if (item.detail?.trim()) bits.push(item.detail.trim());
      btn.querySelector(".dash-item-meta").textContent = bits.join(" · ");
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
    const tool = toolLabel(item.tool || "");
    const file = (item.file || "").trim();
    const meta = [tool, file].filter(Boolean).join(" · ");
    let line = `${mark} ${item.text}`;
    if (meta) line += ` [${meta}]`;
    if (detail) line += `\n  ${detail.replace(/\n/g, "\n  ")}`;
    return line;
  }

  function renderToolChip(item) {
    const tool = toolLabel(item.tool || "");
    const file = (item.file || "").trim();
    if (!tool && !file) return null;
    const chip = document.createElement("div");
    chip.className = "tool-chip";
    if (tool) {
      const label = document.createElement("span");
      label.textContent = tool;
      chip.appendChild(label);
    }
    if (file) {
      if (tool) chip.appendChild(document.createTextNode(" · "));
      if (looksLikeUrl(file)) {
        const a = document.createElement("a");
        a.href = file;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = file;
        a.addEventListener("click", (e) => e.stopPropagation());
        chip.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.textContent = file;
        chip.appendChild(span);
      }
    }
    return chip;
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
      if (typeof item.tool !== "string") item.tool = "";
      if (typeof item.file !== "string") item.file = "";
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
        : item.detail?.trim() || item.tool || item.file
          ? "Edit info"
          : "Add info";

      top.append(text, detailBtn);
      main.appendChild(top);

      if (!isOpen) {
        const chip = renderToolChip(item);
        if (chip) main.appendChild(chip);
        if (item.detail?.trim()) {
          const preview = document.createElement("p");
          preview.className = "item-detail-preview";
          preview.textContent = item.detail.trim();
          main.appendChild(preview);
        }
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

        const metaRow = document.createElement("div");
        metaRow.className = "item-meta-row";

        const toolSelect = document.createElement("select");
        toolSelect.className = "item-edit-tool";
        toolSelect.innerHTML = toolSelectHtml(item.tool || "");
        toolSelect.setAttribute("aria-label", "Tool or file type");

        const fileInput = document.createElement("input");
        fileInput.type = "text";
        fileInput.className = "item-edit-file";
        fileInput.maxLength = 300;
        fileInput.value = item.file || "";
        fileInput.placeholder = "File name or link…";
        fileInput.setAttribute("aria-label", "File name or link");

        metaRow.append(toolSelect, fileInput);

        const detailInput = document.createElement("textarea");
        detailInput.className = "item-edit-detail";
        detailInput.rows = 3;
        detailInput.maxLength = 1000;
        detailInput.value = item.detail || "";
        detailInput.placeholder = "Add notes, blockers, next steps…";
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
          item.tool = toolSelect.value || "";
          item.file = fileInput.value.trim();
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
        editor.append(titleInput, metaRow, detailInput, actions);
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
    else if (currentView === "day") renderDay();
    else renderNotes();
  }

  function collectTaskFiles() {
    const rows = [];
    contentKeys().forEach((key) => {
      const day = peekDay(key);
      [...day.todos, ...day.dones].forEach((item) => {
        if (!item.file?.trim() && !item.tool) return;
        rows.push({
          id: `task-${item.id}`,
          title: item.text,
          url: item.file || "",
          tool: item.tool || "",
          source: prettyDate(key),
          kind: "task",
        });
      });
    });
    return rows;
  }

  function renderNotes() {
    setNotesTab(notesTab);
    renderLinksPanel();
    renderAllStickiesPanel();
    renderConsolidatedPanel();
  }

  function renderLinksPanel() {
    const saved = store.links || [];
    const fromTasks = collectTaskFiles();
    const combined = [
      ...saved.map((l) => ({ ...l, kind: "link" })),
      ...fromTasks,
    ];

    els.linksCount.textContent = String(combined.length);
    els.linksList.innerHTML = "";
    els.linksEmpty.hidden = combined.length > 0;

    combined.forEach((link) => {
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "dash-item";
      row.style.cursor = "default";

      const left = document.createElement("div");
      const title = document.createElement("p");
      title.className = "dash-item-title";
      title.textContent = link.title || "Untitled link";

      const meta = document.createElement("p");
      meta.className = "dash-item-meta";
      const bits = [];
      if (link.tool) bits.push(toolLabel(link.tool));
      if (link.source) bits.push(link.source);
      if (link.url) bits.push(link.url);
      meta.textContent = bits.join(" · ") || "Saved link";

      left.append(title, meta);

      const side = document.createElement("div");
      side.style.display = "flex";
      side.style.gap = "0.35rem";
      side.style.alignItems = "center";

      if (looksLikeUrl(link.url)) {
        const open = document.createElement("a");
        open.className = "dash-item-side";
        open.href = link.url;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.textContent = "Open";
        side.appendChild(open);
      } else {
        const tag = document.createElement("span");
        tag.className = "dash-item-side";
        tag.textContent = toolLabel(link.tool) || "file";
        side.appendChild(tag);
      }

      if (link.kind === "link") {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "delete";
        del.setAttribute("aria-label", "Delete link");
        del.textContent = "×";
        del.addEventListener("click", () => {
          store.links = store.links.filter((l) => l.id !== link.id);
          saveStore();
          renderLinksPanel();
          showToast("Link removed");
        });
        side.appendChild(del);
      }

      row.append(left, side);
      li.appendChild(row);
      els.linksList.appendChild(li);
    });
  }

  function renderAllStickiesPanel() {
    const all = [];
    contentKeys().forEach((key) => {
      peekDay(key).stickies.forEach((sticky) => {
        all.push({ ...sticky, dayKey: key });
      });
    });

    els.allStickiesCount.textContent = String(all.length);
    els.allStickiesBoard.innerHTML = "";
    els.allStickiesEmpty.hidden = all.length > 0;

    all.forEach((sticky) => {
      const note = document.createElement("article");
      note.className = `sticky-note sticky-card color-${sticky.color || "butter"}`;

      const kicker = document.createElement("p");
      kicker.className = "sticky-label";
      kicker.textContent = prettyDate(sticky.dayKey);
      note.appendChild(kicker);

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
      const open = document.createElement("button");
      open.type = "button";
      open.className = "ghost-btn";
      open.textContent = "Open day";
      open.addEventListener("click", () => openDay(sticky.dayKey));
      foot.appendChild(open);
      note.appendChild(foot);
      els.allStickiesBoard.appendChild(note);
    });
  }

  function renderConsolidatedPanel() {
    const cards = [];

    (store.notes || []).forEach((note) => {
      cards.push({
        id: note.id,
        kicker: "notebook",
        title: note.title,
        body: note.body,
        meta: new Date(note.createdAt || Date.now()).toLocaleString(),
        deletable: true,
        sort: note.createdAt || 0,
      });
    });

    contentKeys().forEach((key) => {
      const day = peekDay(key);
      day.stickies.forEach((sticky) => {
        cards.push({
          id: `sticky-${sticky.id}`,
          kicker: `sticky · ${prettyDate(key)}`,
          title: sticky.title?.trim() || "Sticky reminder",
          body: sticky.body || "",
          meta: toolLabel(sticky.color) ? prettyDate(key) : prettyDate(key),
          deletable: false,
          sort: sticky.createdAt || 0,
        });
      });
      [...day.todos, ...day.dones].forEach((item) => {
        if (!item.detail?.trim() && !item.file?.trim() && !item.tool) return;
        const bits = [];
        if (item.tool) bits.push(toolLabel(item.tool));
        if (item.file?.trim()) bits.push(item.file.trim());
        if (item.detail?.trim()) bits.push(item.detail.trim());
        cards.push({
          id: `tasknote-${item.id}`,
          kicker: `task · ${prettyDate(key)}`,
          title: item.text,
          body: bits.join("\n"),
          meta: item.done ? "done" : "to-do",
          deletable: false,
          sort: item.createdAt || 0,
        });
      });
    });

    cards.sort((a, b) => b.sort - a.sort);
    els.consolidatedList.innerHTML = "";
    els.consolidatedEmpty.hidden = cards.length > 0;

    cards.forEach((card) => {
      const el = document.createElement("article");
      el.className = "note-card";
      el.innerHTML = `
        <p class="note-card-kicker"></p>
        <h3 class="note-card-title"></h3>
        <p class="note-card-body"></p>
        <div class="note-card-foot">
          <span class="note-card-meta"></span>
        </div>
      `;
      el.querySelector(".note-card-kicker").textContent = card.kicker;
      el.querySelector(".note-card-title").textContent = card.title;
      el.querySelector(".note-card-body").textContent = card.body;
      el.querySelector(".note-card-meta").textContent = card.meta;
      if (card.deletable) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "ghost-btn";
        del.textContent = "Delete";
        del.addEventListener("click", () => {
          store.notes = store.notes.filter((n) => n.id !== card.id);
          saveStore();
          renderConsolidatedPanel();
          showToast("Note deleted");
        });
        el.querySelector(".note-card-foot").appendChild(del);
      }
      els.consolidatedList.appendChild(el);
    });
  }

  function buildNotesSummary() {
    const lines = ["Sprig — consolidated notes", ""];
    (store.notes || []).forEach((n) => {
      lines.push(`Notebook: ${n.title}`, n.body, "");
    });
    contentKeys().forEach((key) => {
      const day = peekDay(key);
      const chunk = [];
      day.stickies.forEach((s) =>
        chunk.push(`Sticky: ${s.title?.trim() || "Reminder"} — ${s.body}`)
      );
      [...day.todos, ...day.dones].forEach((item) => {
        if (!item.detail?.trim() && !item.file?.trim() && !item.tool) return;
        chunk.push(formatItemLine(item, item.done ? "Done" : "Todo"));
      });
      if (chunk.length) {
        lines.push(prettyDate(key), ...chunk, "");
      }
    });
    (store.links || []).forEach((l) => {
      lines.push(
        `Link: ${l.title} [${toolLabel(l.tool) || "link"}] ${l.url || ""}`.trim()
      );
    });
    return lines.join("\n").trim() || "No notes yet.";
  }

  function addItem(kind, text, detail = "", tool = "", file = "") {
    const trimmed = text.trim();
    if (!trimmed) return;
    const data = dayData();
    const entry = {
      id: uid(),
      text: trimmed,
      detail: detail.trim(),
      tool: tool || "",
      file: (file || "").trim(),
      done: kind === "done",
      createdAt: Date.now(),
    };
    if (kind === "todo") data.todos.unshift(entry);
    else data.dones.unshift(entry);
    openEditors.delete(entry.id);
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
  els.tabNotes.addEventListener("click", () => setView("notes"));
  els.openToday.addEventListener("click", () => openDay(todayKey()));
  els.backDashboard.addEventListener("click", () => setView("dashboard"));
  els.copyWeek.addEventListener("click", () =>
    copyText(buildWeekSummary(), "Week summary copied")
  );

  els.notesTabLinks.addEventListener("click", () => {
    setNotesTab("links");
  });
  els.notesTabStickies.addEventListener("click", () => {
    setNotesTab("stickies");
  });
  els.notesTabConsolidated.addEventListener("click", () => {
    setNotesTab("consolidated");
  });

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
    addItem(
      "todo",
      els.todoInput.value,
      els.todoDetail.value,
      els.todoTool.value,
      els.todoFile.value
    );
    els.todoInput.value = "";
    els.todoDetail.value = "";
    els.todoTool.value = "";
    els.todoFile.value = "";
    els.todoInput.focus();
  });

  els.doneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(
      "done",
      els.doneInput.value,
      els.doneDetail.value,
      els.doneTool.value,
      els.doneFile.value
    );
    els.doneInput.value = "";
    els.doneDetail.value = "";
    els.doneTool.value = "";
    els.doneFile.value = "";
    els.doneInput.focus();
  });

  els.stickyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveStickyReminder();
  });

  els.linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.linkTitle.value.trim();
    const url = els.linkUrl.value.trim();
    if (!title || !url) return;
    store.links.unshift({
      id: uid(),
      title,
      url,
      tool: els.linkTool.value || "",
      createdAt: Date.now(),
    });
    saveStore();
    els.linkTitle.value = "";
    els.linkUrl.value = "";
    els.linkTool.value = "";
    renderLinksPanel();
    showToast("Link saved");
  });

  els.noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.noteTitle.value.trim();
    const body = els.noteBody.value.trim();
    if (!title || !body) return;
    store.notes.unshift({
      id: uid(),
      title,
      body,
      createdAt: Date.now(),
    });
    saveStore();
    els.noteTitle.value = "";
    els.noteBody.value = "";
    renderConsolidatedPanel();
    showToast("Note added");
  });

  els.copyNotes.addEventListener("click", () =>
    copyText(buildNotesSummary(), "Notes copied")
  );

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
        text: "Polish homepage mockups",
        detail: "Align spacing with mentor feedback.",
        tool: "figma",
        file: "Intern Homepage.fig",
        done: false,
        createdAt: Date.now(),
      },
    ];
    today.dones = [
      {
        id: uid(),
        text: "Opened Sprig and started my intern log",
        detail: "Using the dashboard to track daily wins.",
        tool: "other",
        file: "",
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
        text: "Draft onboarding checklist",
        detail: "Shared with mentor for review.",
        tool: "gdoc",
        file: "https://docs.google.com",
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

    store.links = [
      {
        id: uid(),
        title: "Brand kit",
        url: "Brand-Kit.psd",
        tool: "photoshop",
        createdAt: Date.now(),
      },
    ];
    store.notes = [
      {
        id: uid(),
        title: "Internship goals",
        body: "Ship one visible design improvement each week and write down feedback.",
        createdAt: Date.now(),
      },
    ];
    saveStore();
  }

  setView(currentView);
})();
