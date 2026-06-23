// ============================================================
// CREATIVE UNIVERSE — Team Workload Page
// ============================================================

import { getAll, getEmployeeWorkload, getCapacityStyle, COLLECTIONS } from '../data/store.js';
import { Chart, registerables } from 'chart.js';
import { openModal, closeModal } from '../components/Modal.js';
Chart.register(...registerables);

// ─── Chart Theme ──────────────────────────────────────────────
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';

// ─── Active Chart Instances ───────────────────────────────────
let _activeCharts = [];

export function cleanupTeamWorkloadCharts() {
  _activeCharts.forEach(c => { try { c.destroy(); } catch (_) {} });
  _activeCharts = [];
}

// ─── HELPERS ──────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function avatarColor(id = '') {
  const palette = [
    '#7C3AED','#2563EB','#16A34A','#D97706','#DC2626',
    '#0891B2','#DB2777','#9333EA','#EA580C','#0D9488',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

function capacityBadge(capacity) {
  const s = getCapacityStyle(capacity);
  const dot = {
    Available: '#16A34A', Balanced: '#2563EB', 'High Workload': '#D97706', Overloaded: '#DC2626',
  }[capacity] || '#9CA3AF';
  return `
    <span class="badge" style="background:${s.bg};color:${s.color};font-size:12px;padding:5px 12px;font-weight:700;letter-spacing:0.03em;">
      <span style="width:7px;height:7px;border-radius:50%;background:${dot};display:inline-block;margin-right:5px;flex-shrink:0;"></span>
      ${capacity}
    </span>
  `;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function isOverdue(task) {
  return task.daysOverdue > 0 || (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'uploaded');
}

const DARK_CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: '#1A1D27',
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, precision: 0 },
      grid: { color: 'rgba(255,255,255,0.06)' },
      beginAtZero: true,
    },
  },
};

