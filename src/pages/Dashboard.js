// ============================================================
// CREATIVE UNIVERSE — Dashboard Page
// ============================================================

import { getDashboardStats, generateAlerts, getAll, getClientStats, COLLECTIONS } from '../data/store.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// ─── CHART DEFAULTS (Dark Theme) ─────────────────────────────
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';
Chart.defaults.backgroundColor = 'rgba(124,58,237,0.6)';

// ─── ACTIVE CHART INSTANCES (for cleanup) ────────────────────
let _activeCharts = [];

/**
 * Destroy all previously created chart instances.
 * Called before re-rendering to prevent canvas reuse errors.
 */
export function cleanupDashboardCharts() {
  _activeCharts.forEach(c => {
    try { c.destroy(); } catch (_) { /* already destroyed */ }
  });
  _activeCharts = [];
}

// ─── HELPERS ─────────────────────────────────────────────────
function formatMonthLabel(month) {
  // month is "YYYY-MM"
  if (!month) return '';
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── STAT CARD DEFINITIONS ───────────────────────────────────
function buildStatCards(stats) {
  return [
    {
      label: 'Total Active Clients',
      value: stats.totalActiveClients,
      icon: '👥',
      color: '#7C3AED',
      sub: 'Currently active',
    },
    {
      label: 'Total Active Employees',
      value: stats.totalActiveEmployees,
      icon: '🧑‍💼',
      color: '#2563EB',
      sub: 'Full-time & part-time',
    },
    {
      label: 'Employees Working Today',
      value: stats.employeesWorkingToday,
      icon: '✅',
      color: '#16A34A',
      sub: 'On duty today',
    },
    {
      label: 'Reels Promised This Month',
      value: stats.totalReelsPromised,
      icon: '🎬',
      color: '#7C3AED',
      sub: 'Committed to clients',
    },
    {
      label: 'Reels Completed',
      value: stats.reelsCompleted,
      icon: '✅',
      color: '#16A34A',
      sub: 'Uploaded this month',
    },
    {
      label: 'Reels Pending',
      value: stats.reelsPending,
      icon: '⏳',
      color: '#EF4444',
      sub: 'Yet to be uploaded',
    },
    {
      label: 'Static Posts Pending',
      value: stats.staticPostsPending,
      icon: '🖼️',
      color: '#2563EB',
      sub: 'Not yet uploaded',
    },
    {
      label: 'Carousels Pending',
      value: stats.carouselsPending,
      icon: '📱',
      color: '#0891B2',
      sub: 'Not yet uploaded',
    },
    {
      label: 'Stories Pending',
      value: stats.storiesPending,
      icon: '⭕',
      color: '#DB2777',
      sub: 'Not yet uploaded',
    },
    {
      label: 'Other Tasks Pending',
      value: stats.otherPending,
      icon: '📌',
      color: '#6B7280',
      sub: 'All other types',
    },
    {
      label: 'Raw Videos Available',
      value: stats.rawVideosAvailable,
      icon: '🎥',
      color: '#D97706',
      sub: 'Available or partial',
    },
    {
      label: 'Clients Low on Raw Data',
      value: stats.clientsLowRaw,
      icon: '⚠️',
      color: '#EF4444',
      sub: 'Need raw footage',
    },
    {
      label: 'Clients Requiring Shoot',
      value: stats.clientsRequiringShoot,
      icon: '📷',
      color: '#F97316',
      sub: 'Shoot scheduled needed',
    },
    {
      label: 'Pending CU Approvals',
      value: stats.pendingCUApprovals,
      icon: '🔍',
      color: '#EAB308',
      sub: 'Awaiting internal review',
    },
    {
      label: 'Pending Client Approvals',
      value: stats.pendingClientApprovals,
      icon: '✋',
      color: '#F59E0B',
      sub: 'Awaiting client sign-off',
    },
    {
      label: 'Tasks in Re-Edit',
      value: stats.tasksInReEdit,
      icon: '🔄',
      color: '#DC2626',
      sub: 'Needs rework',
    },
    {
      label: 'Buffer Content',
      value: stats.bufferContent,
      icon: '📦',
      color: '#8B5CF6',
      sub: 'Saved for later',
    },
    {
      label: 'Ready to Upload',
      value: stats.readyToUpload,
      icon: '📤',
      color: '#16A34A',
      sub: 'Approved, pending post',
    },
    {
      label: 'Uploaded This Month',
      value: stats.uploadedThisMonth,
      icon: '🎉',
      color: '#14B8A6',
      sub: 'Published content',
    },
    {
      label: 'Unassigned Tasks',
      value: stats.unassignedTasks,
      icon: '❓',
      color: '#EF4444',
      sub: 'No owner assigned',
    },
    {
      label: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: '🚨',
      color: '#DC2626',
      sub: 'Past deadline',
    },
    {
      label: 'Missing Drive Links',
      value: stats.missingDriveLinks,
      icon: '🔗',
      color: '#6B7280',
      sub: 'Clients without Drive',
    },
  ];
}

// ─── HTML BUILDERS ────────────────────────────────────────────
function renderStatsGrid(stats) {
  const cards = buildStatCards(stats);
  return `
    <div class="stats-grid">
      ${cards.map(card => `
        <div class="stat-card" style="--stat-color: ${card.color};">
          <div class="stat-card-header">
            <span class="stat-card-label">${card.label}</span>
            <span class="stat-card-icon">${card.icon}</span>
          </div>
          <div class="stat-card-value">${card.value}</div>
          <div class="stat-card-sub">${card.sub}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderChartsGrid() {
  return `
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card-title">📊 Promised vs Completed Deliverables</div>
        <div class="chart-wrap">
          <canvas id="chart-deliverables"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">🔄 Content by Workflow Status</div>
        <div class="chart-wrap">
          <canvas id="chart-workflow"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">👤 Workload by Employee (Top 8)</div>
        <div class="chart-wrap">
          <canvas id="chart-workload"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">💚 Client Health Scores</div>
        <div class="chart-wrap">
          <canvas id="chart-health"></canvas>
        </div>
      </div>
    </div>
  `;
}

function renderAlertsSection(alerts) {
  const alertIcon = { red: '🔴', orange: '🟠', yellow: '🟡' };
  const alertsHTML = alerts.length === 0
    ? `<div class="empty-state" style="padding: 24px 16px;">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-title">No Active Alerts</div>
        <div class="empty-state-sub">Everything looks good across all clients.</div>
      </div>`
    : alerts.map(alert => `
        <div class="alert-item ${alert.type}">
          <span class="alert-dot"></span>
          <span>${alertIcon[alert.type] || ''} ${alert.message}</span>
        </div>
      `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">⚠️ Active Alerts</span>
        <span class="badge badge-red">${alerts.length}</span>
      </div>
      <div class="alerts-list">
        ${alertsHTML}
      </div>
    </div>
  `;
}

// ─── CHART INITIALIZERS ───────────────────────────────────────

const DARK_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94A3B8',
        font: { size: 11, family: 'Inter, system-ui, sans-serif' },
        boxWidth: 12,
        padding: 12,
      },
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
      grid: { color: 'rgba(255,255,255,0.07)' },
    },
    y: {
      ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, precision: 0 },
      grid: { color: 'rgba(255,255,255,0.07)' },
      beginAtZero: true,
    },
  },
};

/**
 * Chart 1: Promised vs Completed Deliverables (Bar)
 * Group monthly deliverables by content type bucket.
 */
function initDeliverablesChart(month) {
  const canvas = document.getElementById('chart-deliverables');
  if (!canvas) return;

  const deliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES).filter(
    d => !month || d.month === month
  );

  // Define buckets: reel, static-post, carousel, story, other
  const buckets = [
    { label: 'Reels', type: 'reel' },
    { label: 'Static Posts', type: 'static-post' },
    { label: 'Carousels', type: 'carousel' },
    { label: 'Stories', type: 'story' },
    { label: 'Other', type: '__other__' },
  ];

  const KNOWN_TYPES = ['reel', 'static-post', 'carousel', 'story'];

  const promised = buckets.map(b => {
    if (b.type === '__other__') {
      return deliverables
        .filter(d => !KNOWN_TYPES.includes(d.contentType))
        .reduce((s, d) => s + (d.promised || 0), 0);
    }
    return deliverables
      .filter(d => d.contentType === b.type)
      .reduce((s, d) => s + (d.promised || 0), 0);
  });

  const completed = buckets.map(b => {
    if (b.type === '__other__') {
      return deliverables
        .filter(d => !KNOWN_TYPES.includes(d.contentType))
        .reduce((s, d) => s + (d.uploaded || 0), 0);
    }
    return deliverables
      .filter(d => d.contentType === b.type)
      .reduce((s, d) => s + (d.uploaded || 0), 0);
  });

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: buckets.map(b => b.label),
      datasets: [
        {
          label: 'Promised',
          data: promised,
          backgroundColor: 'rgba(124,58,237,0.7)',
          borderColor: 'rgba(124,58,237,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: completed,
          backgroundColor: 'rgba(22,163,74,0.7)',
          borderColor: 'rgba(22,163,74,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...DARK_CHART_OPTIONS,
      plugins: {
        ...DARK_CHART_OPTIONS.plugins,
        legend: {
          ...DARK_CHART_OPTIONS.plugins.legend,
          position: 'top',
        },
      },
    },
  });

  _activeCharts.push(chart);
}

/**
 * Chart 2: Content by Workflow Status (Doughnut)
 */
function initWorkflowChart() {
  const canvas = document.getElementById('chart-workflow');
  if (!canvas) return;

  const tasks = getAll(COLLECTIONS.TASKS);

  const statusGroups = [
    { id: 'not-started',      label: 'Not Started',       color: '#6B7280' },
    { id: 'under-editing',    label: 'Under Editing',     color: '#3B82F6' },
    { id: 'cu-approval',      label: 'CU Approval',       color: '#D97706' },
    { id: 're-edit',          label: 'Re-Edit',           color: '#EF4444' },
    { id: 'buffer',           label: 'Buffer',            color: '#8B5CF6' },
    { id: 'client-approval',  label: 'Client Approval',   color: '#06B6D4' },
    { id: 'ready-to-upload',  label: 'Ready to Upload',   color: '#10B981' },
    { id: 'uploaded',         label: 'Uploaded',          color: '#14B8A6' },
  ];

  const counts = statusGroups.map(s => tasks.filter(t => t.status === s.id).length);

  // Only include statuses that have at least 1 task
  const filtered = statusGroups
    .map((s, i) => ({ ...s, count: counts[i] }))
    .filter(s => s.count > 0);

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: filtered.map(s => s.label),
      datasets: [
        {
          data: filtered.map(s => s.count),
          backgroundColor: filtered.map(s => s.color + 'CC'),
          borderColor: filtered.map(s => s.color),
          borderWidth: 1.5,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94A3B8',
            font: { size: 10, family: 'Inter, system-ui, sans-serif' },
            boxWidth: 10,
            padding: 8,
          },
        },
        tooltip: {
          backgroundColor: '#1A1D27',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''}`,
          },
        },
      },
    },
  });

  _activeCharts.push(chart);
}

