// ============================================================
// CREATIVE UNIVERSE — Sidebar Component
// ============================================================

import {
  createIcons,
  LayoutDashboard,
  Users,
  GitBranch,
  Kanban,
  BarChart2,
  Film,
  Camera,
  UserCircle,
  Activity,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide';

// ─── CONSTANTS ────────────────────────────────────────────────

const COLLAPSE_KEY = 'cu_sidebar_collapsed';

/**
 * All navigation items in display order.
 * Each item: { id, label, icon (lucide name), section }
 */
const NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',            icon: 'layout-dashboard',  section: 'main'   },
  { id: 'clients',             label: 'Clients',              icon: 'users',             section: 'main'   },
  { id: 'project-allocation',  label: 'Project Allocation',   icon: 'git-branch',        section: 'main'   },
  { id: 'content-workflow',    label: 'Content Workflow',     icon: 'kanban',            section: 'main'   },
  { id: 'monthly-deliverables',label: 'Monthly Deliverables', icon: 'bar-chart-2',       section: 'main'   },
  { id: 'raw-data',            label: 'Raw Data',             icon: 'film',              section: 'main'   },
  { id: 'shoot-planner',       label: 'Shoot Planner',        icon: 'camera',            section: 'main'   },
  { id: 'team-directory',      label: 'Team Directory',       icon: 'user-circle',       section: 'team'   },
  { id: 'team-workload',       label: 'Team Workload',        icon: 'activity',          section: 'team'   },
  { id: 'calendar',            label: 'Calendar',             icon: 'calendar',          section: 'tools'  },
  { id: 'reports',             label: 'Reports',              icon: 'file-text',         section: 'tools', adminOnly: true },
  { id: 'settings',            label: 'Settings',             icon: 'settings',          section: 'tools', adminOnly: true },
];

const SECTIONS = [
  { id: 'main',  label: 'Main Menu' },
  { id: 'team',  label: 'Team'      },
  { id: 'tools', label: 'Tools'     },
];

// ─── INTERNAL STATE ───────────────────────────────────────────

/** @type {string} Currently active page id */
let _currentPage = 'dashboard';

/** @type {string} Current user role */
let _role = '';

// ─── HELPERS ─────────────────────────────────────────────────

function isCollapsed() {
  return localStorage.getItem(COLLAPSE_KEY) === '1';
}

function setCollapsed(val) {
  localStorage.setItem(COLLAPSE_KEY, val ? '1' : '0');
}

