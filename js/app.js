const STORAGE_KEY = "grid:tasks";
const PREFS_KEY = "grid:prefs";

const sidebarNav = document.getElementById("sidebarNav");
const searchInput = document.getElementById("taskSearch");
const sortSelect = document.getElementById("taskSort");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const emptyTrashBtn = document.getElementById("emptyTrashBtn");

const newTaskTitle = document.getElementById("newTaskTitle");
const newTaskNotes = document.getElementById("newTaskNotes");
const newTaskDue = document.getElementById("newTaskDue");
const newTaskPriority = document.getElementById("newTaskPriority");
const newTaskTag = document.getElementById("newTaskTag");
const newTaskImportant = document.getElementById("newTaskImportant");
const createTaskBtn = document.getElementById("createTaskBtn");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyText = document.getElementById("emptyText");
const visibleCount = document.getElementById("visibleCount");

const countAll = document.getElementById("countAll");
const countActive = document.getElementById("countActive");
const countCompleted = document.getElementById("countCompleted");
const countImportant = document.getElementById("countImportant");
const countTrash = document.getElementById("countTrash");
const taskCount = document.getElementById("taskCount");
const completedCount = document.getElementById("completedCount");
const todayDate = document.getElementById("todayDate");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");

const inspectorEmpty = document.getElementById("inspectorEmpty");
const inspectorForm = document.getElementById("inspectorForm");
const detailTitle = document.getElementById("detailTitle");
const detailNotes = document.getElementById("detailNotes");
const detailDue = document.getElementById("detailDue");
const detailPriority = document.getElementById("detailPriority");
const detailTag = document.getElementById("detailTag");
const detailImportant = document.getElementById("detailImportant");
const detailCompleted = document.getElementById("detailCompleted");
const detailCreated = document.getElementById("detailCreated");
const detailUpdated = document.getElementById("detailUpdated");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");
const duplicateTaskBtn = document.getElementById("duplicateTaskBtn");
const restoreTaskBtn = document.getElementById("restoreTaskBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastUndoBtn = document.getElementById("toastUndoBtn");

let tasks = loadTasks();
let prefs = loadPrefs();

let activeFilter = prefs.filter || "all";
let selectedTaskId = null; // keep inspector empty by default

let undoBatch = null;
let undoTimer = null;
let inspectorSyncTimer = null;

const PRIORITY_WEIGHT = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
};

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];

        return parsed.map((task, index) => {
            const id = Number.isFinite(Number(task.id)) ? Number(task.id) : Date.now() + index;
            const createdAt = task.createdAt || new Date().toISOString();
            const updatedAt = task.updatedAt || createdAt;

            return {
                id,
                title: String(task.title ?? task.text ?? "Untitled task"),
                notes: String(task.notes ?? ""),
                dueDate: task.dueDate || "",
                priority: ["low", "medium", "high", "urgent"].includes(task.priority) ? task.priority : "medium",
                tag: String(task.tag ?? ""),
                important: Boolean(task.important),
                completed: Boolean(task.completed),
                trashed: Boolean(task.trashed),
                deletedAt: task.deletedAt || null,
                createdAt,
                updatedAt
            };
        });
    } catch {
        return [];
    }
}

function loadPrefs() {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== "object") return {};

        delete parsed.selectedTaskId;
        return parsed;
    } catch {
        return {};
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Failed to save tasks:", error);
    }
}

function savePrefs() {
    const data = {
        filter: activeFilter,
        sort: sortSelect.value,
        search: searchInput.value
    };

    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save preferences:", error);
    }
}

