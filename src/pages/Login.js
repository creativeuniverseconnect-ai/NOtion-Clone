import { getAll, create, setCurrentUser, COLLECTIONS } from '../data/store.js';

export default function renderLogin(container, onLogin) {

  const avatarColors = {
    ADM: '#7C3AED', SMM: '#2563EB', VE: '#DC2626', GD: '#D97706',
    CW: '#16A34A', SC: '#0891B2', CAM: '#9333EA', CD: '#DB2777',
    RV: '#EA580C', FR: '#6B7280', PM: '#0D9488', WD: '#1D4ED8',
    INT: '#92400E',
  };

  let selectedEmployee = null;

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  function doLogin(user) {
    setCurrentUser({
      id: user.id,
      name: user.name,
      role: user.role,
      cuId: user.cuId,
      department: user.department,
    });
    if (typeof onLogin === 'function') onLogin(user);
  }

  // ─── FIRST-TIME SETUP (no employees exist) ───────────────────
  function renderSetup() {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-bg"></div>
        <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.08),transparent);top:-100px;left:-100px;pointer-events:none;"></div>
        <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,0.06),transparent);bottom:-50px;right:-50px;pointer-events:none;"></div>

        <div style="width:100%;max-width:540px;padding:24px;position:relative;z-index:1;">
          <div class="login-card">

            <!-- Logo + Welcome -->
            <div style="text-align:center;margin-bottom:32px;">
              <img src="/logo.png" alt="Creative Universe" style="width:80px;height:80px;object-fit:contain;margin:0 auto 16px;display:block;" />
              <div style="font-size:22px;font-weight:900;color:var(--text-primary);margin-bottom:6px;">Welcome to Creative Universe!</div>
              <div style="font-size:14px;color:var(--text-muted);">First time? Create your admin account to get started.</div>
            </div>

            <!-- Setup badge -->
            <div style="display:flex;align-items:center;gap:8px;background:var(--accent-light);border:1px solid var(--accent);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:24px;">
              <span style="font-size:18px;">🚀</span>
              <span style="font-size:13px;font-weight:600;color:var(--text-accent);">First-Time Setup — Create Admin Account</span>
            </div>

            <!-- Form -->
            <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
              <div class="input-group">
                <label class="input-label">Your Full Name *</label>
                <input class="input" type="text" id="setup-name" placeholder="e.g. Smit Nayak" />
              </div>
              <div class="input-group">
                <label class="input-label">Email Address *</label>
                <input class="input" type="email" id="setup-email" placeholder="you@creativeuniverse.in" />
              </div>
              <div class="input-group">
                <label class="input-label">Phone Number</label>
                <input class="input" type="tel" id="setup-phone" placeholder="+91 98765 00001" />
              </div>
            </div>

            <div id="setup-error" style="display:none;background:var(--bg-red);border:1px solid var(--color-red);color:var(--color-red);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;margin-bottom:16px;"></div>

            <button class="btn btn-primary" id="setup-btn" style="width:100%;padding:14px;font-size:15px;justify-content:center;">
              <span>Create Account & Enter App</span>
              <span style="margin-left:8px;">→</span>
            </button>

            <div style="margin-top:16px;text-align:center;font-size:12px;color:var(--text-muted);">
              You can add more team members from <strong style="color:var(--text-accent);">Team Directory</strong> inside the app.
            </div>
          </div>
        </div>

        <style>
          @media (max-width: 768px) {
            .login-page > div:nth-child(4) { padding: 16px !important; }
          }
        </style>
      </div>
    `;

    const nameInput = container.querySelector('#setup-name');
    const emailInput = container.querySelector('#setup-email');
    const phoneInput = container.querySelector('#setup-phone');
    const errorEl = container.querySelector('#setup-error');
    const btn = container.querySelector('#setup-btn');

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }

    function handleSetup() {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!name) { showError('Please enter your full name.'); nameInput.focus(); return; }
      if (!email) { showError('Please enter your email address.'); emailInput.focus(); return; }

      errorEl.style.display = 'none';
      btn.disabled = true;
      btn.innerHTML = '<span>Creating account...</span>';

      // Create admin employee record
      const adminUser = {
        id: 'emp-001',
        cuId: 'CU-ADM-001',
        name,
        role: 'Admin / Owner',
        department: 'ADM',
        departmentName: 'Admin / Owner',
        email,
        phone: phone || '',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-Time',
        status: 'Active',
        avatar: null,
        notes: 'Agency owner. Created on first setup.',
        assignedClients: [],
      };

      create(COLLECTIONS.EMPLOYEES, adminUser);
      doLogin(adminUser);
    }

    btn.addEventListener('click', handleSetup);
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') emailInput.focus(); });
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSetup(); });
    phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSetup(); });

    // Auto-focus
    setTimeout(() => nameInput.focus(), 100);
  }

  // ─── NORMAL LOGIN (employees exist) ──────────────────────────
  function renderNormalLogin(employees) {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-bg"></div>
        <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.08),transparent);top:-100px;left:-100px;pointer-events:none;"></div>
        <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,0.06),transparent);bottom:-50px;right:-50px;pointer-events:none;"></div>

        <div style="width:100%;max-width:900px;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:24px;position:relative;z-index:1;">
          <!-- Left: branding -->
          <div style="display:flex;flex-direction:column;justify-content:center;padding:32px 0;">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px;">
              <img src="/logo.png" alt="Creative Universe" style="width:80px;height:80px;object-fit:contain;" />
              <div>
                <div style="font-size:24px;font-weight:900;color:var(--text-primary);letter-spacing:-0.5px;">Creative Universe</div>
                <div style="font-size:13px;color:var(--text-muted);">Content Management Platform</div>
              </div>
            </div>
            <h1 style="font-size:40px;font-weight:900;line-height:1.1;margin-bottom:16px;color:var(--text-primary);">
              Manage every piece of content.<br>Effortlessly.
            </h1>
            <p style="font-size:15px;color:var(--text-muted);line-height:1.7;margin-bottom:32px;">
              Your agency's complete content production hub — clients, reels, shoots, team workload, approvals, and monthly reports — all in one place.
            </p>
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${[
                { icon: '📊', text: 'Track deliverables and completion for all clients' },
                { icon: '🎬', text: 'Manage raw footage and content workflow in real-time' },
                { icon: '👥', text: 'Assign teams, track workload, and monitor capacity' },
                { icon: '📅', text: 'Plan shoots, calendar events, and deadlines' },
              ].map(f => `
                <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-secondary);">
                  <span style="font-size:16px;">${f.icon}</span>${f.text}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: login card -->
          <div class="login-card">
            <div class="login-logo">
              <img src="/logo.png" alt="Creative Universe" style="width:56px;height:56px;object-fit:contain;" />
              <div>
                <div class="login-title">Welcome back</div>
                <div class="login-sub">Select your profile to continue</div>
              </div>
            </div>

            <!-- Profile picker -->
            ${employees.length > 0 ? `
              <div style="margin-bottom:20px;">
                <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Select Your Profile</div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:240px;overflow-y:auto;">
                  ${employees.slice(0, 12).map(emp => `
                    <div class="login-role-btn" data-emp-id="${emp.id}"
                         style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                      <div style="width:36px;height:36px;border-radius:50%;background:${avatarColors[emp.department] || '#7C3AED'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0;">
                        ${getInitials(emp.name)}
                      </div>
                      <div style="overflow:hidden;">
                        <div class="login-role-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${emp.name}</div>
                        <div class="login-role-id">${emp.cuId || ''}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                <div style="flex:1;height:1px;background:var(--border);"></div>
                <span style="font-size:11px;color:var(--text-muted);font-weight:600;">OR</span>
                <div style="flex:1;height:1px;background:var(--border);"></div>
              </div>
            ` : ''}

            <!-- Manual login -->
            <div style="margin-bottom:20px;">
              <div style="display:flex;flex-direction:column;gap:10px;">
                <input class="input" type="email" id="login-email" placeholder="Email address" />
              </div>
            </div>

            <div id="login-error" style="display:none;background:var(--bg-red);border:1px solid var(--color-red);color:var(--color-red);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;margin-bottom:14px;"></div>

            <button class="btn btn-primary" id="login-btn" style="width:100%;padding:12px;font-size:15px;justify-content:center;">
              <span>Continue to Dashboard</span>
              <span style="margin-left:8px;">→</span>
            </button>
          </div>
        </div>

        <style>
          @media (max-width: 768px) {
            .login-page > div:nth-child(4) { grid-template-columns: 1fr !important; }
            .login-page > div:nth-child(4) > div:first-child { display: none !important; }
          }
        </style>
      </div>
    `;

    const errorEl = container.querySelector('#login-error');

    // Profile click
    container.querySelectorAll('.login-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedEmployee = employees.find(e => e.id === btn.dataset.empId);
        container.querySelectorAll('.login-role-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const emailInput = container.querySelector('#login-email');
        if (emailInput && selectedEmployee?.email) emailInput.value = selectedEmployee.email;
        errorEl.style.display = 'none';
      });
    });

    function handleLogin() {
      const emailVal = container.querySelector('#login-email')?.value?.trim();
      let user = selectedEmployee;

      if (!user && emailVal) {
        user = employees.find(e => e.email?.toLowerCase() === emailVal.toLowerCase());
      }

      // If still no match but there's only 1 employee (admin), just let them in
      if (!user && employees.length === 1 && !emailVal) {
        user = employees[0];
      }

      if (!user && employees.length > 0 && !emailVal) {
        errorEl.textContent = 'Please select a profile or enter your email address.';
        errorEl.style.display = 'block';
        return;
      }

      if (!user && emailVal) {
        errorEl.textContent = `No account found for "${emailVal}". Please check your email or select a profile above.`;
        errorEl.style.display = 'block';
        return;
      }

      if (!user) {
        user = employees[0];
      }

      doLogin(user);
    }

    container.querySelector('#login-btn').addEventListener('click', handleLogin);
    container.querySelector('#login-email')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  // ─── ROUTER ───────────────────────────────────────────────────
  const employees = getAll(COLLECTIONS.EMPLOYEES);
  if (employees.length === 0) {
    renderSetup();
  } else {
    renderNormalLogin(employees);
  }
}