/**
 * Chart 3: Workload by Employee (Horizontal Bar — top 8)
 */
function initWorkloadChart(month) {
  const canvas = document.getElementById('chart-workload');
  if (!canvas) return;

  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  const tasks = getAll(COLLECTIONS.TASKS).filter(t => !month || t.month === month);

  // Count tasks per employee (primary owner)
  const workloadMap = {};
  employees.forEach(emp => { workloadMap[emp.id] = { name: emp.name, role: emp.role, assigned: 0, completed: 0 }; });
  tasks.forEach(t => {
    if (t.primaryOwner && workloadMap[t.primaryOwner]) {
      workloadMap[t.primaryOwner].assigned++;
      if (t.status === 'uploaded') workloadMap[t.primaryOwner].completed++;
    }
  });

  // Sort by assigned desc, take top 8
  const sorted = Object.values(workloadMap)
    .filter(e => e.assigned > 0)
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 8);

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted.map(e => e.name.split(' ')[0]), // first name for brevity
      datasets: [
        {
          label: 'Assigned',
          data: sorted.map(e => e.assigned),
          backgroundColor: 'rgba(59,130,246,0.75)',
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: sorted.map(e => e.completed),
          backgroundColor: 'rgba(22,163,74,0.75)',
          borderColor: 'rgba(22,163,74,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...DARK_CHART_OPTIONS.plugins,
        legend: {
          ...DARK_CHART_OPTIONS.plugins.legend,
          position: 'top',
        },
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, precision: 0 },
          grid: { color: 'rgba(255,255,255,0.07)' },
          beginAtZero: true,
        },
        y: {
          ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });

  _activeCharts.push(chart);
}

