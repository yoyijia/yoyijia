(() => {
  const META_KEY = "specimen-fonts-meta-v1";
  const FILTER_KEY = "specimen-fonts-filter-v1";
  const DB_NAME = "specimen-fonts-media-v1";
  const STORE = "images";

  const FONT_TYPES = [
    ["serif", "Serif"],
    ["sans", "Sans"],
    ["display", "Display"],
    ["script", "Script"],
    ["mono", "Mono"],
    ["hand", "Handwritten"],
    ["decorative", "Decorative"],
    ["variable", "Variable"],
    ["other", "Other"],
  ];
  const TYPE_LABELS = Object.fromEntries(FONT_TYPES);
  const TAG_SUGGESTIONS = [
    "logo",
    "editorial",
    "poster",
    "elegant",
    "bold",
    "modern",
    "vintage",
    "rounded",
    "condensed",
  ];

  const els = {
    fontForm: document.getElementById("fontForm"),
    fontImage: document.getElementById("fontImage"),
    uploadCard: document.getElementById("uploadCard"),
    uploadPreview: document.getElementById("uploadPreview"),
    fontName: document.getElementById("fontName"),
    fontNote: document.getElementById("fontNote"),
    typeChips: document.getElementById("typeChips"),
    tagDraft: document.getElementById("tagDraft"),
    tagInput: document.getElementById("tagInput"),
    tagAdd: document.getElementById("tagAdd"),
    tagSuggestions: document.getElementById("tagSuggestions"),
    tagQuick: document.getElementById("tagQuick"),
    saveBtn: document.getElementById("saveBtn"),
    cancelEdit: document.getElementById("cancelEdit"),
    editHint: document.getElementById("editHint"),
    fontCount: document.getElementById("fontCount"),
    search: document.getElementById("search"),
    filters: document.getElementById("filters"),
    fontGrid: document.getElementById("fontGrid"),
    fontEmpty: document.getElementById("fontEmpty"),
    viewer: document.getElementById("viewer"),
    viewerTitle: document.getElementById("viewerTitle"),
    viewerType: document.getElementById("viewerType"),
    viewerMeta: document.getElementById("viewerMeta"),
    viewerImage: document.getElementById("viewerImage"),
    viewerNote: document.getElementById("viewerNote"),
    viewerEdit: document.getElementById("viewerEdit"),
    viewerClose: document.getElementById("viewerClose"),
    toast: document.getElementById("toast"),
  };

  let store = loadMeta();
  let draftTypes = new Set();
  let draftTags = [];
  let draftFiles = []; // { id?, blob, url, name }
  let editingId = null;
  let viewingId = null;
  let filter = parseFilter(localStorage.getItem(FILTER_KEY) || "all");
  let searchQuery = "";
  let toastTimer = null;
  let dbPromise = null;
  const urlCache = new Map();

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return { items: [] };
      const parsed = JSON.parse(raw);
      return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
    } catch {
      return { items: [] };
    }
  }

  function saveMeta() {
    localStorage.setItem(META_KEY, JSON.stringify(store));
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("DB failed"));
    });
    return dbPromise;
  }

  async function putBlob(id, blob) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function revokeUrl(id) {
    const url = urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(id);
    }
  }

  async function mediaUrl(id) {
    if (urlCache.has(id)) return urlCache.get(id);
    const blob = await getBlob(id);
    if (!blob) return "";
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  }

  function compressImage(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file?.type?.startsWith("image/")) {
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
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(src);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compress failed"))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(src);
        reject(new Error("Load failed"));
      };
      img.src = src;
    });
  }

  function normalizeTag(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  }

  function normalizeTags(tags) {
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

  function normalizeTypes(types) {
    if (!Array.isArray(types)) return [];
    return [...new Set(types.filter((t) => TYPE_LABELS[t]))];
  }

  function parseFilter(raw) {
    const value = String(raw || "all");
    if (!value || value === "all") return { kind: "all", value: "all" };
    if (value.startsWith("tag:")) {
      const tag = normalizeTag(value.slice(4));
      return tag ? { kind: "tag", value: tag } : { kind: "all", value: "all" };
    }
    if (value.startsWith("type:")) {
      const type = value.slice(5);
      return TYPE_LABELS[type]
        ? { kind: "type", value: type }
        : { kind: "all", value: "all" };
    }
    if (TYPE_LABELS[value]) return { kind: "type", value };
    return { kind: "all", value: "all" };
  }

  function serializeFilter(f) {
    if (f?.kind === "tag" && f.value) return `tag:${f.value}`;
    if (f?.kind === "type" && f.value) return `type:${f.value}`;
    return "all";
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    requestAnimationFrame(() => els.toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove("show");
      setTimeout(() => {
        els.toast.hidden = true;
      }, 280);
    }, 2400);
  }

  function collectKnownTags() {
    const map = new Map();
    store.items.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        const key = tag.toLowerCase();
        if (!map.has(key)) map.set(key, tag);
      });
    });
    return [...map.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function matchesItem(item) {
    if (filter.kind === "type" && !(item.types || []).includes(filter.value)) {
      return false;
    }
    if (
      filter.kind === "tag" &&
      !(item.tags || []).some(
        (t) => t.toLowerCase() === filter.value.toLowerCase()
      )
    ) {
      return false;
    }
    if (!searchQuery) return true;
    const hay = [
      item.name,
      item.note,
      ...(item.tags || []),
      ...(item.types || []).map((t) => TYPE_LABELS[t] || t),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(searchQuery);
  }

  function renderTypeChips() {
    els.typeChips.innerHTML = "";
    FONT_TYPES.forEach(([value, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `type-chip${draftTypes.has(value) ? " is-active" : ""}`;
      btn.textContent = label;
      btn.setAttribute("aria-pressed", draftTypes.has(value) ? "true" : "false");
      btn.addEventListener("click", () => {
        if (draftTypes.has(value)) draftTypes.delete(value);
        else draftTypes.add(value);
        renderTypeChips();
      });
      els.typeChips.appendChild(btn);
    });
  }

  function renderDraftTags() {
    els.tagDraft.innerHTML = "";
    draftTags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.appendChild(document.createTextNode(tag));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${tag}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        draftTags = draftTags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
        renderDraftTags();
      });
      chip.appendChild(remove);
      els.tagDraft.appendChild(chip);
    });
    updateTagSuggestions();
  }

  function updateTagSuggestions() {
    const known = collectKnownTags();
    const draftKeys = new Set(draftTags.map((t) => t.toLowerCase()));
    els.tagSuggestions.innerHTML = known
      .filter((tag) => !draftKeys.has(tag.toLowerCase()))
      .map((tag) => `<option value="${tag.replace(/"/g, "&quot;")}"></option>`)
      .join("");

    const pool = [];
    const seen = new Set();
    [...TAG_SUGGESTIONS, ...known].forEach((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key) || draftKeys.has(key)) return;
      seen.add(key);
      pool.push(tag);
    });
    els.tagQuick.innerHTML = "";
    pool.slice(0, 8).forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggest-chip";
      btn.textContent = `+ ${tag}`;
      btn.addEventListener("click", () => {
        addDraftTag(tag);
        els.tagInput.focus();
      });
      els.tagQuick.appendChild(btn);
    });
  }

  function addDraftTag(raw) {
    const parts = String(raw || "")
      .split(/[,;]+/)
      .map(normalizeTag)
      .filter(Boolean);
    if (!parts.length) return false;
    let added = false;
    parts.forEach((tag) => {
      if (draftTags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
      draftTags.push(tag);
      added = true;
    });
    if (added) {
      els.tagInput.value = "";
      renderDraftTags();
    }
    return added;
  }

  function clearDraft({ keepEditing = false } = {}) {
    draftFiles.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    draftFiles = [];
    draftTypes = new Set();
    draftTags = [];
    els.fontName.value = "";
    els.fontNote.value = "";
    els.tagInput.value = "";
    els.fontImage.value = "";
    els.uploadPreview.hidden = true;
    els.uploadPreview.innerHTML = "";
    els.uploadCard.hidden = false;
    if (!keepEditing) {
      editingId = null;
      els.saveBtn.textContent = "Save specimen";
      els.cancelEdit.hidden = true;
      els.editHint.hidden = true;
    }
    renderTypeChips();
    renderDraftTags();
  }

  function renderUploadPreview() {
    els.uploadPreview.innerHTML = "";
    if (!draftFiles.length) {
      els.uploadPreview.hidden = true;
      els.uploadCard.hidden = false;
      return;
    }
    els.uploadPreview.hidden = false;
    els.uploadCard.hidden = editingId ? true : false;
    draftFiles.forEach((file) => {
      const img = document.createElement("img");
      img.src = file.url;
      img.alt = file.name || "Preview";
      els.uploadPreview.appendChild(img);
    });
  }

  async function addFiles(fileList) {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      showToast("Choose an image");
      return;
    }
    for (const file of files.slice(0, 12)) {
      try {
        const blob = await compressImage(file);
        const url = URL.createObjectURL(blob);
        draftFiles.push({ blob, url, name: file.name || "" });
      } catch {
        showToast("Could not read one image");
      }
    }
    renderUploadPreview();
    if (!els.fontName.value.trim() && files[0]?.name) {
      els.fontName.value = files[0].name.replace(/\.[^.]+$/, "");
    }
  }

  function setFilter(next) {
    filter = parseFilter(
      typeof next === "string" ? next : serializeFilter(next)
    );
    localStorage.setItem(FILTER_KEY, serializeFilter(filter));
    renderLibrary();
  }

  function renderFilters(items) {
    const typeCounts = {};
    FONT_TYPES.forEach(([value]) => {
      typeCounts[value] = items.filter((i) =>
        (i.types || []).includes(value)
      ).length;
    });
    const tagCounts = {};
    collectKnownTags().forEach((tag) => {
      tagCounts[tag] = items.filter((i) =>
        (i.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())
      ).length;
    });

    els.filters.innerHTML = "";
    const add = (label, count, active, onClick, extra = "") => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-chip${extra}${active ? " is-active" : ""}`;
      btn.textContent = `${label} (${count})`;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.addEventListener("click", onClick);
      els.filters.appendChild(btn);
    };

    add("All", items.length, filter.kind === "all", () => setFilter("all"));
    FONT_TYPES.forEach(([value, label]) => {
      const count = typeCounts[value] || 0;
      if (count === 0 && !(filter.kind === "type" && filter.value === value)) {
        return;
      }
      add(
        label,
        count,
        filter.kind === "type" && filter.value === value,
        () => setFilter({ kind: "type", value })
      );
    });
    Object.keys(tagCounts)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .forEach((tag) => {
        add(
          tag,
          tagCounts[tag],
          filter.kind === "tag" &&
            filter.value.toLowerCase() === tag.toLowerCase(),
          () => setFilter({ kind: "tag", value: tag }),
          " is-tag"
        );
      });
  }

  async function renderLibrary() {
    store.items = store.items.map((item) => ({
      ...item,
      types: normalizeTypes(item.types),
      tags: normalizeTags(item.tags),
    }));

    const visible = store.items
      .filter(matchesItem)
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    els.fontCount.textContent = String(visible.length);
    els.fontGrid.innerHTML = "";
    els.fontEmpty.hidden = visible.length > 0;
    if (!store.items.length) {
      els.fontEmpty.hidden = false;
      els.fontEmpty.textContent =
        "No specimens yet. Upload a font image and tag its type.";
    } else if (!visible.length) {
      els.fontEmpty.hidden = false;
      els.fontEmpty.textContent = "No specimens match this filter.";
    }

    renderFilters(store.items);

    for (const item of visible) {
      const card = document.createElement("article");
      card.className = "card";

      const media = document.createElement("button");
      media.type = "button";
      media.className = "card-media";
      media.setAttribute("aria-label", `Open ${item.name || "specimen"}`);
      const img = document.createElement("img");
      img.alt = item.name || "Font specimen";
      try {
        const url = await mediaUrl(item.imageId);
        if (url) img.src = url;
      } catch {
        /* ignore */
      }
      media.appendChild(img);
      media.addEventListener("click", () => openViewer(item.id));

      const body = document.createElement("div");
      body.className = "card-body";

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = item.name || "Untitled font";

      const tags = document.createElement("div");
      tags.className = "card-tags";
      (item.types || []).forEach((type) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = TYPE_LABELS[type] || type;
        tags.appendChild(chip);
      });
      (item.tags || []).slice(0, 4).forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = tag;
        tags.appendChild(chip);
      });

      if (item.note) {
        const note = document.createElement("p");
        note.className = "card-note";
        note.textContent = item.note;
        body.append(title, tags, note);
      } else {
        body.append(title, tags);
      }

      const actions = document.createElement("div");
      actions.className = "card-actions";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "ghost-btn";
      open.textContent = "Open";
      open.addEventListener("click", () => openViewer(item.id));
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "ghost-btn";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => startEdit(item.id));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.setAttribute("aria-label", "Delete specimen");
      del.textContent = "×";
      del.addEventListener("click", () => deleteItem(item.id));
      actions.append(open, edit, del);
      body.appendChild(actions);

      card.append(media, body);
      els.fontGrid.appendChild(card);
    }
  }

  async function openViewer(id) {
    const item = store.items.find((i) => i.id === id);
    if (!item) return;
    viewingId = id;
    els.viewerTitle.textContent = item.name || "Untitled font";
    els.viewerType.textContent =
      (item.types || []).map((t) => TYPE_LABELS[t] || t).join(" · ") ||
      "specimen";
    els.viewerMeta.innerHTML = "";
    (item.types || []).forEach((type) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = TYPE_LABELS[type] || type;
      els.viewerMeta.appendChild(chip);
    });
    (item.tags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = tag;
      els.viewerMeta.appendChild(chip);
    });
    try {
      els.viewerImage.src = (await mediaUrl(item.imageId)) || "";
    } catch {
      els.viewerImage.src = "";
    }
    els.viewerImage.alt = item.name || "Font specimen";
    if (item.note) {
      els.viewerNote.hidden = false;
      els.viewerNote.textContent = item.note;
    } else {
      els.viewerNote.hidden = true;
      els.viewerNote.textContent = "";
    }
    els.viewer.hidden = false;
  }

  function closeViewer() {
    viewingId = null;
    els.viewer.hidden = true;
    els.viewerImage.src = "";
  }

  async function startEdit(id) {
    const item = store.items.find((i) => i.id === id);
    if (!item) return;
    closeViewer();
    clearDraft({ keepEditing: true });
    editingId = id;
    els.fontName.value = item.name || "";
    els.fontNote.value = item.note || "";
    draftTypes = new Set(normalizeTypes(item.types));
    draftTags = normalizeTags(item.tags);
    try {
      const blob = await getBlob(item.imageId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        draftFiles = [{ id: item.imageId, blob, url, name: item.name || "" }];
      }
    } catch {
      draftFiles = [];
    }
    els.saveBtn.textContent = "Update specimen";
    els.cancelEdit.hidden = false;
    els.editHint.hidden = false;
    renderTypeChips();
    renderDraftTags();
    renderUploadPreview();
    els.fontName.focus();
    showToast("Editing specimen");
  }

  async function deleteItem(id) {
    const item = store.items.find((i) => i.id === id);
    if (!item) return;
    if (editingId === id) clearDraft();
    if (viewingId === id) closeViewer();
    store.items = store.items.filter((i) => i.id !== id);
    saveMeta();
    revokeUrl(item.imageId);
    try {
      await deleteBlob(item.imageId);
    } catch {
      /* ignore */
    }
    renderLibrary();
    showToast("Specimen removed");
  }

  els.fontForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (els.tagInput.value.trim()) addDraftTag(els.tagInput.value);
    const name = els.fontName.value.trim() || "Untitled font";
    const note = els.fontNote.value.trim();
    const types = normalizeTypes([...draftTypes]);
    const tags = normalizeTags(draftTags);

    if (!types.length) {
      showToast("Pick at least one type");
      return;
    }

    if (editingId) {
      const existing = store.items.find((i) => i.id === editingId);
      if (!existing) {
        clearDraft();
        showToast("Specimen not found");
        return;
      }
      if (draftFiles[0]?.blob && !draftFiles[0]?.id) {
        await putBlob(existing.imageId, draftFiles[0].blob);
        revokeUrl(existing.imageId);
      }
      existing.name = name;
      existing.note = note;
      existing.types = types;
      existing.tags = tags;
      existing.updatedAt = Date.now();
      saveMeta();
      clearDraft();
      renderLibrary();
      showToast("Specimen updated");
      return;
    }

    if (!draftFiles.length) {
      showToast("Add at least one image");
      return;
    }

    const fileCount = draftFiles.length;
    for (const file of draftFiles) {
      const imageId = uid();
      await putBlob(imageId, file.blob);
      store.items.unshift({
        id: uid(),
        imageId,
        name:
          fileCount === 1
            ? name
            : file.name.replace(/\.[^.]+$/, "") || name,
        note,
        types,
        tags,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    saveMeta();
    clearDraft();
    renderLibrary();
    showToast(fileCount > 1 ? "Specimens saved" : "Specimen saved");
  });

  els.cancelEdit.addEventListener("click", () => {
    clearDraft();
    showToast("Edit cancelled");
  });

  els.tagAdd.addEventListener("click", () => {
    if (!addDraftTag(els.tagInput.value)) showToast("Type a tag first");
    else els.tagInput.focus();
  });

  els.tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraftTag(els.tagInput.value);
    } else if (e.key === "Backspace" && !els.tagInput.value && draftTags.length) {
      draftTags.pop();
      renderDraftTags();
    }
  });

  els.fontImage.addEventListener("change", async () => {
    await addFiles(els.fontImage.files);
    els.fontImage.value = "";
  });

  const upload = els.fontImage.closest(".upload");
  ["dragenter", "dragover"].forEach((evt) => {
    upload.addEventListener(evt, (e) => {
      e.preventDefault();
      upload.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    upload.addEventListener(evt, (e) => {
      e.preventDefault();
      upload.classList.remove("is-dragging");
    });
  });
  upload.addEventListener("drop", async (e) => {
    await addFiles(e.dataTransfer?.files);
  });

  els.search.addEventListener("input", () => {
    searchQuery = els.search.value.trim().toLowerCase();
    renderLibrary();
  });

  els.viewerClose.addEventListener("click", closeViewer);
  els.viewerEdit.addEventListener("click", () => {
    if (viewingId) startEdit(viewingId);
  });
  els.viewer.addEventListener("click", (e) => {
    if (e.target === els.viewer) closeViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.viewer.hidden) closeViewer();
  });

  renderTypeChips();
  renderDraftTags();
  renderLibrary();
})();
