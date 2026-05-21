# GRID — Modern Task Management Dashboard

GRID is a modern and responsive task management web application built using HTML, CSS, and Vanilla JavaScript.

The application focuses on productivity, minimalism, and clean user experience while providing powerful task organization features such as custom lists, task prioritization, archiving, trash management, search, filtering, and task inspection panels.

---

## Preview

### Landing Page

![Landing Page](assets/home-preview.png)

- Clean hero section
- Modern glassmorphism-inspired UI
- Responsive design
- CTA button to open dashboard

### Dashboard

![Dashboard](assets/dashboard-preview.png)

- Task creation & editing
- Task completion system
- Starred tasks
- Archive & Trash management
- Search & sorting
- Custom list categories
- Inspector panel
- Undo toast notifications
- Fully responsive mobile layout

### Mobile View

![Mobile View](assets/mobile-preview.png)

---

## Features

### Task Management
- Create tasks
- Edit existing tasks
- Delete tasks
- Permanent deletion support
- Archive tasks
- Restore archived tasks
- Mark tasks as completed/incomplete
- Star important tasks

### Custom Lists
- Create personalized lists
- Rename lists
- Delete lists
- Assign tasks to custom categories

### Search & Sorting
- Real-time search
- Search by:
  - Task title
  - Description
  - Category
- Sorting options:
  - Newest
  - Alphabetical
  - Priority

### Productivity Features
- Undo system using toast notifications
- Task inspector/details panel
- Persistent data using Local Storage
- Empty state UI handling

### Responsive Design
- Mobile optimized sidebar drawer
- Responsive task cards
- Adaptive layout
- Touch-friendly controls

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage API
- Google Fonts (Manrope)

---

## Folder Structure

```bash
GRID/
│
├── css/
│   ├── global.css
│   ├── home.css
│   └── dashboard.css
│
├── js/
│   └── dashboard.js
│
├── home.html
├── dashboard.html
└── README.md
```

---

## Pages

### `home.html`
Landing page for the GRID application.

### `dashboard.html`
Main task management dashboard interface.

---

## Core Functionalities

### Local Storage Persistence
All tasks and custom lists are stored in the browser using LocalStorage.

```javascript
localStorage.setItem('GRID_dashboard_tasks', JSON.stringify(state.tasks));
```

---

### Task States

Each task supports:
- Completed
- Starred
- Archived
- Trashed

---

### Undo System

The dashboard includes an undo stack mechanism for task mutations.

```javascript
pushUndoStack(label, rollbackCallback);
```

---

## UI Highlights

- Glassmorphism-inspired interface
- Smooth transitions and animations
- Modern typography
- Soft gradients
- Dynamic inspector panel
- Responsive modal system
- Interactive toast notifications

---

## Responsive Features

GRID is fully responsive and optimized for:
- Desktop
- Tablet
- Mobile devices

Mobile enhancements include:
- Slide-out sidebar
- Full-screen inspector panel
- Touch-friendly action buttons

---

## How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/isha-hanaan/synent-task5-todoapp-isha.git
```

### 2. Navigate to the Project Folder

```bash
cd synent-task5-todoapp-isha
```

### 3. Open the Project

Open `home.html` in your browser.

---

## Future Improvements

Potential upgrades for the application:

- Drag and drop task sorting
- Due dates & reminders
- Dark/light theme switcher
- User authentication
- Cloud sync/database integration
- Calendar view
- Subtasks & labels
- Keyboard shortcuts
- Progressive Web App (PWA) support
- Automatic permanent deletion of trashed tasks after a configurable number of days
- Multi-select task management
- “Select All” functionality for bulk task operations
- Bulk archive/delete/complete actions
- Task deadline notifications
- Task analytics & productivity insights
- Export/import task data
- Offline-first synchronization support

---

## Accessibility Features

- Semantic HTML structure
- ARIA labels
- Keyboard navigation support
- Focus-visible states
- Responsive touch targets

---

## Design Philosophy

GRID was designed to:
- Reduce visual clutter
- Improve focus
- Maintain clean information hierarchy
- Deliver smooth productivity workflows

The UI emphasizes clarity, spacing, readability, and modern interaction design.

---

## Author
Isha Hanaan

Developed as a modern frontend task management project using pure frontend technologies.

---

## License

This project is open-source and available for educational and personal use.
