// ============================================================
// CREATIVE UNIVERSE — App Bootstrap & Router
// ============================================================

import './styles/index.css';
import { initStore, getCurrentUser, getSettings, generateAlerts, COLLECTIONS } from './data/store.js';
import { registerSW } from 'virtual:pwa-register';


// ─── LAZY PAGE IMPORTS ────────────────────────────────────────
const pages = {
  login: () => import('./pages/Login.js'),
  dashboard: () => import('./pages/Dashboard.js'),
  clients: () => import('./pages/Clients.js'),
  'client-profile': () => import('./pages/ClientProfile.js'),
  'project-allocation': () => import('./pages/ProjectAllocation.js'),
  'content-workflow': () => import('./pages/ContentWorkflow.js'),
  'monthly-deliverables': () => import('./pages/MonthlyDeliverables.js'),
  'raw-data': () => import('./pages/RawDataInventory.js'),
  'shoot-planner': () => import('./pages/ShootPlanner.js'),
  'team-directory': () => import('./pages/TeamDirectory.js'),
  'team-workload': () => import('./pages/TeamWorkload.js'),
  calendar: () => import('./pages/Calendar.js'),
  reports: () => import('./pages/Reports.js'),
  settings: () => import('./pages/Settings.js'),
};

// ─── APP STATE ────────────────────────────────────────────────
// Load saved theme
const savedTheme = localStorage.getItem('cu_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const state = {
  currentPage: 'login',
  currentUser: null,
  currentMonth: getCurrentMonth(),
  clientId: null,
  theme: savedTheme,
  sidebarCollapsed: localStorage.getItem('cu_sidebar_collapsed') === 'true',
  mobileMenuOpen: false,
};

let cleanupFns = [];

// ─── HELPERS ──────────────────────────────────────────────────
function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const deptColors = {
  ADM: '#7C3AED', SMM: '#2563EB', VE: '#DC2626', GD: '#D97706',
  CW: '#16A34A', SC: '#0891B2', CAM: '#9333EA', CD: '#DB2777',
  RV: '#EA580C', FR: '#6B7280', PM: '#0D9488', WD: '#1D4ED8', INT: '#92400E',
};