function escapeHTML(text = "") {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function normalize(text = "") {
    return String(text).trim().toLowerCase();
}

function formatRelativeTime(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(seconds);

    const units = [
        ["year", 60 * 60 * 24 * 365],
        ["month", 60 * 60 * 24 * 30],
        ["day", 60 * 60 * 24],
        ["hour", 60 * 60],
        ["minute", 60],
        ["second", 1]
    ];

    for (const [unit, step] of units) {
        if (absSeconds >= step || unit === "second") {
            const value = Math.round(seconds / step);
            const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
            return rtf.format(value, unit);
        }
    }

    return "just now";
}

function formatDueLabel(dateString) {
    if (!dateString) return null;

    const due = new Date(dateString);
    if (Number.isNaN(due.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
    if (diffDays <= 7) return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(due);
}

function formatToday() {
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(new Date());
}

function isOverdue(task) {
    if (!task.dueDate || task.completed || task.trashed) return false;

    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return false;

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return due.getTime() < endOfDay.getTime();
}

function truncate(text = "", max = 120) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1)}…`;
}

function getActiveTasks() {
    return tasks.filter(task => !task.trashed);
}

function getTrashTasks() {
    return tasks.filter(task => task.trashed);
}

function getVisibleTasks() {
    let items = activeFilter === "trash" ? getTrashTasks() : getActiveTasks();

    if (activeFilter === "active") {
        items = items.filter(task => !task.completed);
    } else if (activeFilter === "completed") {
        items = items.filter(task => task.completed);
    } else if (activeFilter === "important") {
        items = items.filter(task => task.important);
    }

    const query = normalize(searchInput.value);
    if (query) {
        items = items.filter(task => {
            const haystack = [task.title, task.notes, task.tag].join(" ");
            return normalize(haystack).includes(query);
        });
    }

    const sortValue = sortSelect.value;

    items.sort((a, b) => {
        if (sortValue === "oldest") {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (sortValue === "due") {
            const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
            const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;

            if (aDue !== bDue) return aDue - bDue;

            return (
                PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        }

        if (sortValue === "priority") {
            return (
                PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        }

        if (sortValue === "title") {
            return a.title.localeCompare(b.title);
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return items;
}

function findTask(id) {
    return tasks.find(task => task.id === id);
}

function updateSidebarActive() {
    sidebarNav.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === activeFilter);
    });
}

function setActiveSidebar(filter) {
    activeFilter = filter;

    sidebarNav.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === filter);
    });

    clearInspector();
    renderTaskList();

    document.querySelector(".workspace-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    savePrefs();
}

function updateCounts() {
    const activeTasks = getActiveTasks();
    const total = activeTasks.length;
    const completed = activeTasks.filter(task => task.completed).length;
    const active = total - completed;
    const important = activeTasks.filter(task => task.important).length;
    const trash = getTrashTasks().length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    taskCount.textContent = String(total);
    completedCount.textContent = String(completed);
    countAll.textContent = String(total);
    countActive.textContent = String(active);
    countCompleted.textContent = String(completed);
    countImportant.textContent = String(important);
    countTrash.textContent = String(trash);

    progressLabel.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;

    clearCompletedBtn.disabled = completed === 0;
    emptyTrashBtn.disabled = trash === 0;
}

function updateAddButtonState() {
    createTaskBtn.disabled = newTaskTitle.value.trim() === "";
}

function updateSearchButton() {
    clearSearchBtn.classList.toggle("hidden", !searchInput.value.trim());
}

function syncSelectedToVisible() {
    const visibleTasks = getVisibleTasks();
    const visibleIds = new Set(visibleTasks.map(task => task.id));

    if (selectedTaskId && !visibleIds.has(selectedTaskId)) {
        selectedTaskId = null;
    }
}

function renderTaskList() {
    syncSelectedToVisible();

    const visibleTasks = getVisibleTasks();
    taskList.innerHTML = "";

    if (visibleTasks.length === 0) {
        emptyState.classList.remove("hidden");

        if (activeFilter === "trash") {
            emptyTitle.textContent = "Trash is empty";
            emptyText.textContent = "Deleted tasks will appear here for recovery.";
        } else if (tasks.length === 0) {
            emptyTitle.textContent = "No tasks yet";
            emptyText.textContent = "Add your first task to begin your workspace.";
        } else if (searchInput.value.trim()) {
            emptyTitle.textContent = "No matching tasks";
            emptyText.textContent = "Try a different keyword or clear the search.";
        } else {
            emptyTitle.textContent = "Nothing in this view";
            emptyText.textContent = "Try another filter or add a new task.";
        }

        visibleCount.textContent = "0 visible";
    } else {
        emptyState.classList.add("hidden");
        visibleCount.textContent = `${visibleTasks.length} visible`;

        visibleTasks.forEach(task => {
            taskList.appendChild(createTaskRow(task));
        });

        /* Remove invalid selected state */
        if (selectedTaskId && !visibleTasks.some(task => task.id === selectedTaskId)) {
            clearInspector();
        }
    }

    updateCounts();
    updateSearchButton();
    savePrefs();
}

function createTaskRow(task) {
    const row = document.createElement("article");
    const overdue = isOverdue(task);

    row.className = `task-row ${task.completed ? "completed" : ""} ${task.trashed ? "trashed" : ""} ${task.important ? "important" : ""} ${overdue ? "overdue" : ""} ${task.id === selectedTaskId ? "selected" : ""}`;
    row.dataset.id = String(task.id);

    const dueLabel = formatDueLabel(task.dueDate);

    const priorityText = {
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent"
    }[task.priority] || "Medium";

    if (activeFilter === "trash") {
        row.innerHTML = `
            <div class="task-main">
                <div class="task-copy">
                    <div class="task-title">${escapeHTML(task.title)}</div>

                    ${task.notes ? `<div class="task-notes">${escapeHTML(truncate(task.notes, 130))}</div>` : ""}

                    <div class="task-meta">
                        ${dueLabel ? `<span class="badge ${overdue ? "overdue" : ""}">Due ${escapeHTML(dueLabel)}</span>` : ""}
                        <span class="badge priority-${escapeHTML(task.priority)}">${escapeHTML(priorityText)} priority</span>
                        ${task.important ? `<span class="badge">Important</span>` : ""}
                        ${task.tag ? `<span class="badge">#${escapeHTML(task.tag)}</span>` : ""}
                    </div>
                </div>
            </div>

            <div class="task-actions">
                <button type="button" class="task-action" data-action="restore">Restore</button>
                <button type="button" class="task-action open" data-action="open">Open</button>
                <button type="button" class="task-action delete" data-action="delete-permanent">Delete forever</button>
            </div>
        `;
    } else {
        row.innerHTML = `
            <div class="task-main">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? "checked" : ""}
                    aria-label="Toggle completed"
                />

                <div class="task-copy">
                    <div class="task-title">${escapeHTML(task.title)}</div>

                    ${task.notes ? `<div class="task-notes">${escapeHTML(truncate(task.notes, 130))}</div>` : ""}

                    <div class="task-meta">
                        ${dueLabel ? `<span class="badge ${overdue ? "overdue" : ""}">Due ${escapeHTML(dueLabel)}</span>` : ""}
                        <span class="badge priority-${escapeHTML(task.priority)}">${escapeHTML(priorityText)} priority</span>
                        ${task.important ? `<span class="badge">Important</span>` : ""}
                        ${task.tag ? `<span class="badge">#${escapeHTML(task.tag)}</span>` : ""}
                    </div>
                </div>
            </div>

            <div class="task-actions">
                <button type="button" class="task-action important ${task.important ? "active" : ""}" data-action="important">
                    ${task.important ? "★" : "☆"}
                </button>
                <button type="button" class="task-action open" data-action="open">Open</button>
                <button type="button" class="task-action duplicate" data-action="duplicate">Duplicate</button>
                <button type="button" class="task-action delete" data-action="trash">Trash</button>
            </div>
        `;
    }

    return row;
}

function setInspectorState(task) {
    const isTrashed = Boolean(task?.trashed);

    inspectorForm.classList.toggle("is-trash", isTrashed);

    [
        detailTitle,
        detailNotes,
        detailDue,
        detailPriority,
        detailTag,
        detailImportant,
        detailCompleted
    ].forEach(element => {
        element.disabled = isTrashed;
    });

    restoreTaskBtn.classList.toggle("hidden", !isTrashed);
    duplicateTaskBtn.classList.toggle("hidden", isTrashed);
    deleteTaskBtn.textContent = isTrashed ? "Delete permanently" : "Move to trash";
}

function renderInspector() {
    const task = findTask(selectedTaskId);

    if (!task) {
        inspectorForm.classList.add("hidden");
        inspectorEmpty.classList.remove("hidden");
        return;
    }

    inspectorEmpty.classList.add("hidden");
    inspectorForm.classList.remove("hidden");

    detailTitle.value = task.title;
    detailNotes.value = task.notes || "";
    detailDue.value = task.dueDate || "";
    detailPriority.value = task.priority || "medium";
    detailTag.value = task.tag || "";
    detailImportant.checked = Boolean(task.important);
    detailCompleted.checked = Boolean(task.completed);
    detailCreated.textContent = `Created ${formatRelativeTime(task.createdAt)}`;
    detailUpdated.textContent = `Updated ${formatRelativeTime(task.updatedAt)}`;

    setInspectorState(task);
}

function clearInspector() {
    selectedTaskId = null;

    inspectorForm.classList.add("hidden");
    inspectorEmpty.classList.remove("hidden");

    taskList.querySelectorAll(".task-row").forEach(row => {
        row.classList.remove("selected");
    });
}

function selectTask(id) {
    selectedTaskId = id;
    renderTaskList();
    renderInspector();
    savePrefs();
}

function createTask() {
    const title = newTaskTitle.value.trim();
    if (!title) return;

    const now = new Date().toISOString();

    const task = {
        id: Date.now(),
        title,
        notes: newTaskNotes.value.trim(),
        dueDate: newTaskDue.value || "",
        priority: newTaskPriority.value || "medium",
        tag: newTaskTag.value.trim(),
        important: Boolean(newTaskImportant.checked),
        completed: false,
        trashed: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
    };

    tasks.unshift(task);
    selectedTaskId = task.id;

    if (activeFilter === "trash") {
        activeFilter = "all";
        updateSidebarActive();
    }

    saveTasks();
    savePrefs();
    renderTaskList();
    renderInspector();

    document.querySelector(".workspace-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    newTaskTitle.value = "";
    newTaskNotes.value = "";
    newTaskDue.value = "";
    newTaskPriority.value = "medium";
    newTaskTag.value = "";
    newTaskImportant.checked = false;
    updateAddButtonState();

    detailTitle?.focus();
}

function showUndoToast(message, ids) {
    undoBatch = { ids };

    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
        toast.classList.remove("show");
        undoBatch = null;
    }, 5000);
}

function restoreBatch(ids) {
    const now = new Date().toISOString();
    const idSet = new Set(ids);

    tasks = tasks.map(task => {
        if (!idSet.has(task.id)) return task;

        return {
            ...task,
            trashed: false,
            deletedAt: null,
            updatedAt: now
        };
    });

    saveTasks();

    const visible = getVisibleTasks();
    if (!visible.some(task => task.id === selectedTaskId)) {
        selectedTaskId = visible[0]?.id ?? null;
    }

    renderTaskList();
    renderInspector();
    savePrefs();
}

function softDeleteTasks(ids) {
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    let changed = 0;

    tasks = tasks.map(task => {
        if (!idSet.has(task.id) || task.trashed) return task;

        changed += 1;
        return {
            ...task,
            trashed: true,
            deletedAt: now,
            updatedAt: now
        };
    });

    if (!changed) return;

    if (activeFilter !== "trash" && selectedTaskId && idSet.has(selectedTaskId)) {
        const visible = getVisibleTasks().filter(task => !idSet.has(task.id));
        selectedTaskId = visible[0]?.id ?? null;
    }

    saveTasks();
    savePrefs();
    renderTaskList();
    renderInspector();

    showUndoToast(
        `${changed} task${changed === 1 ? "" : "s"} moved to trash`,
        [...idSet]
    );
}

function restoreTask(id) {
    const task = findTask(id);
    if (!task || !task.trashed) return;

    task.trashed = false;
    task.deletedAt = null;
    task.updatedAt = new Date().toISOString();

    saveTasks();

    if (activeFilter === "trash") {
        const visible = getVisibleTasks();
        if (!visible.some(item => item.id === selectedTaskId)) {
            selectedTaskId = visible[0]?.id ?? null;
        }
    }

    renderTaskList();
    renderInspector();
    savePrefs();
}

function permanentDeleteTasks(ids) {
    const idSet = new Set(ids);
    const count = ids.length;

    if (!count) return;

    const confirmed = window.confirm(
        count === 1
            ? "Delete this task permanently? This cannot be undone."
            : `Delete these ${count} tasks permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => !idSet.has(task.id));

    if (selectedTaskId && idSet.has(selectedTaskId)) {
        selectedTaskId = null;
    }

    saveTasks();
    renderTaskList();
    renderInspector();
    savePrefs();
}

