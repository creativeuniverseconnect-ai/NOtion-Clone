// ============================================================
// CALENDAR PAGE — Custom calendar (no FullCalendar dependency)
// ============================================================
import { getAll, create, update, COLLECTIONS } from '../data/store.js';

export default function renderCalendar(container, currentMonth) {
  const today = new Date();
  const state = {
    viewDate: currentMonth ? new Date(currentMonth + '-01') : new Date(today.getFullYear(), today.getMonth(), 1),
    typeFilter: 'all',
    clientFilter: 'all',
  };

  function getAllEvents() {
    const calEvents = getAll(COLLECTIONS.CALENDAR_EVENTS);
    const tasks = getAll(COLLECTIONS.TASKS).filter(t => t.deadline);
    const shoots = getAll(COLLECTIONS.SHOOTS).filter(s => s.suggestedDate);
    const clients = getAll(COLLECTIONS.CLIENTS);

    const events = [
      ...calEvents.map(e => ({ ...e, type: e.type || 'event', color: e.color || '#7C3AED' })),
      ...tasks.map(t => ({
        id: 'task-' + t.id,
        title: t.title + ' ⏰',
        start: t.deadline,
        type: 'deadline',
        color: t.daysOverdue > 0 ? '#EF4444' : '#F97316',
        clientId: t.clientId,
        clientName: t.clientName,
      })),
      ...shoots.map(s => ({
        id: 'shoot-' + s.id,
        title: '📷 Shoot — ' + s.clientName,
        start: s.suggestedDate,
        type: 'shoot',
        color: '#7C3AED',
        clientId: s.clientId,
        clientName: s.clientName,
      })),
    ];

    return events;
  }

  function getFilteredEvents() {
    let events = getAllEvents();
    if (state.typeFilter !== 'all') events = events.filter(e => e.type === state.typeFilter);
    if (state.clientFilter !== 'all') events = events.filter(e => e.clientId === state.clientFilter);
    return events;
  }

  function getEventsForDate(dateStr) {
    return getFilteredEvents().filter(e => e.start === dateStr);
  }

  function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatMonthLabel(d) {
    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }

  function openAddEventModal() {
    const clients = getAll(COLLECTIONS.CLIENTS);
    let overlay = document.getElementById('cal-modal');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'cal-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Add Calendar Event</span>
          <button class="modal-close" id="cal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="input-group full">
              <label class="input-label">Event Title *</label>
              <input class="input" type="text" id="cal-title" placeholder="e.g. Shoot Day, Script Deadline..." />
            </div>
            <div class="input-group">
              <label class="input-label">Date *</label>
              <input class="input" type="date" id="cal-date" value="${fmt(today)}" />
            </div>
            <div class="input-group">
              <label class="input-label">Type</label>
              <select class="input" id="cal-type">
                <option value="shoot">Shoot</option>
                <option value="deadline">Deadline</option>
                <option value="event">Event</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div class="input-group full">
              <label class="input-label">Client</label>
              <select class="input" id="cal-client">
                <option value="">No specific client</option>
                ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group full">
              <label class="input-label">Notes</label>
              <textarea class="input" id="cal-notes" rows="2" placeholder="Optional notes..."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cal-cancel">Cancel</button>
          <button class="btn btn-primary" id="cal-save">Add Event</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#cal-close').addEventListener('click', close);
    overlay.querySelector('#cal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#cal-save').addEventListener('click', () => {
      const title = document.getElementById('cal-title')?.value?.trim();
      const date = document.getElementById('cal-date')?.value;
      if (!title || !date) { window.showToast?.('Title and date are required', 'error'); return; }
      const typeColors = { shoot: '#7C3AED', deadline: '#F97316', event: '#2563EB', task: '#22C55E' };
      const eventType = document.getElementById('cal-type')?.value || 'event';
      const clientEl = document.getElementById('cal-client');
      const client = getAll(COLLECTIONS.CLIENTS).find(c => c.id === clientEl?.value);
      create(COLLECTIONS.CALENDAR_EVENTS, {
        id: `evt-${Date.now()}`,
        title, start: date, end: date,
        type: eventType,
        color: typeColors[eventType],
        clientId: client?.id || null,
        clientName: client?.name || null,
        notes: document.getElementById('cal-notes')?.value?.trim() || '',
      });
      window.showToast?.('Event added!', 'success');
      close();
      render();
    });
  }

  function showEventModal(event) {
    let overlay = document.getElementById('cal-event-modal');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'cal-event-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title" style="color:${event.color};">${event.title}</span>
          <button class="modal-close" id="cal-ev-close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div><span style="font-size:12px;color:var(--text-muted);">DATE</span><div style="font-size:15px;font-weight:600;margin-top:4px;">📅 ${event.start}</div></div>
            <div><span style="font-size:12px;color:var(--text-muted);">TYPE</span>
              <div style="margin-top:4px;"><span class="badge" style="background:${event.color}20;color:${event.color};">${event.type.charAt(0).toUpperCase()+event.type.slice(1)}</span></div>
            </div>
            ${event.clientName ? `<div><span style="font-size:12px;color:var(--text-muted);">CLIENT</span><div style="font-size:14px;font-weight:500;margin-top:4px;">${event.clientName}</div></div>` : ''}
            ${event.notes ? `<div><span style="font-size:12px;color:var(--text-muted);">NOTES</span><div style="font-size:14px;margin-top:4px;">${event.notes}</div></div>` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cal-ev-close2">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#cal-ev-close').addEventListener('click', close);
    overlay.querySelector('#cal-ev-close2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  function render() {
    const clients = getAll(COLLECTIONS.CLIENTS);
    const events = getFilteredEvents();
    const vd = state.viewDate;
    const firstDay = new Date(vd.getFullYear(), vd.getMonth(), 1);
    const lastDay = new Date(vd.getFullYear(), vd.getMonth() + 1, 0);
    const startDow = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayStr = fmt(today);

    // Upcoming events (next 7 days)
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const upcoming = getAllEvents()
      .filter(e => e.start >= todayStr && e.start <= fmt(in7))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 10);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build calendar grid cells
    const cells = [];
    for (let i = 0; i < startDow; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - (startDow - i));
      cells.push({ date: d, otherMonth: true });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(vd.getFullYear(), vd.getMonth(), d), otherMonth: false });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, otherMonth: true });
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendar</h1>
          <p class="page-subtitle">Shoots, deadlines, and task schedules at a glance</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-event-btn">+ Add Event</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row" style="margin-bottom:20px;">
        ${[
          { id: 'all', label: '🌐 All' },
          { id: 'shoot', label: '📷 Shoots' },
          { id: 'deadline', label: '⏰ Deadlines' },
          { id: 'event', label: '📌 Events' },
        ].map(f => `<button class="filter-chip ${state.typeFilter === f.id ? 'active' : ''}" data-type-filter="${f.id}">${f.label}</button>`).join('')}
        <select class="input input-sm" id="cal-client-filter" style="width:auto;margin-left:8px;">
          <option value="all">All Clients</option>
          ${clients.map(c => `<option value="${c.id}" ${state.clientFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start;">
        <!-- Calendar -->
        <div class="card" style="padding:0;overflow:hidden;">
          <!-- Nav -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">
            <button class="btn btn-ghost btn-sm btn-icon" id="cal-prev">‹</button>
            <h2 style="font-size:18px;font-weight:700;">${formatMonthLabel(vd)}</h2>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" id="cal-today">Today</button>
              <button class="btn btn-ghost btn-sm btn-icon" id="cal-next">›</button>
            </div>
          </div>

          <!-- Day headers -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border);">
            ${dayNames.map(d => `
              <div style="padding:8px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">${d}</div>
            `).join('')}
          </div>

          <!-- Grid -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr);">
            ${cells.map(({ date, otherMonth }) => {
              const dateStr = fmt(date);
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const shown = dayEvents.slice(0, 3);
              const extra = dayEvents.length - 3;

              return `
                <div style="min-height:88px;padding:6px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);${otherMonth ? 'opacity:0.35;' : ''}${isWeekend && !otherMonth ? 'background:rgba(255,255,255,0.015);' : ''}">
                  <div style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;margin-bottom:4px;
                    ${isToday ? 'background:var(--accent);color:white;font-weight:700;' : 'color:var(--text-secondary);'}
                    font-size:12px;">
                    ${date.getDate()}
                  </div>
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    ${shown.map(ev => `
                      <div class="cal-event-pill" data-event-id="${ev.id}" 
                           style="background:${ev.color}22;color:${ev.color};font-size:10px;font-weight:500;padding:2px 5px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;border-left:2px solid ${ev.color};" 
                           title="${ev.title}">
                        ${ev.title}
                      </div>
                    `).join('')}
                    ${extra > 0 ? `<div style="font-size:10px;color:var(--text-muted);padding:1px 4px;">+${extra} more</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Sidebar: Upcoming -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card">
            <div class="section-header">
              <div class="section-title">Upcoming (7 days)</div>
            </div>
            ${upcoming.length === 0 ? `<div style="color:var(--text-muted);font-size:13px;">No upcoming events</div>` : `
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${upcoming.map(ev => `
                  <div style="padding:8px 10px;border-radius:8px;background:${ev.color}18;border-left:3px solid ${ev.color};cursor:pointer;" class="cal-event-pill" data-event-id="${ev.id}">
                    <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${ev.title}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">📅 ${ev.start}${ev.clientName ? ' · '+ev.clientName : ''}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Legend -->
          <div class="card">
            <div class="section-title" style="margin-bottom:12px;">Legend</div>
            ${[
              { color: '#7C3AED', label: 'Shoot Day' },
              { color: '#F97316', label: 'Task Deadline' },
              { color: '#EF4444', label: 'Overdue' },
              { color: '#2563EB', label: 'Event' },
              { color: '#22C55E', label: 'Completed' },
            ].map(l => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
                <div style="width:12px;height:12px;border-radius:3px;background:${l.color};flex-shrink:0;"></div>
                <span style="font-size:12px;color:var(--text-secondary);">${l.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Events
    container.querySelector('#add-event-btn')?.addEventListener('click', openAddEventModal);
    container.querySelector('#cal-prev')?.addEventListener('click', () => {
      state.viewDate = new Date(vd.getFullYear(), vd.getMonth() - 1, 1);
      render();
    });
    container.querySelector('#cal-next')?.addEventListener('click', () => {
      state.viewDate = new Date(vd.getFullYear(), vd.getMonth() + 1, 1);
      render();
    });
    container.querySelector('#cal-today')?.addEventListener('click', () => {
      state.viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      render();
    });

    container.querySelectorAll('[data-type-filter]').forEach(btn => {
      btn.addEventListener('click', () => { state.typeFilter = btn.dataset.typeFilter; render(); });
    });
    container.querySelector('#cal-client-filter')?.addEventListener('change', e => {
      state.clientFilter = e.target.value; render();
    });

    container.querySelectorAll('.cal-event-pill[data-event-id]').forEach(pill => {
      pill.addEventListener('click', () => {
        const ev = getAllEvents().find(e => e.id === pill.dataset.eventId);
        if (ev) showEventModal(ev);
      });
    });
  }

  render();
}
