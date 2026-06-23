// ============================================================
// REPORTS PAGE
// ============================================================
import { getAll, getDashboardStats, getClientStats, getEmployeeWorkload, COLLECTIONS } from '../data/store.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';

const _charts = [];
export function cleanup() { _charts.forEach(c => { try { c.destroy(); } catch(e){} }); _charts.length = 0; }

function mkChart(id, config) {
  const el = document.getElementById(id);
  if (!el) return;
  const existing = Chart.getChart(el);
  if (existing) existing.destroy();
  const chart = new Chart(el, config);
  _charts.push(chart);
  return chart;
}

const DARK = { bg: '#1A1D27', grid: 'rgba(255,255,255,0.07)', text: '#94A3B8' };

export default function renderReports(container, currentMonth) {
  const state = { tab: 'overview', clientFilter: 'all', empFilter: 'all' };

  function exportCSV(headers, rows, filename) {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  function renderTabContent(tabId) {
    const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
    const employees = getAll(COLLECTIONS.EMPLOYEES).filter(e => e.status === 'Active');
    const tasks = getAll(COLLECTIONS.TASKS);
    const rawData = getAll(COLLECTIONS.RAW_DATA);
    const deliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES);

    cleanup();

    switch (tabId) {
      case 'overview': return renderOverview(clients, tasks, deliverables);
      case 'deliverables': return renderDeliverables(clients, deliverables);
      case 'workload': return renderWorkload(employees, tasks);
      case 'raw': return renderRawData(clients, rawData);
      case 'health': return renderClientHealth(clients);
      case 'approvals': return renderApprovals(tasks);
      case 'buffer': return renderBuffer(tasks);
      default: return '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">Select a report</div></div>';
    }
  }

  function renderOverview(clients, tasks, deliverables) {
    const totalPromised = deliverables.reduce((s, d) => s + (d.promised || 0), 0);
    const totalUploaded = deliverables.reduce((s, d) => s + (d.uploaded || 0), 0);
    const overdue = tasks.filter(t => t.daysOverdue > 0).length;
    const completionRate = totalPromised > 0 ? Math.round((totalUploaded / totalPromised) * 100) : 0;

    setTimeout(() => {
      mkChart('rpt-client-chart', {
        type: 'bar',
        data: {
          labels: clients.map(c => c.name.replace('Dr. ', 'Dr.')),
          datasets: [
            { label: 'Promised', data: clients.map(c => deliverables.filter(d => d.clientId === c.id).reduce((s,d) => s+(d.promised||0), 0)), backgroundColor: 'rgba(124,58,237,0.6)', borderRadius: 4 },
            { label: 'Completed', data: clients.map(c => deliverables.filter(d => d.clientId === c.id).reduce((s,d) => s+(d.uploaded||0), 0)), backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 4 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { color: DARK.grid } }, y: { grid: { color: DARK.grid }, beginAtZero: true } } }
      });
    }, 50);

    return `
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:24px;">
        ${[
          { label: 'Total Clients', value: clients.length, color: '#7C3AED' },
          { label: 'Total Tasks', value: getAll(COLLECTIONS.TASKS).length, color: '#2563EB' },
          { label: 'Completion Rate', value: completionRate + '%', color: '#22C55E' },
          { label: 'Overdue Tasks', value: overdue, color: '#EF4444' },
        ].map(s => `
          <div class="stat-card" style="--stat-color:${s.color};">
            <div class="stat-card-label">${s.label}</div>
            <div class="stat-card-value">${s.value}</div>
          </div>
        `).join('')}
      </div>
      <div class="chart-card" style="margin-bottom:24px;">
        <div class="chart-card-title">Promised vs Completed by Client</div>
        <div class="chart-wrap" style="height:220px;"><canvas id="rpt-client-chart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span style="font-weight:600;">Client Summary</span>
          <button class="btn btn-secondary btn-sm" id="export-overview-csv">📥 Export CSV</button>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Client</th><th>Package</th><th>Promised</th><th>Completed</th><th>Remaining</th><th>Completion %</th><th>Health Score</th></tr></thead>
          <tbody>
            ${clients.map(c => {
              const stats = getClientStats(c.id, currentMonth);
              const p = deliverables.filter(d => d.clientId === c.id).reduce((s,d) => s+(d.promised||0), 0);
              const u = deliverables.filter(d => d.clientId === c.id).reduce((s,d) => s+(d.uploaded||0), 0);
              const pct = p > 0 ? Math.round((u/p)*100) : 0;
              const hColor = stats.healthScore >= 80 ? '#22C55E' : stats.healthScore >= 60 ? '#F97316' : '#EF4444';
              return `<tr>
                <td style="font-weight:600;">${c.name}</td>
                <td>${c.packageName}</td>
                <td>${p}</td>
                <td>${u}</td>
                <td>${p - u}</td>
                <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;background:${pct>=80?'#22C55E':pct>=50?'#F97316':'#EF4444'};"></div></div><span class="progress-bar-label">${pct}%</span></div></td>
                <td><span style="font-weight:700;color:${hColor};">${stats.healthScore}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderDeliverables(clients, deliverables) {
    setTimeout(() => {
      const types = ['reel','static-post','carousel','story','monthly-report'];
      const typeNames = ['Reels','Static Posts','Carousels','Stories','Reports'];
      mkChart('rpt-del-chart', {
        type: 'bar',
        data: {
          labels: typeNames,
          datasets: [
            { label: 'Promised', data: types.map(t => deliverables.filter(d => d.contentType === t).reduce((s,d) => s+(d.promised||0), 0)), backgroundColor: 'rgba(124,58,237,0.6)', borderRadius: 4 },
            { label: 'Completed', data: types.map(t => deliverables.filter(d => d.contentType === t).reduce((s,d) => s+(d.uploaded||0), 0)), backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 4 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { color: DARK.grid } }, y: { grid: { color: DARK.grid }, beginAtZero: true } } }
      });
    }, 50);

    return `
      <div class="chart-card" style="margin-bottom:24px;">
        <div class="chart-card-title">Deliverables by Content Type</div>
        <div class="chart-wrap" style="height:200px;"><canvas id="rpt-del-chart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span style="font-weight:600;">Monthly Deliverables</span>
          <button class="btn btn-secondary btn-sm" id="export-del-csv">📥 Export CSV</button>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Client</th><th>Content Type</th><th>Promised</th><th>Completed</th><th>Remaining</th><th>%</th></tr></thead>
          <tbody>
            ${deliverables.filter(d => d.promised > 0).map(d => {
              const client = clients.find(c => c.id === d.clientId);
              const pct = d.promised > 0 ? Math.round(((d.uploaded||0)/d.promised)*100) : 0;
              return `<tr>
                <td style="font-weight:500;">${client?.name || d.clientId}</td>
                <td>${d.contentTypeName}</td>
                <td>${d.promised}</td>
                <td>${d.uploaded||0}</td>
                <td>${d.promised - (d.uploaded||0)}</td>
                <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;background:${pct>=80?'#22C55E':pct>=50?'#F97316':'#EF4444'};"></div></div><span class="progress-bar-label">${pct}%</span></div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderWorkload(employees, tasks) {
    setTimeout(() => {
      mkChart('rpt-workload-chart', {
        type: 'bar',
        data: {
          labels: employees.map(e => e.name.split(' ')[0]),
          datasets: [
            { label: 'Assigned', data: employees.map(e => tasks.filter(t => t.primaryOwner === e.id).length), backgroundColor: 'rgba(124,58,237,0.6)', borderRadius: 4 },
            { label: 'Completed', data: employees.map(e => tasks.filter(t => t.primaryOwner === e.id && t.status === 'uploaded').length), backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 4 },
          ],
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { color: DARK.grid }, beginAtZero: true }, y: { grid: { color: DARK.grid } } } }
      });
    }, 50);

    return `
      <div class="chart-card" style="margin-bottom:24px;">
        <div class="chart-card-title">Tasks by Employee</div>
        <div class="chart-wrap" style="height:260px;"><canvas id="rpt-workload-chart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span style="font-weight:600;">Employee Workload</span>
          <button class="btn btn-secondary btn-sm" id="export-wl-csv">📥 Export CSV</button>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Employee</th><th>CU-ID</th><th>Dept</th><th>Assigned</th><th>Completed</th><th>Pending</th><th>Overdue</th><th>% Done</th></tr></thead>
          <tbody>
            ${employees.map(emp => {
              const wl = getEmployeeWorkload(emp.id, currentMonth);
              const pct = wl.assigned > 0 ? Math.round((wl.completed/wl.assigned)*100) : 0;
              return `<tr>
                <td style="font-weight:600;">${emp.name}</td>
                <td><code class="cu-id">${emp.cuId}</code></td>
                <td>${emp.departmentName || emp.department}</td>
                <td>${wl.assigned}</td>
                <td>${wl.completed}</td>
                <td>${wl.pending}</td>
                <td style="color:${wl.overdue > 0 ? '#EF4444' : 'var(--text-muted)'};">${wl.overdue}</td>
                <td><div class="progress-bar-wrap" style="min-width:80px;"><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;"></div></div><span class="progress-bar-label">${pct}%</span></div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderRawData(clients, rawData) {
    setTimeout(() => {
      const statuses = ['Available','Partially Used','Fully Used','Missing Link','Rejected','Hold for Later'];
      const counts = statuses.map(s => rawData.filter(r => r.status === s).length);
      const colors = ['rgba(34,197,94,0.7)','rgba(249,115,22,0.7)','rgba(107,114,128,0.7)','rgba(220,38,38,0.7)','rgba(239,68,68,0.7)','rgba(139,92,246,0.7)'];
      mkChart('rpt-raw-chart', {
        type: 'doughnut',
        data: { labels: statuses, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 2, borderColor: DARK.bg }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right' } } }
      });
    }, 50);

    const clientRaw = clients.map(c => {
      const cr = rawData.filter(r => r.clientId === c.id);
      return { client: c, total: cr.length, available: cr.filter(r=>r.status==='Available').length, partial: cr.filter(r=>r.status==='Partially Used').length, full: cr.filter(r=>r.status==='Fully Used').length, missing: cr.filter(r=>!r.driveLink).length };
    });

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div class="chart-card">
          <div class="chart-card-title">Raw Data Status Distribution</div>
          <div class="chart-wrap" style="height:200px;"><canvas id="rpt-raw-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="section-title" style="margin-bottom:12px;">Quick Stats</div>
          ${[
            { label: 'Total Raw Videos', value: rawData.length, color: '#7C3AED' },
            { label: 'Available', value: rawData.filter(r=>r.status==='Available').length, color: '#22C55E' },
            { label: 'Partially Used', value: rawData.filter(r=>r.status==='Partially Used').length, color: '#F97316' },
            { label: 'Missing Drive Links', value: rawData.filter(r=>!r.driveLink).length, color: '#EF4444' },
          ].map(s => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:13px;color:var(--text-secondary);">${s.label}</span>
            <span style="font-size:15px;font-weight:700;color:${s.color};">${s.value}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="table-container">
        <div class="table-header"><span style="font-weight:600;">Raw Data by Client</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Client</th><th>Total</th><th>Available</th><th>Partial</th><th>Fully Used</th><th>Missing Links</th></tr></thead>
          <tbody>
            ${clientRaw.map(r => `<tr>
              <td style="font-weight:500;">${r.client.name}</td>
              <td>${r.total}</td>
              <td style="color:#22C55E;font-weight:600;">${r.available}</td>
              <td style="color:#F97316;font-weight:600;">${r.partial}</td>
              <td style="color:#6B7280;">${r.full}</td>
              <td style="color:${r.missing>0?'#EF4444':'var(--text-muted)'};">${r.missing}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderClientHealth(clients) {
    setTimeout(() => {
      const scores = clients.map(c => getClientStats(c.id, currentMonth).healthScore);
      const colors = scores.map(s => s >= 80 ? 'rgba(34,197,94,0.7)' : s >= 60 ? 'rgba(249,115,22,0.7)' : 'rgba(239,68,68,0.7)');
      mkChart('rpt-health-chart', {
        type: 'bar',
        data: { labels: clients.map(c => c.name.replace('Dr. ','')), datasets: [{ label: 'Health Score', data: scores, backgroundColor: colors, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: DARK.grid } }, y: { grid: { color: DARK.grid }, min: 0, max: 100 } } }
      });
    }, 50);

    return `
      <div class="chart-card" style="margin-bottom:24px;">
        <div class="chart-card-title">Client Health Scores</div>
        <div class="chart-wrap" style="height:220px;"><canvas id="rpt-health-chart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span style="font-weight:600;">Client Health Details</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Client</th><th>Health Score</th><th>Status</th><th>Overdue</th><th>Pending Approvals</th><th>Raw Available</th><th>Missing Links</th></tr></thead>
          <tbody>
            ${clients.map(c => {
              const st = getClientStats(c.id, currentMonth);
              const sc = st.healthScore;
              const hColor = sc >= 80 ? '#22C55E' : sc >= 60 ? '#F97316' : '#EF4444';
              const hLabel = sc >= 80 ? 'On Track' : sc >= 60 ? 'Needs Attention' : 'Action Required';
              return `<tr>
                <td style="font-weight:600;">${c.name}</td>
                <td><span style="font-size:18px;font-weight:800;color:${hColor};">${sc}</span><span style="font-size:11px;color:var(--text-muted);">/100</span></td>
                <td><span class="badge" style="background:${hColor}20;color:${hColor};">${hLabel}</span></td>
                <td style="color:${st.overdue>0?'#EF4444':'var(--text-muted)'};">${st.overdue}</td>
                <td style="color:${st.pendingApprovals>2?'#F97316':'var(--text-muted)'};">${st.pendingApprovals}</td>
                <td style="color:${st.rawReelsAvailable<3?'#EF4444':'#22C55E'};font-weight:600;">${st.rawReelsAvailable}</td>
                <td style="color:${st.missingLinks>0?'#EF4444':'var(--text-muted)'};">${st.missingLinks}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderApprovals(tasks) {
    const approvalTasks = tasks.filter(t => t.status === 'cu-approval' || t.status === 'client-approval');
    return `
      <div class="table-container">
        <div class="table-header">
          <span style="font-weight:600;">Approval Delays — ${approvalTasks.length} tasks waiting</span>
          <button class="btn btn-secondary btn-sm" id="export-appr-csv">📥 Export CSV</button>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Task</th><th>Client</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Deadline</th></tr></thead>
          <tbody>
            ${approvalTasks.length === 0 ? `<tr><td colspan="6"><div class="empty-state" style="padding:30px;"><div class="empty-state-icon">✅</div><div class="empty-state-title">No pending approvals!</div></div></td></tr>` :
              approvalTasks.map(t => {
                const stMap = { 'cu-approval': { label: 'CU Approval', color: '#F59E0B' }, 'client-approval': { label: 'Client Approval', color: '#06B6D4' } };
                const st = stMap[t.status] || {};
                return `<tr>
                  <td style="font-weight:500;max-width:200px;">${t.title}</td>
                  <td>${t.clientName}</td>
                  <td><span class="badge" style="background:${st.color}20;color:${st.color};">${st.label}</span></td>
                  <td><span class="badge ${t.priority==='Urgent'?'badge-red':t.priority==='High'?'badge-orange':'badge-gray'}">${t.priority}</span></td>
                  <td>${t.primaryOwnerName || '—'}</td>
                  <td style="color:${t.deadline && new Date(t.deadline)<new Date()?'#EF4444':'var(--text-muted)'};">${t.deadline || '—'}</td>
                </tr>`;
              }).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderBuffer(tasks) {
    const bufferTasks = tasks.filter(t => t.status === 'buffer');
    return `
      <div class="table-container">
        <div class="table-header">
          <span style="font-weight:600;">Buffer Content — ${bufferTasks.length} pieces ready</span>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Content Title</th><th>Client</th><th>Content Type</th><th>Priority</th><th>Tags</th><th>Created</th></tr></thead>
          <tbody>
            ${bufferTasks.length === 0 ? `<tr><td colspan="6"><div class="empty-state" style="padding:30px;"><div class="empty-state-icon">📦</div><div class="empty-state-title">No buffer content</div></div></td></tr>` :
              bufferTasks.map(t => `<tr>
                <td style="font-weight:500;">${t.title}</td>
                <td>${t.clientName}</td>
                <td>${t.contentTypeName}</td>
                <td><span class="badge ${t.priority==='Urgent'?'badge-red':t.priority==='High'?'badge-orange':'badge-gray'}">${t.priority}</span></td>
                <td>${(t.tags||[]).map(tag => `<span class="badge badge-purple" style="font-size:10px;">${tag}</span>`).join(' ')}</td>
                <td class="cell-muted">${t.createdAt || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function render() {
    const tabs = [
      { id: 'overview', label: '📊 Overview' },
      { id: 'deliverables', label: '📦 Deliverables' },
      { id: 'workload', label: '⚡ Employee Workload' },
      { id: 'raw', label: '🎥 Raw Data' },
      { id: 'health', label: '❤️ Client Health' },
      { id: 'approvals', label: '✋ Approval Delays' },
      { id: 'buffer', label: '📦 Buffer Content' },
    ];

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-subtitle">Agency analytics, performance metrics, and export tools</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="export-pdf-btn">🖨️ Print / PDF</button>
          <button class="btn btn-secondary" id="export-csv-btn">📥 Export CSV</button>
        </div>
      </div>

      <div class="tabs" style="margin-bottom:24px;">
        ${tabs.map(t => `<div class="tab ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</div>`).join('')}
      </div>

      <div id="report-content">${renderTabContent(state.tab)}</div>
    `;

    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        state.tab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.tab));
        document.getElementById('report-content').innerHTML = renderTabContent(state.tab);
        attachTabEvents();
      });
    });

    container.querySelector('#export-pdf-btn')?.addEventListener('click', () => window.print());
    container.querySelector('#export-csv-btn')?.addEventListener('click', () => {
      const tasks = getAll(COLLECTIONS.TASKS);
      exportCSV(
        ['Task ID','Title','Client','Content Type','Status','Priority','Assigned','Deadline'],
        tasks.map(t => [t.contentId, t.title, t.clientName, t.contentTypeName, t.status, t.priority, t.primaryOwnerName||'', t.deadline||''])
      , 'creative-universe-tasks.csv');
      window.showToast?.('CSV exported!', 'success');
    });

    attachTabEvents();
  }

  function attachTabEvents() {
    document.getElementById('export-overview-csv')?.addEventListener('click', () => {
      const deliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES);
      const clients = getAll(COLLECTIONS.CLIENTS);
      exportCSV(['Client','Promised','Completed','Remaining'],
        clients.map(c => {
          const p = deliverables.filter(d=>d.clientId===c.id).reduce((s,d)=>s+(d.promised||0),0);
          const u = deliverables.filter(d=>d.clientId===c.id).reduce((s,d)=>s+(d.uploaded||0),0);
          return [c.name, p, u, p-u];
        }), 'overview-report.csv');
      window.showToast?.('CSV exported!', 'success');
    });
    document.getElementById('export-del-csv')?.addEventListener('click', () => {
      const deliverables = getAll(COLLECTIONS.MONTHLY_DELIVERABLES);
      const clients = getAll(COLLECTIONS.CLIENTS);
      exportCSV(['Client','Content Type','Promised','Completed','Remaining'],
        deliverables.map(d => {
          const c = clients.find(cl=>cl.id===d.clientId);
          return [c?.name||d.clientId, d.contentTypeName, d.promised, d.uploaded||0, d.promised-(d.uploaded||0)];
        }), 'deliverables-report.csv');
      window.showToast?.('CSV exported!', 'success');
    });
    document.getElementById('export-wl-csv')?.addEventListener('click', () => {
      const employees = getAll(COLLECTIONS.EMPLOYEES);
      exportCSV(['Employee','CU-ID','Department','Assigned','Completed','Pending','Overdue'],
        employees.map(e => {
          const wl = getEmployeeWorkload(e.id, currentMonth);
          return [e.name, e.cuId, e.departmentName||e.department, wl.assigned, wl.completed, wl.pending, wl.overdue];
        }), 'workload-report.csv');
      window.showToast?.('CSV exported!', 'success');
    });
    document.getElementById('export-appr-csv')?.addEventListener('click', () => {
      const tasks = getAll(COLLECTIONS.TASKS).filter(t=>t.status==='cu-approval'||t.status==='client-approval');
      exportCSV(['Title','Client','Status','Priority','Assigned','Deadline'],
        tasks.map(t=>[t.title,t.clientName,t.status,t.priority,t.primaryOwnerName||'',t.deadline||''])
      ,'approvals-report.csv');
      window.showToast?.('CSV exported!', 'success');
    });
  }

  render();
}