function duplicateTask(id) {
    const original = findTask(id);
    if (!original || original.trashed) return;

    const now = new Date().toISOString();

    const copy = {
        ...original,
        id: Date.now(),
        title: `${original.title} Copy`,
        completed: false,
        trashed: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
    };

    tasks.unshift(copy);
    selectedTaskId = copy.id;

    saveTasks();
    renderTaskList();
    renderInspector();
    savePrefs();
}

function toggleTaskCompleted(id, completed) {
    const task = findTask(id);
    if (!task || task.trashed) return;

    task.completed = completed;
    task.updatedAt = new Date().toISOString();

    saveTasks();
    renderTaskList();
    renderInspector();
    savePrefs();
}

function toggleImportant(id) {
    const task = findTask(id);
    if (!task || task.trashed) return;

    task.important = !task.important;
    task.updatedAt = new Date().toISOString();

    saveTasks();
    renderTaskList();
    renderInspector();
    savePrefs();
}

function clearCompletedTasks() {
    const ids = tasks
        .filter(task => !task.trashed && task.completed)
        .map(task => task.id);

    if (!ids.length) return;

    softDeleteTasks(ids);
}

function emptyTrash() {
    const ids = tasks.filter(task => task.trashed).map(task => task.id);

    if (!ids.length) return;

    const confirmed = window.confirm(
        ids.length === 1
            ? "Empty the trash permanently? This cannot be undone."
            : `Empty the trash permanently? ${ids.length} tasks will be deleted.`
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => !task.trashed);
    selectedTaskId = null;

    saveTasks();
    renderTaskList();
    renderInspector();
    savePrefs();
}

