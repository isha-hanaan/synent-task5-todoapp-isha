
const Tasks = (() => {
  const create = (data) => {
    return Storage.addTask({
      title: data.title || "Untitled Task",
      description: data.description || "",
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      priority: data.priority || "medium",
      category: data.category || ""
    });
  };

  const update = (id, updates) => {
    return Storage.updateTask(id, updates);
  };

  const complete = (id) => {
    return Storage.updateTask(id, {
      completed: true,
      completedAt: new Date().toISOString()
    });
  };

  const uncomplete = (id) => {
    return Storage.updateTask(id, {
      completed: false,
      completedAt: null
    });
  };

  const remove = (id) => Storage.deleteTask(id);
  const restore = (id) => Storage.restoreTask(id);
  const archive = (id) => Storage.archiveTask(id);
  const unarchive = (id) => Storage.unarchiveTask(id);

  const getSectionTasks = (section) => {
    switch (section) {
      case "today":
        return Storage.getTodayTasks();
      case "upcoming":
        return Storage.getUpcomingTasks();
      case "someday":
        return Storage.getSomedayTasks();
      case "completed":
        return Storage.getCompletedTasks();
      case "archive":
        return Storage.getArchivedTasks();
      case "trash":
        return Storage.getTrashTasks();
      default:
        return Storage.getTodayTasks();
    }
  };

  const renderSection = (section) => {
    const container = document.getElementById(`${section}-list`);
    if (!container) return;

    const tasks = getSectionTasks(section);
    container.innerHTML = "";

    if (section === "completed") {
      const summary = document.getElementById("completedSummary");
      if (summary) {
        summary.innerHTML = tasks.length
          ? `<p>🎉 You completed <strong>${tasks.length} task${tasks.length === 1 ? "" : "s"}</strong> today!</p>`
          : "<p>Complete tasks to see them here!</p>";
      }
    }

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

    tasks.forEach((task) => {
      container.appendChild(createTaskElement(task, section));
    });
  };

  const createTaskElement = (task, section) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.completed ? "completed" : ""}`;
    item.dataset.taskId = task.id;

    const dueText = formatDueDate(task.dueDate, task.dueTime);
    const descriptionHtml = task.description
      ? `<p class="task-description">${escapeHtml(task.description)}</p>`
      : "";

    const primaryAction =
      section === "trash" || section === "archive"
        ? `<button class="task-btn" data-action="restore" title="Restore">↩️</button>`
        : `<button class="task-btn" data-action="toggle" title="Mark complete">${task.completed ? "↩️" : "✓"}</button>`;

    const extraAction =
      section === "trash"
        ? ""
        : section === "archive"
        ? `<button class="task-btn delete" data-action="delete" title="Delete">🗑️</button>`
        : `
          <button class="task-btn" data-action="edit" title="Edit">✏️</button>
          <button class="task-btn" data-action="archive" title="Archive">📦</button>
          <button class="task-btn delete" data-action="delete" title="Delete">🗑️</button>
        `;

    item.innerHTML = `
      <button class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle" aria-label="Toggle completion">
        ${task.completed ? "✓" : ""}
      </button>

      <div class="task-content">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${descriptionHtml}
        <div class="task-meta">
          ${dueText ? `<span class="task-meta-item">📅 ${escapeHtml(dueText)}</span>` : ""}
          ${task.category ? `<span class="task-meta-item">${escapeHtml(task.category)}</span>` : ""}
          <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
      </div>

      <div class="task-actions">
        ${primaryAction}
        ${extraAction}
      </div>
    `;

    return item;
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
        label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        });
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

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  return {
    create,
    update,
    complete,
    uncomplete,
    remove,
    restore,
    archive,
    unarchive,
    renderSection,
    getSectionTasks,
    formatDueDate
  };
})();