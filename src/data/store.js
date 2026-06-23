// ============================================================
// CREATIVE UNIVERSE — localStorage Data Store
// ============================================================

import { COLLECTIONS, DEFAULT_CONTENT_TYPES, DEFAULT_WORKFLOW_SEGMENTS, DEPARTMENTS, ROLES } from './schema.js';
import {
  SAMPLE_EMPLOYEES, SAMPLE_CLIENTS, SAMPLE_PACKAGE_TEMPLATES,
  SAMPLE_MONTHLY_DELIVERABLES, SAMPLE_TASKS, SAMPLE_RAW_DATA,
  SAMPLE_SHOOTS, SAMPLE_CALENDAR_EVENTS,
} from './sampleData.js';

// Re-export schema constants so pages can import from a single place
export { COLLECTIONS, DEFAULT_CONTENT_TYPES, DEFAULT_WORKFLOW_SEGMENTS, DEPARTMENTS, ROLES };


const INITIALIZED_KEY = 'cu_initialized_v4'; // bumped → clears old sample data


// ─── INIT ─────────────────────────────────────────────────────
export function initStore() {
  // Migrate: clear old versions so data starts fresh
  const OLD_KEYS = ['cu_initialized_v1', 'cu_initialized_v2', 'cu_initialized_v3'];
  const hasOldData = OLD_KEYS.some(k => localStorage.getItem(k));
  if (hasOldData) {
    // Wipe everything from old versions
    OLD_KEYS.forEach(k => localStorage.removeItem(k));
    Object.values(COLLECTIONS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('cu_current_user');
  }

  if (localStorage.getItem(INITIALIZED_KEY)) return;

  localStorage.setItem(COLLECTIONS.EMPLOYEES, JSON.stringify(SAMPLE_EMPLOYEES));
  localStorage.setItem(COLLECTIONS.CLIENTS, JSON.stringify(SAMPLE_CLIENTS));
  localStorage.setItem(COLLECTIONS.PACKAGE_TEMPLATES, JSON.stringify(SAMPLE_PACKAGE_TEMPLATES));
  localStorage.setItem(COLLECTIONS.MONTHLY_DELIVERABLES, JSON.stringify(SAMPLE_MONTHLY_DELIVERABLES));
  localStorage.setItem(COLLECTIONS.TASKS, JSON.stringify(SAMPLE_TASKS));
  localStorage.setItem(COLLECTIONS.RAW_DATA, JSON.stringify(SAMPLE_RAW_DATA));
  localStorage.setItem(COLLECTIONS.SHOOTS, JSON.stringify(SAMPLE_SHOOTS));
  localStorage.setItem(COLLECTIONS.CALENDAR_EVENTS, JSON.stringify(SAMPLE_CALENDAR_EVENTS));
  localStorage.setItem(COLLECTIONS.CONTENT_TYPES, JSON.stringify(DEFAULT_CONTENT_TYPES));
  localStorage.setItem(COLLECTIONS.WORKFLOW_SEGMENTS, JSON.stringify(DEFAULT_WORKFLOW_SEGMENTS));
  localStorage.setItem(COLLECTIONS.SETTINGS, JSON.stringify({
    agencyName: 'Creative Universe',
    theme: localStorage.getItem('cu_theme') || 'dark',
    accentColor: '#7C3AED',
  }));
  localStorage.removeItem('cu_current_user'); // force fresh login
  localStorage.setItem(INITIALIZED_KEY, '1');
}


export function resetStore() {
  localStorage.removeItem(INITIALIZED_KEY);
  Object.values(COLLECTIONS).forEach(k => localStorage.removeItem(k));
  initStore();
  window.dispatchEvent(new CustomEvent('cu:store-reset'));
}

// ─── CRUD ─────────────────────────────────────────────────────
export function getAll(collection) {
  try { return JSON.parse(localStorage.getItem(collection) || '[]'); }
  catch { return []; }
}

export function getById(collection, id) {
  return getAll(collection).find(item => item.id === id) || null;
}

export function create(collection, item) {
  const items = getAll(collection);
  const newItem = { ...item, id: item.id || generateId(collection), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  items.push(newItem);
  localStorage.setItem(collection, JSON.stringify(items));
  emit(collection, 'created', newItem);
  return newItem;
}

export function update(collection, id, changes) {
  const items = getAll(collection);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() };
  localStorage.setItem(collection, JSON.stringify(items));
  emit(collection, 'updated', items[idx]);
  return items[idx];
}

export function remove(collection, id) {
  const items = getAll(collection);
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(collection, JSON.stringify(filtered));
  emit(collection, 'deleted', { id });
}

export function query(collection, predicate) {
  return getAll(collection).filter(predicate);
}

export function upsert(collection, item) {
  const existing = getById(collection, item.id);
  if (existing) return update(collection, item.id, item);
  return create(collection, item);
}

// ─── SETTINGS ────────────────────────────────────────────────
export function getSettings() {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS.SETTINGS) || '{}'); }
  catch { return {}; }
}

