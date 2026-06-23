// ============================================================
// CREATIVE UNIVERSE — Client Profile Page (7 Tabs)
// ============================================================

import {
  getAll, getById, update, create, getClientStats,
  getHealthLabel, getStatusStyle, COLLECTIONS,
} from '../data/store.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';

// ─── HELPERS ──────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function fmtCurrency(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function avatarHTML(name, size = 36, gradient = '#7C3AED,#2563EB') {
  const initials = getInitials(name);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,${gradient});display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.35)}px;font-weight:700;color:#fff;flex-shrink:0;">${initials}</div>`;
}

function badgeHTML(label, color, bg) {
  return `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${color};background:${bg};white-space:nowrap;">${label}</span>`;
}

function healthRingSVG(score) {
  const h = getHealthLabel(score);
  const r = 36, c = 40, circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return `
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${h.color}" stroke-width="7"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 ${c} ${c})" style="transition:stroke-dashoffset 0.6s ease;"/>
      <text x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central"
        fill="${h.color}" font-size="14" font-weight="700" font-family="Inter,sans-serif">${score}</text>
    </svg>`;
}

const ROLE_CONFIG = [
  { key: 'assignedSMM', label: 'SMM',  icon: '📣', gradient: '#7C3AED,#9333EA' },
  { key: 'assignedVE',  label: 'VE',   icon: '🎬', gradient: '#2563EB,#3B82F6' },
  { key: 'assignedGD',  label: 'GD',   icon: '🎨', gradient: '#0891B2,#06B6D4' },
  { key: 'assignedCW',  label: 'CW',   icon: '✍️', gradient: '#D97706,#F59E0B' },
  { key: 'assignedSC',  label: 'SC',   icon: '📅', gradient: '#16A34A,#22C55E' },
  { key: 'assignedCAM', label: 'CAM',  icon: '📷', gradient: '#DC2626,#EF4444' },
];

const STORAGE_TYPES = [
  { key: 'driveLink',       label: 'Main Drive Folder',        icon: '📁' },
  { key: 'rawFootageLink',  label: 'Raw Footage Folder',       icon: '🎥' },
  { key: 'editedReelsLink', label: 'Edited Reels Folder',      icon: '🎬' },
  { key: 'graphicsLink',    label: 'Graphics Folder',          icon: '🎨' },
  { key: 'brandKitLink',    label: 'Brand Kit Folder',         icon: '💼' },
  { key: 'scriptsLink',     label: 'Scripts Folder',           icon: '📝' },
  { key: 'reportsLink',     label: 'Reports Folder',           icon: '📊' },
  { key: 'publishedLink',   label: 'Published Content Folder', icon: '📤' },
  { key: 'campaignLink',    label: 'Campaign Folder',          icon: '📢' },
  { key: 'photographyLink', label: 'Photography Folder',       icon: '📷' },
  { key: 'websiteLink',     label: 'Website Assets Folder',    icon: '🌐' },
];

// ─── TAB DEFINITIONS ──────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: '📋 Overview' },
  { id: 'team',         label: '👥 Team' },
  { id: 'deliverables', label: '📦 Monthly Deliverables' },
  { id: 'rawdata',      label: '🎥 Raw Data' },
  { id: 'content',      label: '✅ Content' },
  { id: 'storage',      label: '🔗 Storage' },
  { id: 'timeline',     label: '📅 Timeline' },
];

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderClientProfile(container, clientId, currentMonth) {
  const client = getById(COLLECTIONS.CLIENTS, clientId);
  if (!client) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-title">Client not found</div></div>`;
    return;
  }

  const stats = getClientStats(clientId, currentMonth);
  const healthInfo = getHealthLabel(stats.healthScore);

  // ── Page Header ──────────────────────────────────────────────
  const gradients = ['#7C3AED,#2563EB', '#DC2626,#F97316', '#16A34A,#0891B2', '#D97706,#DC2626', '#9333EA,#DB2777'];
  const gradientPick = gradients[(clientId.charCodeAt(clientId.length - 1)) % gradients.length];

  container.innerHTML = `
    <!-- Client Profile Header -->
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap;">
        <!-- Logo block -->
        <div style="width:80px;height:80px;border-radius:16px;background:linear-gradient(135deg,${gradientPick});display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          ${getInitials(client.name)}
        </div>

        <!-- Name + meta -->
        <div style="flex:1;min-width:200px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
            <h1 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;">${client.name}</h1>
            ${client.status ? badgeHTML(client.status, client.status === 'Active' ? '#16A34A' : '#EF4444', client.status === 'Active' ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)') : ''}
            ${badgeHTML(healthInfo.label, healthInfo.color, healthInfo.bg)}
          </div>
          <div style="color:var(--text-secondary);font-size:13px;margin-bottom:8px;">${client.businessName || ''} &bull; ${client.industry || ''} &bull; ${client.specialty || ''}</div>
          <div style="color:var(--text-muted);font-size:12px;display:flex;gap:16px;flex-wrap:wrap;">
            ${client.location ? `<span>📍 ${client.location}</span>` : ''}
            ${client.instagram ? `<a href="https://instagram.com/${client.instagram.replace('@','')}" target="_blank" style="color:var(--color-purple);text-decoration:none;">📸 ${client.instagram}</a>` : ''}
            ${client.website ? `<a href="https://${client.website}" target="_blank" style="color:var(--color-blue);text-decoration:none;">🌐 ${client.website}</a>` : ''}
          </div>
        </div>

        <!-- Health ring -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          ${healthRingSVG(stats.healthScore)}
          <span style="font-size:11px;color:${healthInfo.color};font-weight:600;">Health Score</span>
        </div>

        <!-- Package badge -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div style="background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(37,99,235,0.2));border:1px solid rgba(124,58,237,0.3);border-radius:10px;padding:8px 14px;text-align:right;">
            <div style="font-size:12px;color:var(--text-muted);">Package</div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${client.packageName || '—'}</div>
            <div style="font-size:16px;font-weight:800;color:#7C3AED;">${fmtCurrency(client.packagePrice)}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">/mo</span></div>
          </div>
          <!-- Quick actions -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="btn-edit-client" style="font-size:12px;padding:6px 12px;">✏️ Edit Profile</button>
            <button class="btn btn-primary btn-sm" id="btn-add-task" style="font-size:12px;padding:6px 12px;">➕ Add Task</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav" style="display:flex;gap:2px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:4px;margin-bottom:20px;overflow-x:auto;flex-wrap:nowrap;">
      ${TABS.map(t => `
        <button class="tab-btn${t.id === 'overview' ? ' active' : ''}" data-tab="${t.id}" style="
          flex:0 0 auto;padding:8px 16px;border:none;background:transparent;border-radius:var(--radius-md);
          font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:var(--transition);
          color:${t.id === 'overview' ? '#fff' : 'var(--text-secondary)'};
          background:${t.id === 'overview' ? 'var(--color-purple)' : 'transparent'};
        ">${t.label}</button>
      `).join('')}
    </div>

    <!-- Tab Content Area -->
    <div id="tab-content-area"></div>
  `;

  // ── Tab switching logic ──────────────────────────────────────
  let activeTab = 'overview';
  const contentArea = container.querySelector('#tab-content-area');

  function renderTab(tabId) {
    activeTab = tabId;
    // Update button styles
    container.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.style.color = isActive ? '#fff' : 'var(--text-secondary)';
      btn.style.background = isActive ? 'var(--color-purple)' : 'transparent';
    });
    // Render content
    switch (tabId) {
      case 'overview':     renderOverviewTab(contentArea, client, stats, currentMonth); break;
      case 'team':         renderTeamTab(contentArea, client); break;
      case 'deliverables': renderDeliverablesTab(contentArea, client, currentMonth); break;
      case 'rawdata':      renderRawDataTab(contentArea, client); break;
      case 'content':      renderContentTab(contentArea, client, currentMonth); break;
      case 'storage':      renderStorageTab(contentArea, client); break;
      case 'timeline':     renderTimelineTab(contentArea, client); break;
    }
  }

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => renderTab(btn.dataset.tab));
  });

  // Quick action buttons
  container.querySelector('#btn-edit-client')?.addEventListener('click', () => openEditClientModal(client, () => renderClientProfile(container, clientId, currentMonth)));
  container.querySelector('#btn-add-task')?.addEventListener('click', () => openAddTaskModal(client, currentMonth, () => renderTab(activeTab)));

  // Initial render
  renderTab('overview');
}

