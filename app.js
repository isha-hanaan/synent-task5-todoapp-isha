const App = (() => {
    /**
     * Initialize the application
     */
    const init = () => {
        // Check if we're on the dashboard
        if (!document.getElementById('dashboard-page') && document.body.classList.contains('dashboard-page')) {
            initDashboard();
        }
    };

    /**
     * Initialize dashboard
     */
    const initDashboard = () => {
        // Setup theme
        setupTheme();

        // Setup UI
        setupUIElements();

        // Setup event listeners
        setupEventListeners();

        // Load initial data
        loadDashboard();

        // Cleanup old trash
        Storage.cleanUpTrash();

        // Initialize animations
        AnimationsModule.setupScrollReveal();
    };

    /**
     * Setup theme
     */
    const setupTheme = () => {
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    };

    /**
     * Setup UI elements
     */
    const setupUIElements = () => {
        // Update gamification display
        UI.updateGamificationDisplay();

        // Render initial section
        UI.switchSection('today');
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                UI.switchSection(section);
            });
        });

        // Quick add
        const quickAddBtn = document.getElementById('quickAddBtn');
        const quickAddInput = document.getElementById('quickAddInput');
        const advancedAddBtn = document.getElementById('advancedAddBtn');

        if (quickAddBtn && quickAddInput) {
            quickAddBtn.addEventListener('click', handleQuickAdd);
            quickAddInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleQuickAdd();
                }
            });
        }

        if (advancedAddBtn) {
            advancedAddBtn.addEventListener('click', () => {
                UI.showModal('taskModal');
                UI.clearTaskForm();
            });
        }

        // Priority tags
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const priority = e.target.dataset.priority;
                const input = document.getElementById('quickAddInput');
                if (input) {
                    input.focus();
                    // Store selected priority for next task
                    input.dataset.priority = priority;
                }
            });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                UI.updateSearchResults(e.target.value);
            });
        }

        // Task modal
        const taskForm = document.getElementById('taskForm');
        const modalClose = document.querySelector('.modal-close');
        const modalCancel = document.getElementById('modalCancel');

        if (taskForm) {
            taskForm.addEventListener('submit', handleTaskFormSubmit);
        }

        if (modalClose) {
            modalClose.addEventListener('click', () => UI.hideModal('taskModal'));
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', () => UI.hideModal('taskModal'));
        }

        // Task list delegated events
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            list.addEventListener('click', handleTaskAction);
        });

        // Settings
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                UI.showModal('settingsModal');
            });
        }

        const settingsClose = document.querySelector('#settingsModal .modal-close');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => UI.hideModal('settingsModal'));
        }

        // Settings actions
        const exportBtn = document.getElementById('exportData');
        const importBtn = document.getElementById('importData');
        const clearBtn = document.getElementById('clearData');

        if (exportBtn) {
            exportBtn.addEventListener('click', handleExportData);
        }

        if (importBtn) {
            importBtn.addEventListener('click', handleImportData);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', handleClearData);
        }

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UI.hideModal(modal.id);
                }
            });
        });
    };

    /**
     * Toggle theme
     */
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        Storage.setTheme(isDark ? 'dark' : 'light');
    };

    /**
     * Handle quick add task
     */
    const handleQuickAdd = () => {
        const input = document.getElementById('quickAddInput');
        if (!input || !input.value.trim()) return;

        const parsed = Parser.parse(input.value);
        const priority = input.dataset.priority || 'medium';

        const task = Tasks.create({
            ...parsed,
            priority
        });

        // Track in analytics
        Analytics.trackCompletion(task);

        // Clear input
        input.value = '';
        input.dataset.priority = '';
        input.focus();

        // Reload current section
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            UI.switchSection(activeNav.dataset.section);
        }

        UI.showToast('✅ Task added!', 'success');
    };

    /**
     * Handle task form submit
     */
    const handleTaskFormSubmit = (e) => {
        e.preventDefault();

        const form = e.target;
        const editId = form.dataset.editId;

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            dueDate: document.getElementById('taskDate').value || null,
            dueTime: document.getElementById('taskTime').value || null,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value || ''
        };

        if (editId) {
            // Update existing task
            Tasks.update(editId, taskData);
            UI.showToast('✏️ Task updated!', 'success');
        } else {
            // Create new task
            Tasks.create(taskData);
            UI.showToast('✅ Task created!', 'success');
        }

        UI.hideModal('taskModal');
        UI.clearTaskForm();

        // Reload current section
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            UI.switchSection(activeNav.dataset.section);
        }
    };

    /**
     * Handle task actions
     */
    const handleTaskAction = (e) => {
        const action = e.target.closest('[data-action]');
        if (!action) return;

        const taskItem = action.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.taskId;
        const actionType = action.dataset.action;

        switch (actionType) {
            case 'toggle':
                handleTaskToggle(taskId, taskItem);
                break;
            case 'edit':
                UI.loadTaskForEdit(taskId);
                break;
            case 'delete':
                handleTaskDelete(taskId);
                break;
        }
    };

    /**
     * Handle task toggle (complete/uncomplete)
     */
    const handleTaskToggle = (taskId, taskItem) => {
        const task = Storage.getTask(taskId);
        if (!task) return;

        if (task.completed) {
            Tasks.uncomplete(taskId);
            UI.showToast('↩️ Task uncompleted', 'info');
        } else {
            Tasks.complete(taskId);

            // Celebrate!
            AnimationsModule.taskCompletionEffect(taskItem, () => {
                // Check for badges
                const stats = Gamification.getStats();
                const badges = Gamification.getEarnedBadges();

                if (badges.length > 0) {
                    const latestBadge = badges[0];
                    AnimationsModule.badgeUnlockEffect(latestBadge.name);
                }
            });

            UI.showToast('🎉 Task completed!', 'success');
        }

        // Update gamification display
        UI.updateGamificationDisplay();

        // Reload section
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            UI.switchSection(activeNav.dataset.section);
        }
    };

    /**
     * Handle task delete (soft delete to trash)
     */
    const handleTaskDelete = (taskId) => {
        Tasks.delete(taskId);
        UI.showToast('🗑️ Task moved to trash', 'info');

        // Reload section
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            UI.switchSection(activeNav.dataset.section);
        }
    };

    /**
     * Load dashboard data
     */
    const loadDashboard = () => {
        // This is called on init to load all data
        UI.switchSection('today');
    };

    /**
     * Handle export data
     */
    const handleExportData = () => {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        UI.showToast('💾 Data exported!', 'success');
    };

    /**
     * Handle import data
     */
    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const success = Storage.importData(event.target.result);
                    if (success) {
                        UI.showToast('📂 Data imported successfully!', 'success');
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        UI.showToast('❌ Failed to import data', 'error');
                    }
                } catch (err) {
                    UI.showToast('❌ Invalid file', 'error');
                }
            };

            reader.readAsText(file);
        });

        input.click();
    };

    /**
     * Handle clear all data
     */
    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            Storage.clearAllData();
            UI.showToast('🗑️ All data cleared', 'info');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    };

    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init
    };
})();
