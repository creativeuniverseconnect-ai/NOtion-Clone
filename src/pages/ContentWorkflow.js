// ============================================================
// CREATIVE UNIVERSE — Content Workflow (Kanban Board)
// ============================================================

import { getAll, create, update, remove, getStatusStyle, COLLECTIONS } from '../data/store.js';
import { showToast } from '../components/Toast.js';

// ─── CONSTANTS ────────────────────────────────────────────────
const COLUMNS = [
  { id: 'not-started',     label: 'Not Started',      color: '#6B7280' },
  { id: 'under-editing',   label: 'Under Editing',    color: '#3B82F6' },
  { id: 'cu-approval',     label: 'CU Approval',      color: '#F59E0B' },
  { id: 're-edit',         label: 'Re-Edit',           color: '#EF4444' },
  { id: 'buffer',          label: 'Buffer',            color: '#8B5CF6' },
  { id: 'client-approval', label: 'Client Approval',  color: '#06B6D4' },
  { id: 'ready-to-upload', label: 'Ready to Upload',  color: '#10B981' },
  { id: 'uploaded',        label: 'Uploaded',          color: '#14B8A6' },
];

const CONTENT_TYPE_TABS = [
  { id: 'all',         label: 'All Content' },
  { id: 'reel',        label: 'Reels' },
  { id: 'static-post', label: 'Static Posts' },
  { id: 'carousel',    label: 'Carousels' },
  { id: 'story',       label: 'Stories' },
  { id: 'other',       label: 'Other' },
];

const PRIORITY_COLORS = {
  Urgent: '#EF4444',
  High:   '#F97316',
  Normal: '#3B82F6',
  Low:    '#6B7280',
};

const CONTENT_TYPE_ICONS = {
  reel:          '🎬',
  'static-post': '🖼️',
  carousel:      '📱',
  story:         '⭕',
  'festival-post': '🎉',
  'testimonial-reel': '⭐',
  'ad-creative': '📢',
  'youtube-short': '▶️',
  'youtube-video': '📹',
  'google-business': '🏢',
  'podcast-clip': '🎙️',
  blog:          '📝',
  photography:   '📷',
  'website-update': '🌐',
  seo:           '🔍',
  'meta-ads':    '📊',
  'google-ads':  '📈',
  'monthly-report': '📋',
  influencer:    '🤝',
  other:         '📌',
};