// ─── BUILD EMPLOYEE CARD ──────────────────────────────────────
function buildEmployeeCard(emp, workload, tasks, currentMonth) {
  const color = avatarColor(emp.id);
  const pct = workload.completionPct;
  const cs = getCapacityStyle(workload.capacity);

  // Content type breakdown
  const reels = tasks.filter(t => t.primaryOwner === emp.id && t.contentType === 'reel').length;
  const posts = tasks.filter(t => t.primaryOwner === emp.id && t.contentType === 'static-post').length;
  const other = tasks.filter(t => t.primaryOwner === emp.id && !['reel','static-post'].includes(t.contentType)).length;

  // Assigned clients
  const clientIds = [...new Set(tasks.filter(t => t.primaryOwner === emp.id).map(t => t.clientId))];
  const allClients = getAll(COLLECTIONS.CLIENTS);
  const assignedClients = clientIds.map(id => allClients.find(c => c.id === id)).filter(Boolean);

  const clientLogos = assignedClients.slice(0, 5).map(c => {
    const initials = getInitials(c.name);
    const bg = avatarColor(c.id);
    return `<div class="avatar" style="width:26px;height:26px;font-size:10px;font-weight:700;background:${bg};border:2px solid var(--bg-card);" title="${c.name}">${initials}</div>`;
  }).join('');
  const moreClients = assignedClients.length > 5
    ? `<div style="font-size:11px;color:var(--text-muted);margin-left:4px;">+${assignedClients.length - 5}</div>`
    : '';

  const progressBarColor = workload.capacity === 'Overloaded' ? '#DC2626'
    : workload.capacity === 'High Workload' ? '#D97706'
    : workload.capacity === 'Balanced' ? '#2563EB'
    : '#16A34A';

  return `
    <div class="card" style="display:flex;flex-direction:column;gap:14px;transition:transform 0.2s ease;" 
         onmouseenter="this.style.transform='translateY(-2px)'" 
         onmouseleave="this.style.transform='translateY(0)'">
      <!-- Top: Avatar + Name + Badges -->
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div class="avatar avatar-lg" style="background:${color};width:56px;height:56px;font-size:20px;flex-shrink:0;">
          ${getInitials(emp.name)}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${emp.name}
          </div>
          <div class="cu-id" style="margin-bottom:6px;">${emp.cuId}</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;">
            <span class="badge badge-purple" style="font-size:10px;">${emp.role}</span>
            <span class="badge badge-blue" style="font-size:10px;">${emp.departmentName || emp.department}</span>
          </div>
        </div>
      </div>

      <!-- Capacity Badge (big) -->
      <div style="text-align:center;">
        ${capacityBadge(workload.capacity)}
      </div>

      <!-- Progress bar -->
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:5px;">
          <span>Progress</span>
          <span style="font-weight:700;color:var(--text-primary);">${workload.completed}/${workload.assigned}</span>
        </div>
        <div class="progress-bar" style="height:8px;">
          <div class="progress-bar-fill" style="width:${pct}%;background:${progressBarColor};"></div>
        </div>
        <div style="text-align:right;font-size:11px;color:${progressBarColor};font-weight:700;margin-top:3px;">${pct}%</div>
      </div>

      <!-- Content type breakdown -->
      <div style="display:flex;gap:8px;justify-content:center;">
        <div style="text-align:center;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-md);flex:1;">
          <div style="font-size:17px;font-weight:800;color:var(--text-primary);">${reels}</div>
          <div style="font-size:10px;color:var(--text-muted);">Reels</div>
        </div>
        <div style="text-align:center;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-md);flex:1;">
          <div style="font-size:17px;font-weight:800;color:var(--text-primary);">${posts}</div>
          <div style="font-size:10px;color:var(--text-muted);">Posts</div>
        </div>
        <div style="text-align:center;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-md);flex:1;">
          <div style="font-size:17px;font-weight:800;color:var(--text-primary);">${other}</div>
          <div style="font-size:10px;color:var(--text-muted);">Other</div>
        </div>
      </div>

      <!-- Task stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:6px 4px;">
          <div style="font-size:15px;font-weight:800;color:var(--text-primary);">${workload.assigned}</div>
          <div style="font-size:9px;color:var(--text-muted);">Assigned</div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:6px 4px;">
          <div style="font-size:15px;font-weight:800;color:var(--color-green);">${workload.completed}</div>
          <div style="font-size:9px;color:var(--text-muted);">Done</div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:6px 4px;">
          <div style="font-size:15px;font-weight:800;color:var(--color-yellow);">${workload.pending}</div>
          <div style="font-size:9px;color:var(--text-muted);">Pending</div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:6px 4px;">
          <div style="font-size:15px;font-weight:800;color:${workload.overdue > 0 ? 'var(--color-red)' : 'var(--text-muted)'};">${workload.overdue}</div>
          <div style="font-size:9px;color:var(--text-muted);">Overdue</div>
        </div>
      </div>

      <!-- Assigned clients -->
      ${assignedClients.length > 0 ? `
        <div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;">CLIENTS</div>
          <div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;">
            ${clientLogos}${moreClients}
          </div>
        </div>
      ` : ''}

      <!-- View Details -->
      <button class="btn btn-secondary btn-sm btn-view-details" data-emp="${emp.id}" data-emp-name="${emp.name}" style="width:100%;justify-content:center;margin-top:auto;">
        View Details →
      </button>
    </div>
  `;
}