/**
 * Chart 4: Client Health Scores (Bar)
 * Color each bar: green >=80, orange >=60, red <60
 */
function initHealthChart(month) {
  const canvas = document.getElementById('chart-health');
  if (!canvas) return;

  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');

  const clientScores = clients.map(c => {
    const stats = getClientStats(c.id, month);
    return {
      name: c.name.split(' ').slice(0, 2).join(' '), // shorten long names
      score: stats.healthScore,
    };
  });

  const barColors = clientScores.map(c => {
    if (c.score >= 80) return 'rgba(22,163,74,0.8)';
    if (c.score >= 60) return 'rgba(234,179,8,0.8)';
    return 'rgba(239,68,68,0.8)';
  });

  const borderColors = clientScores.map(c => {
    if (c.score >= 80) return 'rgba(22,163,74,1)';
    if (c.score >= 60) return 'rgba(234,179,8,1)';
    return 'rgba(239,68,68,1)';
  });

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: clientScores.map(c => c.name),
      datasets: [
        {
          label: 'Health Score',
          data: clientScores.map(c => c.score),
          backgroundColor: barColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1D27',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` Health Score: ${ctx.raw}/100`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8', font: { size: 10, family: 'Inter, system-ui, sans-serif' }, maxRotation: 30 },
          grid: { color: 'rgba(255,255,255,0.07)' },
        },
        y: {
          ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } },
          grid: { color: 'rgba(255,255,255,0.07)' },
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  _activeCharts.push(chart);
}