// ─── STATE ────────────────────────────────────────────────────
let state = {
  activeTab: 'all',
  filterClient: 'all',
  filterEmployee: 'all',
  filterPriority: 'all',
  bulkMode: false,
  selectedTaskIds: new Set(),
  draggedTaskId: null,
  currentMonth: null,
};

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderContentWorkflow(container, currentMonth) {
  state.currentMonth = currentMonth;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Content Workflow</h1>
        <p class="page-subtitle">Drag and drop tasks across workflow stages</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="btn-bulk-select">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>
          Bulk Select
        </button>
        <button class="btn btn-primary btn-sm" id="btn-add-task">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
    </div>

    <div class="tabs" id="content-type-tabs">
      ${CONTENT_TYPE_TABS.map(t => `
        <div class="tab ${t.id === state.activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</div>
      `).join('')}
    </div>

    <div class="filters-row" id="kanban-filters">
      <select class="input input-sm" id="filter-client" style="min-width:160px;">
        <option value="all">All Clients</option>
        ${getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active').map(c =>
          `<option value="${c.id}">${c.name}</option>`
        ).join('')}
      </select>
      <select class="input input-sm" id="filter-employee" style="min-width:160px;">
        <option value="all">All Employees</option>
        ${getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active').map(e =>
          `<option value="${e.id}">${e.name}</option>`
        ).join('')}
      </select>
      <select class="input input-sm" id="filter-priority" style="min-width:140px;">
        <option value="all">All Priorities</option>
        <option value="Urgent">Urgent</option>
        <option value="High">High</option>
        <option value="Normal">Normal</option>
        <option value="Low">Low</option>
      </select>
    </div>

    <div class="kanban-board" id="kanban-board"></div>
    <div id="bulk-action-bar" style="display:none;"></div>
  `;

  attachHeaderEvents(container);
  renderBoard(container);
}

// ─── BOARD RENDERER ───────────────────────────────────────────
function renderBoard(container) {
  const board = container.querySelector('#kanban-board');
  if (!board) return;

  const tasks = getFilteredTasks();
  const tasksByStatus = {};
  COLUMNS.forEach(col => { tasksByStatus[col.id] = []; });
  tasks.forEach(task => {
    if (tasksByStatus[task.status] !== undefined) {
      tasksByStatus[task.status].push(task);
    }
  });

  board.innerHTML = COLUMNS.map(col => {
    const colTasks = tasksByStatus[col.id] || [];
    return `
      <div class="kanban-column" data-status="${col.id}">
        <div class="kanban-col-header">
          <div class="kanban-col-title">
            <span class="kanban-col-dot" style="background:${col.color};"></span>
            <span>${col.label}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="kanban-col-count">${colTasks.length}</span>
            <button class="btn btn-ghost btn-add-kanban-task" data-status="${col.id}" style="padding:0;width:24px;height:24px;min-height:unset;display:flex;align-items:center;justify-content:center;font-size:12px;" title="Add Task in ${col.label}">➕</button>
          </div>
        </div>
        <div class="kanban-col-body" data-status="${col.id}">
          ${colTasks.length === 0 ? `
            <div style="padding:20px 10px;text-align:center;color:var(--text-muted);font-size:12px;opacity:0.6;">
              Drop tasks here
            </div>` : colTasks.map(task => renderTaskCard(task)).join('')}
        </div>
      </div>
    `;
  }).join('');

  attachDragEvents(board);
  attachCardEvents(board, container);
  renderBulkBar(container);
}

// ─── TASK CARD ────────────────────────────────────────────────
function renderTaskCard(task) {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6B7280';
  const deadlineInfo = getDeadlineInfo(task.deadline);
  const icon = CONTENT_TYPE_ICONS[task.contentType] || '📌';
  const ownerInitials = task.primaryOwnerName
    ? task.primaryOwnerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const isSelected = state.selectedTaskIds.has(task.id);

  return `
    <div class="task-card ${isSelected ? 'selected' : ''}"
      draggable="true"
      data-task-id="${task.id}"
      style="${isSelected ? 'border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-light);' : ''}">
      <div class="task-card-priority" style="background:${priorityColor};"></div>

      ${state.bulkMode ? `
        <div style="position:absolute;top:8px;right:8px;z-index:2;">
          <input type="checkbox" class="bulk-checkbox" data-task-id="${task.id}"
            ${isSelected ? 'checked' : ''}
            style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);">
        </div>` : ''}

      <div class="task-card-header" style="justify-content:space-between;">
        <span class="task-card-id">${task.contentId || task.id}</span>
        <span class="badge" style="background:${PRIORITY_COLORS[task.priority]}22;color:${PRIORITY_COLORS[task.priority]};font-size:10px;padding:2px 6px;">${task.priority}</span>
      </div>

      <div class="task-card-title">${task.title}</div>
      <div class="task-card-client">${task.clientName}</div>

      <div class="task-card-meta">
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="avatar avatar-sm" style="background:var(--accent);font-size:10px;" title="${task.primaryOwnerName || 'Unassigned'}">
            ${ownerInitials}
          </div>
          <span style="font-size:11px;color:var(--text-muted);">${task.primaryOwnerName ? task.primaryOwnerName.split(' ')[0] : 'Unassigned'}</span>
        </div>
        <div class="task-card-deadline ${deadlineInfo.cls}">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${deadlineInfo.label}
        </div>
      </div>

      <div class="task-card-footer">
        <div class="task-card-type">
          <span>${icon}</span>
          <span>${task.contentTypeName || task.contentType}</span>
          ${task.revisionCount > 0 ? `<span style="color:var(--color-orange);margin-left:4px;">↩ ${task.revisionCount}</span>` : ''}
        </div>
        <div class="task-card-actions">
          <button class="task-card-action-btn" data-action="open" data-task-id="${task.id}" title="Open">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="task-card-action-btn" data-action="edit" data-task-id="${task.id}" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="task-card-action-btn" data-action="delete" data-task-id="${task.id}" title="Delete" style="color:var(--color-red);">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── DEADLINE HELPER ──────────────────────────────────────────
