/* ════════════════════════════════════════════════════════
   FLUX — Task Manager
   Arquitectura: Módulo único con estado centralizado.
   Patrón: State → Render (unidireccional).
════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. Estado de la aplicación ─────────────────────── */
const state = {
  tasks:  [],          // Array de objetos tarea
  filter: 'all',       // 'all' | 'pending' | 'done' | 'high'
  theme:  'light',     // 'light' | 'dark'
};

/* ── 2. Persistencia (localStorage) ─────────────────── */
const Storage = {
  TASKS_KEY: 'flux_tasks',
  THEME_KEY: 'flux_theme',

  loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(this.TASKS_KEY)) || [];
    } catch { return []; }
  },

  saveTasks(tasks) {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
  },

  loadTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  },
};

/* ── 3. Utilidades ───────────────────────────────────── */
const Utils = {
  id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  },

  today() {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  },

  priorityLabel(p) {
    return { high: 'Alta', medium: 'Media', low: 'Baja' }[p] ?? p;
  },

  priorityClass(p) {
    return { high: 'p-high', medium: 'p-medium', low: 'p-low' }[p] ?? '';
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

/* ── 4. Toast de notificación ────────────────────────── */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ── 5. Lógica de tareas ────────────────────────────── */
function createTask(text, priority) {
  return {
    id:        Utils.id(),
    text:      text.trim(),
    priority,
    done:      false,
    createdAt: Date.now(),
  };
}

function addTask(text, priority) {
  if (!text.trim()) return false;
  const task = createTask(text, priority);
  state.tasks.unshift(task);
  Storage.saveTasks(state.tasks);
  return true;
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  Storage.saveTasks(state.tasks);
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  Storage.saveTasks(state.tasks);
}

function clearDone() {
  const count = state.tasks.filter(t => t.done).length;
  if (!count) { showToast('No hay tareas completadas.'); return; }
  state.tasks = state.tasks.filter(t => !t.done);
  Storage.saveTasks(state.tasks);
  showToast(`${count} tarea${count > 1 ? 's' : ''} eliminada${count > 1 ? 's' : ''}.`);
}

/* ── 6. Filtrado ─────────────────────────────────────── */
function getFilteredTasks() {
  const { tasks, filter } = state;
  switch (filter) {
    case 'pending': return tasks.filter(t => !t.done);
    case 'done':    return tasks.filter(t => t.done);
    case 'high':    return tasks.filter(t => t.priority === 'high' && !t.done);
    default:        return tasks;
  }
}

/* ── 7. Render ───────────────────────────────────────── */
function renderStats() {
  const total   = state.tasks.length;
  const done    = state.tasks.filter(t => t.done).length;
  const pending = total - done;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-done').textContent    = done;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
}

function renderTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card${task.done ? ' done' : ''}`;
  card.dataset.id = task.id;

  card.innerHTML = `
    <div class="check-wrap">
      <input type="checkbox" ${task.done ? 'checked' : ''}
             aria-label="Marcar tarea como ${task.done ? 'pendiente' : 'completada'}">
    </div>
    <div class="task-info">
      <p class="task-text">${Utils.escapeHTML(task.text)}</p>
      <div class="task-meta">
        <span class="priority-badge ${Utils.priorityClass(task.priority)}">
          ${Utils.priorityLabel(task.priority)}
        </span>
        <span class="task-date">${Utils.formatDate(task.createdAt)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="del-btn" title="Eliminar tarea" aria-label="Eliminar tarea">✕</button>
    </div>
  `;

  /* Eventos delegados en la card */
  card.querySelector('input[type="checkbox"]').addEventListener('change', () => {
    toggleTask(task.id);
    render();
    showToast(task.done ? '¡Tarea completada! 🎉' : 'Tarea marcada como pendiente.');
  });

  card.querySelector('.del-btn').addEventListener('click', () => {
    card.style.opacity = '0';
    card.style.transform = 'translateX(20px)';
    card.style.transition = 'opacity .2s, transform .2s';
    setTimeout(() => {
      deleteTask(task.id);
      render();
      showToast('Tarea eliminada.');
    }, 200);
  });

  return card;
}

function renderTaskList() {
  const list     = document.getElementById('task-list');
  const filtered = getFilteredTasks();
  list.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const messages = {
      all:     ['📋', 'Sin tareas todavía. ¡Agrega una arriba!'],
      pending: ['✅', 'No hay tareas pendientes. ¡Todo al día!'],
      done:    ['🎯', 'Aún no has completado ninguna tarea.'],
      high:    ['🔴', 'No hay tareas de alta prioridad pendientes.'],
    };
    const [icon, msg] = messages[state.filter] ?? messages.all;
    empty.innerHTML = `<div class="icon">${icon}</div><p>${msg}</p>`;
    list.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  filtered.forEach(task => frag.appendChild(renderTaskCard(task)));
  list.appendChild(frag);
}

function renderFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
}

function renderTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.getElementById('theme-btn').textContent =
    state.theme === 'dark' ? '☀️' : '🌙';
}

function render() {
  renderStats();
  renderTaskList();
  renderFilters();
}

/* ── 8. Manejadores de eventos ───────────────────────── */
function handleAddTask() {
  const input    = document.getElementById('task-input');
  const select   = document.getElementById('priority-select');
  const added    = addTask(input.value, select.value);
  if (added) {
    input.value = '';
    input.focus();
    render();
    showToast('Tarea agregada.');
  } else {
    input.focus();
    input.style.borderColor = 'var(--accent)';
    setTimeout(() => input.style.borderColor = '', 800);
  }
}

function handleFilterChange(e) {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  state.filter = btn.dataset.filter;
  render();
}

function handleThemeToggle() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  Storage.saveTheme(state.theme);
  renderTheme();
}

function handleKeydown(e) {
  if (e.key === 'Enter' && document.activeElement.id === 'task-input') {
    handleAddTask();
  }
}

/* ── 9. Inicialización ───────────────────────────────── */
function init() {
  /* Cargar estado persistido */
  state.tasks = Storage.loadTasks();
  state.theme = Storage.loadTheme();

  /* Fecha en header */
  document.getElementById('date-label').textContent = Utils.today();

  /* Tema */
  renderTheme();

  /* Eventos */
  document.getElementById('add-btn').addEventListener('click', handleAddTask);
  document.getElementById('task-input').addEventListener('keydown', handleKeydown);
  document.getElementById('filter-row').addEventListener('click', handleFilterChange);
  document.getElementById('theme-btn').addEventListener('click', handleThemeToggle);
  document.getElementById('clear-done-btn').addEventListener('click', () => {
    clearDone();
    render();
  });

  /* Render inicial */
  render();
}

document.addEventListener('DOMContentLoaded', init);