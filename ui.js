
const UI = (() => {
    const escapeHtml = (text) => {
        const div = document.createElement("div");
        div.textContent = text ?? "";
        return div.innerHTML;
    };

    const formatDueDate = (dueDate, dueTime) => {
        if (!dueDate) return "";

        const today = new Date().toISOString().split("T")[0];
        let label = dueDate;

        if (dueDate === today) {
            label = "Today";
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];

            if (dueDate === tomorrowStr) {
                label = "Tomorrow";
            } else {
                const d = new Date(dueDate);
                label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
        }

        if (dueTime) {
            const time = new Date(`2000-01-01T${dueTime}`);
            const timeLabel = time.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });
            return `${label} at ${timeLabel}`;
        }

        return label;
    };

    const renderTaskItem = (task) => {
        const div = document.createElement("div");
        div.className = `task-item ${task.completed ? "completed" : ""}`;
        div.dataset.taskId = task.id;

        const dueText = formatDueDate(task.dueDate, task.dueTime);
        const description = task.description
            ? `<p class="task-description">${escapeHtml(task.description)}</p>`
            : "";

        div.innerHTML = `
      <button class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle">
        ${task.completed ? "✓" : ""}
      </button>

      <div class="task-content">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${description}
        <div class="task-meta">
          ${dueText ? `<span class="task-meta-item">📅 ${escapeHtml(dueText)}</span>` : ""}
          ${task.category ? `<span class="task-meta-item">${escapeHtml(task.category)}</span>` : ""}
          <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
      </div>

      <div class="task-actions">
        <button class="task-btn" data-action="edit">✏️</button>
        <button class="task-btn" data-action="archive">📦</button>
        <button class="task-btn delete" data-action="delete">🗑️</button>
      </div>
    `;

        return div;
    };

    const renderTaskList = (tasks, container) => {
        if (!container) return;

        container.innerHTML = "";

        if (!tasks.length) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No tasks yet</h3>
          <p>Create a task to get started</p>
        </div>
      `;
            return;
        }

        tasks.forEach((task) => container.appendChild(renderTaskItem(task)));
    };

    const renderCompletedToday = (tasks) => {
        const container = document.getElementById("completed-list");
        const summary = document.getElementById("completedSummary");
        if (!container || !summary) return;

        summary.innerHTML = tasks.length
            ? `<p>🎉 You completed <strong>${tasks.length} task${tasks.length === 1 ? "" : "s"}</strong> today!</p>`
            : "<p>Complete tasks to see them here!</p>";

        renderTaskList(tasks, container);
    };

    const renderAnalytics = () => {
        const weekCompleted = document.getElementById("weekCompleted");
        const scoreEl = document.getElementById("productivityScore");
        const ring = document.getElementById("productivityRing");
        const streakCal = document.getElementById("streakCalendar");
        const categoriesList = document.getElementById("categoriesList");

        if (weekCompleted) {
            weekCompleted.textContent = `${Analytics.getCompletedThisWeek()} completed`;
        }

        const score = Gamification.getProductivityScore();
        if (scoreEl) scoreEl.textContent = `${score}%`;

        if (ring) {
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }

        if (streakCal) {
            streakCal.innerHTML = "";
            Analytics.getCompletionHistory().forEach((day) => {
                const el = document.createElement("div");
                el.className = `streak-day ${day.completed > 0 ? "active" : ""}`;
                el.textContent = day.completed > 0 ? "✓" : "";
                el.title = `${day.date}: ${day.completed} completed`;
                streakCal.appendChild(el);
            });
        }

        if (categoriesList) {
            const categories = Analytics.getCategoryStats();
            categoriesList.innerHTML = "";

            if (!categories.length) {
                categoriesList.innerHTML = `<p style="color: var(--text-secondary);">No category data yet</p>`;
            } else {
                categories.slice(0, 5).forEach((cat) => {
                    const item = document.createElement("div");
                    item.className = "category-item";
                    item.innerHTML = `
            <span class="category-name">${escapeHtml(cat.category)}</span>
            <span class="category-count">${cat.count}</span>
          `;
                    categoriesList.appendChild(item);
                });
            }
        }
    };

    const updateGamificationDisplay = () => {
        const stats = Gamification.getStats();
        const streakValue = document.getElementById("streakValue");
        const xpValue = document.getElementById("xpValue");
        const levelValue = document.getElementById("levelValue");

        if (streakValue) streakValue.textContent = stats.streak || 0;
        if (xpValue) xpValue.textContent = stats.xp || 0;
        if (levelValue) levelValue.textContent = stats.level || 1;
    };

    const showModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add("active");
    };

    const hideModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove("active");
    };

    const clearTaskForm = () => {
        const form = document.getElementById("taskForm");
        if (!form) return;

        delete form.dataset.editId;
        form.reset();
        document.getElementById("modalTitle").textContent = "Add New Task";
        const priority = document.getElementById("taskPriority");
        if (priority) priority.value = "medium";
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
        document.getElementById("modalTitle").textContent = "Edit Task";

        const form = document.getElementById("taskForm");
        if (form) form.dataset.editId = taskId;

        showModal("taskModal");
    };

    const showToast = (message, type = "info", duration = 2500) => {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    };

    const switchSection = (sectionName) => {
        document.querySelectorAll(".task-section").forEach((section) => {
            section.classList.remove("active");
        });

        const section = document.getElementById(`${sectionName}-section`);
        if (section) section.classList.add("active");

        document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.remove("active");
            if (item.dataset.section === sectionName) item.classList.add("active");
        });

        renderSectionContent(sectionName);
    };

    const renderSectionContent = (sectionName) => {
        const container = document.getElementById(`${sectionName}-list`);
        if (!container && sectionName !== "completed" && sectionName !== "analytics") return;

        let tasks = [];

        switch (sectionName) {
            case "today":
                tasks = Storage.getTodayTasks();
                renderTaskList(tasks, container);
                break;
            case "upcoming":
                tasks = Storage.getUpcomingTasks();
                renderTaskList(tasks, container);
                break;
            case "someday":
                tasks = Storage.getSomedayTasks();
                renderTaskList(tasks, container);
                break;
            case "completed":
                renderCompletedToday(Storage.getCompletedTasks());
                break;
            case "archive":
                tasks = Storage.getArchivedTasks();
                renderTaskList(tasks, container);
                break;
            case "trash":
                tasks = Storage.getTrashTasks();
                renderTaskList(tasks, container);
                break;
            case "analytics":
                renderAnalytics();
                break;
        }
    };

    const updateSearchResults = (query) => {
        const trimmed = query.trim();
        const todayContainer = document.getElementById("today-list");
        if (!todayContainer) return;

        if (!trimmed) {
            switchSection(document.querySelector(".nav-item.active")?.dataset.section || "today");
            return;
        }

        const results = Storage.searchTasks(trimmed);
        renderTaskList(results, todayContainer);

        document.querySelectorAll(".task-section").forEach((section) => {
            section.classList.remove("active");
        });
        document.getElementById("today-section")?.classList.add("active");
    };

    return {
        renderTaskList,
        renderTaskItem,
        renderCompletedToday,
        renderAnalytics,
        updateGamificationDisplay,
        showModal,
        hideModal,
        clearTaskForm,
        loadTaskForEdit,
        showToast,
        switchSection,
        renderSectionContent,
        updateSearchResults
    };
})();