// ============================================================
// RAW DATA INVENTORY PAGE
// ============================================================
import { getAll, create, update, remove, getById, COLLECTIONS } from '../data/store.js';

export default function renderRawDataInventory(container, currentMonth) {
  const state = { search: '', statusFilter: 'all', clientFilter: 'all' };

  function getStatusStyle(status) {
    const map = {
      'Available': { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
      'Assigned for Editing': { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
      'Partially Used': { color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
      'Fully Used': { color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
      'Rejected': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
      'Hold for Later': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
      'Missing Link': { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
    };
    return map[status] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  function getFilteredRaw() {
    let items = getAll(COLLECTIONS.RAW_DATA);
    if (state.search) {
      const q = state.search.toLowerCase();
      items = items.filter(r =>
        r.clientName?.toLowerCase().includes(q) ||
        r.topic?.toLowerCase().includes(q) ||
        r.speaker?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }
    if (state.statusFilter !== 'all') items = items.filter(r => r.status === state.statusFilter);
    if (state.clientFilter !== 'all') items = items.filter(r => r.clientId === state.clientFilter);
    return items;
  }

  function getStats() {
    const all = getAll(COLLECTIONS.RAW_DATA);
    return {
      total: all.length,
      available: all.filter(r => r.status === 'Available').length,
      partiallyUsed: all.filter(r => r.status === 'Partially Used').length,
      fullyUsed: all.filter(r => r.status === 'Fully Used').length,
      missingLinks: all.filter(r => !r.driveLink || r.status === 'Missing Link').length,
      rejected: all.filter(r => r.status === 'Rejected').length,
    };
  }

  function openAddModal(existing = null) {
    const clients = getAll(COLLECTIONS.CLIENTS);
    const editors = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.department === 'VE' || e.role === 'Video Editor');
    const isEdit = !!existing;

    const body = `
      <div class="form-grid">
        <div class="input-group full">
          <label class="input-label">Client *</label>
          <select class="input" id="raw-client">
            <option value="">Select client...</option>
            ${clients.map(c => `<option value="${c.id}" ${existing?.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Shoot Date *</label>
          <input class="input" type="date" id="raw-shoot-date" value="${existing?.shootDate || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Status</label>
          <select class="input" id="raw-status">
            ${['Available','Assigned for Editing','Partially Used','Fully Used','Rejected','Hold for Later','Missing Link'].map(s =>
              `<option value="${s}" ${existing?.status === s ? 'selected' : s === 'Available' && !existing ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
        <div class="input-group full">
          <label class="input-label">Topic / Subject *</label>
          <input class="input" type="text" id="raw-topic" placeholder="e.g. Diabetes Management Tips" value="${existing?.topic || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Speaker Name</label>
          <input class="input" type="text" id="raw-speaker" placeholder="e.g. Dr. Neel Patel" value="${existing?.speaker || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Raw Video Duration</label>
          <input class="input" type="text" id="raw-duration" placeholder="e.g. 45:00" value="${existing?.duration || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Estimated Reels Possible</label>
          <input class="input" type="number" id="raw-est-reels" min="0" value="${existing?.estimatedReels || 0}" />
        </div>
        <div class="input-group">
          <label class="input-label">Reels Already Created</label>
          <input class="input" type="number" id="raw-reels-created" min="0" value="${existing?.reelsCreated || 0}" />
        </div>
        <div class="input-group full">
          <label class="input-label">Google Drive Folder Link</label>
          <input class="input" type="url" id="raw-drive-link" placeholder="https://drive.google.com/..." value="${existing?.driveLink || ''}" />
        </div>
        <div class="input-group full">
          <label class="input-label">Assigned Editor</label>
          <select class="input" id="raw-editor">
            <option value="">Not assigned</option>
            ${editors.map(e => `<option value="${e.id}" ${existing?.assignedEditor === e.id ? 'selected' : ''}>${e.name} (${e.cuId})</option>`).join('')}
          </select>
        </div>
        <div class="input-group full">
          <label class="input-label">Notes</label>
          <textarea class="input" id="raw-notes" rows="2" placeholder="Any notes...">${existing?.notes || ''}</textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="document.dispatchEvent(new Event('close-modal'))">Cancel</button>
      <button class="btn btn-primary" id="save-raw-btn">${isEdit ? 'Update' : 'Add Raw Video'}</button>
    `;

    showModal(`${isEdit ? 'Edit' : 'Add'} Raw Video`, body, footer, () => {
      const clientEl = document.getElementById('raw-client');
      const client = getAll(COLLECTIONS.CLIENTS).find(c => c.id === clientEl?.value);
      const data = {
        clientId: clientEl?.value || '',
        clientName: client?.name || '',
        shootDate: document.getElementById('raw-shoot-date')?.value || '',
        topic: document.getElementById('raw-topic')?.value?.trim() || '',
        speaker: document.getElementById('raw-speaker')?.value?.trim() || '',
        duration: document.getElementById('raw-duration')?.value?.trim() || '',
        estimatedReels: parseInt(document.getElementById('raw-est-reels')?.value || '0'),
        reelsCreated: parseInt(document.getElementById('raw-reels-created')?.value || '0'),
        driveLink: document.getElementById('raw-drive-link')?.value?.trim() || null,
        assignedEditor: document.getElementById('raw-editor')?.value || null,
        status: document.getElementById('raw-status')?.value || 'Available',
        notes: document.getElementById('raw-notes')?.value?.trim() || '',
        storageLocation: 'Google Drive',
      };

      if (!data.clientId || !data.topic || !data.shootDate) {
        window.showToast?.('Please fill in required fields (Client, Shoot Date, Topic)', 'error');
        return;
      }

      if (isEdit) {
        update(COLLECTIONS.RAW_DATA, existing.id, data);
        window.showToast?.('Raw video updated!', 'success');
      } else {
        const allRaw = getAll(COLLECTIONS.RAW_DATA);
        const newId = `raw-${String(allRaw.length + 1).padStart(3, '0')}`;
        create(COLLECTIONS.RAW_DATA, { id: newId, ...data });
        window.showToast?.('Raw video added!', 'success');
      }
      closeModal();
      render();
    });
  }

  function showModal(title, body, footer, onSave) {
    let overlay = document.getElementById('raw-modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'raw-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" id="raw-modal-close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    overlay.querySelector('#raw-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('close-modal', close, { once: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });

    const saveBtn = overlay.querySelector('#save-raw-btn');
    if (saveBtn && onSave) saveBtn.addEventListener('click', onSave);
  }

  function closeModal() {
    const overlay = document.getElementById('raw-modal-overlay');
    if (overlay) overlay.remove();
  }

  function render() {
    const rawItems = getFilteredRaw();
    const stats = getStats();
    const clients = getAll(COLLECTIONS.CLIENTS);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Raw Data Inventory</h1>
          <p class="page-subtitle">Track all raw footage, drive links, and editing assignments</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="bulk-add-btn">📥 Bulk Add</button>
          <button class="btn btn-primary" id="add-raw-btn">+ Add Raw Video</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));margin-bottom:24px;">
        ${[
          { label: 'Total', value: stats.total, color: '#7C3AED', icon: '🎥' },
          { label: 'Available', value: stats.available, color: '#22C55E', icon: '✅' },
          { label: 'Partially Used', value: stats.partiallyUsed, color: '#F97316', icon: '🔶' },
          { label: 'Fully Used', value: stats.fullyUsed, color: '#6B7280', icon: '⬛' },
          { label: 'Missing Links', value: stats.missingLinks, color: '#DC2626', icon: '🔗' },
          { label: 'Rejected', value: stats.rejected, color: '#EF4444', icon: '❌' },
        ].map(s => `
          <div class="stat-card" style="--stat-color:${s.color};">
            <div class="stat-card-header"><span class="stat-card-label">${s.label}</span><span>${s.icon}</span></div>
            <div class="stat-card-value">${s.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Filters -->
      <div class="filters-row" style="margin-bottom:16px;">
        <div class="search-bar" style="flex:1;max-width:320px;">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:10px;width:16px;height:16px;color:var(--text-muted);pointer-events:none;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="input" type="text" id="raw-search" placeholder="Search client, topic, speaker..." value="${state.search}" style="padding-left:34px;" />
        </div>
        <select class="input input-sm" id="raw-client-filter" style="width:auto;">
          <option value="all">All Clients</option>
          ${clients.map(c => `<option value="${c.id}" ${state.clientFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        <select class="input input-sm" id="raw-status-filter" style="width:auto;">
          <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>All Status</option>
          ${['Available','Assigned for Editing','Partially Used','Fully Used','Missing Link','Hold for Later','Rejected'].map(s =>
            `<option value="${s}" ${state.statusFilter === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="table-header">
          <span style="font-size:14px;font-weight:600;">${rawItems.length} Raw Videos</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Raw ID</th>
                <th>Client</th>
                <th>Shoot Date</th>
                <th>Topic</th>
                <th>Speaker</th>
                <th>Duration</th>
                <th>Est. Reels</th>
                <th>Created</th>
                <th>Remaining</th>
                <th>Drive Link</th>
                <th>Editor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rawItems.length === 0 ? `
                <tr><td colspan="13">
                  <div class="empty-state" style="padding:40px;">
                    <div class="empty-state-icon">🎥</div>
                    <div class="empty-state-title">No raw videos found</div>
                  </div>
                </td></tr>
              ` : rawItems.map(raw => {
                const remaining = (raw.estimatedReels || 0) - (raw.reelsCreated || 0);
                const remainColor = remaining > 0 ? '#22C55E' : remaining === 0 ? '#6B7280' : '#EF4444';
                const st = getStatusStyle(raw.status);
                const editors = getAll(COLLECTIONS.EMPLOYEES);
                const editor = editors.find(e => e.id === raw.assignedEditor);

                return `
                  <tr>
                    <td><code class="cu-id">${raw.id}</code></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#7C3AED,#2563EB);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;">${getInitials(raw.clientName)}</div>
                        <span style="font-size:13px;font-weight:500;">${raw.clientName}</span>
                      </div>
                    </td>
                    <td class="cell-muted">${raw.shootDate || '—'}</td>
                    <td style="max-width:180px;"><span style="font-weight:500;">${raw.topic || '—'}</span></td>
                    <td class="cell-muted">${raw.speaker || '—'}</td>
                    <td class="cell-muted">${raw.duration || '—'}</td>
                    <td style="text-align:center;font-weight:600;">${raw.estimatedReels || 0}</td>
                    <td style="text-align:center;font-weight:600;">${raw.reelsCreated || 0}</td>
                    <td style="text-align:center;">
                      <span style="font-weight:700;color:${remainColor};">${remaining}</span>
                    </td>
                    <td>
                      ${raw.driveLink
                        ? `<a href="${raw.driveLink}" target="_blank" style="color:var(--accent);font-size:12px;display:flex;align-items:center;gap:4px;">🔗 Open</a>`
                        : `<span style="color:var(--color-red);font-size:12px;font-weight:600;">⚠ Missing</span>`
                      }
                    </td>
                    <td>
                      ${editor
                        ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;border-radius:50%;background:#DC2626;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;">${getInitials(editor.name)}</div><span style="font-size:12px;">${editor.name}</span></div>`
                        : `<span class="cell-muted">—</span>`
                      }
                    </td>
                    <td>
                      <span class="badge" style="background:${st.bg};color:${st.color};">${raw.status}</span>
                    </td>
                    <td>
                      <div style="display:flex;gap:4px;">
                        <button class="btn btn-ghost btn-sm" data-edit-raw="${raw.id}" title="Edit">✏️</button>
                        <button class="btn btn-ghost btn-sm" data-mark-used="${raw.id}" title="Mark Fully Used" ${raw.status === 'Fully Used' ? 'disabled' : ''}>✅</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Events
    container.querySelector('#add-raw-btn')?.addEventListener('click', () => openAddModal());
    container.querySelector('#bulk-add-btn')?.addEventListener('click', () => {
      window.showToast?.('Bulk add: paste multiple Drive links separated by commas in the Add form.', 'info');
    });

    container.querySelector('#raw-search')?.addEventListener('input', e => {
      state.search = e.target.value;
      render();
    });
    container.querySelector('#raw-client-filter')?.addEventListener('change', e => {
      state.clientFilter = e.target.value;
      render();
    });
    container.querySelector('#raw-status-filter')?.addEventListener('change', e => {
      state.statusFilter = e.target.value;
      render();
    });

    container.querySelectorAll('[data-edit-raw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = getById(COLLECTIONS.RAW_DATA, btn.dataset.editRaw);
        if (item) openAddModal(item);
      });
    });

    container.querySelectorAll('[data-mark-used]').forEach(btn => {
      btn.addEventListener('click', () => {
        update(COLLECTIONS.RAW_DATA, btn.dataset.markUsed, { status: 'Fully Used' });
        window.showToast?.('Marked as Fully Used', 'success');
        render();
      });
    });
  }

  render();
}