function getDeadlineInfo(deadline) {
  if (!deadline) return { label: 'No deadline', cls: '' };
  const now = new Date();
  const d = new Date(deadline);
  const diff = Math.ceil((d - now) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'overdue' };
  if (diff === 0) return { label: 'Due today', cls: 'soon' };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'soon' };
  return { label: `Due ${deadline}`, cls: '' };
}

// ─── FILTERING ────────────────────────────────────────────────
function getFilteredTasks() {
  let tasks = getAll(COLLECTIONS.TASKS);
  if (state.currentMonth) {
    tasks = tasks.filter(t => !t.month || t.month === state.currentMonth);
  }
  if (state.activeTab !== 'all') {
    if (state.activeTab === 'other') {
      const knownTypes = ['reel', 'static-post', 'carousel', 'story'];
      tasks = tasks.filter(t => !knownTypes.includes(t.contentType));
    } else {
      tasks = tasks.filter(t => t.contentType === state.activeTab);
    }
  }
  if (state.filterClient !== 'all') {
    tasks = tasks.filter(t => t.clientId === state.filterClient);
  }
  if (state.filterEmployee !== 'all') {
    tasks = tasks.filter(t =>
      t.primaryOwner === state.filterEmployee ||
      (t.supportMembers || []).includes(state.filterEmployee)
    );
  }
  if (state.filterPriority !== 'all') {
    tasks = tasks.filter(t => t.priority === state.filterPriority);
  }
  return tasks;
}

// ─── DRAG AND DROP ────────────────────────────────────────────
function attachDragEvents(board) {
  board.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      state.draggedTaskId = card.dataset.taskId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      board.querySelectorAll('.kanban-col-body').forEach(col => col.classList.remove('drag-over'));
    });
  });

  board.querySelectorAll('.kanban-col-body').forEach(colBody => {
    colBody.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      colBody.classList.add('drag-over');
    });
    colBody.addEventListener('dragleave', e => {
      if (!colBody.contains(e.relatedTarget)) {
        colBody.classList.remove('drag-over');
      }
    });
    colBody.addEventListener('drop', e => {
      e.preventDefault();
      colBody.classList.remove('drag-over');
      if (!state.draggedTaskId) return;

      const newStatus = colBody.dataset.status;
      const task = getAll(COLLECTIONS.TASKS).find(t => t.id === state.draggedTaskId);
      if (!task || task.status === newStatus) return;

      // Check if dropping into re-edit or client-approval requires feedback
      if (newStatus === 're-edit' || newStatus === 'client-approval') {
        showFeedbackDialog(state.draggedTaskId, newStatus, () => {
          update(COLLECTIONS.TASKS, state.draggedTaskId, { status: newStatus });
          showToast(`Task moved to "${getStatusStyle(newStatus).label}"`, 'success');
          renderBoard(board.closest('.app-content') || board.parentElement);
        });
      } else {
        update(COLLECTIONS.TASKS, state.draggedTaskId, { status: newStatus });
        showToast(`Task moved to "${getStatusStyle(newStatus).label}"`, 'success');
        renderBoard(board.closest('.app-content') || board.parentElement);
      }
      state.draggedTaskId = null;
    });
  });
}

// ─── CARD EVENTS ──────────────────────────────────────────────
function attachCardEvents(board, container) {
  board.addEventListener('click', e => {
    // Bulk checkbox
    const checkbox = e.target.closest('.bulk-checkbox');
    if (checkbox) {
      const taskId = checkbox.dataset.taskId;
      if (checkbox.checked) state.selectedTaskIds.add(taskId);
      else state.selectedTaskIds.delete(taskId);
      renderBulkBar(container);
      // Update card style
      const card = board.querySelector(`.task-card[data-task-id="${taskId}"]`);
      if (card) {
        if (checkbox.checked) {
          card.style.borderColor = 'var(--accent)';
          card.style.boxShadow = '0 0 0 2px var(--accent-light)';
        } else {
          card.style.borderColor = '';
          card.style.boxShadow = '';
        }
      }
      return;
    }

    // Action buttons
    const btn = e.target.closest('.task-card-action-btn');
    if (btn) {
      e.stopPropagation();
      const action = btn.dataset.action;
      const taskId = btn.dataset.taskId;
      if (action === 'open' || action === 'edit') {
        const task = getAll(COLLECTIONS.TASKS).find(t => t.id === taskId);
        if (task) openEditModal(task, container);
      } else if (action === 'delete') {
        if (confirm('Delete this task?')) {
          remove(COLLECTIONS.TASKS, taskId);
          showToast('Task deleted', 'success');
          renderBoard(container);
        }
      }
      return;
    }

    // Click card body to open
    const card = e.target.closest('.task-card');
    if (card && !state.bulkMode) {
      const taskId = card.dataset.taskId;
      const task = getAll(COLLECTIONS.TASKS).find(t => t.id === taskId);
      if (task) openEditModal(task, container);
    }
  });
}

