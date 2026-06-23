// ============================================================
// CREATIVE UNIVERSE — Clients Page
// ============================================================

import { getAll, create, update, remove, getClientStats, getHealthLabel, COLLECTIONS } from '../data/store.js';
import { showToast } from '../components/Toast.js';

// ─── HELPERS ──────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function buildAvatarGradient(industry) {
  const map = {
    Healthcare: 'linear-gradient(135deg,#7C3AED,#2563EB)',
    Technology: 'linear-gradient(135deg,#0891B2,#16A34A)',
    Finance: 'linear-gradient(135deg,#D97706,#DC2626)',
    Education: 'linear-gradient(135deg,#DB2777,#9333EA)',
    Retail: 'linear-gradient(135deg,#EA580C,#D97706)',
  };
  return map[industry] || 'linear-gradient(135deg,#7C3AED,#DB2777)';
}

function getStatusBadge(status) {
  const map = {
    Active: 'badge-green',
    Inactive: 'badge-gray',
    'On Hold': 'badge-orange',
    Churned: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

function getHealthBadgeClass(score) {
  if (score >= 80) return 'badge-green';
  if (score >= 60) return 'badge-orange';
  return 'badge-red';
}

function getHealthBarColor(score) {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#DC2626';
}

// ─── FILTER LOGIC ─────────────────────────────────────────────
function filterClients(clients, search, chip, month) {
  let list = clients;

  // Search
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.businessName || '').toLowerCase().includes(q) ||
      (c.instagram || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    );
  }

  // Chip
  switch (chip) {
    case 'Active':
      list = list.filter(c => c.status === 'Active');
      break;
    case 'Inactive':
      list = list.filter(c => c.status !== 'Active');
      break;
    case 'Healthcare':
      list = list.filter(c => c.industry === 'Healthcare');
      break;
    case 'Low Raw Data':
      list = list.filter(c => {
        const stats = getClientStats(c.id, month);
        return stats.rawReelsAvailable < stats.reelsRemaining;
      });
      break;
    case 'Shoot Required':
      list = list.filter(c => {
        const stats = getClientStats(c.id, month);
        return stats.shootRequired;
      });
      break;
    case 'On Track':
      list = list.filter(c => {
        const stats = getClientStats(c.id, month);
        return stats.healthScore >= 80;
      });
      break;
    case 'Needs Attention':
      list = list.filter(c => {
        const stats = getClientStats(c.id, month);
        return stats.healthScore >= 60 && stats.healthScore < 80;
      });
      break;
    case 'Immediate Action':
      list = list.filter(c => {
        const stats = getClientStats(c.id, month);
        return stats.healthScore < 60;
      });
      break;
    default:
      break; // 'All'
  }

  return list;
}

