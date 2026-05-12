const UI = (() => {
    /**
     * Render tasks in a list
     */
    const renderTaskList = (tasks, container) => {
        if (!container) return;

        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No tasks yet</h3>
                    <p>Create a task to get started</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskEl = renderTaskItem(task);
            container.appendChild(taskEl);
        });
    };

    /**
     * Render a single task item
     */
    const renderTaskItem = (task) => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.dataset.taskId = task.id;

        const dueText = formatDueDate(task.dueDate, task.dueTime);
        const categoryTag = task.category ? `<span class="task-meta-item">${task.category}</span>` : '';
        const descriptionHtml = task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : '';

        div.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                ${descriptionHtml}
                <div class="task-meta">
                    ${dueText ? `<span class="task-meta-item">📅 ${dueText}</span>` : ''}
                    ${categoryTag}
                    <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn" title="Edit task" data-action="edit">✏️</button>
                <button class="task-btn delete" title="Delete task" data-action="delete">🗑️</button>
            </div>
        `;

        return div;
    };

    /**
     * Render completed today section
     */
    const renderCompletedToday = (tasks) => {
        const container = document.getElementById('completed-list');
        const summary = document.getElementById('completedSummary');

        if (!container || !summary) return;

        const taskCount = tasks.length;
        if (taskCount > 0) {
            summary.innerHTML = `
                <p>🎉 You completed <strong>${taskCount} task${taskCount !== 1 ? 's' : ''}</strong> today!</p>
            `;
        } else {
            summary.innerHTML = '<p>Complete tasks to see them here!</p>';
        }

        renderTaskList(tasks, container);
    };

    /**
     * Render analytics section
     */
    const renderAnalytics = () => {
        const weekCompleted = Analytics.getCompletedThisWeek();
        document.getElementById('weekCompleted').textContent = `${weekCompleted} completed`;

        // Productivity score
        const score = Gamification.getProductivityScore();
        const ring = document.getElementById('productivityRing');
        const scoreEl = document.getElementById('productivityScore');

        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        ring.style.strokeDashoffset = offset;
        scoreEl.textContent = score + '%';

        // Streak calendar
        const streakCal = document.getElementById('streakCalendar');
        const history = Analytics.getCompletionHistory();
        streakCal.innerHTML = '';

        history.slice(-30).forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = `streak-day ${day.completed > 0 ? 'active' : ''}`;
            dayEl.title = `${day.date}: ${day.completed} completed`;
            dayEl.textContent = day.completed > 0 ? '✓' : '';
            streakCal.appendChild(dayEl);
        });

        // Category stats
        const categoriesList = document.getElementById('categoriesList');
        const categories = Analytics.getCategoryStats();
        categoriesList.innerHTML = '';

        categories.slice(0, 5).forEach(cat => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <span class="category-name">${escapeHtml(cat.category)}</span>
                <span class="category-count">${cat.count}</span>
            `;
            categoriesList.appendChild(item);
        });

        if (categories.length === 0) {
            categoriesList.innerHTML = '<p style="color: var(--text-secondary);">No category data yet</p>';
        }
    };

    /**
     * Update gamification display
     */
    const updateGamificationDisplay = () => {
        const stats = Gamification.getStats();

        const streakEl = document.getElementById('streakValue');
        const xpEl = document.getElementById('xpValue');
        const levelEl = document.getElementById('levelValue');

        if (streakEl) streakEl.textContent = stats.streak || 0;
        if (xpEl) xpEl.textContent = stats.xp || 0;
        if (levelEl) levelEl.textContent = stats.level || 1;
    };

    /**
     * Show modal
     */
    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    };

    /**
     * Hide modal
     */
    const hideModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    };

    /**
     * Show toast notification
     */
    const showToast = (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    /**
     * Switch section
     */
    const switchSection = (sectionName) => {
        // Hide all sections
        document.querySelectorAll('.task-section').forEach(s => {
            s.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.add('active');
        }

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });

        // Render content based on section
        renderSectionContent(sectionName);
    };

    /**
     * Render content for a section
     */
    const renderSectionContent = (sectionName) => {
        const containerId = `${sectionName}-list`;
        const container = document.getElementById(containerId);

        if (!container) return;

        let tasks;

        switch (sectionName) {
            case 'today':
                tasks = Storage.getTodayTasks();
                break;
            case 'upcoming':
                tasks = Storage.getUpcomingTasks();
                break;
            case 'someday':
                tasks = Storage.getSomedayTasks();
                break;
            case 'completed':
                tasks = Storage.getCompletedTasks();
                renderCompletedToday(tasks);
                return;
            case 'archive':
                tasks = Storage.getArchivedTasks();
                break;
            case 'trash':
                tasks = Storage.getTrashTasks();
                break;
            case 'analytics':
                renderAnalytics();
                return;
            default:
                tasks = [];
        }

        renderTaskList(tasks, container);
    };

    /**
     * Format due date display
     */
    const formatDueDate = (dueDate, dueTime) => {
        if (!dueDate) return '';

        const today = new Date().toISOString().split('T')[0];
        const date = new Date(dueDate);

        let dateText;
        if (dueDate === today) {
            dateText = 'Today';
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (dueDate === tomorrow.toISOString().split('T')[0]) {
                dateText = 'Tomorrow';
            } else {
                dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        }

        if (dueTime) {
            const time = new Date(`2000-01-01T${dueTime}`);
            const timeText = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `${dateText} at ${timeText}`;
        }

        return dateText;
    };

    /**
     * Escape HTML
     */
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Update search results
     */
    const updateSearchResults = (query) => {
        if (!query.trim()) {
            // Show current section
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                switchSection(activeNav.dataset.section);
            }
            return;
        }

        const results = Storage.searchTasks(query);
        const container = document.getElementById('today-list');

        if (container) {
            renderTaskList(results, container);
        }

        // Show today section
        document.querySelectorAll('.task-section').forEach(s => s.classList.remove('active'));
        document.getElementById('today-section').classList.add('active');
    };

    /**
     * Load and display form data for editing
     */
    const loadTaskForEdit = (taskId) => {
        const task = Storage.getTask(taskId);
        if (!task) return;

        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.description || '';
        document.getElementById('taskDate').value = task.dueDate || '';
        document.getElementById('taskTime').value = task.dueTime || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category || '';

        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskForm').dataset.editId = taskId;

        UI.showModal('taskModal');
    };

    /**
     * Clear task form
     */
    const clearTaskForm = () => {
        document.getElementById('taskForm').reset();
        document.getElementById('modalTitle').textContent = 'Add New Task';
        delete document.getElementById('taskForm').dataset.editId;
    };

    return {
        renderTaskList,
        renderTaskItem,
        renderCompletedToday,
        renderAnalytics,
        updateGamificationDisplay,
        showModal,
        hideModal,
        showToast,
        switchSection,
        renderSectionContent,
        formatDueDate,
        escapeHtml,
        updateSearchResults,
        loadTaskForEdit,
        clearTaskForm
    };
})();