function clearSearch() {
    searchInput.value = "";
    updateSearchButton();
    renderTaskList();
    renderInspector();
    savePrefs();
    searchInput.focus();
}

function setActiveFilter(filter) {
    activeFilter = filter;
    updateSidebarActive();

    const visibleTasks = getVisibleTasks();
    selectedTaskId = visibleTasks[0]?.id ?? null;

    savePrefs();
    renderTaskList();
    renderInspector();
}

function syncInspectorToTask() {
    const task = findTask(selectedTaskId);
    if (!task || task.trashed) return;

    task.title = detailTitle.value.trim() || "Untitled task";
    task.notes = detailNotes.value.trim();
    task.dueDate = detailDue.value || "";
    task.priority = detailPriority.value;
    task.tag = detailTag.value.trim();
    task.important = detailImportant.checked;
    task.completed = detailCompleted.checked;
    task.updatedAt = new Date().toISOString();

    saveTasks();
    renderTaskList();
    savePrefs();

    detailUpdated.textContent = `Updated ${formatRelativeTime(task.updatedAt)}`;
}

function scheduleInspectorSync() {
    clearTimeout(inspectorSyncTimer);
    inspectorSyncTimer = setTimeout(syncInspectorToTask, 220);
}

sidebarNav.addEventListener("click", (e) => {
    const button = e.target.closest(".nav-btn");
    if (!button) return;

    setActiveSidebar(button.dataset.filter);
});

