const Storage = (() => {
    const PREFIX = 'taskflow_';

    /**
     * Get all tasks
     */
    const getAllTasks = () => {
        const data = localStorage.getItem(`${PREFIX}tasks`);
        return data ? JSON.parse(data) : [];
    };

    /**
     * Save all tasks
     */
    const saveTasks = (tasks) => {
        localStorage.setItem(`${PREFIX}tasks`, JSON.stringify(tasks));
    };

    /**
     * Add a new task
     */
    const addTask = (task) => {
        const tasks = getAllTasks();
        const newTask = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            completed: false,
            archived: false,
            inTrash: false,
            ...task
        };
        tasks.push(newTask);
        saveTasks(tasks);
        return newTask;
    };

    /**
     * Update a task
     */
    const updateTask = (id, updates) => {
        const tasks = getAllTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            saveTasks(tasks);
            return tasks[index];
        }
        return null;
    };

    /**
     * Delete a task (soft delete - move to trash)
     */
    const deleteTask = (id) => {
        return updateTask(id, {
            inTrash: true,
            trashedAt: new Date().toISOString()
        });
    };

    /**
     * Permanently delete a task
     */
    const permanentlyDeleteTask = (id) => {
        let tasks = getAllTasks();
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
    };

    /**
     * Get task by ID
     */
    const getTask = (id) => {
        const tasks = getAllTasks();
        return tasks.find(t => t.id === id);
    };

    /**
     * Get active tasks (not completed, not archived, not in trash)
     */
    const getActiveTasks = () => {
        const tasks = getAllTasks();
        return tasks.filter(t => !t.completed && !t.archived && !t.inTrash);
    };

    /**
     * Get today's tasks
     */
    const getTodayTasks = () => {
        const today = new Date().toISOString().split('T')[0];
        return getActiveTasks().filter(t => t.dueDate === today);
    };

    /**
     * Get upcoming tasks
     */
    const getUpcomingTasks = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        return getActiveTasks().filter(t => {
            if (!t.dueDate) return false;
            return t.dueDate > todayStr;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    /**
     * Get completed tasks
     */
    const getCompletedTasks = () => {
        const tasks = getAllTasks();
        return tasks.filter(t => t.completed && !t.archived && !t.inTrash);
    };

    /**
     * Get archived tasks
     */
    const getArchivedTasks = () => {
        const tasks = getAllTasks();
        return tasks.filter(t => t.archived && !t.inTrash);
    };

    /**
     * Get Someday tasks
     */
    const getSomedayTasks = () => {
        const today = new Date().toISOString().split('T')[0];
        return getActiveTasks().filter(t => !t.dueDate || t.dueDate === '');
    };

    /**
     * Get trash tasks
     */
    const getTrashTasks = () => {
        const tasks = getAllTasks();
        return tasks.filter(t => t.inTrash);
    };

    /**
     * Restore a task from trash
     */
    const restoreTask = (id) => {
        return updateTask(id, { inTrash: false, trashedAt: null });
    };

    /**
     * Archive a task
     */
    const archiveTask = (id) => {
        return updateTask(id, { archived: true });
    };

    /**
     * Unarchive a task
     */
    const unarchiveTask = (id) => {
        return updateTask(id, { archived: false });
    };

    /**
     * Move to Someday
     */
    const moveToSomeday = (id) => {
        return updateTask(id, { dueDate: null, dueTime: null });
    };

    /**
     * Search tasks
     */
    const searchTasks = (query) => {
        const tasks = getActiveTasks();
        const q = query.toLowerCase();
        return tasks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.category && t.category.toLowerCase().includes(q))
        );
    };

    /**
     * Get gamification stats
     */
    const getGamificationStats = () => {
        const data = localStorage.getItem(`${PREFIX}gamification`);
        return data ? JSON.parse(data) : {
            xp: 0,
            level: 1,
            streak: 0,
            lastCompletionDate: null,
            badges: [],
            totalCompleted: 0
        };
    };

    /**
     * Update gamification stats
     */
    const updateGamificationStats = (stats) => {
        localStorage.setItem(`${PREFIX}gamification`, JSON.stringify(stats));
    };

    /**
     * Get analytics data
     */
    const getAnalyticsData = () => {
        const data = localStorage.getItem(`${PREFIX}analytics`);
        return data ? JSON.parse(data) : {
            completedThisWeek: 0,
            completedToday: 0,
            completionHistory: {},
            categoryStats: {}
        };
    };

    /**
     * Update analytics data
     */
    const updateAnalyticsData = (analytics) => {
        localStorage.setItem(`${PREFIX}analytics`, JSON.stringify(analytics));
    };

    /**
     * Get theme preference
     */
    const getTheme = () => {
        return localStorage.getItem(`${PREFIX}theme`) || 'light';
    };

    /**
     * Set theme preference
     */
    const setTheme = (theme) => {
        localStorage.setItem(`${PREFIX}theme`, theme);
    };

    /**
     * Get settings
     */
    const getSettings = () => {
        const data = localStorage.getItem(`${PREFIX}settings`);
        return data ? JSON.parse(data) : {
            notificationsEnabled: true,
            soundEnabled: true,
            autoArchive: true
        };
    };

    /**
     * Update settings
     */
    const updateSettings = (settings) => {
        localStorage.setItem(`${PREFIX}settings`, JSON.stringify(settings));
    };

    /**
     * Clean up old trash (30 days)
     */
    const cleanUpTrash = () => {
        const tasks = getAllTasks();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const cleaned = tasks.filter(t => {
            if (t.inTrash && t.trashedAt) {
                const trashedDate = new Date(t.trashedAt);
                return trashedDate > thirtyDaysAgo;
            }
            return true;
        });

        if (cleaned.length !== tasks.length) {
            saveTasks(cleaned);
        }
    };

    /**
     * Export data as JSON
     */
    const exportData = () => {
        const data = {
            tasks: getAllTasks(),
            gamification: getGamificationStats(),
            analytics: getAnalyticsData(),
            settings: getSettings(),
            theme: getTheme(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    };

    /**
     * Import data from JSON
     */
    const importData = (jsonData) => {
        try {
            const data = JSON.parse(jsonData);
            if (data.tasks) localStorage.setItem(`${PREFIX}tasks`, JSON.stringify(data.tasks));
            if (data.gamification) localStorage.setItem(`${PREFIX}gamification`, JSON.stringify(data.gamification));
            if (data.analytics) localStorage.setItem(`${PREFIX}analytics`, JSON.stringify(data.analytics));
            if (data.settings) localStorage.setItem(`${PREFIX}settings`, JSON.stringify(data.settings));
            if (data.theme) localStorage.setItem(`${PREFIX}theme`, data.theme);
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    };

    /**
     * Clear all data
     */
    const clearAllData = () => {
        localStorage.removeItem(`${PREFIX}tasks`);
        localStorage.removeItem(`${PREFIX}gamification`);
        localStorage.removeItem(`${PREFIX}analytics`);
        localStorage.removeItem(`${PREFIX}settings`);
        localStorage.removeItem(`${PREFIX}theme`);
    };

    return {
        getAllTasks,
        saveTasks,
        addTask,
        updateTask,
        deleteTask,
        permanentlyDeleteTask,
        getTask,
        getActiveTasks,
        getTodayTasks,
        getUpcomingTasks,
        getCompletedTasks,
        getArchivedTasks,
        getSomedayTasks,
        getTrashTasks,
        restoreTask,
        archiveTask,
        unarchiveTask,
        moveToSomeday,
        searchTasks,
        getGamificationStats,
        updateGamificationStats,
        getAnalyticsData,
        updateAnalyticsData,
        getTheme,
        setTheme,
        getSettings,
        updateSettings,
        cleanUpTrash,
        exportData,
        importData,
        clearAllData
    };
})();
