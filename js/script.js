// ===== Elements =====
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const taskCount = document.getElementById("task-count");
const clearBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// ===== State =====
const STORAGE_KEY = "todo-app-tasks";
let tasks = loadTasks();
let currentFilter = "all"; // "all" | "active" | "done"

// ===== localStorage =====
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== Task actions =====
function addTask(text) {
  const cleanText = text.trim();
  if (cleanText === "") return; // empty task add hobe na

  tasks.push({
    id: Date.now(),
    text: cleanText,
    done: false,
  });

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
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

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  renderTasks();
}

// ===== Render =====
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.done ? " done" : "");
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Mark task as done");

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("aria-label", "Delete task");

  li.append(checkbox, text, deleteBtn);
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

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = "";
  visibleTasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });

  updateEmptyMessage(visibleTasks.length);

  const activeCount = tasks.filter((task) => !task.done).length;
  taskCount.textContent =
    activeCount === 1 ? "1 task left" : activeCount + " tasks left";

  clearBtn.hidden = !tasks.some((task) => task.done);
}

// ===== Events =====
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

// Event delegation: ekta listener diye shob task er checkbox/delete handle
taskList.addEventListener("click", (event) => {
  const item = event.target.closest(".task-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  if (event.target.classList.contains("delete-btn")) {
    deleteTask(id);
  }
});

taskList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("task-checkbox")) return;

  const item = event.target.closest(".task-item");
  toggleTask(Number(item.dataset.id));
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearBtn.addEventListener("click", clearCompleted);

// ===== Start =====
renderTasks();