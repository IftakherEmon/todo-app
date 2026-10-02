// ===== Elements =====
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const prioritySelect = document.getElementById("priority-select");
const dueInput = document.getElementById("due-input");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const taskCount = document.getElementById("task-count");
const clearBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("theme-toggle");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");

// ===== Constants & State =====
const STORAGE_KEY = "todo-app-tasks";
const THEME_KEY = "todo-app-theme";
const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };

let tasks = loadTasks();
let currentFilter = "all"; // "all" | "active" | "done"
let editingId = null;

// ===== localStorage: tasks =====
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];

    // Purano task (priority/due chhara) thakleo jeno kaj kore
    return saved.map((task) => ({
      id: task.id,
      text: String(task.text),
      done: Boolean(task.done),
      priority: PRIORITIES.includes(task.priority) ? task.priority : "medium",
      due: task.due || "",
    }));
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== Theme (dark / light) =====
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

function getInitialTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (error) {
    saved = null;
  }

  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

// ===== Date helpers =====
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function isOverdue(task) {
  return Boolean(task.due) && !task.done && task.due < todayString();
}

function formatDueText(task) {
  if (task.due === todayString()) return "Due today";

  const [year, month, day] = task.due.split("-").map(Number);
  const nice = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (isOverdue(task) ? "Overdue: " : "Due: ") + nice;
}

// ===== Task actions =====
function addTask(text, priority, due) {
  const cleanText = text.trim();
  if (cleanText === "") return false; // empty task add hobe na

  tasks.push({
    id: Date.now(),
    text: cleanText,
    done: false,
    priority: PRIORITIES.includes(priority) ? priority : "medium",
    due: due || "",
  });

  editingId = null;
  saveTasks();
  renderTasks();
  return true;
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  if (editingId === id) editingId = null;
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.done);
  editingId = null;
  saveTasks();
  renderTasks();
}

// ===== Edit =====
function startEdit(id) {
  editingId = id;
  renderTasks();
}

function cancelEdit() {
  editingId = null;
  renderTasks();
}

function saveEdit(id, newText) {
  const cleanText = newText.trim();
  if (cleanText === "") return; // faka text save hobe na

  tasks = tasks.map((task) =>
    task.id === id ? { ...task, text: cleanText } : task
  );
  editingId = null;
  saveTasks();
  renderTasks();
}

// ===== Filter =====
function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((task) => !task.done);
  if (currentFilter === "done") return tasks.filter((task) => task.done);
  return tasks;
}

function setFilter(filter) {
  currentFilter = filter;
  editingId = null;

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  renderTasks();
}

// ===== Render helpers =====
function createButton(label, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-btn " + extraClass;
  button.textContent = label;
  return button;
}

function createMeta(task) {
  const meta = document.createElement("div");
  meta.className = "task-meta";

  const badge = document.createElement("span");
  badge.className = "badge badge-" + task.priority;
  badge.textContent = PRIORITY_LABELS[task.priority];
  meta.appendChild(badge);

  if (task.due) {
    const due = document.createElement("span");
    due.className = "due-date" + (isOverdue(task) ? " overdue" : "");
    due.textContent = formatDueText(task);
    meta.appendChild(due);
  }

  return meta;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.done ? " done" : "");
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Mark task as done");

  const main = document.createElement("div");
  main.className = "task-main";

  const actions = document.createElement("div");
  actions.className = "task-actions";

  if (task.id === editingId) {
    // Edit mode
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = task.text;
    editInput.maxLength = 100;
    editInput.setAttribute("aria-label", "Edit task text");
    main.appendChild(editInput);

    actions.append(
      createButton("Save", "save-btn"),
      createButton("Cancel", "cancel-btn")
    );
  } else {
    // Normal mode
    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    main.append(text, createMeta(task));

    actions.append(
      createButton("Edit", "edit-btn"),
      createButton("Delete", "delete-btn")
    );
  }

  li.append(checkbox, main, actions);
  return li;
}

function updateEmptyMessage(visibleCount) {
  if (visibleCount > 0) {
    emptyMessage.hidden = true;
    return;
  }

  if (tasks.length === 0) {
    emptyMessage.textContent = "No tasks yet. Add your first task above.";
  } else if (currentFilter === "active") {
    emptyMessage.textContent = "No active tasks. Everything is done.";
  } else {
    emptyMessage.textContent = "No completed tasks yet.";
  }
  emptyMessage.hidden = false;
}

function updateProgress() {
  const total = tasks.length;
  const doneCount = tasks.filter((task) => task.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  progressText.textContent =
    total === 0
      ? "No tasks yet"
      : doneCount + " of " + total + " completed (" + percent + "%)";

  progressFill.style.width = percent + "%";
  progressFill.classList.toggle("complete", total > 0 && percent === 100);
  progressBar.setAttribute("aria-valuenow", percent);
}

// ===== Render =====
function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = "";
  visibleTasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });

  updateEmptyMessage(visibleTasks.length);
  updateProgress();

  const activeCount = tasks.filter((task) => !task.done).length;
  taskCount.textContent =
    activeCount === 1 ? "1 task left" : activeCount + " tasks left";

  clearBtn.hidden = !tasks.some((task) => task.done);

  // Edit mode e input e focus dao
  if (editingId !== null) {
    const editInput = taskList.querySelector(".edit-input");
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
  }
}

// ===== Events =====
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const added = addTask(taskInput.value, prioritySelect.value, dueInput.value);

  if (added) {
    taskInput.value = "";
    dueInput.value = "";
    prioritySelect.value = "medium";
  }
  taskInput.focus();
});

// Event delegation: ekta listener diye shob task button handle
taskList.addEventListener("click", (event) => {
  const item = event.target.closest(".task-item");
  if (!item) return;

  const id = Number(item.dataset.id);
  const target = event.target;

  if (target.classList.contains("delete-btn")) {
    deleteTask(id);
  } else if (target.classList.contains("edit-btn")) {
    startEdit(id);
  } else if (target.classList.contains("save-btn")) {
    saveEdit(id, item.querySelector(".edit-input").value);
  } else if (target.classList.contains("cancel-btn")) {
    cancelEdit();
  }
});

taskList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("task-checkbox")) return;

  const item = event.target.closest(".task-item");
  toggleTask(Number(item.dataset.id));
});

// Edit input e Enter = save, Escape = cancel
taskList.addEventListener("keydown", (event) => {
  if (!event.target.classList.contains("edit-input")) return;

  const item = event.target.closest(".task-item");
  const id = Number(item.dataset.id);

  if (event.key === "Enter") {
    event.preventDefault();
    saveEdit(id, event.target.value);
  } else if (event.key === "Escape") {
    cancelEdit();
  }
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearBtn.addEventListener("click", clearCompleted);
themeToggle.addEventListener("click", toggleTheme);

// ===== Start =====
applyTheme(getInitialTheme());
renderTasks();