// ─── MAIN RENDER FUNCTION ─────────────────────────────────────

/**
 * Renders the full dashboard into `container`.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {string} currentMonth - ISO month string "YYYY-MM" (e.g. "2026-06").
 */
export default function renderDashboard(container, currentMonth) {
  // Destroy any leftover charts from a previous render
  cleanupDashboardCharts();

  // ── Fetch data ──────────────────────────────────────────────
  const stats = getDashboardStats(currentMonth);
  const alerts = generateAlerts();
  const monthLabel = formatMonthLabel(currentMonth);

  // ── Build HTML ──────────────────────────────────────────────
  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Agency overview for ${monthLabel || 'All Time'}</p>
      </div>
      <div class="page-actions">
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:6px 14px;font-size:13px;color:var(--text-secondary);">
          <span>📅</span>
          <span>${monthLabel || 'All Time'}</span>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    ${renderStatsGrid(stats)}

    <!-- Charts Grid -->
    ${renderChartsGrid()}

    <!-- Alerts Section -->
    ${renderAlertsSection(alerts)}
  `;

  // ── Initialize Charts (after DOM is ready) ──────────────────
  // Use requestAnimationFrame to ensure canvas elements are painted
  requestAnimationFrame(() => {
    initDeliverablesChart(currentMonth);
    initWorkflowChart();
    initWorkloadChart(currentMonth);
    initHealthChart(currentMonth);
  });
}
