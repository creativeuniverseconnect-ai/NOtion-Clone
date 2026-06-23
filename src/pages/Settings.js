// ============================================================
// SETTINGS PAGE
// ============================================================
import { getAll, create, update, remove, getSettings, updateSettings, resetStore, COLLECTIONS } from '../data/store.js';
import { DEPARTMENTS, ROLES, DEFAULT_CONTENT_TYPES, DEFAULT_WORKFLOW_SEGMENTS } from '../data/schema.js';

export default function renderSettings(container) {
  const state = { section: 'general' };

  const sections = [
    { id: 'general', label: '⚙️ General', icon: '⚙️' },
    { id: 'employees-roles', label: '👥 Employees & Roles', icon: '👥' },
    { id: 'departments', label: '🏢 Departments', icon: '🏢' },
    { id: 'content-types', label: '🎬 Content Types', icon: '🎬' },
    { id: 'workflow', label: '🔄 Workflow Templates', icon: '🔄' },
    { id: 'packages', label: '📦 Package Templates', icon: '📦' },
    { id: 'storage', label: '🗂️ Storage Categories', icon: '🗂️' },
    { id: 'alert-rules', label: '🔔 Alert Rules', icon: '🔔' },
    { id: 'permissions', label: '🔐 Permissions', icon: '🔐' },
    { id: 'reset', label: '⚠️ Reset Data', icon: '⚠️' },
  ];

  function renderSectionContent(id) {
    switch (id) {
      case 'general': return renderGeneral();
      case 'employees-roles': return renderEmployeesRoles();
      case 'departments': return renderDepartments();
      case 'content-types': return renderContentTypes();
      case 'workflow': return renderWorkflow();
      case 'packages': return renderPackages();
      case 'storage': return renderStorage();
      case 'alert-rules': return renderAlertRules();
      case 'permissions': return renderPermissions();
      case 'reset': return renderReset();
      default: return '<div class="empty-state"><div class="empty-state-icon">⚙️</div><div class="empty-state-title">Select a section</div></div>';
    }
  }

  function renderGeneral() {
    const settings = getSettings();
    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">General Settings</h2>
      <div class="card" style="max-width:560px;">
        <div class="form-grid">
          <div class="input-group full">
            <label class="input-label">Agency Name</label>
            <input class="input" type="text" id="agency-name" value="${settings.agencyName || 'Creative Universe'}" />
          </div>
          <div class="input-group full">
            <label class="input-label">Current Logged-in User</label>
            <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:8px;font-size:14px;display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;">
                ${(settings.currentUser?.name||'').split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style="font-weight:600;">${settings.currentUser?.name || 'Unknown'}</div>
                <div style="font-size:12px;color:var(--text-muted);">${settings.currentUser?.cuId || ''} · ${settings.currentUser?.role || ''}</div>
              </div>
            </div>
          </div>
          <div class="input-group full">
            <label class="input-label">Accent Color</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="accent-color" value="${settings.accentColor || '#7C3AED'}" style="width:48px;height:36px;border-radius:8px;cursor:pointer;background:none;border:1px solid var(--border);padding:2px;" />
              <span style="font-size:13px;color:var(--text-muted);">Current: ${settings.accentColor || '#7C3AED'}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;">
          <button class="btn btn-primary" id="save-general">Save Changes</button>
          <button class="btn btn-secondary" onclick="location.reload()">Cancel</button>
        </div>
      </div>
    `;
  }

  function renderEmployeesRoles() {
    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Employee Roles</h2>
      <div class="card">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>#</th><th>Role Name</th><th>Dept Code</th><th>Description</th></tr></thead>
          <tbody>
            ${ROLES.map((role, i) => {
              const dept = DEPARTMENTS.find(d => d.name === role);
              return `<tr>
                <td style="color:var(--text-muted);">${i + 1}</td>
                <td style="font-weight:500;">${role}</td>
                <td><code class="cu-id">${dept?.code || '—'}</code></td>
                <td style="color:var(--text-muted);font-size:12px;">Standard agency role</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
        <div style="margin-top:14px;padding:12px;background:var(--bg-elevated);border-radius:8px;font-size:12px;color:var(--text-muted);">
          💡 Roles are used to generate Employee IDs (e.g., CU-SMM-001). Custom roles can be added in a future update.
        </div>
      </div>
    `;
  }

  function renderDepartments() {
    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Departments</h2>
      <div class="card">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Code</th><th>Department Name</th><th>ID Prefix</th></tr></thead>
          <tbody>
            ${DEPARTMENTS.map(dept => `<tr>
              <td><code class="cu-id">${dept.code}</code></td>
              <td style="font-weight:500;">${dept.name}</td>
              <td style="color:var(--text-muted);font-family:monospace;">CU-${dept.code}-XXX</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderContentTypes() {
    const contentTypes = getAll(COLLECTIONS.CONTENT_TYPES).length > 0 ? getAll(COLLECTIONS.CONTENT_TYPES) : DEFAULT_CONTENT_TYPES;

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="font-size:18px;font-weight:700;">Content Types</h2>
        <button class="btn btn-primary" id="add-ct-btn">+ Add Content Type</button>
      </div>
      <div class="card" style="padding:0;">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Icon</th><th>Name</th><th>Color</th><th>Tracking Type</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            ${contentTypes.map(ct => `<tr>
              <td style="font-size:20px;">${ct.icon}</td>
              <td style="font-weight:600;">${ct.name}</td>
              <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:16px;height:16px;border-radius:4px;background:${ct.color};"></div><span style="font-size:12px;color:var(--text-muted);">${ct.color}</span></div></td>
              <td><span class="badge badge-blue" style="font-size:10px;">${ct.trackingType}</span></td>
              <td>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                  <div style="width:36px;height:20px;border-radius:10px;background:${ct.active !== false ? 'var(--accent)' : 'var(--bg-elevated)'};position:relative;transition:background 0.2s;" class="toggle-switch" data-ct-id="${ct.id}">
                    <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;${ct.active !== false ? 'right:2px' : 'left:2px'};transition:all 0.2s;"></div>
                  </div>
                </label>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" data-edit-ct="${ct.id}">✏️ Edit</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderWorkflow() {
    const templates = [
      { name: 'Reels Workflow', type: 'Reel', steps: ['Not Started','Script Writing','Script Approval','Shoot Pending','Shoot Completed','Under Editing','CU Approval','Re-Edit','Buffer','Client Approval','Ready to Upload','Uploaded'] },
      { name: 'Static Posts Workflow', type: 'Static Post', steps: ['Not Started','Content Writing','Designing','CU Approval','Re-Design','Client Approval','Ready to Upload','Uploaded'] },
      { name: 'Carousels Workflow', type: 'Carousel', steps: ['Not Started','Content Writing','Designing','CU Approval','Re-Design','Client Approval','Ready to Upload','Uploaded'] },
      { name: 'Stories Workflow', type: 'Story', steps: ['Not Started','Designing','CU Approval','Ready to Upload','Uploaded'] },
      { name: 'YouTube Videos', type: 'YouTube Video', steps: ['Not Started','Script Writing','Shoot Pending','Under Editing','Thumbnail Pending','CU Approval','Client Approval','Scheduled','Uploaded'] },
      { name: 'Blogs Workflow', type: 'Blog', steps: ['Not Started','Research','Writing','CU Approval','SEO Review','Client Approval','Published'] },
      { name: 'Monthly Reports', type: 'Monthly Report', steps: ['Not Started','Data Collection','Report Preparation','CU Approval','Sent to Client','Completed'] },
    ];

    const stepColors = ['#6B7280','#3B82F6','#F59E0B','#22C55E','#14B8A6','#F97316','#DC2626','#8B5CF6','#06B6D4','#10B981','#16A34A','#0D9488'];

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="font-size:18px;font-weight:700;">Workflow Templates</h2>
        <button class="btn btn-primary">+ Create Template</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${templates.map(tmpl => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div>
                <div style="font-size:15px;font-weight:700;">${tmpl.name}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Content Type: ${tmpl.type}</div>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-secondary btn-sm">✏️ Edit</button>
                <button class="btn btn-secondary btn-sm">📋 Duplicate</button>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
              ${tmpl.steps.map((step, i) => `
                <div style="display:flex;align-items:center;gap:4px;">
                  <span style="background:${stepColors[i % stepColors.length]}22;color:${stepColors[i % stepColors.length]};font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid ${stepColors[i % stepColors.length]}44;white-space:nowrap;">
                    ${step}
                  </span>
                  ${i < tmpl.steps.length - 1 ? '<span style="color:var(--text-muted);font-size:14px;">→</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPackages() {
    const packages = getAll(COLLECTIONS.PACKAGE_TEMPLATES);
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="font-size:18px;font-weight:700;">Package Templates</h2>
        <button class="btn btn-primary">+ Create Package</button>
      </div>
      <div class="grid-3" style="gap:16px;">
        ${packages.map(pkg => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
              <div>
                <div style="font-size:15px;font-weight:700;">${pkg.name}</div>
                <div style="font-size:18px;font-weight:800;color:var(--accent);margin-top:4px;">₹${(pkg.price||0).toLocaleString('en-IN')}</div>
              </div>
              <button class="btn btn-ghost btn-sm">✏️</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${(pkg.deliverables||[]).map(d => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                  <span style="color:var(--text-secondary);">${d.contentTypeName}</span>
                  <span style="font-weight:700;color:var(--text-primary);">${d.quantity}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" style="flex:1;">📋 Duplicate</button>
              <button class="btn btn-ghost btn-sm">Apply to Client</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderStorage() {
    const types = [
      'Main Drive Folder','Raw Footage Folder','Edited Reels Folder','Graphics Folder',
      'Brand Kit Folder','Scripts Folder','Reports Folder','Published Content Folder',
      'Campaign Folder','Photography Folder','Website Assets Folder',
    ];
    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Storage Link Categories</h2>
      <div class="card">
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${types.map((t, i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-elevated);border-radius:8px;font-size:13px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="color:var(--text-muted);">${i + 1}.</span>
                <span style="font-weight:500;">📁 ${t}</span>
              </div>
              <button class="btn btn-ghost btn-sm">✏️ Rename</button>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:14px;">
          <button class="btn btn-secondary">+ Add Storage Category</button>
        </div>
      </div>
    `;
  }

  function renderAlertRules() {
    const rules = [
      { rule: 'Remaining Deliverables', desc: 'Remaining = Promised Quantity − Uploaded or Completed', type: 'auto' },
      { rule: 'Remaining Raw Data', desc: 'Remaining Raw = Estimated Reels − Reels Already Created', type: 'auto' },
      { rule: 'Shoot Required', desc: 'If Raw Available < Monthly Reels Remaining → mark Shoot Required', type: 'alert' },
      { rule: 'Low Inventory', desc: 'If Raw Available < 4 reels → mark Low Inventory alert', type: 'alert' },
      { rule: 'Overdue Task', desc: 'If Current Date > Deadline and Task not Completed → mark Overdue', type: 'alert' },
      { rule: 'Approval Delay', desc: 'If CU or Client Approval pending > 3 days → show alert', type: 'alert' },
      { rule: 'Missing Assignment', desc: 'If task has no Primary Owner → show Unassigned Task alert', type: 'alert' },
      { rule: 'Missing Link', desc: 'If raw footage has no Drive Link → show Missing Link alert', type: 'alert' },
      { rule: 'Employee Capacity', desc: 'Calculate workload based on pending tasks, overdue tasks, deadlines', type: 'auto' },
      { rule: 'Client Health Score', desc: 'Calculate score using deliverables, raw data, approvals, delays, assignments', type: 'auto' },
    ];

    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Automatic Alert Rules</h2>
      <div style="margin-bottom:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;font-size:13px;color:var(--text-muted);">
        💡 These rules run automatically in real-time. No configuration required.
      </div>
      <div class="card" style="padding:0;">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>#</th><th>Rule Name</th><th>Description</th><th>Type</th></tr></thead>
          <tbody>
            ${rules.map((r, i) => `<tr>
              <td style="color:var(--text-muted);">${i + 1}</td>
              <td style="font-weight:600;">${r.rule}</td>
              <td style="font-size:12px;color:var(--text-muted);max-width:300px;">${r.desc}</td>
              <td><span class="badge ${r.type==='alert' ? 'badge-orange' : 'badge-blue'}">${r.type === 'alert' ? '🔔 Alert' : '⚡ Auto-calc'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  function renderPermissions() {
    const rolePerms = [
      { role: 'Admin / Owner', dashboard: '✅', clients: '✅', workflow: '✅', team: '✅', reports: '✅', settings: '✅' },
      { role: 'Social Media Manager', dashboard: '✅', clients: '✅', workflow: '✅', team: '👁️', reports: '👁️', settings: '❌' },
      { role: 'Video Editor', dashboard: '✅', clients: '👁️', workflow: '✅', team: '❌', reports: '❌', settings: '❌' },
      { role: 'Graphic Designer', dashboard: '✅', clients: '👁️', workflow: '✅', team: '❌', reports: '❌', settings: '❌' },
      { role: 'Content Writer', dashboard: '✅', clients: '👁️', workflow: '✅', team: '❌', reports: '❌', settings: '❌' },
      { role: 'Shoot Coordinator', dashboard: '✅', clients: '👁️', workflow: '👁️', team: '❌', reports: '❌', settings: '❌' },
      { role: 'Creative Director', dashboard: '✅', clients: '✅', workflow: '✅', team: '✅', reports: '✅', settings: '❌' },
      { role: 'Reviewer', dashboard: '✅', clients: '👁️', workflow: '✅', team: '❌', reports: '❌', settings: '❌' },
      { role: 'Freelancer', dashboard: '👁️', clients: '❌', workflow: '✅', team: '❌', reports: '❌', settings: '❌' },
    ];

    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">User Permissions</h2>
      <div style="margin-bottom:12px;font-size:12px;color:var(--text-muted);">✅ Full Access &nbsp;·&nbsp; 👁️ View Only &nbsp;·&nbsp; ❌ No Access</div>
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Role</th><th>Dashboard</th><th>Clients</th><th>Workflow</th><th>Team</th><th>Reports</th><th>Settings</th></tr></thead>
          <tbody>
            ${rolePerms.map(r => `<tr>
              <td style="font-weight:600;white-space:nowrap;">${r.role}</td>
              <td style="text-align:center;">${r.dashboard}</td>
              <td style="text-align:center;">${r.clients}</td>
              <td style="text-align:center;">${r.workflow}</td>
              <td style="text-align:center;">${r.team}</td>
              <td style="text-align:center;">${r.reports}</td>
              <td style="text-align:center;">${r.settings}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderReset() {
    return `
      <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;color:var(--color-red);">⚠️ Danger Zone</h2>
      <div class="card" style="border:1px solid rgba(239,68,68,0.3);">
        <div style="display:flex;align-items:flex-start;gap:16px;">
          <div style="font-size:32px;">🚨</div>
          <div>
            <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Reset to Sample Data</div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.7;">
              This will <strong style="color:var(--color-red);">delete all current data</strong> and restore the original sample data (10 employees, 8 clients, 40 tasks, 20 raw videos). This action cannot be undone.
            </div>
            <div style="display:flex;gap:12px;">
              <button class="btn btn-danger" id="reset-data-btn">🗑️ Reset All Data</button>
              <button class="btn btn-secondary" onclick="void(0)">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;border:1px solid var(--border);">
        <div style="font-size:15px;font-weight:700;margin-bottom:8px;">About This App</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.7;">
          <div style="margin-bottom:6px;"><strong>App:</strong> Creative Universe — Content Inventory & Production Planner</div>
          <div style="margin-bottom:6px;"><strong>Version:</strong> MVP 1.0</div>
          <div style="margin-bottom:6px;"><strong>Data Storage:</strong> Browser localStorage (no backend)</div>
          <div style="margin-bottom:6px;"><strong>Pages:</strong> 14 pages · 10 employees · 8 clients · 40+ tasks</div>
          <div><strong>Built for:</strong> Creative Universe Digital Marketing Agency</div>
        </div>
      </div>
    `;
  }

  function render() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Configure the app, manage templates, and customize workflows</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;">
        <!-- Left nav -->
        <div class="card" style="padding:8px;">
          ${sections.map(s => `
            <div class="nav-item ${state.section === s.id ? 'active' : ''}" data-section="${s.id}" style="margin-bottom:2px;border-radius:8px;">
              <span style="font-size:16px;">${s.icon}</span>
              <span style="font-size:13px;">${s.label.replace(s.icon + ' ', '')}</span>
            </div>
          `).join('')}
        </div>

        <!-- Content -->
        <div id="settings-content">
          ${renderSectionContent(state.section)}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-section]').forEach(item => {
      item.addEventListener('click', () => {
        state.section = item.dataset.section;
        container.querySelectorAll('[data-section]').forEach(i => i.classList.toggle('active', i.dataset.section === state.section));
        document.getElementById('settings-content').innerHTML = renderSectionContent(state.section);
        attachSectionEvents();
      });
    });

    attachSectionEvents();
  }

  function attachSectionEvents() {
    // Save general settings
    document.getElementById('save-general')?.addEventListener('click', () => {
      const name = document.getElementById('agency-name')?.value?.trim();
      const color = document.getElementById('accent-color')?.value;
      updateSettings({ agencyName: name, accentColor: color });
      if (color) document.documentElement.style.setProperty('--accent', color);
      window.showToast?.('Settings saved!', 'success');
    });

    // Reset data
    document.getElementById('reset-data-btn')?.addEventListener('click', () => {
      if (confirm('⚠️ Are you sure you want to reset ALL data? This cannot be undone.')) {
        resetStore();
        window.showToast?.('Data reset to sample data!', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    });

    // Content type toggles
    document.querySelectorAll('.toggle-switch[data-ct-id]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const ctId = toggle.dataset.ctId;
        const contentTypes = getAll(COLLECTIONS.CONTENT_TYPES);
        const ct = contentTypes.find(c => c.id === ctId);
        if (ct) {
          update(COLLECTIONS.CONTENT_TYPES, ctId, { active: ct.active === false });
          window.showToast?.(`${ct.name} ${ct.active === false ? 'activated' : 'deactivated'}`, 'info');
          document.getElementById('settings-content').innerHTML = renderSectionContent(state.section);
          attachSectionEvents();
        }
      });
    });

    // Add content type
    document.getElementById('add-ct-btn')?.addEventListener('click', () => {
      let overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'ct-modal';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header"><span class="modal-title">Add Content Type</span><button class="modal-close" id="ct-close">✕</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="input-group full"><label class="input-label">Content Type Name *</label><input class="input" type="text" id="ct-name" placeholder="e.g. Instagram Reel" /></div>
              <div class="input-group"><label class="input-label">Icon (emoji)</label><input class="input" type="text" id="ct-icon" placeholder="🎬" maxlength="4" /></div>
              <div class="input-group"><label class="input-label">Color</label><input type="color" id="ct-color" value="#7C3AED" style="width:100%;height:40px;border-radius:8px;cursor:pointer;" /></div>
              <div class="input-group full"><label class="input-label">Tracking Type</label>
                <select class="input" id="ct-tracking">
                  <option value="quantity">Quantity-Based</option><option value="task">Task-Based</option><option value="campaign">Campaign-Based</option><option value="shoot-day">Shoot-Day</option><option value="monthly">Monthly Recurring</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="ct-cancel">Cancel</button>
            <button class="btn btn-primary" id="ct-save">Add Type</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('#ct-close').addEventListener('click', close);
      overlay.querySelector('#ct-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      overlay.querySelector('#ct-save').addEventListener('click', () => {
        const name = document.getElementById('ct-name')?.value?.trim();
        if (!name) { window.showToast?.('Name is required', 'error'); return; }
        const newCT = {
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          icon: document.getElementById('ct-icon')?.value || '📌',
          color: document.getElementById('ct-color')?.value || '#7C3AED',
          trackingType: document.getElementById('ct-tracking')?.value || 'quantity',
          active: true,
        };
        const existing = getAll(COLLECTIONS.CONTENT_TYPES);
        if (existing.length === 0) {
          localStorage.setItem(COLLECTIONS.CONTENT_TYPES, JSON.stringify([...DEFAULT_CONTENT_TYPES, newCT]));
        } else {
          create(COLLECTIONS.CONTENT_TYPES, newCT);
        }
        window.showToast?.(`${name} added!`, 'success');
        close();
        document.getElementById('settings-content').innerHTML = renderSectionContent(state.section);
        attachSectionEvents();
      });
    });
  }

  render();
}
