// ============================================================
// CREATIVE UNIVERSE — Monthly Deliverables Page
// ============================================================

import { getAll, update, getClientStats, COLLECTIONS } from '../data/store.js';
import { showToast } from '../components/Toast.js';

// ─── STATE ────────────────────────────────────────────────────
let state = {
  filterClient: 'all',
  filterContentType: 'all',
  filterStatus: 'all',
  collapsedClients: new Set(),
  currentMonth: null,
};

// ─── HELPERS ─────────────────────────────────────────────────
function getCompletionPct(row) {
  if (!row.promised || row.promised === 0) return 0;
  return Math.round((row.uploaded / row.promised) * 100);
}

function getProgressColor(pct) {
  if (pct >= 100) return '#14B8A6';
  if (pct >= 75)  return '#22C55E';
  if (pct >= 50)  return '#F97316';
  return '#EF4444';
}

function getStatusBadge(pct) {
  if (pct >= 100) return { label: 'Done',        cls: 'badge-teal' };
  if (pct >= 80)  return { label: 'On Track',     cls: 'badge-green' };
  if (pct >= 50)  return { label: 'In Progress',  cls: 'badge-orange' };
  return            { label: 'Behind',            cls: 'badge-red' };
}

function getStatusFilterMatch(pct, filter) {
  if (filter === 'all') return true;
  if (filter === 'Complete')    return pct >= 100;
  if (filter === 'On Track')    return pct >= 80 && pct < 100;
  if (filter === 'In Progress') return pct >= 50 && pct < 80;
  if (filter === 'Behind')      return pct < 50;
  return true;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getMonthLabel(month) {
  if (!month) return '';
  const [y, m] = month.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderMonthlyDeliverables(container, currentMonth) {
  state.currentMonth = currentMonth;
  container.innerHTML = buildPage();
  attachEvents(container);
  renderTable(container);
}

function buildPage() {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Monthly Deliverables</h1>
        <p class="page-subtitle">Track promised vs delivered content by client and type</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
    </div>

    <div id="summary-stats" class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:24px;"></div>

    <div class="filters-row" style="margin-bottom:16px;">
      <select class="input input-sm" id="filter-client" style="min-width:160px;">
        <option value="all">All Clients</option>
      </select>
      <select class="input input-sm" id="filter-content-type" style="min-width:160px;">
        <option value="all">All Content Types</option>
      </select>
      <select class="input input-sm" id="filter-status" style="min-width:160px;">
        <option value="all">All Statuses</option>
        <option value="On Track">On Track</option>
        <option value="In Progress">In Progress</option>
        <option value="Behind">Behind</option>
        <option value="Complete">Complete</option>
      </select>
    </div>

    <div id="deliverables-table-wrap"></div>
  `;
}

// ─── EVENTS ──────────────────────────────────────────────────
function attachEvents(container) {
  // Populate selects
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const clientSel = container.querySelector('#filter-client');
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    clientSel.appendChild(opt);
  });

  const contentTypes = [...new Set(getAll(COLLECTIONS.MONTHLY_DELIVERABLES).map(d => d.contentType))];
  const ctSel = container.querySelector('#filter-content-type');
  contentTypes.forEach(ct => {
    const opt = document.createElement('option');
    opt.value = ct;
    opt.textContent = ct.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    ctSel.appendChild(opt);
  });

  clientSel.addEventListener('change', e => { state.filterClient = e.target.value; renderTable(container); });
  container.querySelector('#filter-content-type').addEventListener('change', e => { state.filterContentType = e.target.value; renderTable(container); });
  container.querySelector('#filter-status').addEventListener('change', e => { state.filterStatus = e.target.value; renderTable(container); });
  container.querySelector('#btn-export-csv').addEventListener('click', () => exportCSV(container));
}

// ─── SUMMARY STATS ────────────────────────────────────────────
function renderSummaryStats(container, deliverables) {
  const statsEl = container.querySelector('#summary-stats');
  if (!statsEl) return;

  const totalPromised   = deliverables.reduce((s, d) => s + (d.promised || 0), 0);
  const totalCompleted  = deliverables.reduce((s, d) => s + (d.completed || 0), 0);
  const totalInProgress = deliverables.reduce((s, d) => s + (d.inProgress || 0), 0);
  const totalUploaded   = deliverables.reduce((s, d) => s + (d.uploaded || 0), 0);
  const totalRemaining  = Math.max(0, totalPromised - totalUploaded);
  const overallPct      = totalPromised > 0 ? Math.round((totalUploaded / totalPromised) * 100) : 0;
  const color           = getProgressColor(overallPct);

  statsEl.innerHTML = `
    ${buildStatCard('Total Promised', totalPromised, '📦', '#7C3AED')}
    ${buildStatCard('Completed', totalCompleted, '✅', '#22C55E')}
    ${buildStatCard('In Progress', totalInProgress, '⚙️', '#3B82F6')}
    ${buildStatCard('Remaining', totalRemaining, '⏳', '#F97316')}
    ${buildStatCard('Overall Completion', overallPct + '%', '📊', color)}
  `;
}

function buildStatCard(label, value, icon, color) {
  return `
    <div class="stat-card" style="--stat-color:${color};">
      <div class="stat-card-header">
        <span class="stat-card-label">${label}</span>
        <span class="stat-card-icon">${icon}</span>
      </div>
      <div class="stat-card-value">${value}</div>
    </div>
  `;
}

// ─── TABLE RENDER ─────────────────────────────────────────────
function renderTable(container) {
  const allDeliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES);
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const employees = getAll(COLLECTIONS.EMPLOYEES);

  // Apply month filter
  let deliverables = state.currentMonth
    ? allDeliverables.filter(d => d.month === state.currentMonth)
    : allDeliverables;

  // Apply client filter
  if (state.filterClient !== 'all') {
    deliverables = deliverables.filter(d => d.clientId === state.filterClient);
  }

  // Apply content type filter
  if (state.filterContentType !== 'all') {
    deliverables = deliverables.filter(d => d.contentType === state.filterContentType);
  }

  // Apply status filter
  if (state.filterStatus !== 'all') {
    deliverables = deliverables.filter(d => {
      const pct = getCompletionPct(d);
      return getStatusFilterMatch(pct, state.filterStatus);
    });
  }

  renderSummaryStats(container, deliverables);

  // Group by client
  const clientMap = {};
  deliverables.forEach(d => {
    if (!clientMap[d.clientId]) clientMap[d.clientId] = [];
    clientMap[d.clientId].push(d);
  });

  const wrap = container.querySelector('#deliverables-table-wrap');
  if (!wrap) return;

  if (Object.keys(clientMap).length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No deliverables found</div>
        <div class="empty-state-sub">Try adjusting your filters</div>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-container">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:200px;">Client / Content Type</th>
              <th>Package</th>
              <th style="text-align:center;">Promised</th>
              <th style="text-align:center;">Completed</th>
              <th style="text-align:center;">In Progress</th>
              <th style="text-align:center;">Ready</th>
              <th style="text-align:center;">Uploaded</th>
              <th style="text-align:center;">Remaining</th>
              <th style="min-width:180px;">Completion</th>
              <th>Assigned</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody id="deliverables-tbody">
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = wrap.querySelector('#deliverables-tbody');
  const clientOrder = clients
    .filter(c => clientMap[c.id])
    .sort((a, b) => a.name.localeCompare(b.name));

  // Also add any clients not in the clients list
  Object.keys(clientMap).forEach(cid => {
    if (!clients.find(c => c.id === cid)) {
      clientOrder.push({ id: cid, name: clientMap[cid][0]?.clientName || cid, packageName: '' });
    }
  });

  clientOrder.forEach(client => {
    const rows = clientMap[client.id];
    if (!rows || rows.length === 0) return;

    const isCollapsed = state.collapsedClients.has(client.id);

    // Client overall stats
    const clientTotalPromised  = rows.reduce((s, d) => s + (d.promised || 0), 0);
    const clientTotalUploaded  = rows.reduce((s, d) => s + (d.uploaded || 0), 0);
    const clientOverallPct     = clientTotalPromised > 0
      ? Math.round((clientTotalUploaded / clientTotalPromised) * 100) : 0;
    const clientPctColor       = getProgressColor(clientOverallPct);
    const clientBadge          = getStatusBadge(clientOverallPct);

    // Find assigned SMM
    const fullClient = clients.find(c => c.id === client.id);
    const smm = fullClient?.assignedSMM
      ? employees.find(e => e.id === fullClient.assignedSMM)
      : null;

    // Client header row
    const clientRow = document.createElement('tr');
    clientRow.style.cssText = 'background:var(--bg-secondary);cursor:pointer;';
    clientRow.innerHTML = `
      <td colspan="11" style="padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="client-logo client-logo-sm" style="background:linear-gradient(135deg,var(--accent),#2563EB);">
            ${(client.name || '?')[0].toUpperCase()}
          </div>
          <span style="font-size:13px;font-weight:700;color:var(--text-primary);">${escapeHtml(client.name)}</span>
          ${fullClient?.packageName ? `<span style="font-size:11px;color:var(--text-muted);">${escapeHtml(fullClient.packageName)}</span>` : ''}
          <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:100px;height:6px;background:var(--bg-elevated);border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${clientOverallPct}%;background:${clientPctColor};border-radius:99px;transition:width 0.5s;"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:${clientPctColor};">${clientOverallPct}%</span>
            </div>
            <span class="badge ${clientBadge.cls}">${clientBadge.label}</span>
            <span style="font-size:13px;color:var(--text-muted);">${isCollapsed ? '▶' : '▼'}</span>
          </div>
        </div>
      </td>
    `;
    clientRow.dataset.clientId = client.id;
    clientRow.classList.add('client-header-row');
    tbody.appendChild(clientRow);

    // Content type rows
    rows.forEach(row => {
      const pct = getCompletionPct(row);
      const progressColor = getProgressColor(pct);
      const statusBadge = getStatusBadge(pct);
      const remaining = Math.max(0, (row.promised || 0) - (row.uploaded || 0));

      // Find assigned employee for this content type
      let assignedEmployee = null;
      if (fullClient) {
        if (row.contentType === 'reel') assignedEmployee = employees.find(e => e.id === fullClient.assignedVE);
        else if (row.contentType === 'static-post' || row.contentType === 'carousel') assignedEmployee = employees.find(e => e.id === fullClient.assignedGD);
        else assignedEmployee = employees.find(e => e.id === fullClient.assignedSMM);
      }
      const empInitials = assignedEmployee
        ? assignedEmployee.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

      const tr = document.createElement('tr');
      tr.dataset.clientId = client.id;
      tr.classList.add('content-row');
      if (isCollapsed) tr.style.display = 'none';

      tr.innerHTML = `
        <td style="padding-left:36px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:14px;">${getContentTypeIcon(row.contentType)}</span>
            <span style="font-size:13px;color:var(--text-secondary);">${escapeHtml(row.contentTypeName || row.contentType)}</span>
            ${row.carryForward > 0 ? `<span style="font-size:10px;background:var(--bg-orange);color:var(--color-orange);padding:2px 5px;border-radius:4px;" title="Carried forward from previous month">+${row.carryForward} CF</span>` : ''}
          </div>
        </td>
        <td class="cell-muted" style="font-size:12px;">${escapeHtml(fullClient?.packageName || '—')}</td>
        <td style="text-align:center;font-weight:600;">${row.promised || 0}</td>
        <td style="text-align:center;">
          <span class="editable-cell" data-row-id="${row.id}" data-field="completed" style="cursor:pointer;padding:2px 6px;border-radius:4px;transition:background 0.15s;">${row.completed || 0}</span>
        </td>
        <td style="text-align:center;">
          <span class="editable-cell" data-row-id="${row.id}" data-field="inProgress" style="cursor:pointer;padding:2px 6px;border-radius:4px;transition:background 0.15s;">${row.inProgress || 0}</span>
        </td>
        <td style="text-align:center;color:var(--text-muted);">${row.ready || 0}</td>
        <td style="text-align:center;font-weight:600;color:var(--color-teal);">${row.uploaded || 0}</td>
        <td style="text-align:center;color:${remaining > 0 ? 'var(--color-orange)' : 'var(--color-green)'};">${remaining}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="progress-bar" style="flex:1;height:6px;">
              <div class="progress-bar-fill" style="width:${pct}%;background:${progressColor};"></div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${progressColor};min-width:36px;text-align:right;">${pct}%</span>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="avatar avatar-sm" style="background:var(--accent);font-size:9px;" title="${assignedEmployee?.name || 'Unassigned'}">${empInitials}</div>
            <span style="font-size:11px;color:var(--text-muted);">${assignedEmployee?.name?.split(' ')[0] || '—'}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <span class="badge ${statusBadge.cls}">${statusBadge.label}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });

  // Attach collapse events
  tbody.querySelectorAll('.client-header-row').forEach(row => {
    row.addEventListener('click', () => {
      const clientId = row.dataset.clientId;
      const isCollapsed = state.collapsedClients.has(clientId);
      if (isCollapsed) state.collapsedClients.delete(clientId);
      else state.collapsedClients.add(clientId);
      // Toggle visibility of content rows
      tbody.querySelectorAll(`.content-row[data-client-id="${clientId}"]`).forEach(cr => {
        cr.style.display = isCollapsed ? '' : 'none';
      });
      // Toggle arrow
      const arrow = row.querySelector('span:last-child');
      if (arrow) arrow.textContent = isCollapsed ? '▼' : '▶';
    });
  });

  // Inline edit for completed / inProgress
  tbody.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      cell.style.background = 'var(--bg-elevated)';
    });
    cell.addEventListener('mouseleave', () => {
      cell.style.background = '';
    });
    cell.addEventListener('click', () => startInlineEdit(cell, container));
  });
}

