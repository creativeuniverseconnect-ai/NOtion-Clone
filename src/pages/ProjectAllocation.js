// ============================================================
// CREATIVE UNIVERSE — Project Allocation Page
// ============================================================

import { getAll, getEmployeeWorkload, getCapacityStyle, COLLECTIONS } from '../data/store.js';
import { openModal, closeModal } from '../components/Modal.js';

// ─── ACTIVE CHART INSTANCES ───────────────────────────────────
let _activeCharts = [];

export function cleanupProjectAllocationCharts() {
  _activeCharts.forEach(c => { try { c.destroy(); } catch (_) {} });
  _activeCharts = [];
}

// ─── HELPERS ──────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function avatarColors(id = '') {
  const palette = [
    '#7C3AED','#2563EB','#16A34A','#D97706','#DC2626',
    '#0891B2','#DB2777','#9333EA','#EA580C','#0D9488',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

function capacityBadgeHtml(capacity) {
  const style = getCapacityStyle(capacity);
  return `<span class="badge" style="background:${style.bg};color:${style.color};">${capacity}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// ─── WARNING CARDS ────────────────────────────────────────────
function buildWarningCards(clients, tasks, employees) {
  const noSMM = clients.filter(c => !c.assignedSMM);
  const unassignedTasks = tasks.filter(t => !t.primaryOwner && t.status !== 'uploaded');
  const overloadedEmps = employees.filter(e => {
    const wl = getEmployeeWorkload(e.id, null);
    return wl.capacity === 'Overloaded';
  });
  const missingDrive = clients.filter(c => !c.driveLink);

  const cards = [
    {
      icon: '👤',
      count: noSMM.length,
      label: 'Clients Without SMM',
      desc: 'No Social Media Manager assigned',
      color: '#F97316',
      borderColor: 'rgba(249,115,22,0.5)',
      bg: 'rgba(249,115,22,0.08)',
    },
    {
      icon: '❓',
      count: unassignedTasks.length,
      label: 'Tasks Without Owner',
      desc: 'No primary owner assigned',
      color: '#EF4444',
      borderColor: 'rgba(239,68,68,0.5)',
      bg: 'rgba(239,68,68,0.08)',
    },
    {
      icon: '🔥',
      count: overloadedEmps.length,
      label: 'Overloaded Employees',
      desc: 'Capacity exceeds healthy threshold',
      color: '#DC2626',
      borderColor: 'rgba(220,38,38,0.5)',
      bg: 'rgba(220,38,38,0.08)',
    },
    {
      icon: '🔗',
      count: missingDrive.length,
      label: 'Missing Drive Links',
      desc: 'Clients without a Google Drive link',
      color: '#D97706',
      borderColor: 'rgba(217,119,6,0.5)',
      bg: 'rgba(217,119,6,0.08)',
    },
  ];

  return `
    <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;">
      ${cards.map(card => `
        <div style="
          min-width:220px;flex-shrink:0;
          background:${card.bg};
          border:1px solid ${card.borderColor};
          border-radius:var(--radius-lg);
          padding:20px;
          display:flex;flex-direction:column;gap:6px;
        ">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">${card.icon}</span>
            <span style="font-size:30px;font-weight:800;color:${card.color};">${card.count}</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${card.label}</div>
          <div style="font-size:11px;color:var(--text-muted);">${card.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── FILTER ROW ───────────────────────────────────────────────
function buildFilterRow(clients, employees) {
  const depts = [...new Set(employees.map(e => e.departmentName).filter(Boolean))].sort();
  const contentTypes = [...new Set(getAll(COLLECTIONS.TASKS).map(t => t.contentTypeName).filter(Boolean))].sort();

  return `
    <div class="filters-row" id="alloc-filters-row" style="gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <select class="input input-sm" id="alloc-filter-client" style="min-width:160px;">
        <option value="">All Clients</option>
        ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <select class="input input-sm" id="alloc-filter-emp" style="min-width:160px;">
        <option value="">All Employees</option>
        ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
      </select>
      <select class="input input-sm" id="alloc-filter-dept" style="min-width:150px;">
        <option value="">All Departments</option>
        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
      <select class="input input-sm" id="alloc-filter-type" style="min-width:150px;">
        <option value="">All Content Types</option>
        ${contentTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;white-space:nowrap;">
        <input type="checkbox" id="alloc-filter-unassigned" style="accent-color:var(--accent);">
        Unassigned Only
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;white-space:nowrap;">
        <input type="checkbox" id="alloc-filter-overdue" style="accent-color:var(--accent);">
        Overdue Only
      </label>
      <button class="btn btn-ghost btn-sm" id="alloc-filter-reset" style="margin-left:auto;">
        Reset
      </button>
    </div>
  `;
}

// ─── BUILD TABLE ROWS ─────────────────────────────────────────
function buildAllocationRows(clients, tasks, employees, currentMonth, filters) {
  const empMap = {};
  employees.forEach(e => { empMap[e.id] = e; });

  // Group tasks by clientId + contentType
  const groups = {};
  tasks.forEach(task => {
    if (!task.clientId || !task.contentType) return;
    const key = `${task.clientId}::${task.contentType}`;
    if (!groups[key]) {
      groups[key] = {
        clientId: task.clientId,
        clientName: task.clientName,
        contentType: task.contentType,
        contentTypeName: task.contentTypeName || task.contentType,
        primaryOwner: task.primaryOwner,
        primaryOwnerName: task.primaryOwnerName,
        tasks: [],
      };
    }
    groups[key].tasks.push(task);
    // Use the most common primary owner
    if (task.primaryOwner && !groups[key].primaryOwner) {
      groups[key].primaryOwner = task.primaryOwner;
      groups[key].primaryOwnerName = task.primaryOwnerName;
    }
  });

  let rows = Object.values(groups);

  // Apply filters
  if (filters.clientId) rows = rows.filter(r => r.clientId === filters.clientId);
  if (filters.empId) rows = rows.filter(r => r.primaryOwner === filters.empId);
  if (filters.dept) {
    rows = rows.filter(r => {
      const emp = r.primaryOwner ? empMap[r.primaryOwner] : null;
      return emp && emp.departmentName === filters.dept;
    });
  }
  if (filters.contentType) rows = rows.filter(r => r.contentTypeName === filters.contentType);
  if (filters.unassigned) rows = rows.filter(r => !r.primaryOwner);
  if (filters.overdue) {
    rows = rows.filter(r => r.tasks.some(t =>
      t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')
    ));
  }

  if (rows.length === 0) {
    return `
      <tr>
        <td colspan="11">
          <div class="empty-state" style="padding:40px 16px;">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">No allocations found</div>
            <div class="empty-state-sub">Try adjusting your filters.</div>
          </div>
        </td>
      </tr>
    `;
  }

  return rows.map(row => {
    const tasksInRow = row.tasks;
    const assigned = tasksInRow.length;
    const completed = tasksInRow.filter(t => t.status === 'uploaded').length;
    const pending = tasksInRow.filter(t => t.status !== 'uploaded').length;
    const overdueCount = tasksInRow.filter(t =>
      t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')
    ).length;

    // Nearest non-completed deadline
    const upcomingDeadlines = tasksInRow
      .filter(t => t.deadline && t.status !== 'uploaded')
      .map(t => t.deadline)
      .sort();
    const nearestDeadline = upcomingDeadlines[0] || null;
    const deadlineHtml = nearestDeadline
      ? `<span style="color:${isOverdue(nearestDeadline) ? 'var(--color-red)' : 'var(--text-primary)'};font-size:12px;">${fmtDate(nearestDeadline)}${isOverdue(nearestDeadline) ? ' ⚠️' : ''}</span>`
      : `<span class="cell-muted">—</span>`;

    const emp = row.primaryOwner ? empMap[row.primaryOwner] : null;
    const wl = emp ? getEmployeeWorkload(emp.id, currentMonth) : null;
    const empAvatarColor = emp ? avatarColors(emp.id) : '#6B7280';
    const empInitials = emp ? getInitials(emp.name) : '?';

    const empHtml = emp ? `
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="avatar avatar-sm" style="background:${empAvatarColor};width:30px;height:30px;font-size:11px;cursor:pointer;" data-nav="team-directory" data-emp="${emp.id}">
          ${empInitials}
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-accent);cursor:pointer;" data-nav="team-directory" data-emp="${emp.id}">${emp.name}</div>
          <div class="cu-id">${emp.cuId}</div>
        </div>
      </div>
    ` : `<span style="color:var(--color-red);font-size:12px;">⚠ Unassigned</span>`;

    const deptHtml = emp
      ? `<span class="badge badge-purple">${emp.departmentName || emp.department}</span>`
      : `<span class="cell-muted">—</span>`;

    const capacityHtml = wl
      ? capacityBadgeHtml(wl.capacity)
      : `<span class="badge badge-gray">N/A</span>`;

    const clientInitials = getInitials(row.clientName);
    const clientColor = avatarColors(row.clientId);

    return `
      <tr data-row-client="${row.clientId}" data-row-emp="${row.primaryOwner || ''}" data-row-type="${row.contentTypeName}">
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="client-logo client-logo-sm" style="background:linear-gradient(135deg,${clientColor},#2563EB);cursor:pointer;" data-nav="client-profile" data-client="${row.clientId}">
              ${clientInitials}
            </div>
            <span style="font-size:13px;font-weight:600;color:var(--text-accent);cursor:pointer;" data-nav="client-profile" data-client="${row.clientId}">${row.clientName}</span>
          </div>
        </td>
        <td>
          <span class="badge badge-blue">${row.contentTypeName}</span>
        </td>
        <td>${empHtml}</td>
        <td>${deptHtml}</td>
        <td><span style="font-weight:700;">${assigned}</span></td>
        <td><span style="color:var(--color-green);font-weight:700;">${completed}</span></td>
        <td><span style="color:var(--color-yellow);font-weight:700;">${pending}</span></td>
        <td>${overdueCount > 0
          ? `<span style="color:var(--color-red);font-weight:700;">${overdueCount}</span>`
          : `<span style="color:var(--text-muted);">0</span>`}
        </td>
        <td>${deadlineHtml}</td>
        <td>${capacityHtml}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm btn-quick-assign" data-client="${row.clientId}" data-client-name="${row.clientName}" data-type="${row.contentType}" data-type-name="${row.contentTypeName}" data-current-emp="${row.primaryOwner || ''}" title="Quick Assign">
              👤
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── QUICK ASSIGN MODAL ───────────────────────────────────────
function openQuickAssignModal(employees, clients, tasks, currentMonth, clientId = '', contentType = '', currentEmpId = '', clientName = '', contentTypeName = '') {
  const empOptions = employees.map(e => {
    const wl = getEmployeeWorkload(e.id, currentMonth);
    const style = getCapacityStyle(wl.capacity);
    return `<option value="${e.id}" ${e.id === currentEmpId ? 'selected' : ''}>${e.name} (${e.departmentName}) — ${wl.capacity} [${wl.assigned} tasks]</option>`;
  }).join('');

  const clientOptions = clients.map(c =>
    `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  const contentTypes = [...new Set(tasks.map(t => ({type: t.contentType, name: t.contentTypeName})).filter(t => t.type)
    .map(t => JSON.stringify(t)))]
    .map(s => JSON.parse(s));

  const ctOptions = contentTypes.map(ct =>
    `<option value="${ct.type}" ${ct.type === contentType ? 'selected' : ''}>${ct.name}</option>`
  ).join('');

  const body = `
    <div class="form-grid" style="gap:16px;">
      <div class="input-group full">
        <label class="input-label">Client</label>
        <select class="input" id="qa-client">
          <option value="">— Select Client —</option>
          ${clientOptions}
        </select>
      </div>
      <div class="input-group full">
        <label class="input-label">Content Type</label>
        <select class="input" id="qa-content-type">
          <option value="">— Select Content Type —</option>
          ${ctOptions}
        </select>
      </div>
      <div class="input-group full">
        <label class="input-label">Assign Employee</label>
        <select class="input" id="qa-employee">
          <option value="">— Select Employee —</option>
          ${empOptions}
        </select>
      </div>
      <div class="full" id="qa-preview" style="display:none;background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;font-size:13px;color:var(--text-secondary);">
        Preview will appear here.
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-ghost" id="qa-cancel">Cancel</button>
    <button class="btn btn-primary" id="qa-save">✅ Apply Assignment</button>
  `;

  openModal({
    title: '⚡ Quick Assign',
    body,
    size: 'lg',
    footer,
  });

  // Wire up preview
  const updatePreview = () => {
    const selEmp = document.getElementById('qa-employee')?.value;
    const preview = document.getElementById('qa-preview');
    if (!preview) return;
    if (selEmp) {
      const emp = employees.find(e => e.id === selEmp);
      const wl = getEmployeeWorkload(selEmp, currentMonth);
      const style = getCapacityStyle(wl.capacity);
      preview.style.display = 'block';
      preview.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar avatar-md" style="background:${avatarColors(selEmp)};">${getInitials(emp?.name || '')}</div>
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${emp?.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${emp?.role} · ${emp?.departmentName}</div>
          </div>
          <div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="badge" style="background:${style.bg};color:${style.color};">${wl.capacity}</span>
            <span style="font-size:11px;color:var(--text-muted);">${wl.assigned} assigned · ${wl.completed} completed</span>
          </div>
        </div>
      `;
    } else {
      preview.style.display = 'none';
    }
  };

  setTimeout(() => {
    document.getElementById('qa-employee')?.addEventListener('change', updatePreview);
    if (currentEmpId) updatePreview();

    document.getElementById('qa-cancel')?.addEventListener('click', closeModal);
    document.getElementById('qa-save')?.addEventListener('click', () => {
      const selClient = document.getElementById('qa-client')?.value;
      const selType = document.getElementById('qa-content-type')?.value;
      const selEmp = document.getElementById('qa-employee')?.value;

      if (!selClient || !selType || !selEmp) {
        alert('Please select Client, Content Type, and Employee.');
        return;
      }

      const emp = employees.find(e => e.id === selEmp);
      // Update tasks matching the client + contentType that have no primaryOwner
      const { update } = window.__cuStore || {};
      const matchingTasks = tasks.filter(t =>
        t.clientId === selClient && t.contentType === selType && !t.primaryOwner
      );
      if (matchingTasks.length === 0) {
        alert(`No unassigned tasks found for this client + content type.\n\nYou can manually reassign from the Task Board.`);
        closeModal();
        return;
      }

      // We update via store if available, otherwise dispatch event
      window.dispatchEvent(new CustomEvent('cu:quick-assign', {
        detail: { clientId: selClient, contentType: selType, employeeId: selEmp, employeeName: emp?.name }
      }));

      closeModal();
      // Show a toast-like notification
      const msg = document.createElement('div');
      msg.className = 'toast success';
      msg.innerHTML = `✅ Assigned <strong>${emp?.name}</strong> to ${matchingTasks.length} task(s).`;
      msg.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;animation:slideIn .3s ease;';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3500);
    });
  }, 50);
}

// ─── MAIN RENDER FUNCTION ─────────────────────────────────────
export default function renderProjectAllocation(container, currentMonth) {
  cleanupProjectAllocationCharts();

  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const allClients = getAll(COLLECTIONS.CLIENTS);
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active' || e.status === 'Freelancer Available');
  const tasks = getAll(COLLECTIONS.TASKS).filter(t => !currentMonth || t.month === currentMonth);
  const allTasks = getAll(COLLECTIONS.TASKS);

  // ─── Initial filters state ─────────────────────────────────
  let filters = {
    clientId: '',
    empId: '',
    dept: '',
    contentType: '',
    unassigned: false,
    overdue: false,
  };

  // ─── Build HTML ────────────────────────────────────────────
  const warningCards = buildWarningCards(allClients, allTasks, employees);
  const filterRow = buildFilterRow(clients, employees);

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Project Allocation</h1>
        <p class="page-subtitle">Manage content assignments and employee workloads</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btn-quick-assign-header">
          ⚡ Quick Assign
        </button>
      </div>
    </div>

    <!-- Warning Cards -->
    ${warningCards}

    <!-- Filters -->
    ${filterRow}

    <!-- Allocation Table -->
    <div class="table-container">
      <div class="table-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:14px;font-weight:600;color:var(--text-secondary);">📋 Allocation Overview</span>
          <span class="badge badge-blue" id="alloc-row-count"></span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);">
          Showing content-type groups per client
        </div>
      </div>
      <div class="table-wrap">
        <table class="table" id="alloc-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Content Type</th>
              <th>Assigned Employee</th>
              <th>Dept</th>
              <th>Assigned #</th>
              <th>Completed #</th>
              <th>Pending #</th>
              <th>Overdue #</th>
              <th>Next Deadline</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="alloc-tbody">
          </tbody>
        </table>
      </div>
    </div>
  `;

  // ─── Render table rows ─────────────────────────────────────
  const renderTable = () => {
    const tbody = document.getElementById('alloc-tbody');
    const countBadge = document.getElementById('alloc-row-count');
    if (!tbody) return;
    tbody.innerHTML = buildAllocationRows(clients, tasks, employees, currentMonth, filters);

    // Count visible rows (not the empty-state cell)
    const rows = tbody.querySelectorAll('tr[data-row-client]');
    if (countBadge) countBadge.textContent = `${rows.length} group${rows.length !== 1 ? 's' : ''}`;

    // Wire nav clicks
    tbody.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.dataset.nav;
        window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page } }));
      });
    });

    // Wire Quick Assign row buttons
    tbody.querySelectorAll('.btn-quick-assign').forEach(btn => {
      btn.addEventListener('click', () => {
        openQuickAssignModal(
          employees, clients, allTasks, currentMonth,
          btn.dataset.client,
          btn.dataset.type,
          btn.dataset.currentEmp,
          btn.dataset.clientName,
          btn.dataset.typeName,
        );
      });
    });
  };

  renderTable();

  // ─── Filter event listeners ────────────────────────────────
  setTimeout(() => {
    const applyFilters = () => {
      filters.clientId = document.getElementById('alloc-filter-client')?.value || '';
      filters.empId = document.getElementById('alloc-filter-emp')?.value || '';
      filters.dept = document.getElementById('alloc-filter-dept')?.value || '';
      filters.contentType = document.getElementById('alloc-filter-type')?.value || '';
      filters.unassigned = document.getElementById('alloc-filter-unassigned')?.checked || false;
      filters.overdue = document.getElementById('alloc-filter-overdue')?.checked || false;
      renderTable();
    };

    ['alloc-filter-client', 'alloc-filter-emp', 'alloc-filter-dept', 'alloc-filter-type'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    ['alloc-filter-unassigned', 'alloc-filter-overdue'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    document.getElementById('alloc-filter-reset')?.addEventListener('click', () => {
      document.getElementById('alloc-filter-client').value = '';
      document.getElementById('alloc-filter-emp').value = '';
      document.getElementById('alloc-filter-dept').value = '';
      document.getElementById('alloc-filter-type').value = '';
      document.getElementById('alloc-filter-unassigned').checked = false;
      document.getElementById('alloc-filter-overdue').checked = false;
      filters = { clientId:'', empId:'', dept:'', contentType:'', unassigned:false, overdue:false };
      renderTable();
    });

    // Header quick assign button
    document.getElementById('btn-quick-assign-header')?.addEventListener('click', () => {
      openQuickAssignModal(employees, clients, allTasks, currentMonth);
    });
  }, 50);
}
