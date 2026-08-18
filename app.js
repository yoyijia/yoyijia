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

  const REF_FORMATS = [
    ["reel", "Reel"],
    ["carousel", "Carousel"],
    ["static", "Static post"],
    ["story", "Story"],
    ["video", "Video"],
    ["ad", "Ad"],
    ["other", "Other"],
  ];
  const REF_FORMAT_LABELS = Object.fromEntries(REF_FORMATS);
  const REF_FILTER_KEY = "sprig-ref-filter-v1";
  const REF_GROUP_VIEW_KEY = "sprig-ref-group-view-v1";
  const REF_TAG_SUGGESTIONS = [
    "branding",
    "marketing",
    "social",
    "campaign",
    "product",
    "packaging",
    "typography",
    "color",
  ];
  const DRAW_COLORS = [
    { name: "Ink", value: "#243328" },
    { name: "Coral", value: "#e07a5f" },
    { name: "Sage", value: "#3e6b4a" },
    { name: "Sky", value: "#2f6f9f" },
    { name: "Amber", value: "#b45309" },
    { name: "White", value: "#fff8ef" },
  ];
  const MEDIA_DB_NAME = "sprig-media-v1";
  const MEDIA_STORE = "images";

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
    notesTabRefs: document.getElementById("notesTabRefs"),
    notesTabStickies: document.getElementById("notesTabStickies"),
    notesTabConsolidated: document.getElementById("notesTabConsolidated"),
    notesPanelLinks: document.getElementById("notesPanelLinks"),
    notesPanelRefs: document.getElementById("notesPanelRefs"),
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
    refForm: document.getElementById("refForm"),
    refTitle: document.getElementById("refTitle"),
    refFormat: document.getElementById("refFormat"),
    refUrl: document.getElementById("refUrl"),
    refNote: document.getElementById("refNote"),
    refPointList: document.getElementById("refPointList"),
    refPointAdd: document.getElementById("refPointAdd"),
    refImageInput: document.getElementById("refImageInput"),
    refImageGrid: document.getElementById("refImageGrid"),
    refImageEmpty: document.getElementById("refImageEmpty"),
    refTagDraft: document.getElementById("refTagDraft"),
    refTagInput: document.getElementById("refTagInput"),
    refTagAdd: document.getElementById("refTagAdd"),
    refTagSuggestions: document.getElementById("refTagSuggestions"),
    refTagQuick: document.getElementById("refTagQuick"),
    refSubmitBtn: document.getElementById("refSubmitBtn"),
    refCancelEdit: document.getElementById("refCancelEdit"),
    refEditHint: document.getElementById("refEditHint"),
    refFilters: document.getElementById("refFilters"),
    refBoard: document.getElementById("refBoard"),
    refBoardHint: document.getElementById("refBoardHint"),
    refsEmpty: document.getElementById("refsEmpty"),
    refsCount: document.getElementById("refsCount"),
    addRefGroup: document.getElementById("addRefGroup"),
    drawModal: document.getElementById("drawModal"),
    drawClose: document.getElementById("drawClose"),
    drawPen: document.getElementById("drawPen"),
    drawEraser: document.getElementById("drawEraser"),
    drawSize: document.getElementById("drawSize"),
    drawColors: document.getElementById("drawColors"),
    drawClear: document.getElementById("drawClear"),
    drawSave: document.getElementById("drawSave"),
    drawStage: document.getElementById("drawStage"),
    drawBase: document.getElementById("drawBase"),
    drawLayer: document.getElementById("drawLayer"),
    refViewModal: document.getElementById("refViewModal"),
    refViewTitle: document.getElementById("refViewTitle"),
    refViewKicker: document.getElementById("refViewKicker"),
    refViewMeta: document.getElementById("refViewMeta"),
    refViewBody: document.getElementById("refViewBody"),
    refViewEdit: document.getElementById("refViewEdit"),
    refViewClose: document.getElementById("refViewClose"),
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
  let editingRefId = null;
  let draftRefTags = [];
  let draftKeyPoints = [];
  let draftImages = []; // { id, url }
  let refFilter = parseRefFilter(localStorage.getItem(REF_FILTER_KEY) || "all");
  let expandedGroupId = localStorage.getItem(REF_GROUP_VIEW_KEY) || null;
  let refDrag = null;
  let drawSession = null;
  let viewingRefId = null;
  let mediaDbPromise = null;
  const objectUrlCache = new Map();
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
      if (!raw) {
        return { days: {}, links: [], references: [], refGroups: [], notes: [] };
      }
      const parsed = JSON.parse(raw);
      return {
        days: parsed?.days && typeof parsed.days === "object" ? parsed.days : {},
        links: Array.isArray(parsed?.links) ? parsed.links : [],
        references: Array.isArray(parsed?.references) ? parsed.references : [],
        refGroups: Array.isArray(parsed?.refGroups) ? parsed.refGroups : [],
        notes: Array.isArray(parsed?.notes) ? parsed.notes : [],
      };
    } catch {
      return { days: {}, links: [], references: [], refGroups: [], notes: [] };
    }
  }

  function toolLabel(tool) {
    return TOOL_LABELS[tool] || "";
  }

  function refFormatLabel(format) {
    return REF_FORMAT_LABELS[format] || format || "";
  }

  function parseRefFilter(raw) {
    const value = String(raw || "all");
    if (!value || value === "all") return { kind: "all", value: "all" };
    if (value === "untagged" || value === "tag:") {
      return { kind: "untagged", value: "untagged" };
    }
    if (value.startsWith("tag:")) {
      const tag = normalizeTag(value.slice(4));
      return tag ? { kind: "tag", value: tag } : { kind: "all", value: "all" };
    }
    if (value.startsWith("format:")) {
      const format = value.slice(7);
      return REF_FORMAT_LABELS[format]
        ? { kind: "format", value: format }
        : { kind: "all", value: "all" };
    }
    if (REF_FORMAT_LABELS[value]) return { kind: "format", value };
    return { kind: "all", value: "all" };
  }

  function serializeRefFilter(filter) {
    if (filter?.kind === "untagged") return "untagged";
    if (filter?.kind === "tag" && filter.value) return `tag:${filter.value}`;
    if (filter?.kind === "format" && filter.value) return `format:${filter.value}`;
    return "all";
  }

  function normalizeTag(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  }

  function normalizeRefTags(tags) {
    if (!Array.isArray(tags)) return [];
    const seen = new Set();
    const out = [];
    tags.forEach((tag) => {
      const next = normalizeTag(tag);
      if (!next) return;
      const key = next.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(next);
    });
    return out;
  }

  function refHasTag(ref, tag) {
    const key = normalizeTag(tag).toLowerCase();
    return (ref.tags || []).some((t) => t.toLowerCase() === key);
  }

  function collectKnownTags(refs = store.references || []) {
    const map = new Map();
    refs.forEach((ref) => {
      (ref.tags || []).forEach((tag) => {
        const key = tag.toLowerCase();
        if (!map.has(key)) map.set(key, tag);
      });
    });
    return [...map.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function matchesRefFilter(ref) {
    if (refFilter.kind === "format") return ref.format === refFilter.value;
    if (refFilter.kind === "tag") return refHasTag(ref, refFilter.value);
    if (refFilter.kind === "untagged") return !(ref.tags && ref.tags.length);
    return true;
  }

  function ensureRefBoard() {
    if (!Array.isArray(store.references)) store.references = [];
    if (!Array.isArray(store.refGroups)) store.refGroups = [];

    if (store.refGroups.length === 0) {
      store.refGroups = [{ id: uid(), title: "Board", order: 0 }];
    } else {
      const titles = store.refGroups.map((g) => g.title);
      const presets = ["Inbox", "Shortlist", "Archive"];
      const onlyPresets =
        store.refGroups.length === 3 &&
        store.refGroups.every((g) => presets.includes(g.title)) &&
        presets.every((t) => titles.includes(t));
      if (onlyPresets) {
        const boardId = uid();
        const ordered = [...store.refGroups]
          .sort((a, b) => a.order - b.order)
          .flatMap((g) =>
            store.references
              .filter((r) => r.groupId === g.id)
              .sort((a, b) => a.order - b.order)
          );
        store.refGroups = [{ id: boardId, title: "Board", order: 0 }];
        ordered.forEach((ref, i) => {
          ref.groupId = boardId;
          ref.order = i;
        });
        store.references.forEach((ref) => {
          if (!ordered.includes(ref)) {
            ref.groupId = boardId;
            ref.order = ordered.length;
          }
        });
      }
    }

    store.refGroups = store.refGroups
      .map((g, i) => ({
        id: g.id || uid(),
        title: (g.title || "Group").trim() || "Group",
        order: typeof g.order === "number" ? g.order : i,
      }))
      .sort((a, b) => a.order - b.order);
    store.refGroups.forEach((g, i) => {
      g.order = i;
    });

    const groupIds = new Set(store.refGroups.map((g) => g.id));
    const fallback = store.refGroups[0].id;
    store.references.forEach((ref, i) => {
      if (!ref.groupId || !groupIds.has(ref.groupId)) ref.groupId = fallback;
      if (typeof ref.order !== "number") ref.order = i;
      ref.tags = normalizeRefTags(ref.tags);
      ref.keyPoints = normalizeKeyPoints(ref.keyPoints);
      ref.images = normalizeRefImages(ref.images);
    });
  }

  function sortedRefGroups() {
    ensureRefBoard();
    return [...store.refGroups].sort((a, b) => a.order - b.order);
  }

  function refsInGroup(groupId, refs = store.references) {
    return refs
      .filter((r) => r.groupId === groupId)
      .sort((a, b) => a.order - b.order);
  }

  function defaultRefGroupId() {
    ensureRefBoard();
    return sortedRefGroups()[0]?.id || "";
  }

  function reindexGroup(groupId) {
    refsInGroup(groupId).forEach((ref, i) => {
      ref.order = i;
    });
  }

  function moveRefToGroup(refId, targetGroupId, beforeRefId = null) {
    ensureRefBoard();
    const ref = store.references.find((r) => r.id === refId);
    if (!ref || !store.refGroups.some((g) => g.id === targetGroupId)) return;
    const fromGroup = ref.groupId;
    ref.groupId = targetGroupId;

    let siblings = refsInGroup(targetGroupId).filter((r) => r.id !== refId);
    if (beforeRefId) {
      const idx = siblings.findIndex((r) => r.id === beforeRefId);
      if (idx >= 0) siblings.splice(idx, 0, ref);
      else siblings.push(ref);
    } else {
      siblings.push(ref);
    }
    siblings.forEach((r, i) => {
      r.order = i;
    });
    if (fromGroup !== targetGroupId) reindexGroup(fromGroup);
    saveStore();
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

  function openMediaDb() {
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(MEDIA_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Media DB failed"));
    });
    return mediaDbPromise;
  }

  async function putMediaBlob(id, blob) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readwrite");
      tx.objectStore(MEDIA_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getMediaBlob(id) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readonly");
      const req = tx.objectStore(MEDIA_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteMediaBlob(id) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readwrite");
      tx.objectStore(MEDIA_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function revokeCachedUrl(id) {
    const url = objectUrlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(id);
    }
  }

  async function getMediaUrl(id) {
    if (objectUrlCache.has(id)) return objectUrlCache.get(id);
    const blob = await getMediaBlob(id);
    if (!blob) return "";
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(id, url);
    return url;
  }

  function compressImageFile(file, maxWidth = 1600, quality = 0.84) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Not an image"));
        return;
      }
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(src);
        canvas.toBlob(
          (blob) => {
            if (!blob) reject(new Error("Compress failed"));
            else resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(src);
        reject(new Error("Image load failed"));
      };
      img.src = src;
    });
  }

  function normalizeKeyPoints(points) {
    if (!Array.isArray(points)) return [];
    return points
      .map((p) => String(p || "").trim())
      .filter(Boolean)
      .slice(0, 40);
  }

  function normalizeRefImages(images) {
    if (!Array.isArray(images)) return [];
    return images
      .map((img) => {
        if (typeof img === "string") return { id: img };
        if (img && img.id) return { id: img.id, name: img.name || "" };
        return null;
      })
      .filter(Boolean);
  }

  async function deleteRefImages(images) {
    const list = normalizeRefImages(images);
    await Promise.all(
      list.map(async (img) => {
        revokeCachedUrl(img.id);
        try {
          await deleteMediaBlob(img.id);
        } catch {
          /* ignore */
        }
      })
    );
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
    notesTab = ["links", "refs", "stickies", "consolidated"].includes(tab)
      ? tab
      : "links";
    localStorage.setItem(NOTES_TAB_KEY, notesTab);
    els.notesPanelLinks.hidden = notesTab !== "links";
    els.notesPanelRefs.hidden = notesTab !== "refs";
    els.notesPanelStickies.hidden = notesTab !== "stickies";
    els.notesPanelConsolidated.hidden = notesTab !== "consolidated";
    els.notesTabLinks.setAttribute("aria-selected", notesTab === "links" ? "true" : "false");
    els.notesTabRefs.setAttribute("aria-selected", notesTab === "refs" ? "true" : "false");
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
    renderRefsPanel();
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

  function clearRefEditing({ discardDraftImages = false } = {}) {
    editingRefId = null;
    draftRefTags = [];
    draftKeyPoints = [""];
    const orphanImages = discardDraftImages ? [...draftImages] : [];
    draftImages.forEach((img) => {
      if (img.url && !objectUrlCache.has(img.id)) URL.revokeObjectURL(img.url);
    });
    draftImages = [];
    els.refTitle.value = "";
    els.refUrl.value = "";
    els.refFormat.value = "";
    els.refNote.value = "";
    els.refTagInput.value = "";
    els.refSubmitBtn.textContent = "Save reference";
    els.refCancelEdit.hidden = true;
    els.refEditHint.hidden = true;
    renderDraftRefTags();
    renderDraftKeyPoints();
    renderDraftImages();
    if (orphanImages.length) {
      deleteRefImages(orphanImages);
    }
  }

  function startRefEditing(ref) {
    editingRefId = ref.id;
    draftRefTags = normalizeRefTags(ref.tags);
    draftKeyPoints = normalizeKeyPoints(ref.keyPoints);
    if (!draftKeyPoints.length) draftKeyPoints = [""];
    draftImages.forEach((img) => {
      if (img.url) URL.revokeObjectURL(img.url);
    });
    draftImages = normalizeRefImages(ref.images).map((img) => ({
      id: img.id,
      name: img.name || "",
      url: "",
    }));
    els.refTitle.value = ref.title || "";
    els.refUrl.value = ref.url || "";
    els.refFormat.value = ref.format || "";
    els.refNote.value = ref.note || "";
    els.refTagInput.value = "";
    els.refSubmitBtn.textContent = "Update reference";
    els.refCancelEdit.hidden = false;
    els.refEditHint.hidden = false;
    renderDraftRefTags();
    renderDraftKeyPoints();
    renderDraftImages();
    els.refTitle.focus();
    els.refTitle.select();
    renderRefsPanel();
    showToast("Editing reference");
  }

  function renderDraftKeyPoints() {
    els.refPointList.innerHTML = "";
    if (!draftKeyPoints.length) draftKeyPoints = [""];
    draftKeyPoints.forEach((point, index) => {
      const li = document.createElement("li");
      li.className = "ref-point-row";

      const bullet = document.createElement("span");
      bullet.className = "ref-point-bullet";
      bullet.setAttribute("aria-hidden", "true");

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 280;
      input.value = point;
      input.placeholder = `Key point ${index + 1}…`;
      input.setAttribute("aria-label", `Key point ${index + 1}`);
      input.addEventListener("input", () => {
        draftKeyPoints[index] = input.value;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          draftKeyPoints.splice(index + 1, 0, "");
          renderDraftKeyPoints();
          const next = els.refPointList.querySelectorAll("input")[index + 1];
          next?.focus();
        } else if (e.key === "Backspace" && !input.value && draftKeyPoints.length > 1) {
          e.preventDefault();
          draftKeyPoints.splice(index, 1);
          renderDraftKeyPoints();
          const prev = els.refPointList.querySelectorAll("input")[
            Math.max(0, index - 1)
          ];
          prev?.focus();
        }
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.setAttribute("aria-label", "Remove key point");
      del.textContent = "×";
      del.addEventListener("click", () => {
        draftKeyPoints.splice(index, 1);
        if (!draftKeyPoints.length) draftKeyPoints = [""];
        renderDraftKeyPoints();
      });

      li.append(bullet, input, del);
      els.refPointList.appendChild(li);
    });
  }

  async function renderDraftImages() {
    els.refImageGrid.innerHTML = "";
    const has = draftImages.length > 0;
    els.refImageEmpty.hidden = has;
    els.refImageEmpty.textContent = has
      ? ""
      : "Upload screenshots or inspo, then tap an image to draw on it.";

    for (const img of draftImages) {
      if (!img.url) {
        try {
          img.url = await getMediaUrl(img.id);
        } catch {
          img.url = "";
        }
      }
      const card = document.createElement("div");
      card.className = "ref-image-card";

      if (img.url) {
        const image = document.createElement("img");
        image.src = img.url;
        image.alt = img.name || "Reference image";
        card.appendChild(image);
      }

      const actions = document.createElement("div");
      actions.className = "ref-image-actions";

      const drawBtn = document.createElement("button");
      drawBtn.type = "button";
      drawBtn.textContent = "Draw";
      drawBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDrawModal(img.id);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await removeDraftImage(img.id);
      });

      actions.append(drawBtn, delBtn);
      card.appendChild(actions);
      card.addEventListener("click", () => openDrawModal(img.id));
      els.refImageGrid.appendChild(card);
    }
  }

  async function removeDraftImage(imageId) {
    draftImages = draftImages.filter((img) => img.id !== imageId);
    revokeCachedUrl(imageId);
    try {
      await deleteMediaBlob(imageId);
    } catch {
      /* ignore */
    }
    if (editingRefId) {
      const ref = store.references.find((r) => r.id === editingRefId);
      if (ref) {
        ref.images = normalizeRefImages(ref.images).filter((i) => i.id !== imageId);
        saveStore();
      }
    }
    renderDraftImages();
    renderRefsPanel();
    showToast("Image removed");
  }

  async function addDraftImagesFromFiles(fileList) {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      showToast("Choose an image file");
      return;
    }
    for (const file of files.slice(0, 8)) {
      try {
        const blob = await compressImageFile(file);
        const id = uid();
        await putMediaBlob(id, blob);
        const url = URL.createObjectURL(blob);
        objectUrlCache.set(id, url);
        draftImages.push({ id, name: file.name || "", url });
      } catch {
        showToast("Could not add one image");
      }
    }
    if (editingRefId) {
      const ref = store.references.find((r) => r.id === editingRefId);
      if (ref) {
        ref.images = draftImages.map((img) => ({
          id: img.id,
          name: img.name || "",
        }));
        saveStore();
      }
    }
    renderDraftImages();
    renderRefsPanel();
    showToast(files.length > 1 ? "Images added" : "Image added");
  }

  function setupDrawColors() {
    els.drawColors.innerHTML = "";
    DRAW_COLORS.forEach((color, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `draw-color${i === 0 ? " is-active" : ""}`;
      btn.style.background = color.value;
      btn.title = color.name;
      btn.setAttribute("aria-label", color.name);
      btn.addEventListener("click", () => {
        if (!drawSession) return;
        drawSession.color = color.value;
        els.drawColors.querySelectorAll(".draw-color").forEach((el) => {
          el.classList.toggle("is-active", el === btn);
        });
      });
      els.drawColors.appendChild(btn);
    });
  }

  function setDrawTool(tool) {
    if (!drawSession) return;
    drawSession.tool = tool;
    els.drawPen.classList.toggle("is-active", tool === "pen");
    els.drawEraser.classList.toggle("is-active", tool === "eraser");
  }

  async function openDrawModal(imageId) {
    const blob = await getMediaBlob(imageId);
    if (!blob) {
      showToast("Image not found");
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    drawSession = {
      imageId,
      tool: "pen",
      color: DRAW_COLORS[0].value,
      drawing: false,
      lastX: 0,
      lastY: 0,
      sourceUrl: url,
      sourceImg: img,
    };

    els.drawModal.hidden = false;
    setDrawTool("pen");
    resizeDrawCanvases();
    paintDrawBase();
    const layer = els.drawLayer.getContext("2d");
    layer.clearRect(0, 0, els.drawLayer.width, els.drawLayer.height);
  }

  function closeRefViewer() {
    viewingRefId = null;
    els.refViewModal.hidden = true;
    els.refViewBody.innerHTML = "";
    els.refViewMeta.innerHTML = "";
  }

  async function openRefViewer(refId) {
    ensureRefBoard();
    const ref = store.references.find((r) => r.id === refId);
    if (!ref) {
      showToast("Reference not found");
      return;
    }
    viewingRefId = ref.id;
    els.refViewTitle.textContent = ref.title || "Untitled reference";
    els.refViewKicker.textContent = refFormatLabel(ref.format) || "reference";

    els.refViewMeta.innerHTML = "";
    const formatChip = document.createElement("span");
    formatChip.className = "ref-format-chip";
    formatChip.dataset.format = ref.format || "other";
    formatChip.textContent = refFormatLabel(ref.format) || "Other";
    els.refViewMeta.appendChild(formatChip);

    normalizeRefTags(ref.tags).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "ref-tag-chip";
      chip.textContent = tag;
      els.refViewMeta.appendChild(chip);
    });

    els.refViewBody.innerHTML = "";

    const points = normalizeKeyPoints(ref.keyPoints);
    if (points.length) {
      const section = document.createElement("section");
      const heading = document.createElement("p");
      heading.className = "ref-view-section-title";
      heading.textContent = "Key points";
      const list = document.createElement("ul");
      list.className = "ref-view-points";
      points.forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        list.appendChild(li);
      });
      section.append(heading, list);
      els.refViewBody.appendChild(section);
    }

    const images = normalizeRefImages(ref.images);
    if (images.length) {
      const section = document.createElement("section");
      const heading = document.createElement("p");
      heading.className = "ref-view-section-title";
      heading.textContent = "Images — tap to draw";
      const grid = document.createElement("div");
      grid.className = "ref-view-images";
      for (const img of images) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ref-view-image";
        btn.setAttribute("aria-label", "Open image to draw");
        const photo = document.createElement("img");
        photo.alt = img.name || "Reference image";
        try {
          const url = await getMediaUrl(img.id);
          if (url) photo.src = url;
        } catch {
          /* ignore */
        }
        btn.appendChild(photo);
        btn.addEventListener("click", () => {
          openDrawModal(img.id);
        });
        grid.appendChild(btn);
      }
      section.append(heading, grid);
      els.refViewBody.appendChild(section);
    }

    if (ref.note?.trim()) {
      const section = document.createElement("section");
      const heading = document.createElement("p");
      heading.className = "ref-view-section-title";
      heading.textContent = "Notes";
      const note = document.createElement("p");
      note.className = "ref-view-note";
      note.textContent = ref.note;
      section.append(heading, note);
      els.refViewBody.appendChild(section);
    }

    if (ref.url?.trim()) {
      const section = document.createElement("section");
      const heading = document.createElement("p");
      heading.className = "ref-view-section-title";
      heading.textContent = "Link";
      if (looksLikeUrl(ref.url)) {
        const link = document.createElement("a");
        link.className = "ref-view-link";
        link.href = ref.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = ref.url;
        section.append(heading, link);
      } else {
        const text = document.createElement("p");
        text.className = "ref-view-note";
        text.textContent = ref.url;
        section.append(heading, text);
      }
      els.refViewBody.appendChild(section);
    }

    if (!els.refViewBody.children.length) {
      const empty = document.createElement("p");
      empty.className = "ref-view-empty";
      empty.textContent = "No details yet — hit Edit to add key points, images, or notes.";
      els.refViewBody.appendChild(empty);
    }

    els.refViewModal.hidden = false;
  }

  function closeDrawModal() {
    if (drawSession?.sourceUrl) URL.revokeObjectURL(drawSession.sourceUrl);
    drawSession = null;
    els.drawModal.hidden = true;
  }

  function resizeDrawCanvases() {
    if (!drawSession?.sourceImg) return;
    const img = drawSession.sourceImg;
    const maxW = Math.min(els.drawStage.clientWidth || 800, 900);
    const scale = Math.min(1, maxW / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    els.drawStage.style.height = `${h}px`;
    [els.drawBase, els.drawLayer].forEach((canvas) => {
      canvas.width = w;
      canvas.height = h;
    });
  }

  function paintDrawBase() {
    if (!drawSession?.sourceImg) return;
    const ctx = els.drawBase.getContext("2d");
    ctx.clearRect(0, 0, els.drawBase.width, els.drawBase.height);
    ctx.drawImage(drawSession.sourceImg, 0, 0, els.drawBase.width, els.drawBase.height);
  }

  function drawPointerPos(e) {
    const rect = els.drawLayer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * els.drawLayer.width;
    const y = ((e.clientY - rect.top) / rect.height) * els.drawLayer.height;
    return { x, y };
  }

  function strokeDraw(from, to) {
    if (!drawSession) return;
    const ctx = els.drawLayer.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Number(els.drawSize.value) || 6;
    if (drawSession.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = drawSession.color;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  async function saveDrawing() {
    if (!drawSession) return;
    const out = document.createElement("canvas");
    out.width = els.drawBase.width;
    out.height = els.drawBase.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(els.drawBase, 0, 0);
    ctx.drawImage(els.drawLayer, 0, 0);
    const blob = await new Promise((resolve) =>
      out.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (!blob) {
      showToast("Could not save drawing");
      return;
    }
    const id = drawSession.imageId;
    await putMediaBlob(id, blob);
    revokeCachedUrl(id);
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(id, url);
    const draft = draftImages.find((img) => img.id === id);
    if (draft) {
      if (draft.url && draft.url !== url) URL.revokeObjectURL(draft.url);
      draft.url = url;
    }
    closeDrawModal();
    renderDraftImages();
    renderRefsPanel();
    if (viewingRefId) openRefViewer(viewingRefId);
    showToast("Drawing saved");
  }

  function renderDraftRefTags() {
    els.refTagDraft.innerHTML = "";
    draftRefTags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "ref-tag-chip";
      chip.appendChild(document.createTextNode(tag));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove tag ${tag}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        draftRefTags = draftRefTags.filter(
          (t) => t.toLowerCase() !== tag.toLowerCase()
        );
        renderDraftRefTags();
      });
      chip.appendChild(remove);
      els.refTagDraft.appendChild(chip);
    });
    updateRefTagSuggestions();
  }

  function updateRefTagSuggestions() {
    const known = collectKnownTags();
    const draftKeys = new Set(draftRefTags.map((t) => t.toLowerCase()));
    els.refTagSuggestions.innerHTML = known
      .filter((tag) => !draftKeys.has(tag.toLowerCase()))
      .map((tag) => `<option value="${tag.replace(/"/g, "&quot;")}"></option>`)
      .join("");

    const quickPool = [];
    const seen = new Set();
    [...REF_TAG_SUGGESTIONS, ...known].forEach((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key) || draftKeys.has(key)) return;
      seen.add(key);
      quickPool.push(tag);
    });

    els.refTagQuick.innerHTML = "";
    quickPool.slice(0, 8).forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ref-tag-suggest";
      btn.textContent = `+ ${tag}`;
      btn.addEventListener("click", () => {
        addDraftRefTag(tag);
        els.refTagInput.focus();
      });
      els.refTagQuick.appendChild(btn);
    });
  }

  function addDraftRefTag(raw) {
    const parts = String(raw || "")
      .split(/[,;]+/)
      .map(normalizeTag)
      .filter(Boolean);
    if (!parts.length) return false;
    let added = false;
    parts.forEach((tag) => {
      if (draftRefTags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
      draftRefTags.push(tag);
      added = true;
    });
    if (added) {
      els.refTagInput.value = "";
      renderDraftRefTags();
      showToast(
        draftRefTags.length === 1
          ? "Tag added — add more if you want"
          : `${draftRefTags.length} tags ready`
      );
    }
    return added;
  }

  function setRefFilter(next) {
    refFilter = parseRefFilter(
      typeof next === "string" ? next : serializeRefFilter(next)
    );
    localStorage.setItem(REF_FILTER_KEY, serializeRefFilter(refFilter));
    renderRefsPanel();
  }

  function renderRefFilters(allRefs) {
    const formatCounts = { all: allRefs.length };
    REF_FORMATS.forEach(([value]) => {
      formatCounts[value] = allRefs.filter((r) => r.format === value).length;
    });

    const tagCounts = {};
    collectKnownTags(allRefs).forEach((tag) => {
      tagCounts[tag] = allRefs.filter((r) => refHasTag(r, tag)).length;
    });

    els.refFilters.innerHTML = "";

    const addChip = (label, count, active, onClick, extraClass = "") => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ref-filter${extraClass}${active ? " is-active" : ""}`;
      btn.textContent = `${label} (${count})`;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.addEventListener("click", onClick);
      els.refFilters.appendChild(btn);
    };

    addChip("All", formatCounts.all, refFilter.kind === "all", () =>
      setRefFilter("all")
    );

    const untaggedCount = allRefs.filter((r) => !(r.tags && r.tags.length)).length;
    if (untaggedCount > 0 || refFilter.kind === "untagged") {
      addChip(
        "No tag",
        untaggedCount,
        refFilter.kind === "untagged",
        () => setRefFilter({ kind: "untagged", value: "untagged" }),
        " is-tag"
      );
    }

    REF_FORMATS.forEach(([value, label]) => {
      const count = formatCounts[value] || 0;
      if (
        count === 0 &&
        !(refFilter.kind === "format" && refFilter.value === value)
      ) {
        return;
      }
      addChip(
        label,
        count,
        refFilter.kind === "format" && refFilter.value === value,
        () => setRefFilter({ kind: "format", value })
      );
    });

    Object.keys(tagCounts)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .forEach((tag) => {
        addChip(
          tag,
          tagCounts[tag],
          refFilter.kind === "tag" &&
            refFilter.value.toLowerCase() === tag.toLowerCase(),
          () => setRefFilter({ kind: "tag", value: tag }),
          " is-tag"
        );
      });
  }

  function endRefDrag() {
    if (!refDrag) return;
    refDrag.card?.classList.remove("is-dragging");
    refDrag.ghost?.remove();
    document.querySelectorAll(".ref-column.is-drop-target").forEach((el) => {
      el.classList.remove("is-drop-target");
    });
    document.querySelectorAll(".ref-card.is-drag-over").forEach((el) => {
      el.classList.remove("is-drag-over");
    });
    window.removeEventListener("pointermove", onRefDragMove);
    window.removeEventListener("pointerup", onRefDragEnd);
    window.removeEventListener("pointercancel", onRefDragEnd);
    refDrag = null;
  }

  function onRefDragMove(e) {
    if (!refDrag) return;
    if (refDrag.ghost) {
      refDrag.ghost.style.left = `${e.clientX + 12}px`;
      refDrag.ghost.style.top = `${e.clientY + 12}px`;
    }

    document.querySelectorAll(".ref-column.is-drop-target").forEach((el) => {
      el.classList.remove("is-drop-target");
    });
    document.querySelectorAll(".ref-card.is-drag-over").forEach((el) => {
      el.classList.remove("is-drag-over");
    });

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const column = el?.closest?.(".ref-column");
    const card = el?.closest?.(".ref-card");
    if (column) column.classList.add("is-drop-target");
    if (card && card.dataset.refId !== refDrag.refId) {
      card.classList.add("is-drag-over");
    }
  }

  function onRefDragEnd(e) {
    if (!refDrag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const column = el?.closest?.(".ref-column");
    const overCard = el?.closest?.(".ref-card");
    const targetGroupId = column?.dataset?.groupId;
    const beforeRefId =
      overCard && overCard.dataset.refId !== refDrag.refId
        ? overCard.dataset.refId
        : null;

    if (targetGroupId) {
      moveRefToGroup(refDrag.refId, targetGroupId, beforeRefId);
      endRefDrag();
      renderRefsPanel();
      showToast("Moved on board");
      return;
    }
    endRefDrag();
  }

  function startRefDrag(e, card, ref) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest("a, button, input, select, textarea")) return;
    e.preventDefault();

    endRefDrag();
    const ghost = document.createElement("div");
    ghost.className = "ref-drag-ghost";
    ghost.textContent = ref.title || "Reference";
    ghost.style.left = `${e.clientX + 12}px`;
    ghost.style.top = `${e.clientY + 12}px`;
    document.body.appendChild(ghost);

    card.classList.add("is-dragging");
    refDrag = { refId: ref.id, card, ghost };
    window.addEventListener("pointermove", onRefDragMove);
    window.addEventListener("pointerup", onRefDragEnd);
    window.addEventListener("pointercancel", onRefDragEnd);
  }

  function createRefCard(ref) {
    const card = document.createElement("article");
    card.className = `ref-card${ref.id === editingRefId ? " is-editing" : ""}`;
    card.dataset.refId = ref.id;
    card.tabIndex = 0;
    card.setAttribute("aria-grabbed", "false");

    const handle = document.createElement("span");
    handle.className = "ref-card-handle";
    handle.setAttribute("aria-hidden", "true");
    handle.textContent = "⠿";

    const top = document.createElement("div");
    top.className = "ref-card-top";

    const title = document.createElement("p");
    title.className = "ref-card-title";
    title.textContent = ref.title || "Untitled reference";
    title.style.cursor = "pointer";
    title.title = "Open reference";
    title.addEventListener("click", (e) => {
      e.stopPropagation();
      openRefViewer(ref.id);
    });
    title.addEventListener("pointerdown", (e) => e.stopPropagation());

    const chip = document.createElement("span");
    chip.className = "ref-format-chip";
    chip.dataset.format = ref.format || "other";
    chip.textContent = refFormatLabel(ref.format) || "Other";

    top.append(title, chip);

    card.append(handle, top);

    const tags = normalizeRefTags(ref.tags);
    if (tags.length) {
      const tagRow = document.createElement("div");
      tagRow.className = "ref-card-tags";
      tags.forEach((tag) => {
        const tagChip = document.createElement("span");
        tagChip.className = "ref-tag-chip";
        tagChip.textContent = tag;
        tagRow.appendChild(tagChip);
      });
      card.appendChild(tagRow);
    }

    const points = normalizeKeyPoints(ref.keyPoints);
    if (points.length) {
      const list = document.createElement("ul");
      list.className = "ref-card-points";
      points.slice(0, 4).forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        list.appendChild(li);
      });
      if (points.length > 4) {
        const more = document.createElement("li");
        more.textContent = `+${points.length - 4} more`;
        list.appendChild(more);
      }
      card.appendChild(list);
    }

    const images = normalizeRefImages(ref.images);
    if (images.length) {
      const thumbs = document.createElement("div");
      thumbs.className = "ref-card-thumbs";
      images.slice(0, 4).forEach((img) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ref-card-thumb";
        btn.setAttribute("aria-label", "Open image to draw");
        const photo = document.createElement("img");
        photo.alt = "";
        getMediaUrl(img.id)
          .then((url) => {
            if (url) photo.src = url;
          })
          .catch(() => {});
        btn.appendChild(photo);
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          startRefEditing(ref);
          openDrawModal(img.id);
        });
        btn.addEventListener("pointerdown", (e) => e.stopPropagation());
        thumbs.appendChild(btn);
      });
      card.appendChild(thumbs);
    }

    if (ref.note) {
      const note = document.createElement("p");
      note.className = "ref-card-note";
      note.textContent = ref.note;
      card.appendChild(note);
    } else if (ref.id === editingRefId) {
      const note = document.createElement("p");
      note.className = "ref-card-note";
      note.textContent = "editing…";
      card.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "ref-card-actions";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "dash-item-side as-btn";
    open.textContent = "Open";
    open.setAttribute("aria-label", "Open reference");
    open.addEventListener("click", () => openRefViewer(ref.id));
    actions.appendChild(open);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "dash-item-side as-btn";
    edit.textContent = ref.id === editingRefId ? "Editing…" : "Edit";
    edit.disabled = ref.id === editingRefId;
    edit.addEventListener("click", () => startRefEditing(ref));
    actions.appendChild(edit);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.setAttribute("aria-label", "Delete reference");
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (editingRefId === ref.id) clearRefEditing();
      if (viewingRefId === ref.id) closeRefViewer();
      await deleteRefImages(ref.images);
      store.references = store.references.filter((r) => r.id !== ref.id);
      saveStore();
      renderRefsPanel();
      showToast("Reference removed");
    });
    actions.appendChild(del);

    card.appendChild(actions);
    card.addEventListener("pointerdown", (e) => startRefDrag(e, card, ref));
    return card;
  }

  function renameRefGroup(groupId, title) {
    ensureRefBoard();
    const group = store.refGroups.find((g) => g.id === groupId);
    if (!group) return;
    const next = title.trim() || group.title;
    if (next === group.title) return;
    group.title = next;
    saveStore();
    showToast("Group renamed");
  }

  function deleteRefGroup(groupId) {
    ensureRefBoard();
    if (store.refGroups.length <= 1) {
      showToast("Keep at least one group");
      return;
    }
    const remaining = store.refGroups.filter((g) => g.id !== groupId);
    const fallback = remaining[0].id;
    store.references.forEach((ref) => {
      if (ref.groupId === groupId) ref.groupId = fallback;
    });
    store.refGroups = remaining;
    store.refGroups.forEach((g, i) => {
      g.order = i;
    });
    reindexGroup(fallback);
    if (expandedGroupId === groupId) {
      expandedGroupId = null;
      localStorage.removeItem(REF_GROUP_VIEW_KEY);
    }
    saveStore();
    renderRefsPanel();
    showToast("Group removed");
  }

  function addRefGroup(title = "New group") {
    ensureRefBoard();
    const group = {
      id: uid(),
      title,
      order: store.refGroups.length,
    };
    store.refGroups.push(group);
    saveStore();
    renderRefsPanel();
    showToast("Group added");
    const input = els.refBoard.querySelector(
      `.ref-column[data-group-id="${group.id}"] .ref-column-title`
    );
    if (input) {
      input.focus();
      input.select();
    }
  }

  function setExpandedGroup(groupId) {
    ensureRefBoard();
    if (groupId && store.refGroups.some((g) => g.id === groupId)) {
      expandedGroupId = groupId;
      localStorage.setItem(REF_GROUP_VIEW_KEY, groupId);
    } else {
      expandedGroupId = null;
      localStorage.removeItem(REF_GROUP_VIEW_KEY);
    }
    renderRefsPanel();
  }

  function renderRefsPanel() {
    ensureRefBoard();
    const all = store.references;
    const filtered = all.filter(matchesRefFilter);
    const groups = sortedRefGroups();

    if (
      expandedGroupId &&
      !groups.some((g) => g.id === expandedGroupId)
    ) {
      expandedGroupId = null;
      localStorage.removeItem(REF_GROUP_VIEW_KEY);
    }

    const expandedGroup = expandedGroupId
      ? groups.find((g) => g.id === expandedGroupId)
      : null;

    els.refsCount.textContent = String(
      expandedGroup
        ? refsInGroup(expandedGroup.id, filtered).length
        : filtered.length
    );
    els.refBoard.innerHTML = "";
    els.refBoard.classList.toggle("is-expanded", Boolean(expandedGroup));

    if (els.refBoardHint) {
      els.refBoardHint.textContent = expandedGroup
        ? "Expanded group — open any card, or go back to see all groups."
        : "Each group has an Open group button — tap it to browse that group full-width.";
    }

    els.refsEmpty.hidden = filtered.length > 0 || all.length === 0;
    if (all.length === 0) {
      els.refsEmpty.hidden = false;
      els.refsEmpty.textContent =
        "No references yet. Save ones you love, tag them, and drag into groups.";
    } else if (filtered.length === 0) {
      els.refsEmpty.hidden = false;
      const label =
        refFilter.kind === "tag"
          ? refFilter.value
          : refFilter.kind === "untagged"
            ? "untagged"
            : refFilter.kind === "format"
              ? refFormatLabel(refFilter.value).toLowerCase()
              : "matching";
      els.refsEmpty.textContent = `No ${label} references on the board.`;
    } else {
      els.refsEmpty.hidden = true;
    }

    renderRefFilters(all);
    updateRefTagSuggestions();

    if (expandedGroup) {
      const back = document.createElement("div");
      back.className = "ref-board-back";

      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "ghost-btn";
      backBtn.textContent = "← All groups";
      backBtn.addEventListener("click", () => setExpandedGroup(null));

      const title = document.createElement("h3");
      title.className = "ref-board-back-title";
      title.textContent = expandedGroup.title;

      const count = document.createElement("span");
      count.className = "ref-column-count";
      const groupRefs = refsInGroup(expandedGroup.id, filtered);
      count.textContent = String(groupRefs.length);

      back.append(backBtn, title, count);
      els.refBoard.appendChild(back);

      const column = document.createElement("section");
      column.className = "ref-column is-expanded-view";
      column.dataset.groupId = expandedGroup.id;

      const list = document.createElement("div");
      list.className = "ref-column-list is-expanded-grid";

      if (!groupRefs.length) {
        const empty = document.createElement("p");
        empty.className = "ref-column-empty";
        empty.textContent = "No references in this group yet";
        list.appendChild(empty);
      } else {
        groupRefs.forEach((ref) => list.appendChild(createRefCard(ref)));
      }

      column.appendChild(list);
      els.refBoard.appendChild(column);
      return;
    }

    groups.forEach((group) => {
      const column = document.createElement("section");
      column.className = "ref-column is-clickable";
      column.dataset.groupId = group.id;
      column.setAttribute("role", "button");
      column.setAttribute("tabindex", "0");
      column.setAttribute(
        "aria-label",
        `Open group ${group.title}`
      );

      const head = document.createElement("div");
      head.className = "ref-column-head";

      const titleInput = document.createElement("input");
      titleInput.className = "ref-column-title";
      titleInput.type = "text";
      titleInput.maxLength = 40;
      titleInput.value = group.title;
      titleInput.setAttribute("aria-label", "Group name");
      titleInput.addEventListener("click", (e) => e.stopPropagation());
      titleInput.addEventListener("pointerdown", (e) => e.stopPropagation());
      titleInput.addEventListener("change", () => {
        renameRefGroup(group.id, titleInput.value);
      });
      titleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          titleInput.blur();
        }
      });

      const count = document.createElement("span");
      count.className = "ref-column-count";
      const groupRefs = refsInGroup(group.id, filtered);
      count.textContent = String(groupRefs.length);

      const delGroup = document.createElement("button");
      delGroup.type = "button";
      delGroup.className = "delete ref-column-delete";
      delGroup.setAttribute("aria-label", `Delete group ${group.title}`);
      delGroup.textContent = "×";
      delGroup.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteRefGroup(group.id);
      });

      head.append(titleInput, count, delGroup);

      const list = document.createElement("div");
      list.className = "ref-column-list";

      if (!groupRefs.length) {
        const empty = document.createElement("p");
        empty.className = "ref-column-empty";
        empty.textContent = "No cards yet — drop or add references here";
        list.appendChild(empty);
      } else {
        groupRefs.slice(0, 2).forEach((ref) => list.appendChild(createRefCard(ref)));
      }

      const openGroup = document.createElement("button");
      openGroup.type = "button";
      openGroup.className = "ref-open-group";
      openGroup.textContent =
        groupRefs.length > 0
          ? `Open group · ${groupRefs.length}`
          : "Open group";
      openGroup.setAttribute("aria-label", `Open group ${group.title}`);
      openGroup.addEventListener("click", (e) => {
        e.stopPropagation();
        setExpandedGroup(group.id);
      });

      column.append(head, list, openGroup);
      column.addEventListener("click", (e) => {
        if (e.target.closest("input, button, a, .ref-card")) return;
        setExpandedGroup(group.id);
      });
      column.addEventListener("keydown", (e) => {
        if (e.target !== column) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpandedGroup(group.id);
        }
      });
      els.refBoard.appendChild(column);
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
    (store.references || []).forEach((r) => {
      const group = (store.refGroups || []).find((g) => g.id === r.groupId);
      lines.push(
        `Reference: ${r.title} [${refFormatLabel(r.format) || "ref"}]${
          group ? ` {${group.title}}` : ""
        }${
          (r.tags || []).length ? ` #${(r.tags || []).join(" #")}` : ""
        }${
          (r.keyPoints || []).length
            ? `\n  - ${(r.keyPoints || []).join("\n  - ")}`
            : ""
        } ${r.url || ""}${r.note ? ` — ${r.note}` : ""}`.trim()
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
  els.notesTabRefs.addEventListener("click", () => {
    setNotesTab("refs");
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

  els.refForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ensureRefBoard();
    if (els.refTagInput.value.trim()) addDraftRefTag(els.refTagInput.value);
    const title = els.refTitle.value.trim();
    const url = els.refUrl.value.trim();
    const format = els.refFormat.value;
    const note = els.refNote.value.trim();
    const tags = normalizeRefTags(draftRefTags);
    const keyPoints = normalizeKeyPoints(draftKeyPoints);
    const images = draftImages.map((img) => ({
      id: img.id,
      name: img.name || "",
    }));
    if (!title || !url || !format) {
      showToast("Add a title, format, and URL");
      return;
    }

    if (editingRefId) {
      const existing = store.references.find((r) => r.id === editingRefId);
      if (!existing) {
        clearRefEditing();
        showToast("Reference not found");
        renderRefsPanel();
        return;
      }
      existing.title = title;
      existing.url = url;
      existing.format = format;
      existing.note = note;
      existing.tags = tags;
      existing.keyPoints = keyPoints;
      existing.images = images;
      existing.updatedAt = Date.now();
      saveStore();
      clearRefEditing();
      renderRefsPanel();
      showToast("Reference updated");
      return;
    }

    const groupId = defaultRefGroupId();
    if (!groupId) {
      showToast("Add a board group first");
      return;
    }

    store.references.unshift({
      id: uid(),
      title,
      url,
      format,
      note,
      tags,
      keyPoints,
      images,
      groupId,
      order: -1,
      createdAt: Date.now(),
    });
    reindexGroup(groupId);
    saveStore();
    clearRefEditing();
    renderRefsPanel();
    showToast("Reference saved");
  });

  els.refPointAdd.addEventListener("click", () => {
    draftKeyPoints.push("");
    renderDraftKeyPoints();
    const inputs = els.refPointList.querySelectorAll("input");
    inputs[inputs.length - 1]?.focus();
  });

  els.refImageInput.addEventListener("change", async () => {
    const files = els.refImageInput.files;
    await addDraftImagesFromFiles(files);
    els.refImageInput.value = "";
  });

  els.drawClose.addEventListener("click", () => closeDrawModal());
  els.drawPen.addEventListener("click", () => setDrawTool("pen"));
  els.drawEraser.addEventListener("click", () => setDrawTool("eraser"));
  els.drawClear.addEventListener("click", () => {
    if (!drawSession) return;
    const ctx = els.drawLayer.getContext("2d");
    ctx.clearRect(0, 0, els.drawLayer.width, els.drawLayer.height);
  });
  els.drawSave.addEventListener("click", () => {
    saveDrawing().catch(() => showToast("Could not save drawing"));
  });

  els.refViewClose.addEventListener("click", () => closeRefViewer());
  els.refViewEdit.addEventListener("click", () => {
    if (!viewingRefId) return;
    const ref = store.references.find((r) => r.id === viewingRefId);
    closeRefViewer();
    if (ref) {
      startRefEditing(ref);
      els.refTitle?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
  });
  els.refViewModal.addEventListener("click", (e) => {
    if (e.target === els.refViewModal) closeRefViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!els.drawModal.hidden) {
      closeDrawModal();
      return;
    }
    if (!els.refViewModal.hidden) closeRefViewer();
  });

  const onDrawPointerDown = (e) => {
    if (!drawSession || e.button != null && e.button !== 0) return;
    e.preventDefault();
    els.drawLayer.setPointerCapture?.(e.pointerId);
    drawSession.drawing = true;
    const pos = drawPointerPos(e);
    drawSession.lastX = pos.x;
    drawSession.lastY = pos.y;
    strokeDraw(pos, pos);
  };
  const onDrawPointerMove = (e) => {
    if (!drawSession?.drawing) return;
    e.preventDefault();
    const pos = drawPointerPos(e);
    strokeDraw(
      { x: drawSession.lastX, y: drawSession.lastY },
      pos
    );
    drawSession.lastX = pos.x;
    drawSession.lastY = pos.y;
  };
  const onDrawPointerUp = (e) => {
    if (!drawSession) return;
    drawSession.drawing = false;
    try {
      els.drawLayer.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  els.drawLayer.addEventListener("pointerdown", onDrawPointerDown);
  els.drawLayer.addEventListener("pointermove", onDrawPointerMove);
  els.drawLayer.addEventListener("pointerup", onDrawPointerUp);
  els.drawLayer.addEventListener("pointercancel", onDrawPointerUp);
  window.addEventListener("resize", () => {
    if (!drawSession) return;
    const layer = document.createElement("canvas");
    layer.width = els.drawLayer.width;
    layer.height = els.drawLayer.height;
    layer.getContext("2d").drawImage(els.drawLayer, 0, 0);
    resizeDrawCanvases();
    paintDrawBase();
    els.drawLayer
      .getContext("2d")
      .drawImage(layer, 0, 0, els.drawLayer.width, els.drawLayer.height);
  });

  els.refTagAdd.addEventListener("click", () => {
    if (!addDraftRefTag(els.refTagInput.value)) {
      showToast("Type a tag first");
      return;
    }
    els.refTagInput.focus();
  });

  els.refTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();
      addDraftRefTag(els.refTagInput.value);
      return;
    }
    if (e.key === "Backspace" && !els.refTagInput.value && draftRefTags.length) {
      draftRefTags.pop();
      renderDraftRefTags();
    }
  });

  els.refTagInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  els.refCancelEdit.addEventListener("click", () => {
    clearRefEditing({ discardDraftImages: false });
    renderRefsPanel();
    showToast("Edit cancelled");
  });

  els.addRefGroup.addEventListener("click", () => addRefGroup());

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
    const boardId = uid();
    store.refGroups = [{ id: boardId, title: "Board", order: 0 }];
    store.references = [
      {
        id: uid(),
        title: "Soft product carousel",
        url: "https://www.instagram.com/",
        format: "carousel",
        note: "Clean pacing + muted palette",
        tags: ["branding", "product"],
        groupId: boardId,
        order: 0,
        createdAt: Date.now(),
      },
      {
        id: uid(),
        title: "Quick tip reel",
        url: "https://www.instagram.com/reels/",
        format: "reel",
        note: "Hook in first 1s",
        tags: ["marketing"],
        groupId: boardId,
        order: 1,
        createdAt: Date.now() - 1000,
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

  ensureRefBoard();
  setupDrawColors();
  draftKeyPoints = [""];
  renderDraftKeyPoints();
  renderDraftRefTags();
  renderDraftImages();
  setView(currentView);
})();