// ─── SIDEBAR ──────────────────────────────────────────────────
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'clients', label: 'Clients', icon: '🏥' },
  { id: 'project-allocation', label: 'Project Allocation', icon: '🗂️' },
  { id: 'content-workflow', label: 'Content Workflow', icon: '🎯' },
  { id: 'monthly-deliverables', label: 'Monthly Deliverables', icon: '📦' },
  { id: 'raw-data', label: 'Raw Data Inventory', icon: '🎥' },
  { id: 'shoot-planner', label: 'Shoot Planner', icon: '📷' },
  { id: 'team-directory', label: 'Team Directory', icon: '👥' },
  { id: 'team-workload', label: 'Team Workload', icon: '⚡' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const adminOnlyPages = ['reports', 'settings'];

function renderSidebar() {
  const collapsed = state.sidebarCollapsed;
  const role = state.currentUser?.role || '';
  const isAdmin = role === 'Admin / Owner';

  const filteredNav = navItems.filter(item => isAdmin || !adminOnlyPages.includes(item.id));

  const alerts = generateAlerts();
  const alertCount = alerts.length;

  return `
    <aside class="app-sidebar ${collapsed ? 'collapsed' : ''}" id="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="/logo.png" alt="Creative Universe" class="sidebar-logo-img" />
        ${!collapsed ? `
          <div>
            <div class="sidebar-logo-text">Creative Universe</div>
            <div class="sidebar-logo-sub">Content Management</div>
          </div>
        ` : ''}
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        ${!collapsed ? `<div class="sidebar-section-label">Main Menu</div>` : ''}
        ${filteredNav.map(item => `
          <div class="nav-item ${state.currentPage === item.id ? 'active' : ''}"
               data-page="${item.id}"
               ${collapsed ? `data-tooltip="${item.label}"` : ''}>
            <span style="font-size:18px;flex-shrink:0;">${item.icon}</span>
            ${!collapsed ? `<span class="nav-label">${item.label}</span>` : ''}
            ${!collapsed && item.id === 'dashboard' && alertCount > 0 ? `<span class="nav-badge">${alertCount}</span>` : ''}
          </div>
        `).join('')}
      </nav>

      <!-- Footer: Collapse + Theme toggle -->
      <div class="sidebar-footer" style="flex-direction:column;gap:8px;">
        <button class="sidebar-toggle-btn" id="sidebar-toggle">
          <span style="font-size:16px;">${collapsed ? '→' : '←'}</span>
          ${!collapsed ? `<span class="sidebar-toggle-label">Collapse</span>` : ''}
        </button>
        ${!collapsed ? `
          <button class="theme-toggle" id="sidebar-theme-toggle" title="Toggle Light/Dark theme" style="width:100%;border-radius:8px;gap:8px;font-size:13px;font-weight:500;padding:8px 10px;">
            <span>${state.theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>${state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        ` : `
          <button class="theme-toggle" id="sidebar-theme-toggle" title="Toggle theme">
            ${state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
        `}
      </div>
    </aside>
  `;
}

// ─── TOPBAR ───────────────────────────────────────────────────
function renderTopBar() {
  const user = state.currentUser;
  const initials = user ? getInitials(user.name) : '?';
  const avatarColor = user ? (deptColors[user.department] || '#7C3AED') : '#7C3AED';
  const monthLabel = formatMonth(state.currentMonth);
  const alerts = generateAlerts();

  return `
    <header class="app-topbar" id="topbar">
      <!-- Mobile menu -->
      <button class="topbar-btn" id="mobile-menu-btn" style="display:none;" title="Menu">
        <span style="font-size:18px;">☰</span>
      </button>

      <!-- Page breadcrumb -->
      <div style="display:flex;align-items:center;gap:8px;margin-right:auto;">
        <span style="font-size:13px;font-weight:500;color:var(--text-muted);">
          ${navItems.find(n => n.id === state.currentPage)?.icon || '📊'}
        </span>
        <span style="font-size:14px;font-weight:600;color:var(--text-primary);">
          ${navItems.find(n => n.id === state.currentPage)?.label || 'Dashboard'}
        </span>
      </div>

      <!-- Search -->
      <div class="topbar-search" style="display:none;">
        <svg class="topbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="global-search" placeholder="Search clients, tasks, employees..." />
      </div>

      <div class="topbar-actions">
        <!-- Month selector -->
        <div style="display:flex;align-items:center;gap:2px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:3px;">
          <button class="btn btn-ghost btn-sm btn-icon" id="prev-month" title="Previous Month">‹</button>
          <span style="padding:0 10px;font-size:13px;font-weight:600;white-space:nowrap;min-width:100px;text-align:center;">${monthLabel}</span>
          <button class="btn btn-ghost btn-sm btn-icon" id="next-month" title="Next Month">›</button>
        </div>

        <!-- Quick Add -->
        <div class="dropdown" id="quick-add-dropdown">
          <button class="btn btn-primary btn-sm" id="quick-add-btn">
            <span>+</span> Quick Add
          </button>
          <div class="dropdown-menu" id="quick-add-menu" style="display:none;">
            <div class="dropdown-item" data-quick-action="add-client">🏥 Add Client</div>
            <div class="dropdown-item" data-quick-action="add-employee">👤 Add Employee</div>
            <div class="dropdown-item" data-quick-action="add-task">🎯 Add Task</div>
            <div class="dropdown-item" data-quick-action="add-raw-data">🎥 Add Raw Video</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" data-quick-action="schedule-shoot">📷 Schedule Shoot</div>
            <div class="dropdown-item" data-quick-action="export-report">📊 Export Report</div>
          </div>
        </div>

        <!-- Alerts -->
        <button class="topbar-btn" id="alerts-btn" title="Alerts">
          🔔
          ${alerts.length > 0 ? `<span class="badge" style="position:absolute;top:-4px;right:-4px;background:var(--color-red);color:white;font-size:10px;font-weight:700;padding:1px 4px;border-radius:999px;">${alerts.length > 9 ? '9+' : alerts.length}</span>` : ''}
        </button>

        <!-- User profile -->
        <div class="topbar-user" id="user-menu-btn">
          <div class="topbar-user-avatar" style="background:${avatarColor};">${initials}</div>
          <div class="topbar-user-info">
            <div class="topbar-user-name">${user?.name || 'User'}</div>
            <div class="topbar-user-role">${user?.cuId || ''}</div>
          </div>
        </div>
      </div>
    </header>
  `;
}

// ─── ROUTER ───────────────────────────────────────────────────
async function navigate(page, extra = {}) {
  // Cleanup previous page
  cleanupFns.forEach(fn => { try { fn(); } catch (e) {} });
  cleanupFns = [];

  state.currentPage = page;
  if (extra.clientId) state.clientId = extra.clientId;

  // Check auth
  if (page !== 'login' && !state.currentUser) {
    renderApp('login');
    return;
  }

  renderApp(page);
}

// ─── RENDER SHELL ─────────────────────────────────────────────
function renderApp(page) {
  const app = document.getElementById('app');

  if (page === 'login') {
    app.innerHTML = `<div id="login-container" style="min-height:100vh;"></div>`;
    loadPage(page, document.getElementById('login-container'));
    return;
  }

  app.innerHTML = `
    ${renderSidebar()}
    <div class="app-main ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}" id="main-panel">
      ${renderTopBar()}
      <main class="app-content" id="page-content"></main>
    </div>
    <div id="toast-container" class="toast-container"></div>
    <div id="modal-container"></div>
    <div id="search-results-container"></div>
  `;

  attachShellEvents();
  loadPage(page, document.getElementById('page-content'));
}

// ─── LOAD PAGE ────────────────────────────────────────────────
async function loadPage(page, container) {
  if (!container) return;

  // Show loading state
  if (page !== 'login') {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:50vh;flex-direction:column;gap:16px;color:var(--text-muted);">
        <div class="spinner" style="width:32px;height:32px;border-width:3px;"></div>
        <div style="font-size:14px;">Loading...</div>
      </div>
    `;
  }

  try {
    const loader = pages[page];
    if (!loader) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-title">Page Not Found</div><div class="empty-state-sub">The page "${page}" doesn't exist.</div></div>`;
      return;
    }

    const module = await loader();
    const renderFn = module.default;

    if (typeof renderFn !== 'function') {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Page Error</div><div class="empty-state-sub">Could not load "${page}".</div></div>`;
      return;
    }

    if (page === 'login') {
      renderFn(container, (user) => {
        state.currentUser = user;
        navigate('dashboard');
      });
    } else if (page === 'client-profile') {
      renderFn(container, state.clientId, state.currentMonth);
    } else if (page === 'settings') {
      renderFn(container);
    } else {
      renderFn(container, state.currentMonth);
    }

    // Register cleanup if exported
    if (module.cleanup) cleanupFns.push(module.cleanup);
    if (module.cleanupDashboardCharts) cleanupFns.push(module.cleanupDashboardCharts);

  } catch (err) {
    console.error(`Error loading page "${page}":`, err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Error Loading Page</div>
        <div class="empty-state-sub" style="max-width:400px;">${err.message}</div>
        <button class="btn btn-secondary" style="margin-top:16px;" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

// ─── SHELL EVENTS ─────────────────────────────────────────────
function attachShellEvents() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigate(item.dataset.page);
    });
  });

  // Sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('cu_sidebar_collapsed', state.sidebarCollapsed);
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('main-panel');
      if (sidebar) sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
      if (main) main.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      // Update toggle button icon
      if (toggleBtn) toggleBtn.querySelector('span').textContent = state.sidebarCollapsed ? '→' : '←';
      // Re-render sidebar to show/hide theme button label
      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl) sidebarEl.outerHTML = renderSidebar();
      attachShellEvents();
    });
  }

  // Theme toggle
  const themeToggleBtn = document.getElementById('sidebar-theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cu_theme', state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
      // Update button text/icon
      const icon = themeToggleBtn.querySelector('span:first-child') || themeToggleBtn;
      const label = themeToggleBtn.querySelector('span:last-child');
      if (icon) icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
      if (label && label !== icon) label.textContent = state.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  }

  // Month navigation
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    state.currentMonth = prevMonth(state.currentMonth);
    navigate(state.currentPage, { clientId: state.clientId });
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    state.currentMonth = nextMonth(state.currentMonth);
    navigate(state.currentPage, { clientId: state.clientId });
  });

  // Quick add dropdown
  const quickBtn = document.getElementById('quick-add-btn');
  const quickMenu = document.getElementById('quick-add-menu');
  if (quickBtn && quickMenu) {
    quickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      quickMenu.style.display = quickMenu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { if (quickMenu) quickMenu.style.display = 'none'; });

    quickMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.quickAction;
        window.dispatchEvent(new CustomEvent('cu:quick-action', { detail: { action } }));
        quickMenu.style.display = 'none';
        // Navigate to relevant page
        const actionPageMap = {
          'add-client': 'clients',
          'add-employee': 'team-directory',
          'add-task': 'content-workflow',
          'add-raw-data': 'raw-data',
          'schedule-shoot': 'shoot-planner',
          'export-report': 'reports',
        };
        if (actionPageMap[action]) navigate(actionPageMap[action]);
      });
    });
  }

  // User menu
  const userBtn = document.getElementById('user-menu-btn');
  if (userBtn) {
    userBtn.addEventListener('click', () => {
      showToast(`Logged in as ${state.currentUser?.name} (${state.currentUser?.cuId})`, 'info');
    });
  }

  // Alerts bell
  const alertsBtn = document.getElementById('alerts-btn');
  if (alertsBtn) {
    alertsBtn.addEventListener('click', () => {
      navigate('dashboard');
    });
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('mobile-open');
    });
  }

  // Listen for navigation events from pages
  window.addEventListener('cu:navigate', (e) => {
    navigate(e.detail.page, e.detail);
  });

  // Listen for store changes to update alert count
  window.addEventListener('cu:store-change', () => {
    // Refresh alert badge (lightweight)
    const alertsBtn2 = document.getElementById('alerts-btn');
    if (alertsBtn2) {
      const alerts = generateAlerts();
      const existing = alertsBtn2.querySelector('.badge');
      if (existing) existing.remove();
      if (alerts.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:var(--color-red);color:white;font-size:10px;font-weight:700;padding:1px 4px;border-radius:999px;';
        badge.textContent = alerts.length > 9 ? '9+' : alerts.length;
        alertsBtn2.appendChild(badge);
      }
    }
  });

  // Mobile responsive: show hamburger
  const checkMobile = () => {
    const mBtn = document.getElementById('mobile-menu-btn');
    if (mBtn) mBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  cleanupFns.push(() => window.removeEventListener('resize', checkMobile));

  // Global search
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.dispatchEvent(new CustomEvent('cu:global-search', { detail: { query: e.target.value } }));
    });
  }
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make showToast globally available
window.showToast = showToast;
window.navigateTo = navigate;

// ─── BOOTSTRAP ────────────────────────────────────────────────
function init() {
  // Initialize data store
  initStore();

  // Check if user is already logged in
  const savedUser = getCurrentUser();
  if (savedUser) {
    state.currentUser = savedUser;
    navigate('dashboard');
  } else {
    navigate('login');
  }
}

// Start the app
init();

// ─── PWA: SERVICE WORKER REGISTRATION ─────────────────────────
let swUpdateFn = null;
const updateSW = registerSW({
  onNeedRefresh() {
    // New version available — show update banner
    showUpdateBanner(() => updateSW(true));
  },
  onOfflineReady() {
    showToast('✅ App ready to work offline!', 'success');
  },
  onRegistered(registration) {
    console.log('[CU PWA] Service Worker registered:', registration);
  },
  onRegisterError(error) {
    console.warn('[CU PWA] Service Worker error:', error);
  },
});

// ─── PWA: INSTALL PROMPT ──────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  // Only show banner if user hasn't dismissed it recently
  const dismissed = localStorage.getItem('cu_install_dismissed');
  const dismissedAt = dismissed ? parseInt(dismissed) : 0;
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

  if (dismissedAt < twoDaysAgo) {
    showInstallBanner();
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const banner = document.getElementById('cu-install-banner');
  if (banner) banner.remove();
  showToast('🎉 Creative Universe installed successfully!', 'success');
  localStorage.removeItem('cu_install_dismissed');
});

function showInstallBanner() {
  if (document.getElementById('cu-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'cu-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1A1D27, #242838);
      border: 1px solid rgba(124,58,237,0.4);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2);
      z-index: 9999;
      min-width: 340px;
      max-width: 90vw;
      animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <img src="/logo.png" alt="CU" style="width:44px;height:44px;object-fit:contain;border-radius:10px;background:white;padding:4px;flex-shrink:0;" />
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:#F1F5F9;margin-bottom:2px;">Install Creative Universe</div>
        <div style="font-size:12px;color:#94A3B8;">Works offline · Fast · No browser needed</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="cu-install-btn" style="
          background: #7C3AED; color: white;
          border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 13px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          transition: background 0.2s;
        ">📥 Install</button>
        <button id="cu-install-dismiss" style="
          background: transparent; color: #64748B;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          padding: 8px 10px; font-size: 13px; cursor: pointer;
        ">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('cu-install-btn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      banner.remove();
    }
    deferredInstallPrompt = null;
  });

  document.getElementById('cu-install-dismiss').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('cu_install_dismissed', Date.now().toString());
  });
}

function showUpdateBanner(onUpdate) {
  if (document.getElementById('cu-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'cu-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 16px;
      right: 24px;
      background: linear-gradient(135deg, #1A1D27, #242838);
      border: 1px solid rgba(124,58,237,0.5);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 9999;
      min-width: 300px;
      animation: slideIn 0.3s ease;
    ">
      <span style="font-size:22px;">🔄</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#F1F5F9;">Update Available</div>
        <div style="font-size:12px;color:#94A3B8;">A new version is ready to install</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button id="cu-update-btn" style="
          background:#7C3AED;color:white;
          border:none;border-radius:8px;
          padding:6px 12px;font-size:12px;font-weight:600;
          cursor:pointer;
        ">Update</button>
        <button id="cu-update-dismiss" style="
          background:transparent;color:#64748B;
          border:1px solid rgba(255,255,255,0.1);border-radius:8px;
          padding:6px 8px;font-size:12px;cursor:pointer;
        ">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('cu-update-btn').addEventListener('click', () => {
    banner.remove();
    onUpdate();
  });
  document.getElementById('cu-update-dismiss').addEventListener('click', () => {
    banner.remove();
  });
}

// ─── OFFLINE / ONLINE STATUS ───────────────────────────────────
window.addEventListener('offline', () => {
  showToast('📴 You are offline — app continues to work normally', 'info');
});
window.addEventListener('online', () => {
  showToast('🌐 Back online!', 'success');
});
