
const App = (() => {
    let activeSection = "today";

    const init = () => {
        if (!document.body.classList.contains("dashboard-page")) return;

        setupTheme();
        setupNavigation();
        setupQuickAdd();
        setupModal();
        setupTaskActions();
        setupSearch();
        setupSettingsButtons();
        renderCurrentSection();
    };

    const setupTheme = () => {
        const savedTheme = Storage.getTheme();
        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
        }

        const themeToggle = document.getElementById("themeToggle");
        if (!themeToggle) return;

        themeToggle.addEventListener("click", () => {
            const isDark = document.documentElement.classList.toggle("dark");
            Storage.setTheme(isDark ? "dark" : "light");
        });
    };

    const setupNavigation = () => {
        document.querySelectorAll(".nav-item").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".nav-item").forEach((item) => {
                    item.classList.remove("active");
                });

                btn.classList.add("active");
                activeSection = btn.dataset.section;
                renderCurrentSection();
            });
        });
    };

    const setupQuickAdd = () => {
        const quickAddBtn = document.getElementById("quickAddBtn");
        const quickAddInput = document.getElementById("quickAddInput");
        const advancedAddBtn = document.getElementById("advancedAddBtn");

        if (quickAddBtn && quickAddInput) {
            quickAddBtn.addEventListener("click", handleQuickAdd);
            quickAddInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") handleQuickAdd();
            });
        }

        if (advancedAddBtn) {
            advancedAddBtn.addEventListener("click", () => {
                openModal();
                clearTaskForm();
            });
        }
    };

    const setupModal = () => {
        const taskModal = document.getElementById("taskModal");
        const taskForm = document.getElementById("taskForm");
        const modalCancel = document.getElementById("modalCancel");
        const modalClose = document.querySelector("#taskModal .modal-close");

        if (taskForm) {
            taskForm.addEventListener("submit", handleTaskSubmit);
        }

        if (modalCancel) {
            modalCancel.addEventListener("click", closeModal);
        }

        if (modalClose) {
            modalClose.addEventListener("click", closeModal);
        }

        if (taskModal) {
            taskModal.addEventListener("click", (e) => {
                if (e.target === taskModal) closeModal();
            });
        }
    };

    const setupTaskActions = () => {
        document.querySelectorAll(".task-list").forEach((list) => {
            list.addEventListener("click", handleTaskAction);
        });
    };

    const setupSearch = () => {
        const searchInput = document.getElementById("searchInput");
        if (!searchInput) return;

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();

            if (!query) {
                renderCurrentSection();
                return;
            }

            const results = Storage.searchTasks(query);
            const container = document.getElementById("today-list");
            if (container) {
                container.innerHTML = "";
                if (!results.length) {
                    container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🔎</div>
              <h3>No matching tasks</h3>
              <p>Try a different search term</p>
            </div>
          `;
                    return;
                }

                results.forEach((task) => {
                    container.appendChild(createSearchTaskElement(task));
                });
            }

            setSectionVisible("today");
        });
    };

    const setupSettingsButtons = () => {
        const clearBtn = document.getElementById("clearData");
        const exportBtn = document.getElementById("exportData");
        const importBtn = document.getElementById("importData");

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Clear all saved data? This cannot be undone.")) {
                    Storage.clearAllData();
                    location.reload();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const data = JSON.stringify(Storage.getAllTasks(), null, 2);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = "taskflow-data.json";
                a.click();

                URL.revokeObjectURL(url);
            });
        }

        if (importBtn) {
            importBtn.addEventListener("click", () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";

                input.addEventListener("change", () => {
                    const file = input.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const tasks = JSON.parse(reader.result);
                            if (Array.isArray(tasks)) {
                                Storage.saveTasks(tasks);
                                renderCurrentSection();
                            }
                        } catch {
                            alert("Invalid JSON file.");
                        }
                    };
                    reader.readAsText(file);
                });

                input.click();
            });
        }
    };

    const handleQuickAdd = () => {
        const input = document.getElementById("quickAddInput");
        if (!input || !input.value.trim()) return;

        const parsed = Parser.parse(input.value.trim());
        Tasks.create(parsed);

        input.value = "";
        renderCurrentSection();
    };

    const handleTaskSubmit = (e) => {
        e.preventDefault();

        const form = e.currentTarget;
        const editId = form.dataset.editId;

        const taskData = {
            title: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDesc").value.trim(),
            dueDate: document.getElementById("taskDate").value || null,
            dueTime: document.getElementById("taskTime").value || null,
            priority: document.getElementById("taskPriority").value,
            category: document.getElementById("taskCategory").value.trim()
        };

        if (editId) {
            Tasks.update(editId, taskData);
        } else {
            Tasks.create(taskData);
        }

        closeModal();
        clearTaskForm();
        renderCurrentSection();
    };

    const handleTaskAction = (e) => {
        const actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;

        const taskItem = actionEl.closest(".task-item");
        if (!taskItem) return;

        const taskId = taskItem.dataset.taskId;
        const action = actionEl.dataset.action;

        if (action === "toggle") {
            const task = Storage.getTask(taskId);
            if (!task) return;

            if (task.completed) {
                Tasks.uncomplete(taskId);
            } else {
                Tasks.complete(taskId);
            }

            renderCurrentSection();
            return;
        }

        if (action === "edit") {
            loadTaskForEdit(taskId);
            return;
        }

        if (action === "delete") {
            Tasks.remove(taskId);
            renderCurrentSection();
            return;
        }

        if (action === "archive") {
            Tasks.archive(taskId);
            renderCurrentSection();
            return;
        }

        if (action === "restore") {
            const task = Storage.getTask(taskId);
            if (task?.archived) {
                Tasks.unarchive(taskId);
            } else {
                Tasks.restore(taskId);
            }
            renderCurrentSection();
        }
    };

    const loadTaskForEdit = (taskId) => {
        const task = Storage.getTask(taskId);
        if (!task) return;

        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDesc").value = task.description || "";
        document.getElementById("taskDate").value = task.dueDate || "";
        document.getElementById("taskTime").value = task.dueTime || "";
        document.getElementById("taskPriority").value = task.priority || "medium";
        document.getElementById("taskCategory").value = task.category || "";

        const form = document.getElementById("taskForm");
        if (form) form.dataset.editId = taskId;

        openModal();
    };

    const clearTaskForm = () => {
        const form = document.getElementById("taskForm");
        if (form) delete form.dataset.editId;

        const title = document.getElementById("taskTitle");
        const desc = document.getElementById("taskDesc");
        const date = document.getElementById("taskDate");
        const time = document.getElementById("taskTime");
        const priority = document.getElementById("taskPriority");
        const category = document.getElementById("taskCategory");

        if (form) form.reset();
        if (priority) priority.value = "medium";
        if (title) title.value = "";
        if (desc) desc.value = "";
        if (date) date.value = "";
        if (time) time.value = "";
        if (category) category.value = "";
    };

    const openModal = () => {
        const modal = document.getElementById("taskModal");
        if (modal) modal.classList.add("active");
    };

    const closeModal = () => {
        const modal = document.getElementById("taskModal");
        if (modal) modal.classList.remove("active");
    };

    const renderCurrentSection = () => {
        Tasks.renderSection(activeSection);
    };

    const setSectionVisible = (sectionName) => {
        document.querySelectorAll(".task-section").forEach((section) => {
            section.classList.remove("active");
        });

        const section = document.getElementById(`${sectionName}-section`);
        if (section) section.classList.add("active");
    };

    const createSearchTaskElement = (task) => {
        const div = document.createElement("div");
        div.className = `task-item ${task.completed ? "completed" : ""}`;
        div.dataset.taskId = task.id;

        div.innerHTML = `
      <button class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle">
        ${task.completed ? "✓" : ""}
      </button>
      <div class="task-content">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
        <div class="task-meta">
          ${task.category ? `<span class="task-meta-item">${escapeHtml(task.category)}</span>` : ""}
          <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn" data-action="edit">✏️</button>
        <button class="task-btn delete" data-action="delete">🗑️</button>
      </div>
    `;

        return div;
    };

    const escapeHtml = (text) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { init };
})();