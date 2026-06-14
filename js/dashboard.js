(function () {
    'use strict';

    let state = {
        tasks: [],
        lists: ['Personal', 'Work', 'Shopping', 'Grocery'],
        currentView: 'inbox',    // 'all', 'inbox', 'starred', 'completed', 'archived', 'trash'
        currentCustomList: null,
        searchQuery: '',
        sortBy: 'newest',      // 'newest', 'alpha', 'priority'
        sortAscending: false,
        selectedTaskId: null
    };

    let undoStack = [];

    function pushUndoStack(label, rollbackCallback) {
        undoStack.push(rollbackCallback);

        if (undoStack.length > 20) {
            undoStack.shift();
        }

        spawnToast(`${label}.`, true);
    }

    const DOM = {
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarPanel: document.getElementById('sidebarPanel'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        sortBySelect: document.getElementById('sortBy'),
        sortOrderToggle: document.getElementById('sortOrderToggle'),
        sortOrderIcon: document.getElementById('sortOrderIcon'),
        customListsContainer: document.getElementById('customListsContainer'),
        taskList: document.getElementById('taskList'),
        currentViewTitle: document.getElementById('currentViewTitle'),
        taskCounter: document.getElementById('taskCounter'),
        inspectorPanel: document.getElementById('inspectorPanel'),
        inspectorContent: document.getElementById('inspectorContent'),
        closeInspectorBtn: document.getElementById('closeInspectorBtn'),
        openCreateModalBtn: document.getElementById('openCreateModalBtn'),
        taskModal: document.getElementById('taskModal'),
        modalTitle: document.getElementById('modalTitle'),
        taskForm: document.getElementById('taskForm'),
        formTaskId: document.getElementById('formTaskId'),
        taskTitleInput: document.getElementById('taskTitleInput'),
        taskDescInput: document.getElementById('taskDescInput'),
        taskCategorySelect: document.getElementById('taskCategorySelect'),
        taskPrioritySelect: document.getElementById('taskPrioritySelect'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        cancelModalBtn: document.getElementById('cancelModalBtn'),
        toastContainer: document.getElementById('toastContainer'),
        sidebarNav: document.querySelector('.sidebar-nav'),
        addListBtn: document.getElementById('addListBtn')
    };

    function loadStateFromStorage() {
        const storedTasks = localStorage.getItem('GRID_dashboard_tasks');
        const storedLists = localStorage.getItem('GRID_dashboard_lists');

        if (storedTasks) {
            try {
                state.tasks = JSON.parse(storedTasks) || [];
            } catch {
                state.tasks = [];
            }
        } else {
            state.tasks = [
                { id: '1', title: 'Create a login page for an application ', desc: 'Design a clean login interface that includes e-mail & password fields, login button, and a "Forgot Password" text. It should be a modern & properly aligned UI.', category: 'Work', priority: 'high', starred: true, completed: false, archived: false, trashed: false, created: Date.now() - 86400000 },
                { id: '2', title: 'Book a dermatologist appointment', desc: 'Coming weekend, get your foot crack & other skin issues solved.', category: 'Personal', priority: 'medium', starred: false, completed: false, archived: false, trashed: false, created: Date.now() - 3600000 },
                { id: '3', title: 'Buy veggies & fruits', desc: 'Papaya, oranges, mangoes, cucumber, carrots, beans, cauliflower, sweet corn, bananas.', category: 'Shopping', priority: 'low', starred: false, completed: true, archived: false, trashed: false, created: Date.now() - 7200000 }
            ];
            saveStateToStorage();
        }

        if (storedLists) {
            state.lists = JSON.parse(storedLists);
        }
    }

    function saveStateToStorage() {
        localStorage.setItem('GRID_dashboard_tasks', JSON.stringify(state.tasks));
        localStorage.setItem('GRID_dashboard_lists', JSON.stringify(state.lists));
    }

    function renderCustomLists() {
        DOM.customListsContainer.innerHTML = '';
        DOM.taskCategorySelect.innerHTML = '<option value="">None (Unassigned)</option>';

        state.lists.forEach(listName => {
            const btn = document.createElement('div');
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.className = `list-item-row ${state.currentView === 'list' && state.currentCustomList === listName ? 'active' : ''}`;
            btn.setAttribute('data-list', listName);

            btn.innerHTML = `
                <span class="list-name-text">${escapeHTML(listName)}</span>
                <div class="list-actions">
                    <button class="list-action-btn edit-list-trigger" title="Edit List Label" aria-label="Edit list">✏️</button>
                    <button class="list-action-btn delete-list-trigger" title="Delete List Label" aria-label="Delete list">&times;</button>
                </div>
            `;
            DOM.customListsContainer.appendChild(btn);

            const opt = document.createElement('option');
            opt.value = listName;
            opt.textContent = listName;
            DOM.taskCategorySelect.appendChild(opt);
        });
    }

    function renderTasks() {
        let filtered = state.tasks.filter(task => {
            if (state.currentView === 'all') {
                return !task.trashed && !task.archived;
            } else if (state.currentView === 'inbox') {
                return !task.completed && !task.archived && !task.trashed;
            } else if (state.currentView === 'starred') {
                return task.starred && !task.archived && !task.trashed;
            } else if (state.currentView === 'completed') {
                return task.completed && !task.archived && !task.trashed;
            } else if (state.currentView === 'archived') {
                return task.archived && !task.trashed;
            } else if (state.currentView === 'trash') {
                return task.trashed;
            } else if (state.currentView === 'list') {
                return (
                    task.category === state.currentCustomList &&
                    !task.archived &&
                    !task.trashed
                );
            }
            return true;
        });

        if (state.searchQuery.trim() !== '') {
            const query = state.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.desc.toLowerCase().includes(query) ||
                (t.category && t.category.toLowerCase().includes(query))
            );
            DOM.clearSearchBtn.style.display = 'block';
        } else {
            DOM.clearSearchBtn.style.display = 'none';
        }

        filtered.sort((a, b) => {
            let metric = 0;
            if (state.sortBy === 'newest') {
                metric = b.created - a.created;
            } else if (state.sortBy === 'alpha') {
                metric = a.title.localeCompare(b.title);
            } else if (state.sortBy === 'priority') {
                const weights = { high: 3, medium: 2, low: 1 };
                metric = weights[b.priority] - weights[a.priority];
            }
            return state.sortAscending ? -metric : metric;
        });

        DOM.taskCounter.textContent = `${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`;
        DOM.taskList.innerHTML = '';


        if (filtered.length === 0) {

            let emptyTitle = 'No tasks found';
            let emptyDesc = 'Create a task or adjust your filters.';

            switch (state.currentView) {

                case 'trash':
                    emptyTitle = 'Trash is empty';
                    emptyDesc = 'Deleted tasks will appear here.';
                    break;

                case 'archived':
                    emptyTitle = 'No archived tasks';
                    emptyDesc = 'Archived tasks will appear here.';
                    break;

                case 'completed':
                    emptyTitle = 'No completed tasks';
                    emptyDesc = 'Completed tasks will appear here.';
                    break;

                case 'starred':
                    emptyTitle = 'No starred tasks';
                    emptyDesc = 'Star important tasks for quick access.';
                    break;

                case 'list':
                    emptyTitle = `No tasks in ${state.currentCustomList}`;
                    emptyDesc = 'Create a task for this list.';
                    break;
            }

            DOM.taskList.innerHTML = `
        <div class="empty-state-frame">
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5">

                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>

            </svg>

            <h4>${emptyTitle}</h4>
            <p>${emptyDesc}</p>
        </div>
    `;

            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach(task => {
            const card = document.createElement('div');

            card.className = `
        task-card
        ${task.completed ? 'state-completed' : ''}
        ${state.selectedTaskId === task.id ? 'active-inspection' : ''}
    `;

            card.setAttribute('data-id', task.id);

            const isArchivedView = state.currentView === 'archived';

            const safePriority = ['low', 'medium', 'high'].includes(task.priority)
                ? task.priority
                : 'low';

            card.innerHTML = `
            
            <div class="checkbox-container">
            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? 'checked' : ''}
                aria-label="Toggle completed state"
                title="Mark Task Completed"
            >
        </div>

        <div class="task-card-main">
            <div class="task-card-title-row">
                <span class="task-title">${escapeHTML(task.title)}</span>

                <span class="priority-tag priority-${safePriority}">
                    ${safePriority}
                </span>

                ${task.category
                    ? `<span class="list-category-tag">${escapeHTML(task.category)}</span>`
                    : ''
                }
            </div>

            
               <p class="task-snippet">
                ${task.desc
                    ? escapeHTML(task.desc)
                    : '<i>No additional details added yet.</i>'
                }
            </p>
        </div>

        <div class="task-card-actions">

            <button
                class="card-action-btn star-toggle ${task.starred ? 'starred-active' : ''}"
                title="Star Task"
                aria-label="Star task"
            >
                <svg viewBox="0 0 24 24"
                    fill="${task.starred ? 'currentColor' : 'none'}"
                    stroke="currentColor"
                    stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            </button>

  ${!task.trashed ? `
                <button
                    class="card-action-btn archive-toggle ${isArchivedView ? 'archive-active' : ''}"
                    title="${isArchivedView ? 'Unarchive Task' : 'Archive Task'}"
                    aria-label="${isArchivedView ? 'Unarchive task' : 'Archive task'}"
                >
                    ${isArchivedView
                        ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="12 14 12 2"></polyline>
                            <polyline points="9 5 12 2 15 5"></polyline>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9"></path>
                        </svg>
                        `
                        : `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="21 8 21 21 3 21 3 8"></polyline>
                            <rect x="1" y="3" width="22" height="5"></rect>
                            <line x1="10" y1="12" x2="14" y2="12"></line>
                        </svg>
  `
                    }
                </button>
            ` : ''}

            <button
                class="card-action-btn delete-trigger"
                title="${task.trashed ? 'Permanently Delete Task' : 'Move to Trash'}"
                aria-label="Delete task"
            >
                <svg viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>

        </div>
    `;

            fragment.appendChild(card);
        });

        DOM.taskList.innerHTML = '';
        DOM.taskList.appendChild(fragment);
    }

    function renderInspector() {
        if (!state.selectedTaskId) {
            DOM.inspectorPanel.classList.remove('panel-open');
            document.querySelectorAll('.task-card').forEach(c => c.classList.remove('active-inspection'));
            return;
        }

        const task = state.tasks.find(t => t.id === state.selectedTaskId);
        if (!task) {
            state.selectedTaskId = null;
            DOM.inspectorPanel.classList.remove('panel-open');
            return;
        }

        DOM.inspectorPanel.classList.add('panel-open');

        const safePriority = ['low', 'medium', 'high'].includes(task.priority)
            ? task.priority
            : 'low';

        DOM.inspectorContent.innerHTML = `
            <div class="inspector-title">${escapeHTML(task.title)}</div>
            
            <div class="inspector-meta-box">
                <div class="meta-row">
                    <span class="meta-label">List Category</span>
                    <span class="list-category-tag">${task.category ? escapeHTML(task.category) : 'None (Unassigned)'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Priority Status</span>
                    <span class="priority-tag priority-${safePriority}">${safePriority}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Current State</span>
                    <span class="priority-tag" style="background:rgba(255,255,255,0.05); color:var(--text); border:1px solid var(--glass-border)">
                        ${task.trashed ? 'In Trash bin' : task.archived ? 'Archived Context' : task.completed ? 'Completed' : 'Active / Pending'}
                    </span>
                </div>
            </div>

            <div class="form-group">
                <label>Additional Description</label>
                <div class="inspector-desc">${task.desc ? escapeHTML(task.desc) : '<i>No descriptive specification added yet.</i>'}</div>
            </div>

            <div class="inspector-actions-footer">
                <button id="inspectorEditBtn" class="btn btn-secondary">Edit Task Details</button>
                <button id="inspectorCompleteBtn" class="btn btn-primary">${task.completed ? 'Mark as Incomplete' : 'Mark as Completed'}</button>
                <button id="inspectorDeleteBtn" class="btn btn-danger">${task.trashed ? 'Permanently Delete Task' : 'Move to Trash Bin'}</button>
            </div>
        `;
    }

    function commitTaskMutation(task, updates, actionLabel) {
        const historicalStateClone = JSON.stringify(task);

        Object.assign(task, updates);
        saveStateToStorage();
        renderTasks();
        if (state.selectedTaskId === task.id) renderInspector();

        pushUndoStack(actionLabel, () => {
            const currentTaskInstance = state.tasks.find(t => t.id === task.id);
            if (currentTaskInstance) {
                Object.assign(currentTaskInstance, JSON.parse(historicalStateClone));
                saveStateToStorage();
                renderTasks();
                if (state.selectedTaskId === currentTaskInstance.id) renderInspector();
            }
        });
    }

    function toggleTaskStar(task, event) {
        if (event) event.stopPropagation();
        commitTaskMutation(task, { starred: !task.starred }, `Task ${!task.starred ? 'Starred' : 'Unstarred'}`);
    }

    function toggleTaskCompletion(task, event) {
        if (event) event.stopPropagation();
        commitTaskMutation(task, {
            completed: !task.completed,
            archived: false
        }, `Task marked ${!task.completed ? 'Completed' : 'Active'}`);
    }

    function archiveTask(task, event) {
        if (event) event.stopPropagation();

        const nextArchivedState = !task.archived;

        const alertMessage = nextArchivedState
            ? 'Task moved to Archive'
            : 'Task restored from Archive';

        commitTaskMutation(task, {
            archived: nextArchivedState,
            completed: nextArchivedState ? false : task.completed,
            trashed: false
        }, alertMessage);

    }

    function trashOrDeleteTask(task, event) {
        if (event) event.stopPropagation();

        if (task.trashed) {
            if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
                state.tasks = state.tasks.filter(t => t.id !== task.id);
                if (state.selectedTaskId === task.id) state.selectedTaskId = null;
                saveStateToStorage();
                renderTasks();
                renderInspector();
                spawnToast('Task data successfully deleted. This action is irreversible.');
            }
        } else {
            commitTaskMutation(task, {
                trashed: true,
                archived: false,
                completed: false,
                starred: false
            }, 'Task moved into Trash folder');
        }
    }

    function spawnToast(message, provisionUndo = false) {
        if (DOM.toastContainer.children.length > 2) {
            DOM.toastContainer.removeChild(DOM.toastContainer.firstChild);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        const span = document.createElement('span');
        span.textContent = message;
        toast.appendChild(span);
        if (provisionUndo) {
            const undoBtn = document.createElement('button');
            undoBtn.className = 'toast-undo-btn';
            undoBtn.textContent = 'Undo';


            const rollbackCallback = undoStack.pop();

            undoBtn.addEventListener('click', () => {

                if (rollbackCallback) {
                    rollbackCallback();
                }

                toast.classList.add('toast-fade-out');

                setTimeout(() => toast.remove(), 250);
            });

            toast.appendChild(undoBtn);
        }

        DOM.toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 250);
            }
        }, 5000);
    }

    function bindInterfaceInteractions() {

        DOM.sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();

            if (window.innerWidth <= 768) {
                DOM.inspectorPanel.classList.remove('panel-open');
                state.selectedTaskId = null;
                DOM.sidebarPanel.classList.toggle('drawer-active');
            } else {
                window.location.href = 'home.html';
            }
        });

        document.addEventListener('click', (e) => {
            if (DOM.sidebarPanel.classList.contains('drawer-active') &&
                !DOM.sidebarPanel.contains(e.target) &&
                !DOM.sidebarToggle.contains(e.target)) {
                DOM.sidebarPanel.classList.remove('drawer-active');
            }
        });

        let searchDebounce;

        DOM.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);

            searchDebounce = setTimeout(() => {
                state.searchQuery = e.target.value;
                renderTasks();
            }, 120);
        });

        DOM.clearSearchBtn.addEventListener('click', () => {
            DOM.searchInput.value = '';
            state.searchQuery = '';
            renderTasks();
        });

        DOM.sortBySelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderTasks();
        });

        DOM.sortOrderToggle.addEventListener('click', () => {
            state.sortAscending = !state.sortAscending;
            DOM.sortOrderIcon.style.transform = state.sortAscending ? 'rotate(180deg)' : 'rotate(0deg)';
            renderTasks();
        });

        DOM.sidebarNav.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (!item) return;

            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.list-item-row').forEach(i => i.classList.remove('active'));

            item.classList.add('active');
            state.currentView = item.getAttribute('data-view');
            state.currentCustomList = null;

            DOM.currentViewTitle.textContent = item.querySelector('span').textContent;

            DOM.sidebarPanel.classList.remove('drawer-active');

            renderTasks();
        });

        DOM.customListsContainer.addEventListener('click', (e) => {
            const row = e.target.closest('.list-item-row');
            if (!row) return;

            const listName = row.getAttribute('data-list');

            if (e.target.classList.contains('delete-list-trigger')) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
                    state.lists = state.lists.filter(l => l !== listName);
                    state.tasks.forEach(t => { if (t.category === listName) t.category = null; });
                    if (state.currentCustomList === listName) {
                        state.currentView = 'all';
                        DOM.currentViewTitle.textContent = 'All Tasks';
                        document.querySelector('[data-view="all"]').classList.add('active');
                    }
                    saveStateToStorage();
                    renderCustomLists();
                    renderTasks();
                    if (state.selectedTaskId) renderInspector();
                    spawnToast('List filter deleted.');
                }
                return;
            }

            if (e.target.classList.contains('edit-list-trigger')) {
                e.stopPropagation();
                const currentLabel = listName;
                const revisedLabel = prompt('Enter modified name:', currentLabel);
                if (revisedLabel && revisedLabel.trim() !== '' && revisedLabel.trim() !== currentLabel) {
                    const cleanLabel = revisedLabel.trim();
                    if (state.lists.includes(cleanLabel)) {
                        alert('This label already exists.');
                        return;
                    }
                    const targetIndex = state.lists.indexOf(currentLabel);
                    if (targetIndex !== -1) {
                        state.lists[targetIndex] = cleanLabel;
                        state.tasks.forEach(t => { if (t.category === currentLabel) t.category = cleanLabel; });
                        if (state.currentCustomList === currentLabel) state.currentCustomList = cleanLabel;
                        saveStateToStorage();
                        renderCustomLists();
                        renderTasks();
                        if (state.selectedTaskId) renderInspector();
                        spawnToast('List name updated successfully.');
                    }
                }
                return;
            }

            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.list-item-row').forEach(i => i.classList.remove('active'));

            row.classList.add('active');
            state.currentView = 'list';
            state.currentCustomList = listName;
            DOM.currentViewTitle.textContent = listName;

            DOM.sidebarPanel.classList.remove('drawer-active');
            renderTasks();
        });


        DOM.customListsContainer.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;

            const row = e.target.closest('.list-item-row');

            if (row) {
                row.click();
            }
        });

        DOM.addListBtn.addEventListener('click', () => {
            const rawInput = prompt('Enter a name for the new custom list:');
            if (rawInput && rawInput.trim() !== '') {
                const standardized = rawInput.trim();
                if (state.lists.some(l => l.toLowerCase() === standardized.toLowerCase())) {
                    alert('A label with this name already exists. Please choose a different name.');
                    return;
                }
                state.lists.push(standardized);
                saveStateToStorage();
                renderCustomLists();
                spawnToast(`Succesfully created "${standardized}" list label.`);
            }
        });

        DOM.taskList.addEventListener('click', (e) => {
            const card = e.target.closest('.task-card');
            if (!card) return;

            const taskId = card.getAttribute('data-id');
            const targetTaskInstance = state.tasks.find(t => t.id === taskId);
            if (!targetTaskInstance) return;

            if (e.target.classList.contains('task-checkbox') || e.target.closest('.checkbox-container')) {
                toggleTaskCompletion(targetTaskInstance);
                return;
            }
            if (e.target.closest('.star-toggle')) {
                toggleTaskStar(targetTaskInstance, e);
                return;
            }
            if (e.target.closest('.archive-toggle')) {
                archiveTask(targetTaskInstance, e);
                return;
            }
            if (e.target.closest('.delete-trigger')) {
                trashOrDeleteTask(targetTaskInstance, e);
                return;
            }

            e.stopPropagation();

            document.querySelectorAll('.task-card').forEach(c => c.classList.remove('active-inspection'));
            card.classList.add('active-inspection');
            state.selectedTaskId = taskId;
            renderInspector();

            DOM.sidebarPanel.classList.remove('drawer-active');
        });

        DOM.closeInspectorBtn.addEventListener('click', () => {
            state.selectedTaskId = null;
            renderInspector();
        });

        DOM.inspectorContent.addEventListener('click', (e) => {
            if (!state.selectedTaskId) return;
            const activeTask = state.tasks.find(t => t.id === state.selectedTaskId);
            if (!activeTask) return;

            if (e.target.id === 'inspectorCompleteBtn') {
                toggleTaskCompletion(activeTask);
            } else if (e.target.id === 'inspectorDeleteBtn') {
                trashOrDeleteTask(activeTask);
            } else if (e.target.id === 'inspectorEditBtn') {
                openTaskModal(activeTask);
            }
        });

        DOM.openCreateModalBtn.addEventListener('click', () => openTaskModal());
        DOM.closeModalBtn.addEventListener('click', closeTaskModal);
        DOM.cancelModalBtn.addEventListener('click', closeTaskModal);


        DOM.taskModal.addEventListener('click', (e) => {
            if (e.target === DOM.taskModal) {
                closeTaskModal();
            }
        });
        DOM.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            commitFormSubmissionData();
        });
    }

    function openTaskModal(editingTaskInstance = null) {
        DOM.taskForm.reset();
        DOM.formTaskId.value = '';

        renderCustomLists();

        if (editingTaskInstance) {
            DOM.modalTitle.textContent = 'Edit Task Details';
            DOM.formTaskId.value = editingTaskInstance.id;
            DOM.taskTitleInput.value = editingTaskInstance.title;
            DOM.taskDescInput.value = editingTaskInstance.desc || '';
            DOM.taskCategorySelect.value = editingTaskInstance.category || '';
            DOM.taskPrioritySelect.value = editingTaskInstance.priority;
        } else {
            DOM.modalTitle.textContent = 'Create New Task';
            if (state.currentView === 'list' && state.currentCustomList) {
                DOM.taskCategorySelect.value = state.currentCustomList;
            }
        }

        DOM.taskModal.classList.add('modal-active');
        DOM.taskTitleInput.focus();
    }

    function closeTaskModal() {
        DOM.taskModal.classList.remove('modal-active');
        DOM.formTaskId.value = '';
        DOM.taskForm.reset();
    }

    function commitFormSubmissionData() {
        const targetId = DOM.formTaskId.value;
        const parsedTitle = DOM.taskTitleInput.value.trim();
        const parsedDesc = DOM.taskDescInput.value.trim();
        const parsedCategory = DOM.taskCategorySelect.value;
        const parsedPriority = DOM.taskPrioritySelect.value;

        if (parsedTitle === '') {
            alert('The title field is mandatory for task creation. Please provide a concise title for the task.');
            return;
        }

        if (targetId && targetId !== '') {
            const currentTask = state.tasks.find(t => t.id === targetId);
            if (currentTask) {
                commitTaskMutation(currentTask, {
                    title: parsedTitle,
                    desc: parsedDesc,
                    category: parsedCategory !== '' ? parsedCategory : null,
                    priority: parsedPriority
                }, 'Task details updated');
            }
        } else {
            const freshTask = {
                id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                title: parsedTitle,
                desc: parsedDesc,
                category: parsedCategory !== '' ? parsedCategory : null,
                priority: parsedPriority,
                starred: false,
                completed: false,
                archived: false,
                trashed: false,
                created: Date.now()
            };

            state.tasks.push(freshTask);
            saveStateToStorage();
            renderTasks();
            spawnToast('New task has been created successfully.');
        }

        closeTaskModal();
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
                default: return m;
            }
        });
    }

    function initializeDashboardEngine() {
        loadStateFromStorage();
        renderCustomLists();
        renderTasks();
        renderInspector();
        bindInterfaceInteractions();

        const targetView = state.currentView || 'inbox';

        if (state.currentView === 'list' && state.currentCustomList) {
            const activeCustomRow = document.querySelector(`.list-item-row[data-list="${state.currentCustomList}"]`);
            if (activeCustomRow) {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.list-item-row').forEach(i => i.classList.remove('active'));
                activeCustomRow.classList.add('active');
                DOM.currentViewTitle.textContent = state.currentCustomList;
            }
        } else {
            const initialActiveNavItem = document.querySelector(`[data-view="${targetView}"]`);
            if (initialActiveNavItem) {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.list-item-row').forEach(i => i.classList.remove('active'));
                initialActiveNavItem.classList.add('active');
                DOM.currentViewTitle.textContent = initialActiveNavItem.querySelector('span').textContent;
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboardEngine);
    } else {
        initializeDashboardEngine();
    }

})();