function getInitials(name) {
  if (!name) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns nav items filtered by role.
 * @param {string} role
 */
function getVisibleItems(role) {
  const isAdmin = role === 'Admin / Owner';
  return NAV_ITEMS.filter(item => isAdmin || !item.adminOnly);
}

// ─── BUILD HTML ───────────────────────────────────────────────

function buildNavSectionHtml(sectionId, sectionLabel, items, currentPage) {
  if (!items.length) return '';
  const itemsHtml = items.map(item => {
    const active = item.id === currentPage ? 'active' : '';
    return `
      <div
        class="nav-item ${active}"
        data-page="${item.id}"
        role="button"
        tabindex="0"
        data-tooltip="${item.label}"
        aria-label="${item.label}"
      >
        <span class="nav-icon" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;flex-shrink:0;">
          <i data-lucide="${item.icon}" style="width:18px;height:18px;"></i>
        </span>
        <span class="nav-label">${item.label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="sidebar-section" data-section="${sectionId}">
      <div class="sidebar-section-label">${sectionLabel}</div>
      ${itemsHtml}
    </div>
  `;
}

function buildSidebarHtml(currentPage, role) {
  const collapsed = isCollapsed();
  const collapsedClass = collapsed ? 'collapsed' : '';
  const visibleItems = getVisibleItems(role);

  const sectionsHtml = SECTIONS.map(sec => {
    const sectionItems = visibleItems.filter(i => i.section === sec.id);
    return buildNavSectionHtml(sec.id, sec.label, sectionItems, currentPage);
  }).join('');

  const toggleLabel = collapsed ? 'Expand' : 'Collapse';
  const toggleIcon = collapsed ? 'chevron-right' : 'chevron-left';

  return `
    <aside class="app-sidebar ${collapsedClass}" id="app-sidebar" aria-label="Sidebar navigation">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">🎬</div>
        <div>
          <div class="sidebar-logo-text">Creative Universe</div>
          <div class="sidebar-logo-sub">Content &amp; Production</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav" id="sidebar-nav">
        ${sectionsHtml}
      </nav>

      <!-- Footer / Toggle -->
      <div class="sidebar-footer">
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" aria-label="Toggle sidebar">
          <i data-lucide="${toggleIcon}" style="width:16px;height:16px;flex-shrink:0;"></i>
          <span class="sidebar-toggle-label">${toggleLabel}</span>
        </button>
      </div>
    </aside>
  `;
}

// ─── EVENT WIRING ─────────────────────────────────────────────

function wireEvents() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  // Nav item clicks
  sidebar.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const handler = () => {
      const page = item.getAttribute('data-page');
      window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page } }));
    };
    item.addEventListener('click', handler);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });

  // Toggle collapse button
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const collapsed = !isCollapsed();
      setCollapsed(collapsed);

      sidebar.classList.toggle('collapsed', collapsed);

      // Update the toggle label and icon text
      const label = sidebar.querySelector('.sidebar-toggle-label');
      if (label) label.textContent = collapsed ? 'Expand' : 'Collapse';

      // Swap toggle icon
      const iconEl = toggleBtn.querySelector('i[data-lucide]');
      if (iconEl) {
        iconEl.setAttribute('data-lucide', collapsed ? 'chevron-right' : 'chevron-left');
        createIcons({ icons: { ChevronLeft, ChevronRight }, attrs: { class: 'icon' } });
      }

      // Update main content area margin
      const appMain = document.querySelector('.app-main');
      if (appMain) {
        appMain.classList.toggle('sidebar-collapsed', collapsed);
      }
    });
  }
}

// ─── MOBILE HAMBURGER SUPPORT ────────────────────────────────

/**
 * Listens for the 'cu:toggle-sidebar' event dispatched by the TopBar
 * and toggles the mobile-open class on the sidebar.
 */
function initMobileSupport() {
  window.addEventListener('cu:toggle-sidebar', () => {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('mobile-open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar || !sidebar.classList.contains('mobile-open')) return;
    if (sidebar.contains(e.target)) return;
    // Check it's actually a touch/small screen scenario
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('mobile-open');
    }
  });
}

// ─── PUBLIC API ───────────────────────────────────────────────

/**
 * Renders the sidebar into #app (prepended before existing children).
 *
 * @param {string} currentPage - The active page id.
 * @param {string} role        - Current user's role string.
 */
export function createSidebar(currentPage, role) {
  _currentPage = currentPage;
  _role = role;

  const app = document.getElementById('app');
  if (!app) return;

  // Remove existing sidebar if present
  const existing = document.getElementById('app-sidebar');
  if (existing) existing.remove();

  // Inject sidebar HTML as first child
  const tmp = document.createElement('div');
  tmp.innerHTML = buildSidebarHtml(currentPage, role);
  const sidebarEl = tmp.firstElementChild;
  app.insertBefore(sidebarEl, app.firstChild);

  // Render lucide icons
  createIcons({
    icons: {
      LayoutDashboard, Users, GitBranch, Kanban, BarChart2,
      Film, Camera, UserCircle, Activity, Calendar,
      FileText, Settings, ChevronLeft, ChevronRight,
    },
    attrs: { class: 'icon' },
  });

  wireEvents();
  initMobileSupport();

  // Ensure .app-main has correct class for initial state
  const appMain = document.querySelector('.app-main');
  if (appMain) {
    appMain.classList.toggle('sidebar-collapsed', isCollapsed());
  }
}

/**
 * Updates the active sidebar item without a full re-render.
 *
 * @param {string} page - The new active page id.
 */
export function updateSidebarActive(page) {
  _currentPage = page;

  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  sidebar.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const isActive = item.getAttribute('data-page') === page;
    item.classList.toggle('active', isActive);
  });
}