// ─── HEADER EVENTS ────────────────────────────────────────────
function attachHeaderEvents(container) {
  // Tabs
  container.querySelector('#content-type-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    state.activeTab = tab.dataset.tab;
    container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.activeTab));
    renderBoard(container);
  });

  // Filters
  container.querySelector('#filter-client').addEventListener('change', e => {
    state.filterClient = e.target.value;
    renderBoard(container);
  });
  container.querySelector('#filter-employee').addEventListener('change', e => {
    state.filterEmployee = e.target.value;
    renderBoard(container);
  });
  container.querySelector('#filter-priority').addEventListener('change', e => {
    state.filterPriority = e.target.value;
    renderBoard(container);
  });

  // Add task
  container.querySelector('#btn-add-task').addEventListener('click', () => {
    openAddModal(container, 'not-started');
  });

  // Handle + buttons on column headers
  board.querySelectorAll('.btn-add-kanban-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddModal(container, btn.dataset.status);
    });
  });

  // Bulk select toggle
  container.querySelector('#btn-bulk-select').addEventListener('click', () => {
    state.bulkMode = !state.bulkMode;
    if (!state.bulkMode) state.selectedTaskIds.clear();
    const btn = container.querySelector('#btn-bulk-select');
    btn.classList.toggle('btn-primary', state.bulkMode);
    btn.classList.toggle('btn-secondary', !state.bulkMode);
    renderBoard(container);
  });
}

// ─── BULK ACTION BAR ─────────────────────────────────────────
function renderBulkBar(container) {
  const bar = container.querySelector('#bulk-action-bar');
  if (!bar) return;
  if (!state.bulkMode || state.selectedTaskIds.size === 0) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }

  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  bar.style.display = 'flex';
  bar.innerHTML = `
    <div style="
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:var(--bg-elevated);border:1px solid var(--border-strong);
      border-radius:var(--radius-lg);padding:12px 20px;
      display:flex;align-items:center;gap:12px;
      box-shadow:var(--shadow-lg);z-index:400;
      min-width:580px;flex-wrap:wrap;
    ">
      <span style="font-size:13px;font-weight:600;color:var(--text-primary);">
        ${state.selectedTaskIds.size} selected
      </span>
      <div style="width:1px;height:20px;background:var(--border);"></div>

      <select id="bulk-assign" class="input input-sm" style="min-width:160px;">
        <option value="">Assign Employee…</option>
        ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
      </select>

      <select id="bulk-status" class="input input-sm" style="min-width:160px;">
        <option value="">Change Status…</option>
        ${COLUMNS.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
      </select>

      <select id="bulk-priority" class="input input-sm" style="min-width:140px;">
        <option value="">Change Priority…</option>
        <option value="Urgent">Urgent</option>
        <option value="High">High</option>
        <option value="Normal">Normal</option>
        <option value="Low">Low</option>
      </select>

      <button class="btn btn-danger btn-sm" id="bulk-archive">Archive</button>
      <button class="btn btn-ghost btn-sm" id="bulk-cancel">Cancel</button>
    </div>
  `;

  bar.querySelector('#bulk-assign').addEventListener('change', e => {
    const empId = e.target.value;
    if (!empId) return;
    const emp = getAll(COLLECTIONS.EMPLOYEES).find(em => em.id === empId);
    state.selectedTaskIds.forEach(id => {
      update(COLLECTIONS.TASKS, id, { primaryOwner: empId, primaryOwnerName: emp?.name || '' });
    });
    showToast(`Assigned ${emp?.name} to ${state.selectedTaskIds.size} tasks`, 'success');
    finishBulk(container);
  });

  bar.querySelector('#bulk-status').addEventListener('change', e => {
    const status = e.target.value;
    if (!status) return;
    state.selectedTaskIds.forEach(id => update(COLLECTIONS.TASKS, id, { status }));
    showToast(`Updated status for ${state.selectedTaskIds.size} tasks`, 'success');
    finishBulk(container);
  });

  bar.querySelector('#bulk-priority').addEventListener('change', e => {
    const priority = e.target.value;
    if (!priority) return;
    state.selectedTaskIds.forEach(id => update(COLLECTIONS.TASKS, id, { priority }));
    showToast(`Updated priority for ${state.selectedTaskIds.size} tasks`, 'success');
    finishBulk(container);
  });

  bar.querySelector('#bulk-archive').addEventListener('click', () => {
    if (!confirm(`Archive ${state.selectedTaskIds.size} tasks?`)) return;
    state.selectedTaskIds.forEach(id => remove(COLLECTIONS.TASKS, id));
    showToast(`${state.selectedTaskIds.size} tasks archived`, 'success');
    finishBulk(container);
  });

  bar.querySelector('#bulk-cancel').addEventListener('click', () => {
    finishBulk(container);
  });
}

