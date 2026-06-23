// ============================================================
// CREATIVE UNIVERSE — TopBar Component
// ============================================================

import {
  createIcons,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Plus,
  LogOut,
  Users,
  UserCircle,
  Film,
  LayoutDashboard,
} from 'lucide';

import {
  getCurrentUser,
  getDashboardStats,
  generateAlerts,
  getAll,
} from '../data/store.js';

import { COLLECTIONS } from '../data/schema.js';

// ─── INTERNAL STATE ───────────────────────────────────────────

/** @type {string} Currently selected month in 'YYYY-MM' format */
let _currentMonth = _todayMonth();

/** @type {Function|null} Callback invoked when user picks a different month */
let _onMonthChange = null;

// ─── HELPERS ─────────────────────────────────────────────────

/** Returns today's month as 'YYYY-MM' */
function _todayMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formats a 'YYYY-MM' string to a human-readable label, e.g. 'June 2026'.
 * @param {string} ym
 * @returns {string}
 */
function formatMonth(ym) {
  const [year, month] = ym.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Adds `delta` months to a 'YYYY-MM' string and returns the new 'YYYY-MM'.
 * @param {string} ym
 * @param {number} delta
 * @returns {string}
 */
function shiftMonth(ym, delta) {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the user's initials (up to 2 chars).
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── QUICK ACTIONS ────────────────────────────────────────────

const QUICK_ACTIONS = [
  { action: 'add-client',   icon: 'users',          label: 'Add Client'    },
  { action: 'add-employee', icon: 'user-circle',    label: 'Add Employee'  },
  { action: 'add-task',     icon: 'layout-dashboard', label: 'Add Task'   },
  { action: 'add-raw-data', icon: 'film',           label: 'Add Raw Data'  },
];

function buildQuickActionsDropdown() {
  const itemsHtml = QUICK_ACTIONS.map(qa => `
    <div class="dropdown-item" data-quick-action="${qa.action}" role="button" tabindex="0">
      <i data-lucide="${qa.icon}" style="width:14px;height:14px;flex-shrink:0;"></i>
      ${qa.label}
    </div>
  `).join('');

  return `
    <div class="dropdown" id="topbar-quick-actions-dropdown">
      <button class="topbar-btn btn-primary" id="topbar-quick-btn"
          style="background:var(--accent);color:white;border-color:var(--accent);"
          aria-label="Quick actions" aria-haspopup="true" aria-expanded="false">
        <i data-lucide="plus" style="width:18px;height:18px;"></i>
      </button>
      <div class="dropdown-menu" id="topbar-quick-menu" style="display:none;" role="menu">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// ─── HTML BUILDER ─────────────────────────────────────────────

/**
 * Builds the complete topbar HTML string.
 * @param {string} currentPage
 * @param {string} currentMonth
 * @returns {string}
 */
function buildTopBarHtml(currentPage, currentMonth) {
  const user = getCurrentUser();
  const userName = user?.name || 'User';
  const userRole = user?.role || '';
  const initials = getInitials(userName);

  const alerts = generateAlerts();
  const alertCount = alerts.length;
  const badgeHtml = alertCount > 0
    ? `<span class="badge" style="min-width:unset;padding:0;width:16px;height:16px;font-size:10px;font-weight:700;border-radius:50%;background:var(--color-red);color:white;display:flex;align-items:center;justify-content:center;position:absolute;top:-4px;right:-4px;">
        ${alertCount > 99 ? '99+' : alertCount}
       </span>`
    : '';

  const monthLabel = formatMonth(currentMonth);
  const quickActionsDropdown = buildQuickActionsDropdown();

  return `
    <header class="app-topbar" id="app-topbar" role="banner">

      <!-- Hamburger (mobile) -->
      <button class="topbar-btn" id="topbar-hamburger" aria-label="Toggle sidebar" style="flex-shrink:0;">
        <i data-lucide="menu" style="width:18px;height:18px;"></i>
      </button>

      <!-- Search Bar -->
      <div class="topbar-search" role="search">
        <span class="topbar-search-icon" aria-hidden="true">
          <i data-lucide="search" style="width:15px;height:15px;color:var(--text-muted);"></i>
        </span>
        <input
          type="search"
          id="topbar-search-input"
          placeholder="Search clients, tasks, employees…"
          aria-label="Global search"
          autocomplete="off"
        />
      </div>

      <!-- Right-side actions -->
      <div class="topbar-actions">

        <!-- Month Selector -->
        <div class="topbar-month-selector" id="topbar-month-selector" role="group" aria-label="Month navigation">
          <button class="topbar-btn" id="topbar-month-prev"
              style="width:28px;height:28px;border:none;background:none;padding:0;"
              aria-label="Previous month">
            <i data-lucide="chevron-left" style="width:15px;height:15px;"></i>
          </button>
          <span id="topbar-month-label" style="font-size:13px;font-weight:600;min-width:100px;text-align:center;white-space:nowrap;">
            ${monthLabel}
          </span>
          <button class="topbar-btn" id="topbar-month-next"
              style="width:28px;height:28px;border:none;background:none;padding:0;"
              aria-label="Next month">
            <i data-lucide="chevron-right" style="width:15px;height:15px;"></i>
          </button>
        </div>

        <!-- Quick Actions (+) -->
        ${quickActionsDropdown}

        <!-- Alert Bell -->
        <button class="topbar-btn" id="topbar-alerts-btn"
            aria-label="${alertCount} alerts" style="position:relative;">
          <i data-lucide="bell" style="width:18px;height:18px;"></i>
          ${badgeHtml}
        </button>

        <!-- User Profile Pill -->
        <div class="topbar-user" id="topbar-user-pill" role="button" tabindex="0"
            aria-label="User profile: ${userName}" title="${userName} — ${userRole}">
          <div class="topbar-user-avatar" aria-hidden="true">${initials}</div>
          <div class="topbar-user-info">
            <span class="topbar-user-name">${userName}</span>
            <span class="topbar-user-role">${userRole}</span>
          </div>
        </div>

      </div>
    </header>
  `;
}

// ─── EVENT WIRING ─────────────────────────────────────────────

function wireEvents() {
  // ── Hamburger ─────────────────────────────────────────────
  const hamburger = document.getElementById('topbar-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('cu:toggle-sidebar'));
    });
  }

  // ── Search ───────────────────────────────────────────────
  const searchInput = document.getElementById('topbar-search-input');
  if (searchInput) {
    let _searchTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(_searchTimer);
      const query = e.target.value.trim();
      _searchTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cu:global-search', { detail: { query } }));
      }, 250);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        window.dispatchEvent(new CustomEvent('cu:global-search', { detail: { query: '' } }));
      }
    });
  }

  // ── Month navigation ──────────────────────────────────────
  const prevBtn = document.getElementById('topbar-month-prev');
  const nextBtn = document.getElementById('topbar-month-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      _currentMonth = shiftMonth(_currentMonth, -1);
      _updateMonthLabel();
      if (typeof _onMonthChange === 'function') _onMonthChange(_currentMonth);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      _currentMonth = shiftMonth(_currentMonth, 1);
      _updateMonthLabel();
      if (typeof _onMonthChange === 'function') _onMonthChange(_currentMonth);
    });
  }

  // ── Quick Actions dropdown ─────────────────────────────────
  const quickBtn  = document.getElementById('topbar-quick-btn');
  const quickMenu = document.getElementById('topbar-quick-menu');

  if (quickBtn && quickMenu) {
    quickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = quickMenu.style.display !== 'none';
      quickMenu.style.display = isOpen ? 'none' : 'block';
      quickBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    quickMenu.querySelectorAll('.dropdown-item[data-quick-action]').forEach(item => {
      const handler = () => {
        const action = item.getAttribute('data-quick-action');
        quickMenu.style.display = 'none';
        quickBtn.setAttribute('aria-expanded', 'false');
        window.dispatchEvent(new CustomEvent('cu:quick-action', { detail: { action } }));
      };
      item.addEventListener('click', handler);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('topbar-quick-actions-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        quickMenu.style.display = 'none';
        quickBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && quickMenu.style.display !== 'none') {
        quickMenu.style.display = 'none';
        quickBtn.setAttribute('aria-expanded', 'false');
        quickBtn.focus();
      }
    });
  }

  // ── Alerts bell ──────────────────────────────────────────
  const alertsBtn = document.getElementById('topbar-alerts-btn');
  if (alertsBtn) {
    alertsBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page: 'dashboard' } }));
    });
  }

  // ── User pill ────────────────────────────────────────────
  const userPill = document.getElementById('topbar-user-pill');
  if (userPill) {
    const handler = () => {
      window.dispatchEvent(new CustomEvent('cu:navigate', { detail: { page: 'settings' } }));
    };
    userPill.addEventListener('click', handler);
    userPill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  }
}

// ─── INTERNAL HELPERS ─────────────────────────────────────────

function _updateMonthLabel() {
  const label = document.getElementById('topbar-month-label');
  if (label) {
    label.textContent = formatMonth(_currentMonth);
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────

/**
 * Creates and mounts the top bar into `.app-main` (prepended before `.app-content`).
 *
 * @param {string}   currentPage   - Active page id (informational).
 * @param {string}   currentMonth  - Initial month in 'YYYY-MM' format.
 * @param {Function} onMonthChange - Called with new 'YYYY-MM' when user changes month.
 */
export function createTopBar(currentPage, currentMonth, onMonthChange) {
  _currentMonth = currentMonth || _todayMonth();
  _onMonthChange = onMonthChange || null;

  const appMain = document.querySelector('.app-main');
  if (!appMain) {
    console.warn('[TopBar] .app-main element not found — render sidebar first.');
    return;
  }

  // Remove any existing topbar
  const existing = document.getElementById('app-topbar');
  if (existing) existing.remove();

  // Build and inject HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = buildTopBarHtml(currentPage, _currentMonth);
  const topbarEl = tmp.firstElementChild;

  // Prepend before .app-content (or as first child)
  const appContent = appMain.querySelector('.app-content');
  if (appContent) {
    appMain.insertBefore(topbarEl, appContent);
  } else {
    appMain.insertBefore(topbarEl, appMain.firstChild);
  }

  // Render lucide icons
  createIcons({
    icons: {
      ChevronLeft, ChevronRight, Menu, Search, Bell, Plus, LogOut,
      Users, UserCircle, Film, LayoutDashboard,
    },
    attrs: { class: 'icon' },
  });

  wireEvents();
}

/**
 * Updates the displayed month label without a full re-render.
 * Also calls onMonthChange if provided.
 *
 * @param {string} month - 'YYYY-MM' string.
 */
export function updateTopBarMonth(month) {
  _currentMonth = month;
  _updateMonthLabel();
}

/**
 * Refreshes the alert badge count in the topbar bell button.
 * Call this after store changes that may affect alerts.
 */
export function refreshTopBarAlerts() {
  const alertsBtn = document.getElementById('topbar-alerts-btn');
  if (!alertsBtn) return;

  const alerts = generateAlerts();
  const count = alerts.length;

  // Remove existing badge
  const existingBadge = alertsBtn.querySelector('.badge');
  if (existingBadge) existingBadge.remove();

  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.setAttribute('aria-label', `${count} alerts`);
    badge.style.cssText = 'min-width:unset;padding:0;width:16px;height:16px;font-size:10px;font-weight:700;border-radius:50%;background:var(--color-red);color:white;display:flex;align-items:center;justify-content:center;position:absolute;top:-4px;right:-4px;';
    badge.textContent = count > 99 ? '99+' : String(count);
    alertsBtn.appendChild(badge);
    alertsBtn.setAttribute('aria-label', `${count} alerts`);
  } else {
    alertsBtn.setAttribute('aria-label', 'No alerts');
  }
}