taskList.addEventListener("click", (e) => {
    const row = e.target.closest(".task-row");
    if (!row) return;

    const id = Number(row.dataset.id);
    const actionButton = e.target.closest("[data-action]");

    if (e.target.matches(".task-checkbox")) return;

    if (actionButton) {
        const action = actionButton.dataset.action;

        if (!id) {
            clearInspector();
            return;
        }

        if (action === "open") {
            selectTask(id);
            return;
        }

        if (action === "duplicate") {
            duplicateTask(id);
            return;
        }

        if (action === "trash") {
            softDeleteTasks([id]);
            return;
        }

        if (action === "restore") {
            restoreTask(id);
            return;
        }

        if (action === "delete-permanent") {
            permanentDeleteTasks([id]);
            return;
        }

        if (action === "important") {
            toggleImportant(id);
            return;
        }
    }

    selectTask(id);
});

taskList.addEventListener("change", (e) => {
    if (!e.target.matches(".task-checkbox")) return;

    const row = e.target.closest(".task-row");
    if (!row) return;

    toggleTaskCompleted(Number(row.dataset.id), e.target.checked);
});

searchInput.addEventListener("input", () => {
    updateSearchButton();
    renderTaskList();
    renderInspector();
    savePrefs();
});

sortSelect.addEventListener("change", () => {
    renderTaskList();
    renderInspector();
    savePrefs();
});