function finishBulk(container) {
  state.bulkMode = false;
  state.selectedTaskIds.clear();
  const btn = container.querySelector('#btn-bulk-select');
  if (btn) {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  }
  renderBoard(container);
}

// ─── ADD TASK MODAL ───────────────────────────────────────────
function openAddModal(container, defaultStatus = 'not-started') {
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  // Fall back to DEFAULT_CONTENT_TYPES if store hasn't populated content_types yet
  let contentTypes = getAll(COLLECTIONS.CONTENT_TYPES);
  if (!contentTypes || contentTypes.length === 0) {
    contentTypes = [
      { id: 'reel', name: 'Reel', icon: '🎬' },
      { id: 'static-post', name: 'Static Post', icon: '🖼️' },
      { id: 'carousel', name: 'Carousel', icon: '📱' },
      { id: 'story', name: 'Story', icon: '⭕' },
      { id: 'festival-post', name: 'Festival Post', icon: '🎉' },
      { id: 'testimonial-reel', name: 'Testimonial Reel', icon: '⭐' },
      { id: 'ad-creative', name: 'Ad Creative', icon: '📢' },
      { id: 'youtube-short', name: 'YouTube Short', icon: '▶️' },
      { id: 'youtube-video', name: 'YouTube Video', icon: '📹' },
      { id: 'blog', name: 'Blog', icon: '📝' },
      { id: 'other', name: 'Other', icon: '📌' },
    ];
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2 class="modal-title">Add New Task</h2>
        <button class="modal-close" id="close-add-modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="input-group full">
            <label class="input-label">Task Title *</label>
            <input class="input" id="add-title" placeholder="e.g. Dr. Neel — Morning Habits Reel" required>
          </div>
          <div class="input-group">
            <label class="input-label">Client *</label>
            <select class="input" id="add-client">
              <option value="">Select Client…</option>
              ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Content Type</label>
            <select class="input" id="add-content-type">
              ${contentTypes.map(ct => `<option value="${ct.id}">${ct.icon} ${ct.name}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Assigned Employee</label>
            <select class="input" id="add-owner">
              <option value="">Unassigned</option>
              ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Priority</label>
            <select class="input" id="add-priority">
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Deadline</label>
            <input type="date" class="input" id="add-deadline">
          </div>
          <div class="input-group">
            <label class="input-label">Script Link</label>
            <input class="input" id="add-script-link" placeholder="https://…">
          </div>
          <div class="input-group">
            <label class="input-label">Raw Data Link</label>
            <input class="input" id="add-raw-link" placeholder="https://…">
          </div>
          <div class="input-group full">
            <label class="input-label">Notes</label>
            <textarea class="input" id="add-notes" rows="2" placeholder="Any special instructions…"></textarea>
          </div>
          <div class="input-group full">
            <label class="input-label">Tags (comma separated)</label>
            <input class="input" id="add-tags" placeholder="e.g. festival, urgent, evergreen">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="cancel-add-modal">Cancel</button>
        <button class="btn btn-primary" id="save-add-task">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Save Task
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  overlay.querySelector('#close-add-modal').addEventListener('click', closeModal);
  overlay.querySelector('#cancel-add-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  overlay.querySelector('#save-add-task').addEventListener('click', () => {
    const title = overlay.querySelector('#add-title').value.trim();
    const clientId = overlay.querySelector('#add-client').value;
    if (!title || !clientId) {
      showToast('Title and Client are required', 'error');
      return;
    }
    const client = clients.find(c => c.id === clientId);
    const ctId = overlay.querySelector('#add-content-type').value;
    const ct = contentTypes.find(t => t.id === ctId);
    const ownerId = overlay.querySelector('#add-owner').value;
    const owner = employees.find(e => e.id === ownerId);
    const tasks = getAll(COLLECTIONS.TASKS);
    const nextNum = String(tasks.length + 1).padStart(4, '0');

    const newTask = {
      id: 'task-' + nextNum,
      contentId: 'CU-' + String(Date.now()).slice(-6),
      title,
      clientId,
      clientName: client.name,
      contentType: ctId,
      contentTypeName: ct ? ct.name : ctId,
      priority: overlay.querySelector('#add-priority').value,
      primaryOwner: ownerId,
      primaryOwnerName: owner ? owner.name : '',
      status: defaultStatus,
      supportMembers: [],
      reviewer: null,
      reviewerName: null,
      approver: null,
      approverName: null,
      deadline: overlay.querySelector('#add-deadline').value || null,
      scriptLink: overlay.querySelector('#add-script-link').value.trim() || null,
      rawDataLink: overlay.querySelector('#add-raw-link').value.trim() || null,
      editedFileLink: null,
      notes: overlay.querySelector('#add-notes').value.trim(),
      tags: overlay.querySelector('#add-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      revisionCount: 0,
      daysOverdue: 0,
      month: state.currentMonth,
    };

    create(COLLECTIONS.TASKS, newTask);
    showToast('Task created successfully', 'success');
    closeModal();
    renderBoard(container);
  });
}

// ─── EDIT/VIEW TASK MODAL ────────────────────────────────────
function openEditModal(task, container) {
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  let contentTypes = getAll(COLLECTIONS.CONTENT_TYPES);
  if (!contentTypes || contentTypes.length === 0) {
    contentTypes = [
      { id: 'reel', name: 'Reel', icon: '🎬' },
      { id: 'static-post', name: 'Static Post', icon: '🖼️' },
      { id: 'carousel', name: 'Carousel', icon: '📱' },
      { id: 'story', name: 'Story', icon: '⭕' },
      { id: 'festival-post', name: 'Festival Post', icon: '🎉' },
      { id: 'testimonial-reel', name: 'Testimonial Reel', icon: '⭐' },
      { id: 'ad-creative', name: 'Ad Creative', icon: '📢' },
      { id: 'youtube-short', name: 'YouTube Short', icon: '▶️' },
      { id: 'youtube-video', name: 'YouTube Video', icon: '📹' },
      { id: 'blog', name: 'Blog', icon: '📝' },
      { id: 'other', name: 'Other', icon: '📌' },
    ];
  }
  const deadlineInfo = getDeadlineInfo(task.deadline);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-xl">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="cu-id">${task.contentId || task.id}</span>
          <h2 class="modal-title" style="font-size:16px;">${task.title}</h2>
        </div>
        <button class="modal-close" id="close-edit-modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <!-- Left: Fields -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="input-group">
              <label class="input-label">Title</label>
              <input class="input" id="edit-title" value="${escapeHtml(task.title)}">
            </div>
            <div class="input-group">
              <label class="input-label">Client</label>
              <select class="input" id="edit-client">
                ${clients.map(c => `<option value="${c.id}" ${c.id === task.clientId ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Content Type</label>
              <select class="input" id="edit-content-type">
                ${contentTypes.map(ct => `<option value="${ct.id}" ${ct.id === task.contentType ? 'selected' : ''}>${ct.icon} ${ct.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Primary Owner</label>
              <select class="input" id="edit-owner">
                <option value="">Unassigned</option>
                ${employees.map(e => `<option value="${e.id}" ${e.id === task.primaryOwner ? 'selected' : ''}>${e.name} (${e.role})</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Reviewer</label>
              <select class="input" id="edit-reviewer">
                <option value="">None</option>
                ${employees.map(e => `<option value="${e.id}" ${e.id === task.reviewer ? 'selected' : ''}>${e.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Approver</label>
              <select class="input" id="edit-approver">
                <option value="">None</option>
                ${employees.map(e => `<option value="${e.id}" ${e.id === task.approver ? 'selected' : ''}>${e.name}</option>`).join('')}
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="input-group">
                <label class="input-label">Priority</label>
                <select class="input" id="edit-priority">
                  ${['Low','Normal','High','Urgent'].map(p => `<option value="${p}" ${p === task.priority ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Status</label>
                <select class="input" id="edit-status">
                  ${COLUMNS.map(c => `<option value="${c.id}" ${c.id === task.status ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="input-group">
              <label class="input-label">Deadline</label>
              <input type="date" class="input" id="edit-deadline" value="${task.deadline || ''}">
            </div>
          </div>

          <!-- Right: Links, Notes, Activity -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="input-group">
              <label class="input-label">Script Link</label>
              <input class="input" id="edit-script-link" value="${escapeHtml(task.scriptLink || '')}" placeholder="https://…">
            </div>
            <div class="input-group">
              <label class="input-label">Raw Data Link</label>
              <input class="input" id="edit-raw-link" value="${escapeHtml(task.rawDataLink || '')}" placeholder="https://…">
            </div>
            <div class="input-group">
              <label class="input-label">Edited File Link</label>
              <input class="input" id="edit-edited-link" value="${escapeHtml(task.editedFileLink || '')}" placeholder="https://…">
            </div>
            <div class="input-group">
              <label class="input-label">Linked Raw ID</label>
              <input class="input" id="edit-linked-raw" value="${escapeHtml(task.linkedRawId || '')}" placeholder="raw-001">
            </div>
            <div class="input-group">
              <label class="input-label">Caption</label>
              <textarea class="input" id="edit-caption" rows="2" placeholder="Social media caption…">${escapeHtml(task.caption || '')}</textarea>
            </div>
            <div class="input-group">
              <label class="input-label">Notes</label>
              <textarea class="input" id="edit-notes" rows="2">${escapeHtml(task.notes || '')}</textarea>
            </div>
            <div class="input-group">
              <label class="input-label">Tags (comma separated)</label>
              <input class="input" id="edit-tags" value="${(task.tags || []).join(', ')}">
            </div>
            <div class="input-group">
              <label class="input-label">Revision Count</label>
              <input type="number" class="input" id="edit-revision-count" value="${task.revisionCount || 0}" min="0">
            </div>

            <!-- Activity History -->
            <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Activity History</div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;gap:8px;align-items:flex-start;">
                  <div class="avatar avatar-sm" style="background:var(--accent);font-size:9px;flex-shrink:0;">SN</div>
                  <div>
                    <div style="font-size:12px;color:var(--text-primary);">Task created</div>
                    <div style="font-size:11px;color:var(--text-muted);">${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Recently'}</div>
                  </div>
                </div>
                ${task.updatedAt && task.updatedAt !== task.createdAt ? `
                <div style="display:flex;gap:8px;align-items:flex-start;">
                  <div class="avatar avatar-sm" style="background:var(--accent);font-size:9px;flex-shrink:0;">SN</div>
                  <div>
                    <div style="font-size:12px;color:var(--text-primary);">Task updated · Status: <span style="color:${getStatusStyle(task.status).color};">${getStatusStyle(task.status).label}</span></div>
                    <div style="font-size:11px;color:var(--text-muted);">${new Date(task.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>` : ''}
                ${task.revisionCount > 0 ? `
                <div style="display:flex;gap:8px;align-items:flex-start;">
                  <div class="avatar avatar-sm" style="background:var(--color-orange);font-size:9px;flex-shrink:0;">↩</div>
                  <div>
                    <div style="font-size:12px;color:var(--text-primary);">${task.revisionCount} revision(s) requested</div>
                  </div>
                </div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="cancel-edit-modal">Cancel</button>
        <button class="btn btn-primary" id="save-edit-task">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Save Changes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  overlay.querySelector('#close-edit-modal').addEventListener('click', closeModal);
  overlay.querySelector('#cancel-edit-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  overlay.querySelector('#save-edit-task').addEventListener('click', () => {
    const newStatus = overlay.querySelector('#edit-status').value;
    const needsFeedback = (newStatus === 're-edit' || newStatus === 'client-approval') && newStatus !== task.status;

    const doSave = () => {
      const clientId = overlay.querySelector('#edit-client').value;
      const client = clients.find(c => c.id === clientId);
      const ctId = overlay.querySelector('#edit-content-type').value;
      const ct = contentTypes.find(t => t.id === ctId);
      const ownerId = overlay.querySelector('#edit-owner').value;
      const owner = employees.find(e => e.id === ownerId);
      const reviewerId = overlay.querySelector('#edit-reviewer').value;
      const reviewer = employees.find(e => e.id === reviewerId);
      const approverId = overlay.querySelector('#edit-approver').value;
      const approver = employees.find(e => e.id === approverId);

      update(COLLECTIONS.TASKS, task.id, {
        title: overlay.querySelector('#edit-title').value.trim(),
        clientId,
        clientName: client?.name || task.clientName,
        contentType: ctId,
        contentTypeName: ct?.name || ctId,
        primaryOwner: ownerId || null,
        primaryOwnerName: owner?.name || null,
        reviewer: reviewerId || null,
        reviewerName: reviewer?.name || null,
        approver: approverId || null,
        approverName: approver?.name || null,
        priority: overlay.querySelector('#edit-priority').value,
        status: newStatus,
        deadline: overlay.querySelector('#edit-deadline').value || null,
        scriptLink: overlay.querySelector('#edit-script-link').value.trim() || null,
        rawDataLink: overlay.querySelector('#edit-raw-link').value.trim() || null,
        editedFileLink: overlay.querySelector('#edit-edited-link').value.trim() || null,
        linkedRawId: overlay.querySelector('#edit-linked-raw').value.trim() || null,
        caption: overlay.querySelector('#edit-caption').value.trim(),
        notes: overlay.querySelector('#edit-notes').value.trim(),
        tags: overlay.querySelector('#edit-tags').value.split(',').map(t => t.trim()).filter(Boolean),
        revisionCount: parseInt(overlay.querySelector('#edit-revision-count').value) || 0,
      });
      showToast('Task saved', 'success');
      closeModal();
      renderBoard(container);
    };

    if (needsFeedback) {
      showFeedbackDialog(task.id, newStatus, doSave);
    } else {
      doSave();
    }
  });
}

// ─── FEEDBACK DIALOG ──────────────────────────────────────────
function showFeedbackDialog(taskId, newStatus, onConfirm) {
  const statusLabel = getStatusStyle(newStatus).label;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '600';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;">
      <div class="modal-header">
        <h2 class="modal-title">Feedback Note</h2>
        <button class="modal-close" id="close-fb">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
          Moving to <strong style="color:${getStatusStyle(newStatus).color};">${statusLabel}</strong>. Please add a feedback note:
        </p>
        <div class="input-group">
          <label class="input-label">Feedback / Revision Notes</label>
          <textarea class="input" id="fb-note" rows="4" placeholder="e.g. Change hook, fix subtitles, adjust audio…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="cancel-fb">Cancel</button>
        <button class="btn btn-primary" id="confirm-fb">Confirm Move</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#close-fb').addEventListener('click', close);
  overlay.querySelector('#cancel-fb').addEventListener('click', close);
  overlay.querySelector('#confirm-fb').addEventListener('click', () => {
    const note = overlay.querySelector('#fb-note').value.trim();
    if (note) {
      const task = getAll(COLLECTIONS.TASKS).find(t => t.id === taskId);
      if (task) {
        const currentNotes = task.notes || '';
        const updatedNotes = currentNotes
          ? `${currentNotes}\n[${statusLabel}] ${note}`
          : `[${statusLabel}] ${note}`;
        update(COLLECTIONS.TASKS, taskId, {
          notes: updatedNotes,
          revisionCount: (task.revisionCount || 0) + (newStatus === 're-edit' ? 1 : 0),
        });
      }
    }
    close();
    onConfirm();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ─── UTILITY ──────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
