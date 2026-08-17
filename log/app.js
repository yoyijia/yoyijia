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

  const RICH_COLORS = [
    { name: "Ink", value: "#243328" },
    { name: "Sage", value: "#3e6b4a" },
    { name: "Coral", value: "#e07a5f" },
    { name: "Amber", value: "#b45309" },
    { name: "Sky", value: "#2f6f9f" },
  ];

  function sanitizeHtml(dirty) {
    const template = document.createElement("template");
    template.innerHTML = String(dirty || "");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "SPAN", "BR", "DIV", "P"]);

    const clean = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!allowed.has(child.tagName)) {
            const frag = document.createDocumentFragment();
            while (child.firstChild) frag.appendChild(child.firstChild);
            child.replaceWith(frag);
            clean(node);
            return;
          }
          [...child.attributes].forEach((attr) => {
            if (child.tagName === "SPAN" && attr.name === "style") {
              const color = child.style.color;
              child.removeAttribute("style");
              if (color) child.style.color = color;
            } else {
              child.removeAttribute(attr.name);
            }
          });
          clean(child);
        } else if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
        }
      });
    };

    clean(template.content);
    return template.innerHTML;
  }

  function htmlToPlain(html) {
    const div = document.createElement("div");
    div.innerHTML = sanitizeHtml(html);
    return (div.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function setRichHtml(el, html) {
    el.innerHTML = sanitizeHtml(html || "");
  }

  function mountRichEditor(host) {
    if (!host || host.dataset.richMounted === "1") {
      return host && host._richApi;
    }
    const placeholder = host.dataset.placeholder || "";
    const aria = host.dataset.aria || "Rich text";
    host.dataset.richMounted = "1";
    host.innerHTML = "";

    const toolbar = document.createElement("div");
    toolbar.className = "rt-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", `${aria} formatting`);

    const mkBtn = (label, cmd, title, html) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rt-btn";
      btn.dataset.cmd = cmd;
      btn.title = title;
      btn.setAttribute("aria-label", title);
      btn.innerHTML = html || label;
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", () => {
        editor.focus();
        document.execCommand(cmd, false, null);
        syncToolbar();
      });
      return btn;
    };

    toolbar.append(
      mkBtn("B", "bold", "Bold", "<b>B</b>"),
      mkBtn("I", "italic", "Italic", "<em>I</em>"),
      mkBtn("U", "underline", "Underline", "<u>U</u>")
    );

    const sep = document.createElement("span");
    sep.className = "rt-sep";
    sep.setAttribute("aria-hidden", "true");
    toolbar.appendChild(sep);

    const colors = document.createElement("div");
    colors.className = "rt-colors";
    colors.setAttribute("role", "group");
    colors.setAttribute("aria-label", "Text color");

    RICH_COLORS.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rt-color";
      btn.style.background = color.value;
      btn.title = color.name;
      btn.setAttribute("aria-label", `${color.name} text`);
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", () => {
        editor.focus();
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, color.value);
        syncToolbar();
      });
      colors.appendChild(btn);
    });
    toolbar.appendChild(colors);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "rt-btn";
    clearBtn.title = "Clear formatting";
    clearBtn.setAttribute("aria-label", "Clear formatting");
    clearBtn.textContent = "Tx";
    clearBtn.addEventListener("mousedown", (e) => e.preventDefault());
    clearBtn.addEventListener("click", () => {
      editor.focus();
      document.execCommand("removeFormat", false, null);
      document.execCommand("foreColor", false, "#243328");
      syncToolbar();
    });
    toolbar.appendChild(clearBtn);

    const editor = document.createElement("div");
    editor.className = "rt-editor";
    editor.contentEditable = "true";
    editor.dataset.placeholder = placeholder;
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", "true");
    editor.setAttribute("aria-label", aria);
    editor.spellcheck = true;

    const syncToolbar = () => {
      toolbar.querySelectorAll(".rt-btn[data-cmd]").forEach((btn) => {
        let active = false;
        try {
          active = document.queryCommandState(btn.dataset.cmd);
        } catch {
          active = false;
        }
        btn.classList.toggle("is-active", active);
      });
    };

    editor.addEventListener("keyup", syncToolbar);
    editor.addEventListener("mouseup", syncToolbar);
    editor.addEventListener("focus", syncToolbar);

    host.append(toolbar, editor);

    const api = {
      host,
      editor,
      getHtml: () => sanitizeHtml(editor.innerHTML),
      getPlain: () => htmlToPlain(editor.innerHTML),
      setHtml: (html) => {
        editor.innerHTML = sanitizeHtml(html || "");
      },
      clear: () => {
        editor.innerHTML = "";
      },
      focus: () => editor.focus(),
      isEmpty: () => !htmlToPlain(editor.innerHTML),
    };
    host._richApi = api;
    return api;
  }

  function mountRichEditorIn(parent, { placeholder = "", aria = "Details", className = "" } = {}) {
    const host = document.createElement("div");
    host.className = `rt-host ${className}`.trim();
    host.dataset.placeholder = placeholder;
    host.dataset.aria = aria;
    parent.appendChild(host);
    return mountRichEditor(host);
  }

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
    linkSubmitBtn: document.getElementById("linkSubmitBtn"),
    linkCancelEdit: document.getElementById("linkCancelEdit"),
    linkEditHint: document.getElementById("linkEditHint"),
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
  let editingLinkId = null;
  const openEditors = new Set();

  const rich = {
    todoDetail: mountRichEditor(els.todoDetail),
    doneDetail: mountRichEditor(document.getElementById("doneDetail")),
    stickyBody: mountRichEditor(els.stickyBody),
    noteBody: mountRichEditor(els.noteBody),
  };

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
      else if (htmlToPlain(item.detail || "")) bits.push(htmlToPlain(item.detail));
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
    const detail = htmlToPlain(item.detail || "");
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
        : htmlToPlain(item.detail || "") || item.tool || item.file
          ? "Edit info"
          : "Add info";

      top.append(text, detailBtn);
      main.appendChild(top);

      if (!isOpen) {
        const chip = renderToolChip(item);
        if (chip) main.appendChild(chip);
        if (htmlToPlain(item.detail || "")) {
          const preview = document.createElement("div");
          preview.className = "item-detail-preview rich-content";
          setRichHtml(preview, item.detail);
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

        editor.append(titleInput, metaRow);
        const detailRich = mountRichEditorIn(editor, {
          placeholder: "Add notes, blockers, next steps…",
          aria: "Task details",
        });
        detailRich.setHtml(item.detail || "");

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
          item.detail = detailRich.isEmpty() ? "" : detailRich.getHtml();
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
        editor.appendChild(actions);
        main.appendChild(editor);
        requestAnimationFrame(() => detailRich.focus());
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

      const body = document.createElement("div");
      body.className = "sticky-card-body rich-content";
      setRichHtml(body, sticky.body || "");
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
    if (rich.stickyBody.isEmpty()) {
      showToast("Write something on the sticky first");
      rich.stickyBody.focus();
      return;
    }
    const data = dayData();
    data.stickies.unshift({
      id: uid(),
      title: els.stickyTitle.value.trim(),
      body: rich.stickyBody.getHtml(),
      color: stickyColor,
      createdAt: Date.now(),
    });
    saveStore();
    els.stickyTitle.value = "";
    rich.stickyBody.clear();
    renderStickies();
    showToast("Sticky saved");
    rich.stickyBody.focus();
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

  function clearLinkEditing() {
    editingLinkId = null;
    els.linkTitle.value = "";
    els.linkUrl.value = "";
    els.linkTool.value = "";
    els.linkSubmitBtn.textContent = "Save link";
    els.linkCancelEdit.hidden = true;
    els.linkEditHint.hidden = true;
  }

  function startLinkEditing(link) {
    editingLinkId = link.id;
    els.linkTitle.value = link.title || "";
    els.linkUrl.value = link.url || "";
    els.linkTool.value = link.tool || "";
    els.linkSubmitBtn.textContent = "Update link";
    els.linkCancelEdit.hidden = false;
    els.linkEditHint.hidden = false;
    els.linkTitle.focus();
    els.linkTitle.select();
    renderLinksPanel();
    showToast("Editing link");
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
      row.className = `dash-item${
        link.kind === "link" && link.id === editingLinkId ? " is-editing" : ""
      }`;
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
      if (link.kind === "link" && link.id === editingLinkId) bits.unshift("editing");
      meta.textContent = bits.join(" · ") || "Saved link";

      left.append(title, meta);

      const side = document.createElement("div");
      side.style.display = "flex";
      side.style.gap = "0.35rem";
      side.style.alignItems = "center";
      side.style.flexWrap = "wrap";

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
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "dash-item-side as-btn";
        edit.textContent = link.id === editingLinkId ? "Editing…" : "Edit";
        edit.setAttribute(
          "aria-label",
          link.id === editingLinkId ? "Currently editing this link" : "Edit link"
        );
        edit.disabled = link.id === editingLinkId;
        edit.addEventListener("click", () => startLinkEditing(link));
        side.appendChild(edit);

        const del = document.createElement("button");
        del.type = "button";
        del.className = "delete";
        del.setAttribute("aria-label", "Delete link");
        del.textContent = "×";
        del.addEventListener("click", () => {
          if (editingLinkId === link.id) clearLinkEditing();
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

      const body = document.createElement("div");
      body.className = "sticky-card-body rich-content";
      setRichHtml(body, sticky.body || "");
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
        bodyIsHtml: true,
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
          bodyIsHtml: true,
          meta: prettyDate(key),
          deletable: false,
          sort: sticky.createdAt || 0,
        });
      });
      [...day.todos, ...day.dones].forEach((item) => {
        const detailPlain = htmlToPlain(item.detail || "");
        if (!detailPlain && !item.file?.trim() && !item.tool) return;
        const bits = [];
        if (item.tool) bits.push(toolLabel(item.tool));
        if (item.file?.trim()) bits.push(item.file.trim());
        cards.push({
          id: `tasknote-${item.id}`,
          kicker: `task · ${prettyDate(key)}`,
          title: item.text,
          body: detailPlain
            ? `${bits.join(" · ")}${bits.length ? "\n" : ""}${item.detail}`
            : bits.join(" · "),
          bodyIsHtml: Boolean(detailPlain),
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
        <div class="note-card-body"></div>
        <div class="note-card-foot">
          <span class="note-card-meta"></span>
        </div>
      `;
      el.querySelector(".note-card-kicker").textContent = card.kicker;
      el.querySelector(".note-card-title").textContent = card.title;
      const bodyEl = el.querySelector(".note-card-body");
      bodyEl.classList.add("rich-content");
      if (card.bodyIsHtml) setRichHtml(bodyEl, card.body);
      else bodyEl.textContent = card.body;
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
      lines.push(`Notebook: ${n.title}`, htmlToPlain(n.body), "");
    });
    contentKeys().forEach((key) => {
      const day = peekDay(key);
      const chunk = [];
      day.stickies.forEach((s) =>
        chunk.push(
          `Sticky: ${s.title?.trim() || "Reminder"} — ${htmlToPlain(s.body || "")}`
        )
      );
      [...day.todos, ...day.dones].forEach((item) => {
        if (!htmlToPlain(item.detail || "") && !item.file?.trim() && !item.tool) return;
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
          if (htmlToPlain(i.detail || "")) lines.push(`    ${htmlToPlain(i.detail)}`);
        });
      }
      if (day.todos.length) {
        day.todos.forEach((i) => {
          lines.push(`  ○ ${i.text}`);
          if (htmlToPlain(i.detail || "")) lines.push(`    ${htmlToPlain(i.detail)}`);
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
      rich.todoDetail.isEmpty() ? "" : rich.todoDetail.getHtml(),
      els.todoTool.value,
      els.todoFile.value
    );
    els.todoInput.value = "";
    rich.todoDetail.clear();
    els.todoTool.value = "";
    els.todoFile.value = "";
    els.todoInput.focus();
  });

  els.doneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(
      "done",
      els.doneInput.value,
      rich.doneDetail.isEmpty() ? "" : rich.doneDetail.getHtml(),
      els.doneTool.value,
      els.doneFile.value
    );
    els.doneInput.value = "";
    rich.doneDetail.clear();
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
    if (!title || !url) {
      showToast("Add a title and link/file");
      return;
    }

    if (editingLinkId) {
      const existing = (store.links || []).find((l) => l.id === editingLinkId);
      if (!existing) {
        clearLinkEditing();
        showToast("Link not found");
        renderLinksPanel();
        return;
      }
      existing.title = title;
      existing.url = url;
      existing.tool = els.linkTool.value || "";
      existing.updatedAt = Date.now();
      saveStore();
      clearLinkEditing();
      renderLinksPanel();
      showToast("Link updated");
      return;
    }

    store.links.unshift({
      id: uid(),
      title,
      url,
      tool: els.linkTool.value || "",
      createdAt: Date.now(),
    });
    saveStore();
    clearLinkEditing();
    renderLinksPanel();
    showToast("Link saved");
  });

  els.linkCancelEdit.addEventListener("click", () => {
    clearLinkEditing();
    renderLinksPanel();
    showToast("Edit cancelled");
  });

  els.noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.noteTitle.value.trim();
    if (!title || rich.noteBody.isEmpty()) {
      showToast("Add a title and note body");
      return;
    }
    store.notes.unshift({
      id: uid(),
      title,
      body: rich.noteBody.getHtml(),
      createdAt: Date.now(),
    });
    saveStore();
    els.noteTitle.value = "";
    rich.noteBody.clear();
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