clearSearchBtn.addEventListener("click", clearSearch);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);
emptyTrashBtn.addEventListener("click", emptyTrash);
createTaskBtn.addEventListener("click", createTask);

newTaskTitle.addEventListener("input", updateAddButtonState);
newTaskTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        createTask();
    }
});

[detailTitle, detailNotes, detailTag].forEach(element => {
    element.addEventListener("input", () => {
        if (!selectedTaskId) return;
        scheduleInspectorSync();
    });
});

[detailDue, detailPriority, detailCompleted, detailImportant].forEach(element => {
    element.addEventListener("change", () => {
        if (!selectedTaskId) return;
        syncInspectorToTask();
    });
});

deleteTaskBtn.addEventListener("click", () => {
    if (!selectedTaskId) return;

    const task = findTask(selectedTaskId);
    if (!task) return;

    if (task.trashed) {
        permanentDeleteTasks([selectedTaskId]);
    } else {
        softDeleteTasks([selectedTaskId]);
    }
});

duplicateTaskBtn.addEventListener("click", () => {
    if (!selectedTaskId) return;
    duplicateTask(selectedTaskId);
});

restoreTaskBtn.addEventListener("click", () => {
    if (!selectedTaskId) return;
    restoreTask(selectedTaskId);
});

toastUndoBtn.addEventListener("click", () => {
    if (!undoBatch) return;

    clearTimeout(undoTimer);
    restoreBatch(undoBatch.ids);
    toast.classList.remove("show");
    undoBatch = null;
});

document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "/") {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        if (e.key.toLowerCase() === "n") {
            e.preventDefault();
            newTaskTitle.focus();
            newTaskTitle.select();
        }
    }
});

todayDate.textContent = formatToday();

searchInput.value = prefs.search || "";
sortSelect.value = prefs.sort || "newest";
updateSidebarActive();
updateAddButtonState();
updateSearchButton();

if (activeFilter && !["all", "active", "completed", "important", "trash"].includes(activeFilter)) {
    activeFilter = "all";
}

const initialVisible = getVisibleTasks();

if (selectedTaskId && !findTask(selectedTaskId)) {
    selectedTaskId = initialVisible[0]?.id ?? null;
}

renderTaskList();
renderInspector();
savePrefs();