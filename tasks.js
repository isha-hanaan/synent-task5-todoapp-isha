const Tasks = (() => {
  /**
   * Create a new task
   */
  const create = (data) => {
    const task = {
      title: data.title || 'Untitled Task',
      description: data.description || '',
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      priority: data.priority || 'medium',
      category: data.category || '',
      completed: false,
      archived: false,
      inTrash: false
    };

    return Storage.addTask(task);
  };

  /**
   * Update a task
   */
  const update = (id, updates) => {
    return Storage.updateTask(id, updates);
  };

  /**
   * Complete a task
   */
  const complete = (id) => {
    const task = Storage.getTask(id);
    if (task) {
      Storage.updateTask(id, { completed: true });
      // Update gamification
      Gamification.onTaskCompleted(task);
      return task;
    }
    return null;
  };

  /**
   * Uncomplete a task
   */
  const uncomplete = (id) => {
    return Storage.updateTask(id, { completed: false });
  };

  /**
   * Delete a task (soft delete)
   */
  const delete_ = (id) => {
    return Storage.deleteTask(id);
  };

  /**
   * Restore a task from trash
   */
  const restore = (id) => {
    return Storage.restoreTask(id);
  };

  /**
   * Permanently delete a task
   */
  const permanentlyDelete = (id) => {
    Storage.permanentlyDeleteTask(id);
  };

  /**
   * Archive a task
   */
  const archive = (id) => {
    return Storage.archiveTask(id);
  };

  /**
   * Unarchive a task
   */
  const unarchive = (id) => {
    return Storage.unarchiveTask(id);
  };

  /**
   * Move to Someday
   */
  const moveToSomeday = (id) => {
    return Storage.moveToSomeday(id);
  };

  /**
   * Get all tasks by category
   */
  const getByCategory = (category) => {
    const tasks = Storage.getActiveTasks();
    return tasks.filter(t => t.category === category);
  };

  /**
   * Get tasks by priority
   */
  const getByPriority = (priority) => {
    const tasks = Storage.getActiveTasks();
    return tasks.filter(t => t.priority === priority);
  };

  /**
   * Get overdue tasks
   */
  const getOverdue = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = Storage.getActiveTasks();
    return tasks.filter(t => t.dueDate && t.dueDate < today);
  };

  /**
   * Get tasks due soon (within 3 days)
   */
  const getDueSoon = () => {
    const today = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const threeStr = inThreeDays.toISOString().split('T')[0];

    const tasks = Storage.getActiveTasks();
    return tasks.filter(t => t.dueDate && t.dueDate >= todayStr && t.dueDate <= threeStr);
  };

  /**
   * Get completed today
   */
  const getCompletedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = Storage.getCompletedTasks();
    return tasks.filter(t => {
      if (t.completedAt) {
        return t.completedAt.split('T')[0] === today;
      }
      return false;
    });
  };

  /**
   * Get completed this week
   */
  const getCompletedThisWeek = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return Storage.getCompletedTasks().filter(t => {
      if (t.completedAt) {
        const completedDate = new Date(t.completedAt);
        return completedDate >= weekAgo && completedDate <= now;
      }
      return false;
    });
  };

  /**
   * Check if task is overdue by days
   */
  const isOverdueBy = (task, days) => {
    if (!task.dueDate) return false;

    const today = new Date();
    const taskDue = new Date(task.dueDate);
    const diffTime = today - taskDue;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= days;
  };

  /**
   * Format task for display
   */
  const formatForDisplay = (task) => {
    const today = new Date().toISOString().split('T')[0];
    let dueText = '';

    if (task.dueDate) {
      if (task.dueDate === today) {
        dueText = 'Today';
      } else {
        const due = new Date(task.dueDate);
        dueText = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      if (task.dueTime) {
        const time = new Date(`2000-01-01T${task.dueTime}`);
        dueText += ` at ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
    }

    return {
      ...task,
      dueText,
      isOverdue: task.dueDate && task.dueDate < today && !task.completed
    };
  };

  /**
   * Export tasks as JSON
   */
  const export_ = () => {
    return Storage.getAllTasks();
  };

  return {
    create,
    update,
    complete,
    uncomplete,
    delete: delete_,
    restore,
    permanentlyDelete,
    archive,
    unarchive,
    moveToSomeday,
    getByCategory,
    getByPriority,
    getOverdue,
    getDueSoon,
    getCompletedToday,
    getCompletedThisWeek,
    isOverdueBy,
    formatForDisplay,
    export: export_
  };
})();