export function updateSettings(changes) {
  const current = getSettings();
  const updated = { ...current, ...changes };
  localStorage.setItem(COLLECTIONS.SETTINGS, JSON.stringify(updated));
  emit(COLLECTIONS.SETTINGS, 'updated', updated);
  return updated;
}

export function getCurrentUser() {
  return getSettings().currentUser || null;
}

export function setCurrentUser(user) {
  updateSettings({ currentUser: user });
}

// ─── COMPUTED / AUTOMATIC RULES ──────────────────────────────
export function getClientStats(clientId, month) {
  const tasks = query(COLLECTIONS.TASKS, t => t.clientId === clientId && (month ? t.month === month : true));
  const deliverables = query(COLLECTIONS.MONTHLY_DELIVERABLES, d => d.clientId === clientId && (month ? d.month === month : true));
  const rawData = query(COLLECTIONS.RAW_DATA, r => r.clientId === clientId);

  const totalPromised = deliverables.reduce((s, d) => s + (d.promised || 0), 0);
  const totalUploaded = deliverables.reduce((s, d) => s + (d.uploaded || 0), 0);
  const totalInProgress = deliverables.reduce((s, d) => s + (d.inProgress || 0), 0);

  const reelDeliverable = deliverables.find(d => d.contentType === 'reel');
  const reelsPromised = reelDeliverable?.promised || 0;
  const reelsUploaded = reelDeliverable?.uploaded || 0;
  const reelsRemaining = Math.max(0, reelsPromised - reelsUploaded);
  const rawReelsAvailable = rawData.reduce((s, r) => s + Math.max(0, (r.estimatedReels || 0) - (r.reelsCreated || 0)), 0);

  const overdue = tasks.filter(t => t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')).length;
  const pendingApprovals = tasks.filter(t => t.status === 'cu-approval' || t.status === 'client-approval').length;
  const missingLinks = rawData.filter(r => !r.driveLink).length;
  const unassigned = tasks.filter(t => !t.primaryOwner).length;
  const shootRequired = rawReelsAvailable < reelsRemaining;

  const client = getById(COLLECTIONS.CLIENTS, clientId);
  const missingDriveLink = !client?.driveLink ? 1 : 0;

  // Health score calculation
  let score = 100;
  const completionRate = totalPromised > 0 ? totalUploaded / totalPromised : 1;
  score -= Math.round((1 - completionRate) * 30);
  if (rawReelsAvailable < reelsRemaining) score -= 15;
  if (pendingApprovals > 2) score -= 10;
  if (overdue > 0) score -= overdue * 5;
  if (shootRequired) score -= 10;
  if (missingLinks > 0) score -= 5;
  if (unassigned > 0) score -= 5;
  if (missingDriveLink) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return {
    totalPromised, totalUploaded, totalInProgress,
    reelsPromised, reelsUploaded, reelsRemaining, rawReelsAvailable,
    overdue, pendingApprovals, missingLinks, unassigned,
    shootRequired, healthScore: score,
    completionPct: totalPromised > 0 ? Math.round((totalUploaded / totalPromised) * 100) : 0,
  };
}

export function getDashboardStats(month) {
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const employees = getAll(COLLECTIONS.EMPLOYEES);
  const tasks = query(COLLECTIONS.TASKS, t => !month || t.month === month);
  const rawData = getAll(COLLECTIONS.RAW_DATA);
  const deliverables = query(COLLECTIONS.MONTHLY_DELIVERABLES, d => !month || d.month === month);

  const totalReelsPromised = deliverables.filter(d => d.contentType === 'reel').reduce((s, d) => s + (d.promised || 0), 0);
  const totalReelsUploaded = deliverables.filter(d => d.contentType === 'reel').reduce((s, d) => s + (d.uploaded || 0), 0);

  return {
    totalActiveClients: clients.length,
    totalActiveEmployees: employees.filter(e => e.status === 'Active').length,
    employeesWorkingToday: employees.filter(e => e.status === 'Active').length,
    totalReelsPromised,
    reelsCompleted: totalReelsUploaded,
    reelsPending: totalReelsPromised - totalReelsUploaded,
    staticPostsPending: tasks.filter(t => t.contentType === 'static-post' && t.status !== 'uploaded').length,
    carouselsPending: tasks.filter(t => t.contentType === 'carousel' && t.status !== 'uploaded').length,
    storiesPending: tasks.filter(t => t.contentType === 'story' && t.status !== 'uploaded').length,
    otherPending: tasks.filter(t => !['reel','static-post','carousel','story'].includes(t.contentType) && t.status !== 'uploaded').length,
    rawVideosAvailable: rawData.filter(r => r.status === 'Available' || r.status === 'Partially Used').length,
    clientsLowRaw: clients.filter(c => {
      const stats = getClientStats(c.id, month);
      return stats.rawReelsAvailable < stats.reelsRemaining;
    }).length,
    clientsRequiringShoot: clients.filter(c => c.shootRequired).length,
    pendingCUApprovals: tasks.filter(t => t.status === 'cu-approval').length,
    pendingClientApprovals: tasks.filter(t => t.status === 'client-approval').length,
    tasksInReEdit: tasks.filter(t => t.status === 're-edit').length,
    bufferContent: tasks.filter(t => t.status === 'buffer').length,
    readyToUpload: tasks.filter(t => t.status === 'ready-to-upload').length,
    uploadedThisMonth: tasks.filter(t => t.status === 'uploaded').length,
    unassignedTasks: tasks.filter(t => !t.primaryOwner).length,
    overdueTasks: tasks.filter(t => t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')).length,
    missingDriveLinks: clients.filter(c => !c.driveLink).length,
  };
}

export function getEmployeeWorkload(employeeId, month) {
  const tasks = query(COLLECTIONS.TASKS, t =>
    (t.primaryOwner === employeeId || (t.supportMembers || []).includes(employeeId)) &&
    (!month || t.month === month)
  );
  const assigned = tasks.length;
  const completed = tasks.filter(t => t.status === 'uploaded').length;
  const pending = tasks.filter(t => t.status !== 'uploaded').length;
  const overdue = tasks.filter(t => t.daysOverdue > 0 || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'uploaded')).length;
  const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

  let capacity = 'Available';
  if (assigned > 15) capacity = 'Overloaded';
  else if (assigned > 10) capacity = 'High Workload';
  else if (assigned > 5) capacity = 'Balanced';

  return { assigned, completed, pending, overdue, completionPct, capacity };
}

export function generateAlerts() {
  const alerts = [];
  const clients = getAll(COLLECTIONS.CLIENTS).filter(c => c.status === 'Active');
  const tasks = getAll(COLLECTIONS.TASKS);
  const rawData = getAll(COLLECTIONS.RAW_DATA);

  clients.forEach(client => {
    const stats = getClientStats(client.id, null);
    if (stats.rawReelsAvailable === 0) {
      alerts.push({ type: 'red', message: `No raw videos available for ${client.name}`, clientId: client.id });
    } else if (stats.rawReelsAvailable < stats.reelsRemaining) {
      alerts.push({ type: 'orange', message: `Raw content low for ${client.name} (${stats.rawReelsAvailable} reels vs ${stats.reelsRemaining} remaining)`, clientId: client.id });
    }
    if (!client.driveLink) {
      alerts.push({ type: 'red', message: `Google Drive link missing for ${client.name}`, clientId: client.id });
    }
    if (stats.shootRequired) {
      alerts.push({ type: 'orange', message: `Shoot required for ${client.name}`, clientId: client.id });
    }
  });

  tasks.forEach(task => {
    if (task.daysOverdue > 0 || (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'uploaded')) {
      alerts.push({ type: 'red', message: `Overdue task: "${task.title}" (${task.clientName})`, taskId: task.id });
    }
    if (!task.primaryOwner && task.status !== 'uploaded') {
      alerts.push({ type: 'yellow', message: `Unassigned task: "${task.title}" (${task.clientName})`, taskId: task.id });
    }
    if ((task.status === 'cu-approval' || task.status === 'client-approval')) {
      alerts.push({ type: 'yellow', message: `Approval pending: "${task.title}" (${task.clientName})`, taskId: task.id });
    }
  });

  rawData.forEach(raw => {
    if (!raw.driveLink) {
      alerts.push({ type: 'red', message: `Missing Drive link for raw footage: "${raw.topic}" (${raw.clientName})`, rawId: raw.id });
    }
    const daysSinceShoot = Math.round((Date.now() - new Date(raw.shootDate).getTime()) / 86400000);
    if (daysSinceShoot > 60 && raw.reelsCreated === 0) {
      alerts.push({ type: 'orange', message: `Unused raw footage older than 60 days: "${raw.topic}" (${raw.clientName})`, rawId: raw.id });
    }
  });

  return alerts.slice(0, 20);
}

// ─── UTILITIES ────────────────────────────────────────────────
function generateId(collection) {
  const prefix = collection.replace('cu_', '').slice(0, 4);
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function emit(collection, action, data) {
  window.dispatchEvent(new CustomEvent('cu:store-change', { detail: { collection, action, data } }));
}

export function generateEmployeeId(departmentCode) {
  const employees = query(COLLECTIONS.EMPLOYEES, e => e.department === departmentCode);
  const serial = String(employees.length + 1).padStart(3, '0');
  return `CU-${departmentCode}-${serial}`;
}

export function getHealthLabel(score) {
  if (score >= 80) return { label: 'On Track', color: '#16A34A', bg: 'rgba(22,163,74,0.15)' };
  if (score >= 60) return { label: 'Needs Attention', color: '#D97706', bg: 'rgba(217,119,6,0.15)' };
  return { label: 'Immediate Action', color: '#DC2626', bg: 'rgba(220,38,38,0.15)' };
}

export function getCapacityStyle(capacity) {
  const map = {
    'Available': { color: '#16A34A', bg: 'rgba(22,163,74,0.15)' },
    'Balanced': { color: '#2563EB', bg: 'rgba(37,99,235,0.15)' },
    'High Workload': { color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
    'Overloaded': { color: '#DC2626', bg: 'rgba(220,38,38,0.15)' },
  };
  return map[capacity] || map['Available'];
}

export function getStatusStyle(status) {
  const map = {
    'not-started': { label: 'Not Started', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
    'under-editing': { label: 'Under Editing', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    'cu-approval': { label: 'CU Approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    're-edit': { label: 'Re-Edit', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    'buffer': { label: 'Buffer', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    'client-approval': { label: 'Client Approval', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
    'ready-to-upload': { label: 'Ready to Upload', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    'uploaded': { label: 'Uploaded', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  };
  return map[status] || { label: status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
}
