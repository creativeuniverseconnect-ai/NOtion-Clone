// ============================================================
// CREATIVE UNIVERSE — Team Directory Page
// ============================================================

import { getAll, create, update, generateEmployeeId, getEmployeeWorkload, COLLECTIONS } from '../data/store.js';
import { showToast } from '../components/Toast.js';
import { DEPARTMENTS, ROLES, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from '../data/schema.js';

// ─── DEPT → COLOR MAP ────────────────────────────────────────
const DEPT_COLORS = {
  ADM: '#7C3AED',
  SMM: '#2563EB',
  VE:  '#DC2626',
  GD:  '#D97706',
  CW:  '#16A34A',
  SC:  '#0891B2',
  CAM: '#9333EA',
  CD:  '#DB2777',
  RV:  '#EA580C',
  FR:  '#6B7280',
  PM:  '#0D9488',
  WD:  '#1D4ED8',
  INT: '#92400E',
};

function getDeptColor(code) {
  return DEPT_COLORS[code] || '#6B7280';
}

function getAvatarGradient(code) {
  const c = getDeptColor(code);
  // Blend with a slightly lighter tone
  const secondMap = {
    ADM: '#DB2777', SMM: '#0891B2', VE: '#EA580C', GD: '#9333EA',
    CW: '#0891B2', SC: '#2563EB', CAM: '#DB2777', CD: '#7C3AED',
    RV: '#D97706', FR: '#9CA3AF', PM: '#7C3AED', WD: '#0891B2', INT: '#D97706',
  };
  return `linear-gradient(135deg,${c},${secondMap[code] || '#6B7280'})`;
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getDeptCode(role) {
  const map = {
    'Admin / Owner': 'ADM',
    'Social Media Manager': 'SMM',
    'Video Editor': 'VE',
    'Graphic Designer': 'GD',
    'Content Writer': 'CW',
    'Shoot Coordinator': 'SC',
    'Cameraperson': 'CAM',
    'Creative Director': 'CD',
    'Reviewer': 'RV',
    'Performance Marketing': 'PM',
    'Web Development': 'WD',
    'Intern': 'INT',
    'Freelancer': 'FR',
  };
  return map[role] || 'ADM';
}

function getDeptName(role) {
  const map = {
    'Admin / Owner': 'Admin / Owner',
    'Social Media Manager': 'Social Media Manager',
    'Video Editor': 'Video Editor',
    'Graphic Designer': 'Graphic Designer',
    'Content Writer': 'Content Writer',
    'Shoot Coordinator': 'Shoot Coordinator',
    'Cameraperson': 'Cameraperson',
    'Creative Director': 'Creative Director',
    'Reviewer': 'Reviewer',
    'Performance Marketing': 'Performance Marketing',
    'Web Development': 'Web Development',
    'Intern': 'Intern',
    'Freelancer': 'Freelancer',
  };
  return map[role] || role;
}

function getStatusBadgeClass(status) {
  const map = {
    'Active': 'badge-green',
    'On Leave': 'badge-orange',
    'Inactive': 'badge-gray',
    'Notice Period': 'badge-yellow',
    'Freelancer Available': 'badge-blue',
    'Freelancer Unavailable': 'badge-gray',
  };
  return map[status] || 'badge-gray';
}

function getCapacityBadgeClass(capacity) {
  const map = {
    'Available': 'badge-green',
    'Balanced': 'badge-blue',
    'High Workload': 'badge-orange',
    'Overloaded': 'badge-red',
  };
  return map[capacity] || 'badge-gray';
}

function getEmploymentTypeBadgeClass(type) {
  const map = {
    'Full-Time': 'badge-purple',
    'Part-Time': 'badge-blue',
    'Intern': 'badge-yellow',
    'Freelancer': 'badge-teal',
    'Contract': 'badge-orange',
  };
  return map[type] || 'badge-gray';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── FILTER LOGIC ─────────────────────────────────────────────
function filterEmployees(employees, { search, department, role, status, employmentType }) {
  let list = employees;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.cuId || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    );
  }
  if (department) list = list.filter(e => e.department === department);
  if (role) list = list.filter(e => e.role === role);
  if (status) list = list.filter(e => e.status === status);
  if (employmentType) list = list.filter(e => e.employmentType === employmentType);

  return list;
}

// ─── EMPLOYEE CARD ────────────────────────────────────────────
function buildEmployeeCard(emp) {
  const workload = getEmployeeWorkload(emp.id, null);
  const initials = getInitials(emp.name);
  const gradient = getAvatarGradient(emp.department);
  const deptColor = getDeptColor(emp.department);
  const statusClass = getStatusBadgeClass(emp.status);
  const capacityClass = getCapacityBadgeClass(workload.capacity);
  const empTypeClass = getEmploymentTypeBadgeClass(emp.employmentType);
  const clientCount = (emp.assignedClients || []).length;

  return `
  <div class="employee-card card" data-id="${emp.id}" style="cursor:default;display:flex;flex-direction:column;gap:0;padding:0;overflow:hidden;position:relative;transition:var(--transition);">
    <!-- Top accent bar -->
    <div style="height:3px;background:${gradient};"></div>

    <div style="padding:20px;">
      <!-- Header row -->
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <!-- Avatar -->
        <div class="avatar avatar-lg" style="background:${gradient};flex-shrink:0;">${initials}</div>

        <!-- Info -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-size:15px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${emp.name}</span>
          </div>
          <div style="margin-bottom:6px;">
            <code class="cu-id">${emp.cuId || '—'}</code>
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            <span class="badge badge-gray" style="font-size:10px;color:${deptColor};background:${deptColor}1a;">${emp.role}</span>
            <span class="badge ${empTypeClass}" style="font-size:10px;">${emp.employmentType}</span>
          </div>
        </div>

        <!-- Status -->
        <div>
          <span class="badge ${statusClass}" style="font-size:10px;">${emp.status}</span>
        </div>
      </div>

      <!-- Details -->
      <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;padding:10px;background:var(--bg-secondary);border-radius:var(--radius-md);">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Joined: <span style="color:var(--text-secondary);">${formatDate(emp.joiningDate)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span style="color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${emp.email || '—'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 18z"/></svg>
          <span style="color:var(--text-secondary);">${emp.phone || '—'}</span>
        </div>
      </div>

      <!-- Workload Stats -->
      <div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Workload</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <div style="flex:1;text-align:center;padding:6px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);">${workload.assigned}</div>
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">Assigned</div>
          </div>
          <div style="flex:1;text-align:center;padding:6px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
            <div style="font-size:16px;font-weight:800;color:#16A34A;">${workload.completed}</div>
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">Done</div>
          </div>
          <div style="flex:1;text-align:center;padding:6px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
            <div style="font-size:16px;font-weight:800;color:${workload.overdue > 0 ? '#EF4444' : 'var(--text-muted)'};">${workload.overdue}</div>
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">Overdue</div>
          </div>
          <div style="flex:1;text-align:center;padding:6px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
            <div style="font-size:16px;font-weight:800;color:var(--text-secondary);">${clientCount}</div>
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">Clients</div>
          </div>
        </div>

        <!-- Capacity badge + mini bar -->
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge ${capacityClass}" style="font-size:10px;">${workload.capacity}</span>
          <div style="flex:1;">
            <div class="progress-bar" style="height:4px;">
              <div class="progress-bar-fill" style="width:${Math.min(100, workload.assigned > 0 ? workload.completionPct : 0)}%;background:${workload.overdue > 0 ? '#EF4444' : deptColor};"></div>
            </div>
          </div>
          <span style="font-size:10px;color:var(--text-muted);">${workload.completionPct}%</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;gap:6px;border-top:1px solid var(--border);padding-top:12px;margin-top:4px;">
        <button class="btn btn-ghost btn-sm btn-view-emp" data-id="${emp.id}" style="flex:1;justify-content:center;" title="View Profile">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        <button class="btn btn-ghost btn-sm btn-edit-emp" data-id="${emp.id}" style="flex:1;justify-content:center;" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn btn-ghost btn-sm btn-deactivate-emp" data-id="${emp.id}" data-status="${emp.status}" style="flex:1;justify-content:center;color:${emp.status === 'Active' ? 'var(--color-orange)' : 'var(--color-green)'};" title="${emp.status === 'Active' ? 'Deactivate' : 'Activate'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/>${emp.status === 'Active' ? '<line x1="8" y1="12" x2="16" y2="12"/>' : '<polyline points="9 12 12 15 15 12"/>'}</svg>
          ${emp.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  </div>`;
}

// ─── ADD / EDIT MODAL ─────────────────────────────────────────
function buildEmployeeModal(emp = null, previewId = '') {
  const isEdit = !!emp;
  const val = (k, def = '') => emp ? (emp[k] ?? def) : def;

  const roleOptions = ROLES.map(r =>
    `<option value="${r}" ${val('role') === r ? 'selected' : ''}>${r}</option>`
  ).join('');

  const deptOptions = DEPARTMENTS.map(d =>
    `<option value="${d.code}" ${val('department') === d.code ? 'selected' : ''}>${d.name} (${d.code})</option>`
  ).join('');

  const empTypeOptions = EMPLOYMENT_TYPES.map(t =>
    `<option value="${t}" ${val('employmentType', 'Full-Time') === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  const statusOptions = EMPLOYEE_STATUSES.map(s =>
    `<option value="${s}" ${val('status', 'Active') === s ? 'selected' : ''}>${s}</option>`
  ).join('');

  return `
  <div class="modal-overlay" id="emp-modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? '✏️ Edit Employee' : '➕ Add Employee'}</h2>
        <button class="modal-close" id="emp-modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="emp-form">
        <div class="modal-body">

          ${!isEdit ? `
          <!-- CU-ID Preview -->
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <div>
              <div style="font-size:11px;color:var(--text-muted);">Generated CU-ID Preview</div>
              <code class="cu-id" id="cu-id-preview" style="font-size:14px;">${previewId || 'Select a role to preview'}</code>
            </div>
          </div>
          ` : `
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <div>
              <div style="font-size:11px;color:var(--text-muted);">CU-ID</div>
              <code class="cu-id" style="font-size:14px;">${val('cuId', '—')}</code>
            </div>
          </div>
          `}

          <div class="form-grid">
            <div class="input-group full">
              <label class="input-label">Full Name *</label>
              <input class="input" name="name" placeholder="e.g. Dhruva Sharma" value="${val('name')}" required>
            </div>
            <div class="input-group">
              <label class="input-label">Role *</label>
              <select class="input" name="role" id="emp-role-select" required>
                <option value="">Select Role</option>
                ${roleOptions}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Department</label>
              <select class="input" name="department" id="emp-dept-select">
                <option value="">Auto-fill from role</option>
                ${deptOptions}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Email *</label>
              <input class="input" name="email" type="email" placeholder="name@creativeuniverse.in" value="${val('email')}" required>
            </div>
            <div class="input-group">
              <label class="input-label">Phone</label>
              <input class="input" name="phone" placeholder="+91 98765 00000" value="${val('phone')}">
            </div>
            <div class="input-group">
              <label class="input-label">Employment Type</label>
              <select class="input" name="employmentType">${empTypeOptions}</select>
            </div>
            <div class="input-group">
              <label class="input-label">Status</label>
              <select class="input" name="status">${statusOptions}</select>
            </div>
            <div class="input-group">
              <label class="input-label">Joining Date</label>
              <input class="input" name="joiningDate" type="date" value="${val('joiningDate')}">
            </div>
            <div class="input-group full">
              <label class="input-label">Notes</label>
              <textarea class="input" name="notes" rows="2" placeholder="Any additional notes...">${val('notes')}</textarea>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="emp-modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ${isEdit ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  </div>`;
}

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderTeamDirectory(container, currentMonth) {
  let searchQuery = '';
  let filterDept = '';
  let filterRole = '';
  let filterStatus = '';
  let filterEmpType = '';
  let editingEmpId = null;

  function getData() {
    return getAll(COLLECTIONS.EMPLOYEES);
  }

  function render() {
    const employees = getData();
    const filtered = filterEmployees(employees, {
      search: searchQuery,
      department: filterDept,
      role: filterRole,
      status: filterStatus,
      employmentType: filterEmpType,
    });

    const totalEmp = employees.length;
    const activeToday = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;
    const freelancersAvail = employees.filter(e => e.status === 'Freelancer Available').length;

    const deptOptions = DEPARTMENTS.map(d =>
      `<option value="${d.code}" ${filterDept === d.code ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    const roleOptions = ROLES.map(r =>
      `<option value="${r}" ${filterRole === r ? 'selected' : ''}>${r}</option>`
    ).join('');

    const statusOptions = EMPLOYEE_STATUSES.map(s =>
      `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const empTypeOptions = EMPLOYMENT_TYPES.map(t =>
      `<option value="${t}" ${filterEmpType === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    container.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Team Directory</h1>
          <p class="page-subtitle">${totalEmp} team members · ${activeToday} active today</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" id="btn-add-employee">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Employee
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
        <div class="stat-card" style="--stat-color:#7C3AED;">
          <div class="stat-card-header">
            <div class="stat-card-label">Total Employees</div>
            <div class="stat-card-icon">👥</div>
          </div>
          <div class="stat-card-value">${totalEmp}</div>
          <div class="stat-card-sub">All team members</div>
        </div>
        <div class="stat-card" style="--stat-color:#16A34A;">
          <div class="stat-card-header">
            <div class="stat-card-label">Active Today</div>
            <div class="stat-card-icon">✅</div>
          </div>
          <div class="stat-card-value">${activeToday}</div>
          <div class="stat-card-sub">Currently working</div>
        </div>
        <div class="stat-card" style="--stat-color:#F97316;">
          <div class="stat-card-header">
            <div class="stat-card-label">On Leave</div>
            <div class="stat-card-icon">🏖️</div>
          </div>
          <div class="stat-card-value">${onLeave}</div>
          <div class="stat-card-sub">Away from work</div>
        </div>
        <div class="stat-card" style="--stat-color:#0891B2;">
          <div class="stat-card-header">
            <div class="stat-card-label">Freelancers Available</div>
            <div class="stat-card-icon">🎯</div>
          </div>
          <div class="stat-card-value">${freelancersAvail}</div>
          <div class="stat-card-sub">Ready to take tasks</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        <div class="search-bar" style="flex:1;min-width:200px;max-width:300px;">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input input-sm" id="emp-search" placeholder="Search name, CU-ID, email…" value="${searchQuery}" style="padding-left:34px;">
        </div>
        <select class="input input-sm" id="emp-filter-dept" style="width:auto;min-width:160px;">
          <option value="">All Departments</option>
          ${deptOptions}
        </select>
        <select class="input input-sm" id="emp-filter-role" style="width:auto;min-width:160px;">
          <option value="">All Roles</option>
          ${roleOptions}
        </select>
        <select class="input input-sm" id="emp-filter-status" style="width:auto;min-width:140px;">
          <option value="">All Statuses</option>
          ${statusOptions}
        </select>
        <select class="input input-sm" id="emp-filter-emptype" style="width:auto;min-width:140px;">
          <option value="">All Types</option>
          ${empTypeOptions}
        </select>
        <span style="font-size:12px;color:var(--text-muted);">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <!-- Cards Grid -->
      <div id="emp-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
        ${filtered.length === 0
          ? `<div class="empty-state" style="grid-column:1/-1;">
              <div class="empty-state-icon">🔍</div>
              <div class="empty-state-title">No employees found</div>
              <div class="empty-state-sub">Try adjusting your search or filters.</div>
             </div>`
          : filtered.map(e => buildEmployeeCard(e)).join('')
        }
      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    // Search
    container.querySelector('#emp-search')?.addEventListener('input', e => {
      searchQuery = e.target.value;
      rerenderCards();
    });

    // Filter dropdowns
    container.querySelector('#emp-filter-dept')?.addEventListener('change', e => {
      filterDept = e.target.value;
      rerenderCards();
    });
    container.querySelector('#emp-filter-role')?.addEventListener('change', e => {
      filterRole = e.target.value;
      rerenderCards();
    });
    container.querySelector('#emp-filter-status')?.addEventListener('change', e => {
      filterStatus = e.target.value;
      rerenderCards();
    });
    container.querySelector('#emp-filter-emptype')?.addEventListener('change', e => {
      filterEmpType = e.target.value;
      rerenderCards();
    });

    // Add Employee
    container.querySelector('#btn-add-employee')?.addEventListener('click', () => {
      editingEmpId = null;
      openModal(null);
    });

    // Card actions
    container.querySelector('#emp-cards-grid')?.addEventListener('click', e => {
      const viewBtn = e.target.closest('.btn-view-emp');
      const editBtn = e.target.closest('.btn-edit-emp');
      const deactivateBtn = e.target.closest('.btn-deactivate-emp');

      if (viewBtn) {
        const id = viewBtn.dataset.id;
        window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page: 'employee-profile', employeeId: id } }));
        return;
      }

      if (editBtn) {
        editingEmpId = editBtn.dataset.id;
        const emp = getData().find(e => e.id === editingEmpId);
        openModal(emp);
        return;
      }

      if (deactivateBtn) {
        const id = deactivateBtn.dataset.id;
        const currentStatus = deactivateBtn.dataset.status;
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        update(COLLECTIONS.EMPLOYEES, id, { status: newStatus });
        showToast(`Employee ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
        rerenderCards();
      }
    });
  }

  function rerenderCards() {
    const employees = getData();
    const filtered = filterEmployees(employees, {
      search: searchQuery,
      department: filterDept,
      role: filterRole,
      status: filterStatus,
      employmentType: filterEmpType,
    });

    const grid = container.querySelector('#emp-cards-grid');
    if (grid) {
      grid.innerHTML = filtered.length === 0
        ? `<div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">No employees found</div>
            <div class="empty-state-sub">Try adjusting your search or filters.</div>
           </div>`
        : filtered.map(e => buildEmployeeCard(e)).join('');
    }
    // Update result count
    const countSpan = container.querySelectorAll('[style*="font-size:12px;color:var(--text-muted)"]');
    countSpan.forEach(s => {
      if (s.textContent.includes('result')) {
        s.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
      }
    });
  }

  function openModal(emp = null) {
    const existing = document.getElementById('emp-modal-overlay');
    if (existing) existing.remove();

    // Generate preview ID for new employees
    let previewId = '';
    if (!emp) {
      const firstRole = ROLES[2]; // Default to Video Editor for preview
      const deptCode = getDeptCode(firstRole);
      previewId = generateEmployeeId(deptCode);
    }

    document.body.insertAdjacentHTML('beforeend', buildEmployeeModal(emp, previewId));

    const overlay = document.getElementById('emp-modal-overlay');
    const form = document.getElementById('emp-form');
    const roleSelect = document.getElementById('emp-role-select');
    const deptSelect = document.getElementById('emp-dept-select');
    const idPreview = document.getElementById('cu-id-preview');

    // Auto-fill department from role + update CU-ID preview
    roleSelect?.addEventListener('change', () => {
      const role = roleSelect.value;
      const deptCode = getDeptCode(role);
      if (deptSelect) deptSelect.value = deptCode;
      if (idPreview && !emp) {
        idPreview.textContent = generateEmployeeId(deptCode);
      }
    });

    // Close
    const closeModal = () => overlay.remove();
    document.getElementById('emp-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('emp-modal-cancel')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      // Auto-set department + departmentName if not set
      if (!data.department) data.department = getDeptCode(data.role);
      data.departmentName = getDeptName(data.role);

      if (editingEmpId) {
        update(COLLECTIONS.EMPLOYEES, editingEmpId, data);
        showToast(`${data.name} updated successfully`, 'success');
      } else {
        // Generate CU-ID
        const cuId = generateEmployeeId(data.department);
        const empCount = getData().length;
        const id = `emp-${String(empCount + 1).padStart(3, '0')}`;
        create(COLLECTIONS.EMPLOYEES, {
          ...data,
          id,
          cuId,
          assignedClients: [],
          avatar: null,
        });
        showToast(`Employee "${data.name}" added with ID ${cuId} 🎉`, 'success');
      }

      closeModal();
      render();
    });
  }

  // Initial render
  render();

  // Listen for store changes
  const onStoreChange = e => {
    if (e.detail?.collection === COLLECTIONS.EMPLOYEES || e.detail?.collection === COLLECTIONS.TASKS) {
      rerenderCards();
    }
  };
  window.addEventListener('cu:store-change', onStoreChange);

  return () => window.removeEventListener('cu:store-change', onStoreChange);
}