// ─── EMPLOYEE DETAIL MODAL ────────────────────────────────────
function openEmployeeDetailModal(emp, tasks, currentMonth) {
  const empTasks = tasks.filter(t =>
    t.primaryOwner === emp.id || (t.supportMembers || []).includes(emp.id)
  );

  const statusStyle = {
    'not-started': { label: 'Not Started', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
    'under-editing': { label: 'Under Editing', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    'cu-approval': { label: 'CU Approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    're-edit': { label: 'Re-Edit', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    'buffer': { label: 'Buffer', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    'client-approval': { label: 'Client Approval', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
    'ready-to-upload': { label: 'Ready to Upload', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    'uploaded': { label: 'Uploaded', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  };

  const priorityColor = { Low: '#9CA3AF', Normal: '#3B82F6', High: '#F97316', Urgent: '#DC2626' };

  const tableRows = empTasks.length === 0
    ? `<tr><td colspan="5"><div class="empty-state" style="padding:30px;"><div class="empty-state-icon">📋</div><div class="empty-state-title">No tasks found</div></div></td></tr>`
    : empTasks.map(t => {
        const ss = statusStyle[t.status] || { label: t.status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
        const overdue = isOverdue(t);
        return `
          <tr>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;">${t.title}</td>
            <td style="font-size:12px;color:var(--text-accent);">${t.clientName}</td>
            <td><span class="badge" style="background:${ss.bg};color:${ss.color};font-size:10px;">${ss.label}</span></td>
            <td style="font-size:12px;${overdue ? 'color:var(--color-red);font-weight:600;' : 'color:var(--text-muted);'}">${fmtDate(t.deadline)}${overdue ? ' ⚠️' : ''}</td>
            <td><span style="font-size:11px;font-weight:700;color:${priorityColor[t.priority] || '#9CA3AF'};">${t.priority || '—'}</span></td>
          </tr>
        `;
      }).join('');

  const body = `
    <div style="margin-bottom:20px;display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg-elevated);border-radius:var(--radius-md);">
      <div class="avatar avatar-lg" style="background:${avatarColor(emp.id)};width:56px;height:56px;font-size:20px;">
        ${getInitials(emp.name)}
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${emp.name}</div>
        <div style="font-size:13px;color:var(--text-muted);">${emp.role} · ${emp.departmentName}</div>
        <div class="cu-id" style="margin-top:4px;">${emp.cuId}</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-size:24px;font-weight:800;color:var(--text-primary);">${empTasks.length}</div>
        <div style="font-size:11px;color:var(--text-muted);">Total Tasks</div>
      </div>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Client</th>
            <th>Status</th>
            <th>Deadline</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;

  const footer = `<button class="btn btn-primary" onclick="window.__closeModalRef && window.__closeModalRef()">Close</button>`;

  openModal({ title: `📊 ${emp.name} — Task Details`, body, size: 'xl', footer });
  window.__closeModalRef = closeModal;
}

// ─── CHARTS ───────────────────────────────────────────────────
function initCharts(employeeData, tasks) {
  cleanupTeamWorkloadCharts();

  // Chart A: Horizontal bar — Total tasks per employee
  const canvasA = document.getElementById('wl-chart-a');
  if (canvasA) {
    const sorted = [...employeeData].sort((a, b) => b.workload.assigned - a.workload.assigned).slice(0, 10);
    const barColorsA = sorted.map(d => {
      const cs = getCapacityStyle(d.workload.capacity);
      return cs.color + 'CC';
    });
    const chartA = new Chart(canvasA, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.emp.name.split(' ')[0]),
        datasets: [{
          label: 'Total Tasks',
          data: sorted.map(d => d.workload.assigned),
          backgroundColor: barColorsA,
          borderColor: sorted.map(d => getCapacityStyle(d.workload.capacity).color),
          borderWidth: 1,
          borderRadius: 5,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...DARK_CHART_OPTS.plugins,
          legend: { display: false },
          tooltip: {
            ...DARK_CHART_OPTS.plugins.tooltip,
            callbacks: {
              label: ctx => ` ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          x: { ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, precision: 0 }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
          y: { ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        },
      },
    });
    _activeCharts.push(chartA);
  }

  // Chart B: Doughnut — Tasks by Department
  const canvasB = document.getElementById('wl-chart-b');
  if (canvasB) {
    const deptMap = {};
    employeeData.forEach(d => {
      const dept = d.emp.departmentName || d.emp.department;
      if (!deptMap[dept]) deptMap[dept] = 0;
      deptMap[dept] += d.workload.assigned;
    });
    const deptEntries = Object.entries(deptMap).filter(([, v]) => v > 0);
    const deptColors = ['#7C3AED','#2563EB','#16A34A','#D97706','#DC2626','#0891B2','#DB2777','#9333EA','#EA580C','#0D9488'];
    const chartB = new Chart(canvasB, {
      type: 'doughnut',
      data: {
        labels: deptEntries.map(([k]) => k),
        datasets: [{
          data: deptEntries.map(([, v]) => v),
          backgroundColor: deptEntries.map((_, i) => deptColors[i % deptColors.length] + 'CC'),
          borderColor: deptEntries.map((_, i) => deptColors[i % deptColors.length]),
          borderWidth: 1.5,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94A3B8', font: { size: 10, family: 'Inter, system-ui, sans-serif' }, boxWidth: 10, padding: 8 },
          },
          tooltip: {
            backgroundColor: '#1A1D27', titleColor: '#F1F5F9', bodyColor: '#94A3B8',
            borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} tasks` },
          },
        },
      },
    });
    _activeCharts.push(chartB);
  }

  // Chart C: Bar — Completed vs Pending by Employee
  const canvasC = document.getElementById('wl-chart-c');
  if (canvasC) {
    const sorted = [...employeeData].filter(d => d.workload.assigned > 0).sort((a, b) => b.workload.assigned - a.workload.assigned).slice(0, 8);
    const chartC = new Chart(canvasC, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.emp.name.split(' ')[0]),
        datasets: [
          {
            label: 'Completed',
            data: sorted.map(d => d.workload.completed),
            backgroundColor: 'rgba(22,163,74,0.75)',
            borderColor: 'rgba(22,163,74,1)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Pending',
            data: sorted.map(d => d.workload.pending),
            backgroundColor: 'rgba(234,179,8,0.75)',
            borderColor: 'rgba(234,179,8,1)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Overdue',
            data: sorted.map(d => d.workload.overdue),
            backgroundColor: 'rgba(239,68,68,0.75)',
            borderColor: 'rgba(239,68,68,1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...DARK_CHART_OPTS.plugins,
          legend: { ...DARK_CHART_OPTS.plugins.legend, position: 'top' },
        },
        scales: {
          x: { ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } }, grid: { color: 'rgba(255,255,255,0.06)' }, stacked: false },
          y: { ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, precision: 0 }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
        },
      },
    });
    _activeCharts.push(chartC);
  }
}

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderTeamWorkload(container, currentMonth) {
  cleanupTeamWorkloadCharts();

  const employees = getAll(COLLECTIONS.EMPLOYEES);
  const allTasks = getAll(COLLECTIONS.TASKS);
  const tasks = allTasks.filter(t => !currentMonth || t.month === currentMonth);

  // Build employee data with workloads
  const employeeData = employees.map(emp => ({
    emp,
    workload: getEmployeeWorkload(emp.id, currentMonth),
    tasks: tasks.filter(t => t.primaryOwner === emp.id || (t.supportMembers || []).includes(emp.id)),
  }));

  // Summary stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'uploaded').length;
  const pendingTasks = tasks.filter(t => t.status !== 'uploaded').length;
  const overdueTasks = tasks.filter(t => t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')).length;

  // Filter state
  let searchQ = '';
  let filterDept = '';
  let filterRole = '';
  let filterOverdue = false;

  const depts = [...new Set(employees.map(e => e.departmentName || e.department).filter(Boolean))].sort();
  const roles = [...new Set(employees.map(e => e.role).filter(Boolean))].sort();

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Team Workload</h1>
        <p class="page-subtitle">Employee task distribution and capacity overview</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="wl-export-btn">
          📥 Export
        </button>
      </div>
    </div>

    <!-- Filter Row -->
    <div class="filters-row" style="margin-bottom:20px;flex-wrap:wrap;gap:8px;">
      <div class="search-bar" style="flex:1;min-width:180px;max-width:260px;">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="input input-sm" id="wl-search" placeholder="Search employee..." style="padding-left:34px;min-width:180px;" />
      </div>
      <select class="input input-sm" id="wl-dept" style="min-width:150px;">
        <option value="">All Departments</option>
        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
      <select class="input input-sm" id="wl-role" style="min-width:150px;">
        <option value="">All Roles</option>
        ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;white-space:nowrap;">
        <input type="checkbox" id="wl-overdue-only" style="accent-color:var(--accent);">
        Has Overdue
      </label>
    </div>

    <!-- Summary Stats Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;" id="wl-summary-stats">
      <div class="stat-card" style="--stat-color:#7C3AED;">
        <div class="stat-card-header"><span class="stat-card-label">Total Tasks</span><span class="stat-card-icon">📋</span></div>
        <div class="stat-card-value">${totalTasks}</div>
        <div class="stat-card-sub">Across all employees</div>
      </div>
      <div class="stat-card" style="--stat-color:#16A34A;">
        <div class="stat-card-header"><span class="stat-card-label">Completed</span><span class="stat-card-icon">✅</span></div>
        <div class="stat-card-value" style="color:var(--color-green);">${completedTasks}</div>
        <div class="stat-card-sub">${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}% completion rate</div>
      </div>
      <div class="stat-card" style="--stat-color:#EAB308;">
        <div class="stat-card-header"><span class="stat-card-label">Pending</span><span class="stat-card-icon">⏳</span></div>
        <div class="stat-card-value" style="color:var(--color-yellow);">${pendingTasks}</div>
        <div class="stat-card-sub">In progress or not started</div>
      </div>
      <div class="stat-card" style="--stat-color:#DC2626;">
        <div class="stat-card-header"><span class="stat-card-label">Overdue</span><span class="stat-card-icon">🚨</span></div>
        <div class="stat-card-value" style="color:var(--color-red);">${overdueTasks}</div>
        <div class="stat-card-sub">Past deadline</div>
      </div>
    </div>

    <!-- Employee Cards Grid -->
    <div id="wl-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:32px;"></div>

    <!-- Empty state -->
    <div id="wl-empty" style="display:none;">
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No employees found</div>
        <div class="empty-state-sub">Try adjusting your search or filters.</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div style="margin-bottom:16px;">
      <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">📊 Analytics</div>
      <div style="font-size:13px;color:var(--text-muted);">Workload distribution and completion analysis</div>
    </div>
    <div class="charts-grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;margin-bottom:32px;">
      <div class="chart-card">
        <div class="chart-card-title">📊 Tasks by Employee (Horizontal Bar)</div>
        <div class="chart-wrap" style="height:220px;"><canvas id="wl-chart-a"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">🍩 Tasks by Department</div>
        <div class="chart-wrap" style="height:220px;"><canvas id="wl-chart-b"></canvas></div>
      </div>
      <div class="chart-card" style="grid-column:1/-1;">
        <div class="chart-card-title">📈 Completed vs Pending vs Overdue by Employee</div>
        <div class="chart-wrap" style="height:220px;"><canvas id="wl-chart-c"></canvas></div>
      </div>
    </div>
  `;

  // ─── Render Employee Cards ─────────────────────────────────
  const renderCards = () => {
    const grid = document.getElementById('wl-cards-grid');
    const emptyEl = document.getElementById('wl-empty');
    if (!grid) return;

    let filtered = employeeData;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      filtered = filtered.filter(d =>
        d.emp.name.toLowerCase().includes(q) ||
        d.emp.cuId?.toLowerCase().includes(q) ||
        d.emp.role?.toLowerCase().includes(q)
      );
    }
    if (filterDept) filtered = filtered.filter(d => (d.emp.departmentName || d.emp.department) === filterDept);
    if (filterRole) filtered = filtered.filter(d => d.emp.role === filterRole);
    if (filterOverdue) filtered = filtered.filter(d => d.workload.overdue > 0);

    if (filtered.length === 0) {
      grid.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      if (emptyEl) emptyEl.style.display = 'none';
      grid.innerHTML = filtered.map(d => buildEmployeeCard(d.emp, d.workload, allTasks, currentMonth)).join('');

      // Wire View Details buttons
      grid.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', () => {
          const empId = btn.dataset.emp;
          const emp = employees.find(e => e.id === empId);
          if (emp) openEmployeeDetailModal(emp, allTasks, currentMonth);
        });
      });
    }
  };

  renderCards();

  // ─── Charts ────────────────────────────────────────────────
  requestAnimationFrame(() => {
    initCharts(employeeData, allTasks);
  });

  // ─── Event Listeners ───────────────────────────────────────
  setTimeout(() => {
    document.getElementById('wl-search')?.addEventListener('input', e => {
      searchQ = e.target.value;
      renderCards();
    });
    document.getElementById('wl-dept')?.addEventListener('change', e => {
      filterDept = e.target.value;
      renderCards();
    });
    document.getElementById('wl-role')?.addEventListener('change', e => {
      filterRole = e.target.value;
      renderCards();
    });
    document.getElementById('wl-overdue-only')?.addEventListener('change', e => {
      filterOverdue = e.target.checked;
      renderCards();
    });

    document.getElementById('wl-export-btn')?.addEventListener('click', () => {
      // Build CSV
      const headers = ['Employee', 'CU ID', 'Role', 'Department', 'Assigned', 'Completed', 'Pending', 'Overdue', 'Completion %', 'Capacity'];
      const csvRows = employeeData.map(d => [
        d.emp.name,
        d.emp.cuId,
        d.emp.role,
        d.emp.departmentName || d.emp.department,
        d.workload.assigned,
        d.workload.completed,
        d.workload.pending,
        d.workload.overdue,
        d.workload.completionPct + '%',
        d.workload.capacity,
      ]);
      const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-workload-${currentMonth || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, 50);
}
