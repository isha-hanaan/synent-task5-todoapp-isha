
const Storage = (() => {
    const PREFIX = "taskflow_";
    const TASKS_KEY = `${PREFIX}tasks`;
    const THEME_KEY = `${PREFIX}theme`;

    const getAllTasks = () => {
        const raw = localStorage.getItem(TASKS_KEY);
        return raw ? JSON.parse(raw) : [];
    };

    const saveTasks = (tasks) => {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    };

    const addTask = (taskData) => {
        const tasks = getAllTasks();

        const task = {
            id: Date.now().toString(),
            title: taskData.title || "Untitled Task",
            description: taskData.description || "",
            dueDate: taskData.dueDate || null,
            dueTime: taskData.dueTime || null,
            priority: taskData.priority || "medium",
            category: taskData.category || "",
            completed: false,
            archived: false,
            inTrash: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            trashedAt: null,
            ...taskData
        };

        tasks.unshift(task);
        saveTasks(tasks);
        return task;
    };

    const updateTask = (id, updates) => {
        const tasks = getAllTasks();
        const index = tasks.findIndex((task) => task.id === id);

        if (index === -1) return null;

        tasks[index] = {
            ...tasks[index],
            ...updates
        };

        saveTasks(tasks);
        return tasks[index];
    };

    const getTask = (id) => {
        return getAllTasks().find((task) => task.id === id) || null;
    };

    const deleteTask = (id) => {
        return updateTask(id, {
            inTrash: true,
            trashedAt: new Date().toISOString()
        });
    };

    const restoreTask = (id) => {
        return updateTask(id, {
            inTrash: false,
            trashedAt: null
        });
    };

    const archiveTask = (id) => {
        return updateTask(id, { archived: true });
    };

    const unarchiveTask = (id) => {
        return updateTask(id, { archived: false });
    };

    const getActiveTasks = () => {
        return getAllTasks().filter(
            (task) => !task.completed && !task.archived && !task.inTrash
        );
    };

    const getTodayTasks = () => {
        const today = new Date().toISOString().split("T")[0];
        return getActiveTasks().filter((task) => task.dueDate === today);
    };

    const getUpcomingTasks = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split("T")[0];

        return getActiveTasks()
            .filter((task) => task.dueDate && task.dueDate > todayStr)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    const getSomedayTasks = () => {
        return getActiveTasks().filter((task) => !task.dueDate);
    };

    const getCompletedTasks = () => {
        return getAllTasks().filter(
            (task) => task.completed && !task.archived && !task.inTrash
        );
    };

    const getArchivedTasks = () => {
        return getAllTasks().filter((task) => task.archived && !task.inTrash);
    };

    const getTrashTasks = () => {
        return getAllTasks().filter((task) => task.inTrash);
    };

    const searchTasks = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return getActiveTasks();

        return getActiveTasks().filter((task) => {
            return (
                task.title.toLowerCase().includes(q) ||
                (task.description || "").toLowerCase().includes(q) ||
                (task.category || "").toLowerCase().includes(q)
            );
        });
    };

    const getTheme = () => {
        return localStorage.getItem(THEME_KEY) || "light";
    };

    const setTheme = (theme) => {
        localStorage.setItem(THEME_KEY, theme);
    };

    const clearAllData = () => {
        localStorage.removeItem(TASKS_KEY);
        localStorage.removeItem(THEME_KEY);
    };

    return {
        getAllTasks,
        saveTasks,
        addTask,
        updateTask,
        getTask,
        deleteTask,
        restoreTask,
        archiveTask,
        unarchiveTask,
        getActiveTasks,
        getTodayTasks,
        getUpcomingTasks,
        getSomedayTasks,
        getCompletedTasks,
        getArchivedTasks,
        getTrashTasks,
        searchTasks,
        getTheme,
        setTheme,
        clearAllData
    };
})();