// ─── INLINE EDIT ─────────────────────────────────────────────
function startInlineEdit(cell, container) {
  if (cell.querySelector('input')) return; // Already editing
  const rowId = cell.dataset.rowId;
  const field = cell.dataset.field;
  const currentVal = parseInt(cell.textContent.trim()) || 0;

  cell.innerHTML = `
    <input type="number" min="0" value="${currentVal}" style="
      width:52px;padding:2px 4px;background:var(--bg-input);
      border:1px solid var(--accent);border-radius:4px;
      font-size:12px;text-align:center;color:var(--text-primary);
    " class="inline-edit-input">
  `;
  const input = cell.querySelector('input');
  input.focus();
  input.select();

  const commit = () => {
    const newVal = parseInt(input.value) || 0;
    update(COLLECTIONS.MONTHLY_DELIVERABLES, rowId, { [field]: newVal });
    showToast('Updated', 'success');
    renderTable(container);
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') renderTable(container);
  });
}

// ─── EXPORT CSV ──────────────────────────────────────────────
function exportCSV(container) {
  const deliverables = state.currentMonth
    ? getAll(COLLECTIONS.MONTHLY_DELIVERABLES).filter(d => d.month === state.currentMonth)
    : getAll(COLLECTIONS.MONTHLY_DELIVERABLES);

  const clients = getAll(COLLECTIONS.CLIENTS);
  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = c; });

  const headers = ['Client', 'Package', 'Month', 'Content Type', 'Promised', 'Completed', 'In Progress', 'Ready', 'Uploaded', 'Remaining', 'Completion %', 'Carry Forward'];
  const rows = deliverables.map(d => {
    const client = clientMap[d.clientId];
    const pct = getCompletionPct(d);
    const remaining = Math.max(0, (d.promised || 0) - (d.uploaded || 0));
    return [
      client?.name || d.clientId,
      client?.packageName || '',
      d.month || '',
      d.contentTypeName || d.contentType,
      d.promised || 0,
      d.completed || 0,
      d.inProgress || 0,
      d.ready || 0,
      d.uploaded || 0,
      remaining,
      pct + '%',
      d.carryForward || 0,
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deliverables-${state.currentMonth || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully', 'success');
}

// ─── UTILITY ─────────────────────────────────────────────────
function getContentTypeIcon(ct) {
  const icons = {
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
  return icons[ct] || '📌';
}