// ════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ════════════════════════════════════════════════════════════════
function renderOverviewTab(container, client, stats, currentMonth) {
  const employees = getAll(COLLECTIONS.EMPLOYEES);
  const getEmp = (id) => employees.find(e => e.id === id);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <!-- Contact Info -->
      <div class="card">
        <div class="card-header"><span class="card-title">📞 Contact Information</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;padding-top:4px;">
          ${infoRow('👤 Primary Contact', client.primaryContact)}
          ${infoRow('📞 Phone', client.phone ? `<a href="tel:${client.phone}" style="color:var(--color-blue);">${client.phone}</a>` : '—')}
          ${infoRow('📧 Email', client.email ? `<a href="mailto:${client.email}" style="color:var(--color-blue);">${client.email}</a>` : '—')}
          ${infoRow('💬 WhatsApp', client.whatsapp ? `<a href="${client.whatsapp}" target="_blank" style="color:#25D366;">Open Chat</a>` : '—')}
          ${infoRow('📁 Drive Link', client.driveLink ? `<a href="${client.driveLink}" target="_blank" style="color:var(--color-purple);">Open Drive</a>` : '<span style="color:var(--color-red);">Not Set</span>')}
        </div>
      </div>

      <!-- Package Info -->
      <div class="card">
        <div class="card-header"><span class="card-title">📦 Package Information</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;padding-top:4px;">
          ${infoRow('📋 Package', client.packageName || '—')}
          ${infoRow('💰 Monthly Price', fmtCurrency(client.packagePrice))}
          ${infoRow('📅 Start Date', fmtDate(client.packageStart))}
          ${infoRow('🔄 Renewal Date', fmtDate(client.packageRenewal))}
          ${infoRow('📊 Completion', `<span style="color:${stats.completionPct >= 70 ? 'var(--color-green)' : 'var(--color-orange)'};">${stats.completionPct}% (${stats.totalUploaded}/${stats.totalPromised})</span>`)}
        </div>
      </div>
    </div>

    <!-- Quick Stats Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${miniStat('🎬', 'Reels Promised', stats.reelsPromised, '#7C3AED')}
      ${miniStat('✅', 'Reels Uploaded', stats.reelsUploaded, '#16A34A')}
      ${miniStat('📥', 'Raw Available', stats.rawReelsAvailable, stats.rawReelsAvailable < stats.reelsRemaining ? '#EF4444' : '#D97706')}
      ${miniStat('⚠️', 'Overdue Tasks', stats.overdue, stats.overdue > 0 ? '#DC2626' : '#16A34A')}
    </div>

    <!-- Assigned Team -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header"><span class="card-title">👥 Assigned Team</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-top:8px;">
        ${ROLE_CONFIG.map(role => {
          const emp = getEmp(client[role.key]);
          return `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;display:flex;align-items:center;gap:10px;">
              ${emp ? avatarHTML(emp.name, 36, role.gradient) : `<div style="width:36px;height:36px;border-radius:50%;background:var(--bg-card);border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px;">${role.icon}</div>`}
              <div style="overflow:hidden;">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">${role.label}</div>
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${emp ? emp.name : 'Unassigned'}</div>
                ${emp ? `<div style="font-size:11px;color:var(--text-muted);">${emp.cuId}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Notes -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📝 Notes</span>
        <button class="btn btn-secondary btn-sm" id="btn-save-notes" style="font-size:12px;padding:5px 10px;">Save Notes</button>
      </div>
      <textarea id="client-notes" style="width:100%;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;color:var(--text-primary);font-size:13px;resize:vertical;min-height:120px;box-sizing:border-box;margin-top:8px;font-family:inherit;line-height:1.5;">${client.notes || ''}</textarea>
    </div>
  `;

  container.querySelector('#btn-save-notes')?.addEventListener('click', () => {
    const notes = container.querySelector('#client-notes').value;
    update(COLLECTIONS.CLIENTS, client.id, { notes });
    showToast('Notes saved successfully', 'success');
  });
}

function infoRow(label, valueHTML) {
  return `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:12px;color:var(--text-muted);min-width:140px;flex-shrink:0;">${label}</span>
      <span style="font-size:13px;color:var(--text-primary);font-weight:500;">${valueHTML || '—'}</span>
    </div>`;
}

function miniStat(icon, label, value, color) {
  return `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:center;">
      <div style="font-size:20px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:24px;font-weight:800;color:${color};">${value}</div>
      <div style="font-size:11px;color:var(--text-muted);">${label}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// TAB 2: TEAM
// ════════════════════════════════════════════════════════════════
function renderTeamTab(container, client) {
  const employees = getAll(COLLECTIONS.EMPLOYEES);
  const getEmp = (id) => employees.find(e => e.id === id);

  const rows = ROLE_CONFIG.map(role => {
    const emp = getEmp(client[role.key]);
    return { role, emp };
  });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">👥 Assigned Team Members</span>
        <button class="btn btn-primary btn-sm" id="btn-change-team" style="font-size:12px;">✏️ Reassign Team</button>
      </div>
      <div style="overflow-x:auto;margin-top:12px;">
        <table class="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>CU-ID</th>
              <th>Department</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ role, emp }) => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    ${emp ? avatarHTML(emp.name, 32, role.gradient) : `<div style="width:32px;height:32px;border-radius:50%;background:var(--bg-surface);border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;">${role.icon}</div>`}
                    <div>
                      <div style="font-weight:600;color:var(--text-primary);">${emp ? emp.name : '<span style="color:var(--text-muted);font-style:italic;">Unassigned</span>'}</div>
                      <div style="font-size:11px;color:var(--text-muted);">${emp ? emp.email : ''}</div>
                    </div>
                  </div>
                </td>
                <td>${badgeHTML(role.label, '#7C3AED', 'rgba(124,58,237,0.15)')}</td>
                <td><span style="font-family:monospace;font-size:12px;color:var(--text-secondary);">${emp ? emp.cuId : '—'}</span></td>
                <td style="color:var(--text-secondary);font-size:13px;">${emp ? (emp.departmentName || emp.department) : '—'}</td>
                <td>${emp ? badgeHTML(emp.status, emp.status === 'Active' ? '#16A34A' : '#EF4444', emp.status === 'Active' ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)') : '—'}</td>
                <td style="font-size:12px;color:var(--text-muted);">${emp ? fmtDate(emp.joiningDate) : '—'}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" data-role="${role.key}" data-label="${role.label}" style="font-size:11px;padding:4px 8px;">
                    ${emp ? '🔄 Change' : '➕ Assign'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roleKey = btn.dataset.role;
      const roleLabel = btn.dataset.label;
      openAssignEmployeeModal(client, roleKey, roleLabel, () => {
        const updatedClient = getById(COLLECTIONS.CLIENTS, client.id);
        renderTeamTab(container, updatedClient);
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════
// TAB 3: MONTHLY DELIVERABLES
// ════════════════════════════════════════════════════════════════
function renderDeliverablesTab(container, client, currentMonth) {
  const allDeliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES).filter(d => d.clientId === client.id);
  const months = [...new Set(allDeliverables.map(d => d.month))].sort((a, b) => b.localeCompare(a));
  if (currentMonth && !months.includes(currentMonth)) months.unshift(currentMonth);

  let selectedMonth = currentMonth || (months[0] || new Date().toISOString().slice(0, 7));

  function renderContent(month) {
    const deliverables = allDeliverables.filter(d => d.month === month);
    const totalPromised = deliverables.reduce((s, d) => s + (d.promised || 0), 0);
    const totalUploaded = deliverables.reduce((s, d) => s + (d.uploaded || 0), 0);
    const overallPct = totalPromised > 0 ? Math.round((totalUploaded / totalPromised) * 100) : 0;

    return `
      <!-- Month filter + summary -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
        <select id="month-select" class="input" style="width:auto;padding:6px 12px;font-size:13px;">
          ${months.map(m => `<option value="${m}" ${m === month ? 'selected' : ''}>${formatMonthLabel(m)}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btn-add-deliverable" style="font-size:12px;">➕ Add Row</button>
        <div style="margin-left:auto;display:flex;gap:16px;">
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:700;color:var(--color-purple);">${totalPromised}</div>
            <div style="font-size:11px;color:var(--text-muted);">Promised</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:700;color:var(--color-green);">${totalUploaded}</div>
            <div style="font-size:11px;color:var(--text-muted);">Uploaded</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:700;color:${overallPct >= 70 ? 'var(--color-green)' : 'var(--color-orange)'};">${overallPct}%</div>
            <div style="font-size:11px;color:var(--text-muted);">Overall</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div style="overflow-x:auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Content Type</th>
                <th style="text-align:center;">Promised</th>
                <th style="text-align:center;">Completed</th>
                <th style="text-align:center;">In Progress</th>
                <th style="text-align:center;">Ready</th>
                <th style="text-align:center;">Uploaded</th>
                <th style="text-align:center;">Remaining</th>
                <th style="min-width:120px;">Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${deliverables.length === 0
                ? `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px;">No deliverables set for this month.</td></tr>`
                : deliverables.map(d => {
                  const remaining = Math.max(0, (d.promised || 0) - (d.uploaded || 0));
                  const pct = d.promised > 0 ? Math.round((d.uploaded / d.promised) * 100) : 0;
                  const statusColor = pct >= 100 ? '#16A34A' : pct >= 50 ? '#D97706' : '#EF4444';
                  const statusLabel = pct >= 100 ? 'Complete' : pct >= 50 ? 'In Progress' : 'Behind';
                  return `
                    <tr data-deliverable-id="${d.id}">
                      <td>
                        <div style="font-weight:600;color:var(--text-primary);">${d.contentTypeName || d.contentType}</div>
                      </td>
                      <td style="text-align:center;"><span class="editable-num" data-field="promised" data-id="${d.id}" style="cursor:pointer;color:var(--text-primary);font-weight:600;">${d.promised || 0}</span></td>
                      <td style="text-align:center;color:var(--color-blue);">${d.completed || 0}</td>
                      <td style="text-align:center;color:var(--color-orange);">${d.inProgress || 0}</td>
                      <td style="text-align:center;color:var(--color-purple);">${d.ready || 0}</td>
                      <td style="text-align:center;"><span class="editable-num" data-field="uploaded" data-id="${d.id}" style="cursor:pointer;color:var(--color-green);font-weight:600;">${d.uploaded || 0}</span></td>
                      <td style="text-align:center;color:${remaining > 0 ? 'var(--color-red)' : 'var(--color-green)'};">${remaining}</td>
                      <td>
                        <div style="background:var(--bg-surface);border-radius:4px;height:8px;overflow:hidden;">
                          <div style="height:100%;width:${Math.min(100,pct)}%;background:${statusColor};border-radius:4px;transition:width 0.4s ease;"></div>
                        </div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${pct}%</div>
                      </td>
                      <td>${badgeHTML(statusLabel, statusColor, statusColor + '22')}</td>
                    </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  container.innerHTML = renderContent(selectedMonth);

  // Month filter
  container.querySelector('#month-select')?.addEventListener('change', (e) => {
    selectedMonth = e.target.value;
    container.innerHTML = renderContent(selectedMonth);
    attachDeliverableHandlers();
  });

  function attachDeliverableHandlers() {
    container.querySelector('#month-select')?.addEventListener('change', (e) => {
      selectedMonth = e.target.value;
      container.innerHTML = renderContent(selectedMonth);
      attachDeliverableHandlers();
    });

    container.querySelector('#btn-add-deliverable')?.addEventListener('click', () => {
      openAddDeliverableModal(client, selectedMonth, () => {
        const refreshed = getAll(COLLECTIONS.MONTHLY_DELIVERABLES).filter(d => d.clientId === client.id);
        const months2 = [...new Set(refreshed.map(d => d.month))].sort((a, b) => b.localeCompare(a));
        container.innerHTML = renderContent(selectedMonth);
        attachDeliverableHandlers();
      });
    });

    container.querySelectorAll('.editable-num').forEach(span => {
      span.addEventListener('click', () => {
        const field = span.dataset.field;
        const id = span.dataset.id;
        const current = parseInt(span.textContent) || 0;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = current;
        input.min = 0;
        input.style.cssText = 'width:50px;background:var(--bg-surface);border:1px solid var(--color-purple);border-radius:4px;padding:2px 4px;color:var(--text-primary);font-size:13px;text-align:center;';
        span.replaceWith(input);
        input.focus();
        input.select();
        const save = () => {
          const val = parseInt(input.value) || 0;
          update(COLLECTIONS.MONTHLY_DELIVERABLES, id, { [field]: val });
          container.innerHTML = renderContent(selectedMonth);
          attachDeliverableHandlers();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
      });
    });
  }

  attachDeliverableHandlers();
}

// ════════════════════════════════════════════════════════════════
// TAB 4: RAW DATA
// ════════════════════════════════════════════════════════════════
function renderRawDataTab(container, client) {
  function renderContent() {
    const rawData = getAll(COLLECTIONS.RAW_DATA).filter(r => r.clientId === client.id);
    const statusColors = {
      'Available': '#16A34A', 'Partially Used': '#D97706', 'Assigned for Editing': '#2563EB',
      'Fully Used': '#6B7280', 'Rejected': '#DC2626', 'Hold for Later': '#7C3AED', 'Missing Link': '#EF4444',
    };

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">🎥 Raw Video Inventory</span>
          <button class="btn btn-primary btn-sm" id="btn-add-raw" style="font-size:12px;">➕ Add Raw Data</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0;font-size:12px;text-align:center;">
          <div style="background:rgba(22,163,74,0.1);border-radius:var(--radius-md);padding:10px;">
            <div style="font-size:20px;font-weight:700;color:#16A34A;">${rawData.filter(r => r.status === 'Available').length}</div>
            <div style="color:var(--text-muted);">Available</div>
          </div>
          <div style="background:rgba(217,119,6,0.1);border-radius:var(--radius-md);padding:10px;">
            <div style="font-size:20px;font-weight:700;color:#D97706;">${rawData.filter(r => r.status === 'Partially Used').length}</div>
            <div style="color:var(--text-muted);">Partially Used</div>
          </div>
          <div style="background:rgba(107,114,128,0.1);border-radius:var(--radius-md);padding:10px;">
            <div style="font-size:20px;font-weight:700;color:#6B7280;">${rawData.filter(r => r.status === 'Fully Used').length}</div>
            <div style="color:var(--text-muted);">Fully Used</div>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Raw ID</th>
                <th>Shoot Date</th>
                <th>Topic</th>
                <th>Speaker</th>
                <th>Duration</th>
                <th style="text-align:center;">Est. Reels</th>
                <th style="text-align:center;">Created</th>
                <th style="text-align:center;">Remaining</th>
                <th>Status</th>
                <th>Drive Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rawData.length === 0
                ? `<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:24px;">No raw data recorded.</td></tr>`
                : rawData.map(r => {
                  const remaining = Math.max(0, (r.estimatedReels || 0) - (r.reelsCreated || 0));
                  const sc = statusColors[r.status] || '#6B7280';
                  return `
                    <tr>
                      <td><span style="font-family:monospace;font-size:11px;color:var(--text-muted);">${r.id}</span></td>
                      <td style="font-size:12px;">${fmtDate(r.shootDate)}</td>
                      <td style="font-weight:600;color:var(--text-primary);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${r.topic}">${r.topic || '—'}</td>
                      <td style="font-size:12px;color:var(--text-secondary);">${r.speaker || '—'}</td>
                      <td style="font-size:12px;color:var(--text-muted);">${r.duration || '—'}</td>
                      <td style="text-align:center;font-weight:600;">${r.estimatedReels || 0}</td>
                      <td style="text-align:center;color:var(--color-blue);">${r.reelsCreated || 0}</td>
                      <td style="text-align:center;color:${remaining > 0 ? '#16A34A' : '#6B7280'};font-weight:600;">${remaining}</td>
                      <td>${badgeHTML(r.status || 'Unknown', sc, sc + '22')}</td>
                      <td>${r.driveLink ? `<a href="${r.driveLink}" target="_blank" style="color:var(--color-purple);font-size:12px;">🔗 Open</a>` : '<span style="color:var(--color-red);font-size:12px;">Missing</span>'}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm edit-raw-btn" data-raw-id="${r.id}" style="font-size:11px;padding:4px 8px;">✏️ Edit</button>
                      </td>
                    </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  container.innerHTML = renderContent();

  function attachHandlers() {
    container.querySelector('#btn-add-raw')?.addEventListener('click', () => {
      openAddRawModal(client, () => { container.innerHTML = renderContent(); attachHandlers(); });
    });
    container.querySelectorAll('.edit-raw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rawId = btn.dataset.rawId;
        const raw = getById(COLLECTIONS.RAW_DATA, rawId);
        if (raw) openEditRawModal(raw, () => { container.innerHTML = renderContent(); attachHandlers(); });
      });
    });
  }

  attachHandlers();
}

// ════════════════════════════════════════════════════════════════
// TAB 5: CONTENT PRODUCTION
// ════════════════════════════════════════════════════════════════
function renderContentTab(container, client, currentMonth) {
  let filterStatus = 'all';
  let filterType = 'all';

  function renderContent() {
    const allTasks = getAll(COLLECTIONS.TASKS).filter(t => t.clientId === client.id);
    const contentTypes = [...new Set(allTasks.map(t => t.contentType).filter(Boolean))];
    const filtered = allTasks.filter(t =>
      (filterStatus === 'all' || t.status === filterStatus) &&
      (filterType === 'all' || t.contentType === filterType)
    );

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">✅ Content Tasks</span>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="filter-status" class="input" style="width:auto;padding:5px 10px;font-size:12px;">
              <option value="all">All Statuses</option>
              <option value="not-started">Not Started</option>
              <option value="under-editing">Under Editing</option>
              <option value="cu-approval">CU Approval</option>
              <option value="re-edit">Re-Edit</option>
              <option value="buffer">Buffer</option>
              <option value="client-approval">Client Approval</option>
              <option value="ready-to-upload">Ready to Upload</option>
              <option value="uploaded">Uploaded</option>
            </select>
            <select id="filter-type" class="input" style="width:auto;padding:5px 10px;font-size:12px;">
              <option value="all">All Types</option>
              ${contentTypes.map(ct => `<option value="${ct}">${ct}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" id="btn-add-content-task" style="font-size:12px;">➕ Add Task</button>
          </div>
        </div>
        <div style="overflow-x:auto;margin-top:12px;">
          <table class="table">
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0
                ? `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No tasks matching filters.</td></tr>`
                : filtered.map(task => {
                  const ss = getStatusStyle(task.status);
                  const priorityColors = { 'Urgent': '#DC2626', 'High': '#D97706', 'Normal': '#2563EB', 'Low': '#6B7280' };
                  const pc = priorityColors[task.priority] || '#6B7280';
                  const isOverdue = task.daysOverdue > 0 || (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'uploaded');
                  return `
                    <tr>
                      <td><span style="font-family:monospace;font-size:11px;color:var(--text-muted);">${task.contentId || task.id}</span></td>
                      <td>
                        <div style="font-weight:600;color:var(--text-primary);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${task.title}">${task.title}</div>
                        ${task.daysOverdue > 0 ? `<div style="font-size:10px;color:var(--color-red);">⚠️ ${task.daysOverdue}d overdue</div>` : ''}
                      </td>
                      <td><span style="font-size:12px;color:var(--text-secondary);">${task.contentTypeName || task.contentType || '—'}</span></td>
                      <td>${badgeHTML(ss.label, ss.color, ss.bg)}</td>
                      <td>${task.priority ? badgeHTML(task.priority, pc, pc + '22') : '—'}</td>
                      <td>
                        ${task.primaryOwnerName
                          ? `<div style="display:flex;align-items:center;gap:6px;">${avatarHTML(task.primaryOwnerName, 24)}<span style="font-size:12px;">${task.primaryOwnerName.split(' ')[0]}</span></div>`
                          : '<span style="color:var(--color-red);font-size:12px;">Unassigned</span>'}
                      </td>
                      <td style="font-size:12px;color:${isOverdue ? 'var(--color-red)' : 'var(--text-muted)'};">${fmtDate(task.deadline)}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm view-task-btn" data-task-id="${task.id}" style="font-size:11px;padding:4px 8px;">👁 View</button>
                      </td>
                    </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  container.innerHTML = renderContent();

  function attachHandlers() {
    const statusSel = container.querySelector('#filter-status');
    const typeSel = container.querySelector('#filter-type');
    if (statusSel) { statusSel.value = filterStatus; statusSel.addEventListener('change', e => { filterStatus = e.target.value; container.innerHTML = renderContent(); attachHandlers(); }); }
    if (typeSel) { typeSel.value = filterType; typeSel.addEventListener('change', e => { filterType = e.target.value; container.innerHTML = renderContent(); attachHandlers(); }); }

    container.querySelector('#btn-add-content-task')?.addEventListener('click', () => {
      openAddTaskModal(client, currentMonth, () => { container.innerHTML = renderContent(); attachHandlers(); });
    });

    container.querySelectorAll('.view-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = getById(COLLECTIONS.TASKS, btn.dataset.taskId);
        if (task) openTaskDetailModal(task, () => { container.innerHTML = renderContent(); attachHandlers(); });
      });
    });
  }

  attachHandlers();
}

// ════════════════════════════════════════════════════════════════
// TAB 6: STORAGE LINKS
// ════════════════════════════════════════════════════════════════
function renderStorageTab(container, client) {
  function renderContent() {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">🔗 Storage Links</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:16px;">
          ${STORAGE_TYPES.map(st => {
            const link = client[st.key];
            return `
              <div style="background:var(--bg-surface);border:1px solid ${link ? 'var(--border)' : 'rgba(239,68,68,0.3)'};border-radius:var(--radius-md);padding:16px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <span style="font-size:22px;">${st.icon}</span>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${st.label}</div>
                </div>
                ${link
                  ? `<a href="${link}" target="_blank" style="display:block;color:var(--color-purple);font-size:12px;margin-bottom:10px;word-break:break-all;">🔗 Open Link</a>`
                  : `<div style="color:var(--color-red);font-size:12px;margin-bottom:10px;">❌ Not Set</div>`}
                <button class="btn btn-secondary btn-sm edit-link-btn" data-key="${st.key}" data-label="${st.label}" style="font-size:11px;padding:4px 8px;width:100%;">
                  ${link ? '✏️ Edit Link' : '➕ Add Link'}
                </button>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = renderContent();

  container.querySelectorAll('.edit-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const label = btn.dataset.label;
      const current = client[key] || '';
      openModal({
        title: `${current ? 'Edit' : 'Add'} ${label}`,
        size: 'lg',
        body: `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <label style="font-size:13px;color:var(--text-secondary);">Google Drive Link</label>
            <input type="url" id="storage-link-input" class="input" placeholder="https://drive.google.com/..." value="${current}" style="width:100%;box-sizing:border-box;">
          </div>`,
        footer: `
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
            <button class="btn btn-primary modal-save-link-btn">Save Link</button>
          </div>`,
      });
      setTimeout(() => {
        document.querySelector('.modal-cancel-btn')?.addEventListener('click', closeModal);
        document.querySelector('.modal-save-link-btn')?.addEventListener('click', () => {
          const val = document.querySelector('#storage-link-input')?.value.trim();
          update(COLLECTIONS.CLIENTS, client.id, { [key]: val || null });
          // Update local client object
          client[key] = val || null;
          closeModal();
          container.innerHTML = renderContent();
          attachStorageHandlers();
          showToast('Link saved', 'success');
        });
      }, 50);
    });
  });

  function attachStorageHandlers() {
    container.querySelectorAll('.edit-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Re-attach logic by re-rendering
        const updatedClient = getById(COLLECTIONS.CLIENTS, client.id);
        Object.assign(client, updatedClient);
        renderStorageTab(container, client);
      });
    });
  }
}

// ════════════════════════════════════════════════════════════════
// TAB 7: TIMELINE
// ════════════════════════════════════════════════════════════════
function renderTimelineTab(container, client) {
  const tasks = getAll(COLLECTIONS.TASKS).filter(t => t.clientId === client.id);
  const rawData = getAll(COLLECTIONS.RAW_DATA).filter(r => r.clientId === client.id);
  const employees = getAll(COLLECTIONS.EMPLOYEES);

  // Build events from tasks
  const events = [];
  tasks.forEach(task => {
    const ss = getStatusStyle(task.status);
    events.push({
      date: new Date(task.updatedAt || task.createdAt),
      icon: '✅',
      color: ss.color,
      title: `Task updated: "${task.title}"`,
      desc: `Status → ${ss.label}`,
      type: 'task',
    });
    if (task.createdAt && task.createdAt !== task.updatedAt) {
      events.push({
        date: new Date(task.createdAt),
        icon: '➕',
        color: '#7C3AED',
        title: `Task created: "${task.title}"`,
        desc: `${task.contentTypeName || task.contentType} · ${task.primaryOwnerName || 'Unassigned'}`,
        type: 'create',
      });
    }
  });
  rawData.forEach(r => {
    events.push({
      date: new Date(r.shootDate),
      icon: '🎥',
      color: '#0891B2',
      title: `Shoot: ${r.topic}`,
      desc: `${r.estimatedReels} est. reels · ${r.status}`,
      type: 'shoot',
    });
  });

  events.sort((a, b) => b.date - a.date);

  const typeLabels = { task: 'Task Update', create: 'Task Created', shoot: 'Raw Shoot' };
  const typeBg = { task: 'rgba(22,163,74,0.15)', create: 'rgba(124,58,237,0.15)', shoot: 'rgba(8,145,178,0.15)' };

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">📅 Activity Timeline</span></div>
      <div style="padding-top:8px;">
        ${events.length === 0
          ? `<div class="empty-state" style="padding:24px;"><div class="empty-state-icon">📅</div><div class="empty-state-title">No activity yet</div></div>`
          : events.slice(0, 40).map((ev, i) => `
              <div style="display:flex;gap:16px;padding:12px 0;border-bottom:${i < events.length - 1 ? '1px solid var(--border)' : 'none'};">
                <div style="display:flex;flex-direction:column;align-items:center;min-width:40px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:${ev.color}22;border:2px solid ${ev.color};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${ev.icon}</div>
                  ${i < events.length - 1 ? `<div style="width:2px;flex:1;background:var(--border);margin-top:4px;min-height:20px;"></div>` : ''}
                </div>
                <div style="flex:1;padding-top:6px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                    <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${ev.title}</span>
                    ${badgeHTML(typeLabels[ev.type] || ev.type, ev.color, typeBg[ev.type] || ev.color + '22')}
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);">${ev.desc}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${ev.date.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                </div>
              </div>
            `).join('')}
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════════════

function openEditClientModal(client, onSave) {
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="grid-column:1/-1;">
        <label class="form-label">Client Name *</label>
        <input class="input" id="edit-name" value="${client.name || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Business Name</label>
        <input class="input" id="edit-biz" value="${client.businessName || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Industry</label>
        <input class="input" id="edit-industry" value="${client.industry || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Specialty</label>
        <input class="input" id="edit-specialty" value="${client.specialty || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Location</label>
        <input class="input" id="edit-location" value="${client.location || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Instagram Handle</label>
        <input class="input" id="edit-instagram" value="${client.instagram || ''}" style="width:100%;box-sizing:border-box;" placeholder="@handle">
      </div>
      <div>
        <label class="form-label">Website</label>
        <input class="input" id="edit-website" value="${client.website || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Primary Contact</label>
        <input class="input" id="edit-contact" value="${client.primaryContact || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Phone</label>
        <input class="input" id="edit-phone" value="${client.phone || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Email</label>
        <input class="input" id="edit-email" value="${client.email || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Status</label>
        <select class="input" id="edit-status" style="width:100%;box-sizing:border-box;">
          ${['Active','Inactive','On Hold','Churned'].map(s => `<option value="${s}" ${client.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Package Price (₹)</label>
        <input class="input" id="edit-price" type="number" value="${client.packagePrice || ''}" style="width:100%;box-sizing:border-box;">
      </div>
    </div>`;

  openModal({
    title: '✏️ Edit Client Profile',
    size: 'xl',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Save Changes</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      const changes = {
        name: document.querySelector('#edit-name')?.value.trim(),
        businessName: document.querySelector('#edit-biz')?.value.trim(),
        industry: document.querySelector('#edit-industry')?.value.trim(),
        specialty: document.querySelector('#edit-specialty')?.value.trim(),
        location: document.querySelector('#edit-location')?.value.trim(),
        instagram: document.querySelector('#edit-instagram')?.value.trim(),
        website: document.querySelector('#edit-website')?.value.trim(),
        primaryContact: document.querySelector('#edit-contact')?.value.trim(),
        phone: document.querySelector('#edit-phone')?.value.trim(),
        email: document.querySelector('#edit-email')?.value.trim(),
        status: document.querySelector('#edit-status')?.value,
        packagePrice: parseFloat(document.querySelector('#edit-price')?.value) || client.packagePrice,
      };
      update(COLLECTIONS.CLIENTS, client.id, changes);
      closeModal();
      showToast('Client profile updated', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openAssignEmployeeModal(client, roleKey, roleLabel, onSave) {
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active' || e.status === 'Freelancer Available');
  const body = `
    <div>
      <label class="form-label">Select Employee for ${roleLabel}</label>
      <select class="input" id="assign-emp-select" style="width:100%;box-sizing:border-box;">
        <option value="">— Unassign —</option>
        ${employees.map(e => `<option value="${e.id}" ${client[roleKey] === e.id ? 'selected' : ''}>${e.name} (${e.cuId}) — ${e.role}</option>`).join('')}
      </select>
    </div>`;

  openModal({
    title: `👥 Assign ${roleLabel}`,
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Assign</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      const empId = document.querySelector('#assign-emp-select')?.value || null;
      const emp = employees.find(e => e.id === empId);
      const nameKey = roleKey.replace('assigned', 'assigned') + 'Name';
      update(COLLECTIONS.CLIENTS, client.id, { [roleKey]: empId || null });
      closeModal();
      showToast(`${roleLabel} ${emp ? 'assigned to ' + emp.name : 'unassigned'}`, 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openAddTaskModal(client, currentMonth, onSave) {
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  let contentTypes = getAll(COLLECTIONS.CONTENT_TYPES);
  if (!contentTypes || contentTypes.length === 0) {
    contentTypes = [
      { id: 'reel', name: 'Reel', icon: '🎬' },
      { id: 'static-post', name: 'Static Post', icon: '🖼️' },
      { id: 'carousel', name: 'Carousel', icon: '📱' },
      { id: 'story', name: 'Story', icon: '⭕' },
      { id: 'other', name: 'Other', icon: '📌' },
    ];
  }
  const today = new Date().toISOString().split('T')[0];
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="grid-column:1/-1;">
        <label class="form-label">Task Title *</label>
        <input class="input" id="task-title" placeholder="e.g. Dr. Neel — Health Tips Reel" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Content Type</label>
        <select class="input" id="task-type" style="width:100%;box-sizing:border-box;">
          ${contentTypes.map(ct => `<option value="${ct.id}">${ct.icon} ${ct.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Priority</label>
        <select class="input" id="task-priority" style="width:100%;box-sizing:border-box;">
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
      <div>
        <label class="form-label">Primary Owner</label>
        <select class="input" id="task-owner" style="width:100%;box-sizing:border-box;">
          <option value="">— Unassigned —</option>
          ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Deadline</label>
        <input class="input" id="task-deadline" type="date" value="${today}" style="width:100%;box-sizing:border-box;">
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">Notes</label>
        <textarea class="input" id="task-notes" rows="2" style="width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>
      </div>
    </div>`;

  openModal({
    title: '➕ Add Content Task',
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Create Task</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      const title = document.querySelector('#task-title')?.value.trim();
      if (!title) { showToast('Please enter a task title', 'error'); return; }
      const typeEl = document.querySelector('#task-type');
      const ownerEl = document.querySelector('#task-owner');
      const ownerEmp = employees.find(e => e.id === ownerEl?.value);
      const typeNames = { reel: 'Reel', 'static-post': 'Static Post', carousel: 'Carousel', story: 'Story', 'festival-post': 'Festival Post', 'monthly-report': 'Monthly Report', other: 'Other' };
      create(COLLECTIONS.TASKS, {
        clientId: client.id,
        clientName: client.name,
        title,
        contentType: typeEl?.value || 'reel',
        contentTypeName: typeNames[typeEl?.value] || typeEl?.value,
        priority: document.querySelector('#task-priority')?.value || 'Normal',
        primaryOwner: ownerEl?.value || null,
        primaryOwnerName: ownerEmp?.name || null,
        deadline: document.querySelector('#task-deadline')?.value || null,
        notes: document.querySelector('#task-notes')?.value || '',
        status: 'not-started',
        month: currentMonth,
        revisionCount: 0,
        daysOverdue: 0,
        supportMembers: [],
        tags: [],
        contentId: `CU-${Date.now().toString().slice(-4)}`,
      });
      closeModal();
      showToast('Task created', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openTaskDetailModal(task, onSave) {
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  const ss = getStatusStyle(task.status);
  const body = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${task.contentId || task.id}</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">${task.title}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${badgeHTML(ss.label, ss.color, ss.bg)}
            ${task.priority ? badgeHTML(task.priority, '#D97706', 'rgba(217,119,6,0.15)') : ''}
            ${task.contentTypeName ? badgeHTML(task.contentTypeName, '#2563EB', 'rgba(37,99,235,0.15)') : ''}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${infoRow('Client', task.clientName)}
        ${infoRow('Deadline', fmtDate(task.deadline))}
        ${infoRow('Primary Owner', task.primaryOwnerName || 'Unassigned')}
        ${infoRow('Reviewer', task.reviewerName || '—')}
        ${infoRow('Revision Count', String(task.revisionCount || 0))}
        ${infoRow('Days Overdue', task.daysOverdue > 0 ? `<span style="color:var(--color-red);">${task.daysOverdue} days</span>` : '—')}
      </div>
      <div>
        <label class="form-label">Update Status</label>
        <select class="input" id="task-status-update" style="width:100%;box-sizing:border-box;">
          ${['not-started','under-editing','cu-approval','re-edit','buffer','client-approval','ready-to-upload','uploaded'].map(s => {
            const lbl = getStatusStyle(s).label;
            return `<option value="${s}" ${task.status === s ? 'selected' : ''}>${lbl}</option>`;
          }).join('')}
        </select>
      </div>
      ${task.notes ? `<div><label class="form-label">Notes</label><div style="background:var(--bg-surface);border-radius:var(--radius-md);padding:12px;font-size:13px;color:var(--text-secondary);">${task.notes}</div></div>` : ''}
    </div>`;

  openModal({
    title: '📋 Task Detail',
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Close</button>
      <button class="btn btn-primary" id="modal-update-status">Update Status</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-update-status')?.addEventListener('click', () => {
      const newStatus = document.querySelector('#task-status-update')?.value;
      update(COLLECTIONS.TASKS, task.id, { status: newStatus });
      closeModal();
      showToast('Task status updated', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openAddRawModal(client, onSave) {
  const today = new Date().toISOString().split('T')[0];
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <label class="form-label">Shoot Date *</label>
        <input class="input" id="raw-date" type="date" value="${today}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Topic / Session Name *</label>
        <input class="input" id="raw-topic" placeholder="e.g. Diabetes Awareness Talk" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Speaker</label>
        <input class="input" id="raw-speaker" value="${client.primaryContact || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Duration (mm:ss)</label>
        <input class="input" id="raw-duration" placeholder="45:00" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Estimated Reels</label>
        <input class="input" id="raw-reels" type="number" min="0" value="4" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Assigned Editor</label>
        <select class="input" id="raw-editor" style="width:100%;box-sizing:border-box;">
          <option value="">— None —</option>
          ${employees.filter(e => e.department === 'VE').map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">Drive Link</label>
        <input class="input" id="raw-drive" type="url" placeholder="https://drive.google.com/..." style="width:100%;box-sizing:border-box;">
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">Notes</label>
        <textarea class="input" id="raw-notes" rows="2" style="width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>
      </div>
    </div>`;

  openModal({
    title: '🎥 Add Raw Video',
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Add Raw Data</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      const topic = document.querySelector('#raw-topic')?.value.trim();
      if (!topic) { showToast('Please enter a topic', 'error'); return; }
      const editorEl = document.querySelector('#raw-editor');
      const editorEmp = getAll(COLLECTIONS.EMPLOYEES).find(e => e.id === editorEl?.value);
      create(COLLECTIONS.RAW_DATA, {
        clientId: client.id,
        clientName: client.name,
        shootDate: document.querySelector('#raw-date')?.value,
        topic,
        speaker: document.querySelector('#raw-speaker')?.value || '',
        duration: document.querySelector('#raw-duration')?.value || '',
        estimatedReels: parseInt(document.querySelector('#raw-reels')?.value) || 0,
        reelsCreated: 0,
        assignedEditor: editorEl?.value || null,
        driveLink: document.querySelector('#raw-drive')?.value.trim() || null,
        notes: document.querySelector('#raw-notes')?.value || '',
        status: 'Available',
        storageLocation: 'Google Drive',
      });
      closeModal();
      showToast('Raw data added', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openEditRawModal(raw, onSave) {
  const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
  const statuses = ['Available', 'Assigned for Editing', 'Partially Used', 'Fully Used', 'Rejected', 'Hold for Later', 'Missing Link'];
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <label class="form-label">Shoot Date</label>
        <input class="input" id="raw-date" type="date" value="${raw.shootDate || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Topic</label>
        <input class="input" id="raw-topic" value="${raw.topic || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Speaker</label>
        <input class="input" id="raw-speaker" value="${raw.speaker || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Duration</label>
        <input class="input" id="raw-duration" value="${raw.duration || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Est. Reels</label>
        <input class="input" id="raw-est" type="number" value="${raw.estimatedReels || 0}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Reels Created</label>
        <input class="input" id="raw-created" type="number" value="${raw.reelsCreated || 0}" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Status</label>
        <select class="input" id="raw-status" style="width:100%;box-sizing:border-box;">
          ${statuses.map(s => `<option value="${s}" ${raw.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Assigned Editor</label>
        <select class="input" id="raw-editor" style="width:100%;box-sizing:border-box;">
          <option value="">— None —</option>
          ${employees.filter(e => e.department === 'VE').map(e => `<option value="${e.id}" ${raw.assignedEditor === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">Drive Link</label>
        <input class="input" id="raw-drive" type="url" value="${raw.driveLink || ''}" style="width:100%;box-sizing:border-box;">
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">Notes</label>
        <textarea class="input" id="raw-notes" rows="2" style="width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;">${raw.notes || ''}</textarea>
      </div>
    </div>`;

  openModal({
    title: '✏️ Edit Raw Data',
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Save Changes</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      update(COLLECTIONS.RAW_DATA, raw.id, {
        shootDate: document.querySelector('#raw-date')?.value,
        topic: document.querySelector('#raw-topic')?.value.trim(),
        speaker: document.querySelector('#raw-speaker')?.value.trim(),
        duration: document.querySelector('#raw-duration')?.value.trim(),
        estimatedReels: parseInt(document.querySelector('#raw-est')?.value) || 0,
        reelsCreated: parseInt(document.querySelector('#raw-created')?.value) || 0,
        status: document.querySelector('#raw-status')?.value,
        assignedEditor: document.querySelector('#raw-editor')?.value || null,
        driveLink: document.querySelector('#raw-drive')?.value.trim() || null,
        notes: document.querySelector('#raw-notes')?.value || '',
      });
      closeModal();
      showToast('Raw data updated', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

function openAddDeliverableModal(client, month, onSave) {
  const contentTypes = getAll(COLLECTIONS.CONTENT_TYPES);
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="grid-column:1/-1;">
        <label class="form-label">Content Type *</label>
        <select class="input" id="del-type" style="width:100%;box-sizing:border-box;">
          ${contentTypes.map(ct => `<option value="${ct.id}">${ct.icon} ${ct.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Promised Quantity *</label>
        <input class="input" id="del-promised" type="number" min="0" value="4" style="width:100%;box-sizing:border-box;">
      </div>
      <div>
        <label class="form-label">Month</label>
        <input class="input" id="del-month" type="month" value="${month}" style="width:100%;box-sizing:border-box;">
      </div>
    </div>`;

  openModal({
    title: '➕ Add Deliverable',
    size: 'lg',
    body,
    footer: `<div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Add</button>
    </div>`,
  });

  setTimeout(() => {
    document.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    document.querySelector('#modal-save')?.addEventListener('click', () => {
      const typeId = document.querySelector('#del-type')?.value;
      const ct = contentTypes.find(c => c.id === typeId);
      const promised = parseInt(document.querySelector('#del-promised')?.value) || 0;
      const selMonth = document.querySelector('#del-month')?.value || month;
      create(COLLECTIONS.MONTHLY_DELIVERABLES, {
        clientId: client.id,
        month: selMonth,
        contentType: typeId,
        contentTypeName: ct?.name || typeId,
        promised,
        completed: 0,
        inProgress: 0,
        ready: 0,
        uploaded: 0,
        carryForward: 0,
      });
      closeModal();
      showToast('Deliverable added', 'success');
      if (onSave) onSave();
    });
  }, 50);
}

// ─── UTILITIES ────────────────────────────────────────────────
function formatMonthLabel(month) {
  if (!month) return '';
  const [year, mon] = month.split('-');
  const d = new Date(Number(year), Number(mon) - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}
