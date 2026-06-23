// ============================================================
// SHOOT PLANNER PAGE
// ============================================================
import { getAll, update, create, getById, getClientStats, COLLECTIONS } from '../data/store.js';

export default function renderShootPlanner(container, currentMonth) {
  const state = { filter: 'all' };

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  function getShootStatus(client, stats) {
    if (!client.driveLink) return { status: 'Missing Drive Link', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', urgency: 'Low' };
    if (stats.rawReelsAvailable === 0) return { status: 'Urgent — No Raw Data', color: '#DC2626', bg: 'rgba(220,38,38,0.12)', urgency: 'Urgent' };
    if (stats.rawReelsAvailable < stats.reelsRemaining) return { status: 'Shoot Required', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', urgency: 'High' };
    if (stats.rawReelsAvailable < 4) return { status: 'Low Inventory', color: '#F97316', bg: 'rgba(249,115,22,0.12)', urgency: 'Medium' };
    return { status: 'No Shoot Required', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', urgency: 'Low' };
  }

  function openScheduleModal(client, shoot) {
    const coordinators = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.department === 'SC');
    const cameras = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.department === 'CAM');

    const body = `
      <div class="form-grid">
        <div class="input-group full">
          <label class="input-label">Client</label>
          <input class="input" type="text" value="${client.name}" disabled />
        </div>
        <div class="input-group">
          <label class="input-label">Suggested Shoot Date *</label>
          <input class="input" type="date" id="shoot-date" value="${shoot?.suggestedDate || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Shoot Location</label>
          <input class="input" type="text" id="shoot-location" placeholder="e.g. Clinic — Navrangpura" value="${shoot?.location || ''}" />
        </div>
        <div class="input-group full">
          <label class="input-label">Topics Required (comma-separated)</label>
          <textarea class="input" id="shoot-topics" rows="2" placeholder="e.g. Fever Management, Monsoon Illnesses">${(shoot?.topics || []).join(', ')}</textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Client Availability</label>
          <input class="input" type="text" id="shoot-availability" placeholder="e.g. Weekends preferred" value="${shoot?.availability || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">Shoot Coordinator</label>
          <select class="input" id="shoot-coordinator">
            <option value="">Not assigned</option>
            ${coordinators.map(e => `<option value="${e.id}" ${shoot?.coordinatorId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Cameraperson</label>
          <select class="input" id="shoot-camera">
            <option value="">Not assigned</option>
            ${cameras.map(e => `<option value="${e.id}" ${shoot?.cameraId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="input-group full">
          <label class="input-label">Notes</label>
          <textarea class="input" id="shoot-notes" rows="2" placeholder="Any additional notes...">${shoot?.notes || ''}</textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" id="shoot-cancel">Cancel</button>
      <button class="btn btn-primary" id="shoot-save">📷 Schedule Shoot</button>
    `;

    let overlay = document.getElementById('shoot-modal');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'shoot-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <span class="modal-title">📷 Schedule Shoot — ${client.name}</span>
          <button class="modal-close" id="shoot-close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#shoot-close').addEventListener('click', close);
    overlay.querySelector('#shoot-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#shoot-save').addEventListener('click', () => {
      const topics = (document.getElementById('shoot-topics')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      const data = {
        clientId: client.id,
        clientName: client.name,
        suggestedDate: document.getElementById('shoot-date')?.value || null,
        location: document.getElementById('shoot-location')?.value?.trim() || '',
        topics,
        availability: document.getElementById('shoot-availability')?.value?.trim() || '',
        coordinatorId: document.getElementById('shoot-coordinator')?.value || null,
        cameraId: document.getElementById('shoot-camera')?.value || null,
        notes: document.getElementById('shoot-notes')?.value?.trim() || '',
        status: 'Shoot Required',
        urgency: 'High',
      };

      if (shoot) {
        update(COLLECTIONS.SHOOTS, shoot.id, data);
      } else {
        create(COLLECTIONS.SHOOTS, { id: `shoot-${Date.now()}`, ...data });
      }
      window.showToast?.('Shoot scheduled successfully!', 'success');
      close();
      render();
    });
  }

  function render() {
    const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
    const shoots = getAll(COLLECTIONS.SHOOTS);
    const employees = getAll(COLLECTIONS.EMPLOYEES);

    // Build client shoot data
    const clientData = clients.map(client => {
      const stats = getClientStats(client.id, currentMonth);
      const shootInfo = getShootStatus(client, stats);
      const shoot = shoots.find(s => s.clientId === client.id);
      const coordinator = employees.find(e => e.id === shoot?.coordinatorId);
      const camera = employees.find(e => e.id === shoot?.cameraId);
      return { client, stats, shootInfo, shoot, coordinator, camera };
    });

    let filtered = clientData;
    if (state.filter === 'required') filtered = clientData.filter(d => d.shootInfo.status.includes('Required') || d.shootInfo.status.includes('Urgent'));
    if (state.filter === 'no-shoot') filtered = clientData.filter(d => d.shootInfo.status === 'No Shoot Required');
    if (state.filter === 'urgent') filtered = clientData.filter(d => d.shootInfo.urgency === 'Urgent' || d.shootInfo.urgency === 'High');
    if (state.filter === 'scheduled') filtered = clientData.filter(d => d.shoot?.suggestedDate);

    const shootRequired = clientData.filter(d => d.shootInfo.status !== 'No Shoot Required').length;
    const scheduled = clientData.filter(d => d.shoot?.suggestedDate).length;
    const urgent = clientData.filter(d => d.shootInfo.urgency === 'Urgent').length;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Shoot Planner</h1>
          <p class="page-subtitle">Plan and coordinate client shoots based on raw data availability</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="schedule-shoot-btn">+ Schedule Shoot</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:24px;">
        ${[
          { label: 'Clients Needing Shoot', value: shootRequired, color: '#EF4444', icon: '📷' },
          { label: 'Shoots Scheduled', value: scheduled, color: '#7C3AED', icon: '📅' },
          { label: 'Urgent Shoots', value: urgent, color: '#DC2626', icon: '🚨' },
          { label: 'No Shoot Required', value: clients.length - shootRequired, color: '#22C55E', icon: '✅' },
        ].map(s => `
          <div class="stat-card" style="--stat-color:${s.color};">
            <div class="stat-card-header"><span class="stat-card-label">${s.label}</span><span>${s.icon}</span></div>
            <div class="stat-card-value">${s.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Filters -->
      <div class="filters-row" style="margin-bottom:24px;">
        ${[
          { id: 'all', label: '🌐 All Clients' },
          { id: 'required', label: '📷 Shoot Required' },
          { id: 'urgent', label: '🚨 Urgent' },
          { id: 'scheduled', label: '📅 Scheduled' },
          { id: 'no-shoot', label: '✅ No Shoot Required' },
        ].map(f => `
          <button class="filter-chip ${state.filter === f.id ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>
        `).join('')}
      </div>

      <!-- Client Cards Grid -->
      <div class="grid-3" style="gap:20px;">
        ${filtered.map(({ client, stats, shootInfo, shoot, coordinator, camera }) => `
          <div class="card" style="border-left:3px solid ${shootInfo.color};">
            <!-- Header -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#2563EB);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:white;flex-shrink:0;">
                  ${getInitials(client.name)}
                </div>
                <div>
                  <div style="font-size:14px;font-weight:700;">${client.name}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${client.industry} · ${client.specialty}</div>
                </div>
              </div>
              <span class="badge" style="background:${shootInfo.bg};color:${shootInfo.color};font-size:10px;">${shootInfo.urgency}</span>
            </div>

            <!-- Raw Reels Counter -->
            <div style="display:flex;gap:12px;margin-bottom:14px;">
              <div style="flex:1;text-align:center;padding:10px;background:var(--bg-elevated);border-radius:10px;">
                <div style="font-size:22px;font-weight:800;color:${stats.rawReelsAvailable <= 2 ? '#EF4444' : '#22C55E'};">${stats.rawReelsAvailable}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Raw Available</div>
              </div>
              <div style="flex:1;text-align:center;padding:10px;background:var(--bg-elevated);border-radius:10px;">
                <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${stats.reelsRemaining}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Monthly Remaining</div>
              </div>
            </div>

            <!-- Status Badge -->
            <div style="margin-bottom:12px;">
              <span class="badge" style="background:${shootInfo.bg};color:${shootInfo.color};font-size:11px;padding:5px 10px;">
                ${shootInfo.status}
              </span>
            </div>

            <!-- Shoot Details -->
            ${shoot?.suggestedDate ? `
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
                📅 Suggested: <strong style="color:var(--text-primary);">${shoot.suggestedDate}</strong>
              </div>
            ` : ''}
            ${shoot?.location ? `
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
                📍 ${shoot.location}
              </div>
            ` : ''}
            ${shoot?.topics?.length ? `
              <div style="margin-bottom:10px;">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">TOPICS:</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                  ${shoot.topics.map(t => `<span class="badge badge-purple" style="font-size:10px;">${t}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Assigned Team -->
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              ${coordinator ? `
                <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);">
                  <div style="width:20px;height:20px;border-radius:50%;background:#0891B2;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:white;">${getInitials(coordinator.name)}</div>
                  ${coordinator.name}
                </div>
              ` : '<span style="font-size:11px;color:var(--color-red);">⚠ No Coordinator</span>'}
              ${camera ? `
                <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);">
                  <div style="width:20px;height:20px;border-radius:50%;background:#9333EA;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:white;">${getInitials(camera.name)}</div>
                  ${camera.name}
                </div>
              ` : '<span style="font-size:11px;color:var(--color-red);">⚠ No Camera</span>'}
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:8px;border-top:1px solid var(--border);padding-top:12px;">
              <button class="btn btn-secondary btn-sm" data-schedule-client="${client.id}" style="flex:1;">📷 Schedule</button>
              ${shoot ? `<button class="btn btn-secondary btn-sm" data-mark-done="${client.id}">✅ Done</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📷</div>
          <div class="empty-state-title">No clients match this filter</div>
        </div>
      ` : ''}
    `;

    // Filter buttons
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        render();
      });
    });

    // Schedule buttons
    container.querySelectorAll('[data-schedule-client]').forEach(btn => {
      btn.addEventListener('click', () => {
        const client = clients.find(c => c.id === btn.dataset.scheduleClient);
        const shoot = shoots.find(s => s.clientId === btn.dataset.scheduleClient);
        if (client) openScheduleModal(client, shoot);
      });
    });

    // Mark done
    container.querySelectorAll('[data-mark-done]').forEach(btn => {
      btn.addEventListener('click', () => {
        const shoot = shoots.find(s => s.clientId === btn.dataset.markDone);
        if (shoot) {
          update(COLLECTIONS.SHOOTS, shoot.id, { status: 'Shoot Completed', urgency: 'Low' });
          window.showToast?.('Shoot marked as completed!', 'success');
          render();
        }
      });
    });

    // Top-level schedule button
    container.querySelector('#schedule-shoot-btn')?.addEventListener('click', () => {
      if (clients.length > 0) openScheduleModal(clients[0], null);
    });
  }

  render();
}
