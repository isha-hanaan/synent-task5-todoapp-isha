
const App = (() => {
    const init = () => {
        if (!document.body.classList.contains("dashboard-page")) return;

        setupTheme();
        setupNavigation();
        setupQuickAdd();
        setupModals();
        setupTaskActions();
        setupSearch();
        setupSettings();
        renderInitialView();
    };

    const setupTheme = () => {
        const theme = Storage.getTheme();
        if (theme === "dark") document.documentElement.classList.add("dark");

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
                activeSection = btn.dataset.section;
                UI.switchSection(activeSection);
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
                UI.clearTaskForm();
                UI.showModal("taskModal");
            });
        }

        document.querySelectorAll(".tag-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (quickAddInput) quickAddInput.dataset.priority = btn.dataset.priority;
            });
        });
    };

    const setupModals = () => {
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) UI.hideModal(modal.id);
            });
        });

        const taskForm = document.getElementById("taskForm");
        const modalCancel = document.getElementById("modalCancel");
        const modalClose = document.querySelector("#taskModal .modal-close");

        if (taskForm) taskForm.addEventListener("submit", handleTaskSubmit);
        if (modalCancel) modalCancel.addEventListener("click", () => UI.hideModal("taskModal"));
        if (modalClose) modalClose.addEventListener("click", () => UI.hideModal("taskModal"));
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
            UI.updateSearchResults(e.target.value);
        });
    };

    const setupSettings = () => {
        const settingsBtn = document.getElementById("settingsBtn");
        const exportBtn = document.getElementById("exportData");
        const importBtn = document.getElementById("importData");
        const clearBtn = document.getElementById("clearData");
        const settingsClose = document.querySelector("#settingsModal .modal-close");

        if (settingsBtn) settingsBtn.addEventListener("click", () => UI.showModal("settingsModal"));
        if (settingsClose) settingsClose.addEventListener("click", () => UI.hideModal("settingsModal"));

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const data = Storage.exportData();
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `taskflow-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click();

                URL.revokeObjectURL(url);
                UI.showToast("💾 Data exported!", "success");
            });
        }

        if (importBtn) {
            importBtn.addEventListener("click", () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";

                input.addEventListener("change", () => {
                    const file = input.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const ok = Storage.importData(event.target.result);
                        if (ok) {
                            UI.showToast("📂 Data imported!", "success");
                            location.reload();
                        } else {
                            UI.showToast("❌ Invalid import file", "error");
                        }
                    };
                    reader.readAsText(file);
                });

                input.click();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Clear all data? This cannot be undone.")) {
                    Storage.clearAllData();
                    location.reload();
                }
            });
        }
    };

    const handleQuickAdd = () => {
        const input = document.getElementById("quickAddInput");
        if (!input || !input.value.trim()) return;

        const parsed = Parser.parse(input.value.trim());
        const priority = input.dataset.priority || parsed.priority || "medium";

        Tasks.create({
            ...parsed,
            priority
        });

        input.value = "";
        delete input.dataset.priority;

        UI.showToast("✅ Task added!", "success");
        UI.switchSection(document.querySelector(".nav-item.active")?.dataset.section || "today");
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
            UI.showToast("✏️ Task updated!", "success");
        } else {
            Tasks.create(taskData);
            UI.showToast("✅ Task created!", "success");
        }

        UI.hideModal("taskModal");
        UI.clearTaskForm();
        UI.switchSection(document.querySelector(".nav-item.active")?.dataset.section || "today");
    };

    const handleTaskAction = (e) => {
        const actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;

        const taskItem = actionEl.closest(".task-item");
        if (!taskItem) return;

        const taskId = taskItem.dataset.taskId;
        const action = actionEl.dataset.action;
        const task = Storage.getTask(taskId);

        if (!task) return;

        switch (action) {
            case "toggle":
                if (task.completed) {
                    Tasks.uncomplete(taskId);
                    UI.showToast("↩️ Task uncompleted", "info");
                } else {
                    Tasks.complete(taskId);
                    Analytics.trackCompletion(task);
                    Gamification.onTaskCompleted(task);

                    AnimationsModule.taskCompletionEffect(taskItem, () => {
                        const badges = Gamification.getEarnedBadges();
                        if (badges.length) {
                            AnimationsModule.badgeUnlockEffect(badges[0].name);
                        }
                    });

                    UI.showToast("🎉 Task completed!", "success");
                }
                break;

            case "edit":
                UI.loadTaskForEdit(taskId);
                return;

            case "delete":
                Tasks.remove(taskId);
                UI.showToast("🗑️ Task moved to trash", "info");
                break;

            case "archive":
                Tasks.archive(taskId);
                UI.showToast("📦 Task archived", "info");
                break;

            case "restore":
                if (task.archived) {
                    Tasks.unarchive(taskId);
                } else {
                    Tasks.restore(taskId);
                }
                UI.showToast("↩️ Task restored", "success");
                break;
        }

        UI.updateGamificationDisplay();
        UI.switchSection(document.querySelector(".nav-item.active")?.dataset.section || "today");
    };

    const renderInitialView = () => {
        UI.updateGamificationDisplay();
        UI.switchSection("today");
    };

    let activeSection = "today";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { init };
})();