// ─── TABLE ROWS ───────────────────────────────────────────────
function buildTableRows(clients, employees, month) {
  if (!clients.length) {
    return `<tr>
      <td colspan="11">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No clients found</div>
          <div class="empty-state-sub">Try adjusting filters or search query.</div>
        </div>
      </td>
    </tr>`;
  }

  return clients.map(client => {
    const stats = getClientStats(client.id, month);
    const health = getHealthLabel(stats.healthScore);
    const smm = employees.find(e => e.id === client.assignedSMM);
    const initials = getInitials(client.name);
    const gradient = buildAvatarGradient(client.industry);
    const statusClass = getStatusBadge(client.status);
    const healthClass = getHealthBadgeClass(stats.healthScore);
    const barColor = getHealthBarColor(stats.healthScore);
    const shootBadge = stats.shootRequired
      ? `<span class="badge badge-orange">🎥 Shoot Required</span>`
      : `<span class="badge badge-green">✓ No Shoot</span>`;

    return `<tr class="client-row" data-id="${client.id}" style="cursor:pointer;">
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar avatar-sm" style="background:${gradient};flex-shrink:0;">${initials}</div>
          <div>
            <div style="font-weight:600;font-size:13px;color:var(--text-primary);">${client.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${client.instagram || '—'}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size:13px;">${client.businessName || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted);">${client.location || '—'}</div>
      </td>
      <td>
        <span style="font-size:13px;">${client.industry || '—'}</span>
        ${client.specialty ? `<div style="font-size:11px;color:var(--text-muted);">${client.specialty}</div>` : ''}
      </td>
      <td>
        <div style="font-size:13px;font-weight:500;">${client.packageName || '—'}</div>
      </td>
      <td>
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${formatCurrency(client.packagePrice)}</div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="avatar avatar-sm" style="background:var(--accent);flex-shrink:0;">${smm ? getInitials(smm.name) : '?'}</div>
          <span style="font-size:12px;">${smm ? smm.name : '—'}</span>
        </div>
      </td>
      <td style="min-width:130px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span class="badge ${healthClass}" style="font-size:10px;">${health.label}</span>
          <span style="font-size:11px;font-weight:700;color:${health.color};">${stats.healthScore}</span>
        </div>
        <div class="progress-bar" style="height:4px;width:90px;">
          <div class="progress-bar-fill" style="width:${stats.healthScore}%;background:${barColor};"></div>
        </div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:13px;font-weight:700;color:${stats.rawReelsAvailable > 0 ? 'var(--color-green)' : 'var(--color-red)'};">
            ${stats.rawReelsAvailable}
          </span>
          <span style="font-size:11px;color:var(--text-muted);">avail</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);">${stats.reelsRemaining} needed</div>
      </td>
      <td>${shootBadge}</td>
      <td><span class="badge ${statusClass}">${client.status}</span></td>
      <td>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm btn-view-profile" data-id="${client.id}" title="View Profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-edit-client" data-id="${client.id}" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-deactivate-client" data-id="${client.id}" data-status="${client.status}" title="${client.status === 'Active' ? 'Deactivate' : 'Activate'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${client.status === 'Active' ? 'var(--color-orange)' : 'var(--color-green)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/>${client.status === 'Active' ? '<line x1="8" y1="12" x2="16" y2="12"/>' : '<line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'}</svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── ADD / EDIT MODAL ─────────────────────────────────────────
function buildClientModal(client = null, packages = [], employees = []) {
  const isEdit = !!client;
  const smms = employees.filter(e => e.department === 'SMM' && e.status === 'Active');
  const ves = employees.filter(e => e.department === 'VE' && e.status === 'Active');
  const gds = employees.filter(e => e.department === 'GD' && e.status === 'Active');

  const val = (key, def = '') => client ? (client[key] ?? def) : def;

  const pkgOptions = packages.map(p =>
    `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" ${val('packageId') === p.id ? 'selected' : ''}>${p.name} — ₹${Number(p.price).toLocaleString('en-IN')}</option>`
  ).join('');

  const empOption = (arr, selected) => arr.map(e =>
    `<option value="${e.id}" ${selected === e.id ? 'selected' : ''}>${e.name}</option>`
  ).join('');

  const statusOptions = ['Active', 'Inactive', 'On Hold', 'Churned'].map(s =>
    `<option value="${s}" ${val('status', 'Active') === s ? 'selected' : ''}>${s}</option>`
  ).join('');

  const industries = ['Healthcare', 'Technology', 'Finance', 'Education', 'Retail', 'Real Estate', 'Food & Beverage', 'Fitness & Wellness', 'Legal', 'Other'];
  const industryOptions = industries.map(i =>
    `<option value="${i}" ${val('industry') === i ? 'selected' : ''}>${i}</option>`
  ).join('');

  return `
  <div class="modal-overlay" id="client-modal-overlay">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? '✏️ Edit Client' : '➕ Add New Client'}</h2>
        <button class="modal-close" id="client-modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="client-form" style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
        <div class="modal-body">

          <!-- Section: Basic Info -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Basic Information</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">Client Name *</label>
                <input class="input" name="name" placeholder="e.g. Dr. Neel Patel" value="${val('name')}" required>
              </div>
              <div class="input-group">
                <label class="input-label">Business Name *</label>
                <input class="input" name="businessName" placeholder="e.g. Neel Patel Clinic" value="${val('businessName')}" required>
              </div>
              <div class="input-group">
                <label class="input-label">Industry</label>
                <select class="input" name="industry">
                  <option value="">Select Industry</option>
                  ${industryOptions}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Specialty / Niche</label>
                <input class="input" name="specialty" placeholder="e.g. Orthopedics, Skincare" value="${val('specialty')}">
              </div>
              <div class="input-group">
                <label class="input-label">Location</label>
                <input class="input" name="location" placeholder="City, State" value="${val('location')}">
              </div>
              <div class="input-group">
                <label class="input-label">Status</label>
                <select class="input" name="status">${statusOptions}</select>
              </div>
            </div>
          </div>

          <!-- Section: Social & Web -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Social & Web</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">Instagram Handle</label>
                <input class="input" name="instagram" placeholder="@handle" value="${val('instagram')}">
              </div>
              <div class="input-group">
                <label class="input-label">Website</label>
                <input class="input" name="website" placeholder="www.example.com" value="${val('website')}">
              </div>
            </div>
          </div>

          <!-- Section: Contact -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Contact Details</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">Primary Contact</label>
                <input class="input" name="primaryContact" placeholder="Contact person name" value="${val('primaryContact')}">
              </div>
              <div class="input-group">
                <label class="input-label">Phone</label>
                <input class="input" name="phone" placeholder="+91 98765 00000" value="${val('phone')}">
              </div>
              <div class="input-group full">
                <label class="input-label">Email</label>
                <input class="input" name="email" type="email" placeholder="contact@example.com" value="${val('email')}">
              </div>
            </div>
          </div>

          <!-- Section: Package -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Package</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">Package</label>
                <select class="input" name="packageId" id="pkg-select">
                  <option value="">Select Package</option>
                  ${pkgOptions}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Package Price (₹)</label>
                <input class="input" name="packagePrice" type="number" placeholder="Auto-filled from package" value="${val('packagePrice')}">
              </div>
              <div class="input-group">
                <label class="input-label">Package Start Date</label>
                <input class="input" name="packageStart" type="date" value="${val('packageStart')}">
              </div>
              <div class="input-group">
                <label class="input-label">Renewal Date</label>
                <input class="input" name="packageRenewal" type="date" value="${val('packageRenewal')}">
              </div>
            </div>
          </div>

          <!-- Section: Team Assignment -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Team Assignment</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">Assigned SMM</label>
                <select class="input" name="assignedSMM">
                  <option value="">Select SMM</option>
                  ${empOption(smms, val('assignedSMM'))}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Assigned Video Editor</label>
                <select class="input" name="assignedVE">
                  <option value="">Select VE</option>
                  ${empOption(ves, val('assignedVE'))}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Assigned Graphic Designer</label>
                <select class="input" name="assignedGD">
                  <option value="">Select GD</option>
                  ${empOption(gds, val('assignedGD'))}
                </select>
              </div>
            </div>
          </div>

          <!-- Section: Links -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Links & Resources</div>
            <div class="form-grid">
              <div class="input-group">
                <label class="input-label">WhatsApp Group Link</label>
                <input class="input" name="whatsapp" placeholder="https://chat.whatsapp.com/..." value="${val('whatsapp')}">
              </div>
              <div class="input-group">
                <label class="input-label">Google Drive Link</label>
                <input class="input" name="driveLink" placeholder="https://drive.google.com/..." value="${val('driveLink')}">
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="input-group">
            <label class="input-label">Notes</label>
            <textarea class="input" name="notes" rows="3" placeholder="Additional notes about this client...">${val('notes')}</textarea>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="client-modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ${isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </form>
    </div>
  </div>`;
}

// ─── MAIN RENDER ──────────────────────────────────────────────
export default function renderClients(container, currentMonth) {
  let searchQuery = '';
  let activeChip = 'All';
  let editingClientId = null;

  const chips = ['All', 'Active', 'Inactive', 'Healthcare', 'Low Raw Data', 'Shoot Required', 'On Track', 'Needs Attention', 'Immediate Action'];

  function getData() {
    return {
      clients: getAll(COLLECTIONS.CLIENTS),
      employees: getAll(COLLECTIONS.EMPLOYEES),
      packages: getAll(COLLECTIONS.PACKAGE_TEMPLATES),
    };
  }

  function render() {
    const { clients, employees, packages } = getData();
    const filtered = filterClients(clients, searchQuery, activeChip, currentMonth);

    const totalActive = clients.filter(c => c.status === 'Active').length;
    const totalInactive = clients.filter(c => c.status !== 'Active').length;
    const needsShoot = clients.filter(c => {
      const s = getClientStats(c.id, currentMonth);
      return s.shootRequired;
    }).length;
    const lowRaw = clients.filter(c => {
      const s = getClientStats(c.id, currentMonth);
      return s.rawReelsAvailable < s.reelsRemaining;
    }).length;

    container.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Clients</h1>
          <p class="page-subtitle">${clients.length} total clients · ${totalActive} active</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-import-clients">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-export-clients">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-create-package">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Create Package
          </button>
          <button class="btn btn-primary btn-sm" id="btn-add-client">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Client
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
        <div class="stat-card" style="--stat-color:#16A34A;">
          <div class="stat-card-header">
            <div class="stat-card-label">Active Clients</div>
            <div class="stat-card-icon">✅</div>
          </div>
          <div class="stat-card-value">${totalActive}</div>
          <div class="stat-card-sub">Currently active</div>
        </div>
        <div class="stat-card" style="--stat-color:#6B7280;">
          <div class="stat-card-header">
            <div class="stat-card-label">Inactive</div>
            <div class="stat-card-icon">⏸️</div>
          </div>
          <div class="stat-card-value">${totalInactive}</div>
          <div class="stat-card-sub">Inactive / on hold</div>
        </div>
        <div class="stat-card" style="--stat-color:#F97316;">
          <div class="stat-card-header">
            <div class="stat-card-label">Shoot Required</div>
            <div class="stat-card-icon">🎥</div>
          </div>
          <div class="stat-card-value">${needsShoot}</div>
          <div class="stat-card-sub">Need new footage</div>
        </div>
        <div class="stat-card" style="--stat-color:#EF4444;">
          <div class="stat-card-header">
            <div class="stat-card-label">Low Raw Data</div>
            <div class="stat-card-icon">⚠️</div>
          </div>
          <div class="stat-card-value">${lowRaw}</div>
          <div class="stat-card-sub">Reels < needed</div>
        </div>
      </div>

      <!-- Search + Filters -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
        <div class="search-bar" style="flex:1;min-width:220px;max-width:360px;">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input input-sm" id="clients-search" placeholder="Search clients, business, instagram…" value="${searchQuery}" style="padding-left:34px;">
        </div>
        <span style="font-size:12px;color:var(--text-muted);">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <!-- Filter Chips -->
      <div class="filters-row" id="client-filter-chips">
        ${chips.map(chip =>
          `<button class="filter-chip ${activeChip === chip ? 'active' : ''}" data-chip="${chip}">${chip}</button>`
        ).join('')}
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="table-header">
          <div style="font-size:14px;font-weight:600;">
            All Clients
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px;">${filtered.length} shown</span>
          </div>
          <div style="display:flex;gap:8px;">
            <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;display:inline-block;"></span> On Track
            </span>
            <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#D97706;display:inline-block;"></span> Needs Attention
            </span>
            <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#DC2626;display:inline-block;"></span> Immediate Action
            </span>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table" id="clients-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Business Name</th>
                <th>Industry</th>
                <th>Package</th>
                <th>Price (₹)</th>
                <th>Assigned SMM</th>
                <th>Health Score</th>
                <th>Raw Reels</th>
                <th>Shoot Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="clients-tbody">
              ${buildTableRows(filtered, employees, currentMonth)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    // Search
    const searchInput = container.querySelector('#clients-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        rerenderTable();
      });
    }

    // Filter chips
    container.querySelector('#client-filter-chips')?.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      activeChip = chip.dataset.chip;
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      rerenderTable();
    });

    // Add Client
    container.querySelector('#btn-add-client')?.addEventListener('click', () => {
      editingClientId = null;
      openModal(null);
    });

    // Export
    container.querySelector('#btn-export-clients')?.addEventListener('click', () => {
      const clients = getAll(COLLECTIONS.CLIENTS);
      const csv = [
        ['ID', 'Name', 'Business', 'Industry', 'Package', 'Price', 'Status', 'Health Score', 'Location', 'Phone', 'Email'].join(','),
        ...clients.map(c => [
          c.id, `"${c.name}"`, `"${c.businessName}"`, c.industry,
          `"${c.packageName}"`, c.packagePrice, c.status, c.healthScore,
          `"${c.location}"`, c.phone, c.email
        ].join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-${currentMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Clients exported as CSV', 'success');
    });

    // Import
    container.querySelector('#btn-import-clients')?.addEventListener('click', () => {
      showToast('Import via CSV not implemented in this demo.', 'info');
    });

    // Create Package
    container.querySelector('#btn-create-package')?.addEventListener('click', () => {
      showToast('Package builder coming soon!', 'info');
    });

    // Row click → navigate to profile
    container.querySelector('#clients-tbody')?.addEventListener('click', e => {
      const viewBtn = e.target.closest('.btn-view-profile');
      const editBtn = e.target.closest('.btn-edit-client');
      const deactivateBtn = e.target.closest('.btn-deactivate-client');
      const row = e.target.closest('.client-row');

      if (viewBtn) {
        const id = viewBtn.dataset.id;
        window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page: 'client-profile', clientId: id } }));
        return;
      }

      if (editBtn) {
        editingClientId = editBtn.dataset.id;
        const client = getAll(COLLECTIONS.CLIENTS).find(c => c.id === editingClientId);
        openModal(client);
        return;
      }

      if (deactivateBtn) {
        const id = deactivateBtn.dataset.id;
        const currentStatus = deactivateBtn.dataset.status;
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        update(COLLECTIONS.CLIENTS, id, { status: newStatus });
        showToast(`Client ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`, 'success');
        rerenderTable();
        return;
      }

      if (row && !e.target.closest('button')) {
        const id = row.dataset.id;
        window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page: 'client-profile', clientId: id } }));
      }
    });
  }

  function rerenderTable() {
    const { clients, employees } = getData();
    const filtered = filterClients(clients, searchQuery, activeChip, currentMonth);
    const tbody = container.querySelector('#clients-tbody');
    if (tbody) tbody.innerHTML = buildTableRows(filtered, employees, currentMonth);
    const countEl = container.querySelector('.table-header span');
    if (countEl) countEl.textContent = `${filtered.length} shown`;
    const resultEl = container.querySelectorAll('.search-bar')[0]?.parentElement?.querySelector('span');
    // Update result count near search
    const spans = container.querySelectorAll('[style*="font-size:12px;color:var(--text-muted)"]');
    spans.forEach(s => {
      if (s.textContent.includes('result')) {
        s.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
      }
    });
  }

  function openModal(client = null) {
    const { packages, employees } = getData();
    const existing = document.getElementById('client-modal-overlay');
    if (existing) existing.remove();

    const html = buildClientModal(client, packages, employees);
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('client-modal-overlay');
    const form = document.getElementById('client-form');

    // Package auto-fill price
    const pkgSelect = document.getElementById('pkg-select');
    pkgSelect?.addEventListener('change', () => {
      const selected = pkgSelect.options[pkgSelect.selectedIndex];
      const priceInput = form.querySelector('[name="packagePrice"]');
      if (selected && selected.dataset.price) {
        priceInput.value = selected.dataset.price;
      }
    });

    // Close
    const closeModal = () => overlay.remove();
    document.getElementById('client-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('client-modal-cancel')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      data.packagePrice = parseFloat(data.packagePrice) || 0;

      // Resolve package name
      const pkg = packages.find(p => p.id === data.packageId);
      if (pkg) data.packageName = pkg.name;

      if (editingClientId) {
        update(COLLECTIONS.CLIENTS, editingClientId, data);
        showToast(`Client "${data.name}" updated successfully`, 'success');
      } else {
        const serial = String(getAll(COLLECTIONS.CLIENTS).length + 1).padStart(3, '0');
        const id = `client-${serial}`;
        create(COLLECTIONS.CLIENTS, { ...data, id, healthScore: 100, rawReelsAvailable: 0, shootRequired: false });
        showToast(`Client "${data.name}" added successfully! 🎉`, 'success');
      }

      closeModal();
      render();
    });
  }

  // Initial render
  render();

  // Listen for store changes
  const onStoreChange = e => {
    if (e.detail?.collection === COLLECTIONS.CLIENTS) render();
  };
  window.addEventListener('cu:store-change', onStoreChange);

  // Return cleanup
  return () => window.removeEventListener('cu:store-change', onStoreChange);
}
