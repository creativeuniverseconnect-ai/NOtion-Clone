// ============================================================
// CREATIVE UNIVERSE — Data Schema Definitions
// ============================================================

export const COLLECTIONS = {
  USERS: 'cu_users',
  EMPLOYEES: 'cu_employees',
  CLIENTS: 'cu_clients',
  PACKAGES: 'cu_packages',
  PACKAGE_TEMPLATES: 'cu_package_templates',
  DELIVERABLES: 'cu_deliverables',
  MONTHLY_DELIVERABLES: 'cu_monthly_deliverables',
  CONTENT_TYPES: 'cu_content_types',
  WORKFLOW_TEMPLATES: 'cu_workflow_templates',
  WORKFLOW_SEGMENTS: 'cu_workflow_segments',
  TASKS: 'cu_tasks',
  TASK_ASSIGNMENTS: 'cu_task_assignments',
  TASK_ACTIVITY: 'cu_task_activity',
  RAW_DATA: 'cu_raw_data',
  SHOOTS: 'cu_shoots',
  STORAGE_LINKS: 'cu_storage_links',
  CALENDAR_EVENTS: 'cu_calendar_events',
  ALERTS: 'cu_alerts',
  SETTINGS: 'cu_settings',
};

export const DEPARTMENTS = [
  { code: 'ADM', name: 'Admin / Owner' },
  { code: 'SMM', name: 'Social Media Manager' },
  { code: 'VE', name: 'Video Editor' },
  { code: 'GD', name: 'Graphic Designer' },
  { code: 'CW', name: 'Content Writer' },
  { code: 'SC', name: 'Shoot Coordinator' },
  { code: 'CAM', name: 'Cameraperson' },
  { code: 'CD', name: 'Creative Director' },
  { code: 'RV', name: 'Reviewer' },
  { code: 'PM', name: 'Performance Marketing' },
  { code: 'WD', name: 'Web Development' },
  { code: 'INT', name: 'Intern' },
  { code: 'FR', name: 'Freelancer' },
];

export const ROLES = [
  'Admin / Owner', 'Social Media Manager', 'Video Editor', 'Graphic Designer',
  'Content Writer', 'Shoot Coordinator', 'Cameraperson', 'Creative Director',
  'Reviewer', 'Performance Marketing', 'Web Development', 'Intern', 'Freelancer',
];

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Intern', 'Freelancer', 'Contract'];

export const EMPLOYEE_STATUSES = [
  'Active', 'On Leave', 'Inactive', 'Notice Period',
  'Freelancer Available', 'Freelancer Unavailable',
];

export const TASK_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

export const TASK_STATUSES = [
  'not-started', 'under-editing', 'cu-approval', 're-edit',
  'buffer', 'client-approval', 'ready-to-upload', 'uploaded',
];

export const RAW_DATA_STATUSES = [
  'Available', 'Assigned for Editing', 'Partially Used',
  'Fully Used', 'Rejected', 'Hold for Later', 'Missing Link',
];

export const CLIENT_STATUSES = ['Active', 'Inactive', 'On Hold', 'Churned'];

export const CAPACITY_STATUSES = ['Available', 'Balanced', 'High Workload', 'Overloaded'];

export const DEFAULT_CONTENT_TYPES = [
  { id: 'reel', name: 'Reel', icon: '🎬', color: '#7C3AED', trackingType: 'quantity' },
  { id: 'static-post', name: 'Static Post', icon: '🖼️', color: '#2563EB', trackingType: 'quantity' },
  { id: 'carousel', name: 'Carousel', icon: '📱', color: '#0891B2', trackingType: 'quantity' },
  { id: 'story', name: 'Story', icon: '⭕', color: '#DB2777', trackingType: 'quantity' },
  { id: 'festival-post', name: 'Festival Post', icon: '🎉', color: '#D97706', trackingType: 'quantity' },
  { id: 'testimonial-reel', name: 'Testimonial Reel', icon: '⭐', color: '#9333EA', trackingType: 'quantity' },
  { id: 'ad-creative', name: 'Ad Creative', icon: '📢', color: '#EA580C', trackingType: 'campaign' },
  { id: 'youtube-short', name: 'YouTube Short', icon: '▶️', color: '#DC2626', trackingType: 'quantity' },
  { id: 'youtube-video', name: 'YouTube Video', icon: '📹', color: '#B91C1C', trackingType: 'quantity' },
  { id: 'google-business', name: 'Google Business Post', icon: '🏢', color: '#16A34A', trackingType: 'quantity' },
  { id: 'podcast-clip', name: 'Podcast Clip', icon: '🎙️', color: '#7C3AED', trackingType: 'quantity' },
  { id: 'blog', name: 'Blog', icon: '📝', color: '#0D9488', trackingType: 'task' },
  { id: 'photography', name: 'Photography', icon: '📷', color: '#92400E', trackingType: 'shoot-day' },
  { id: 'website-update', name: 'Website Update', icon: '🌐', color: '#1D4ED8', trackingType: 'task' },
  { id: 'seo', name: 'SEO Task', icon: '🔍', color: '#065F46', trackingType: 'task' },
  { id: 'meta-ads', name: 'Meta Ads Campaign', icon: '📊', color: '#1877F2', trackingType: 'campaign' },
  { id: 'google-ads', name: 'Google Ads Campaign', icon: '📈', color: '#34A853', trackingType: 'campaign' },
  { id: 'monthly-report', name: 'Monthly Report', icon: '📋', color: '#6B7280', trackingType: 'monthly' },
  { id: 'influencer', name: 'Influencer Collaboration', icon: '🤝', color: '#F59E0B', trackingType: 'task' },
  { id: 'other', name: 'Other', icon: '📌', color: '#6B7280', trackingType: 'task' },
];

export const DEFAULT_WORKFLOW_SEGMENTS = [
  { id: 'not-started', name: 'Not Started', color: '#6B7280', order: 0 },
  { id: 'under-editing', name: 'Under Editing', color: '#2563EB', order: 1 },
  { id: 'cu-approval', name: 'CU Approval', color: '#D97706', order: 2 },
  { id: 're-edit', name: 'Re-Edit', color: '#DC2626', order: 3 },
  { id: 'buffer', name: 'Buffer', color: '#7C3AED', order: 4 },
  { id: 'client-approval', name: 'Client Approval', color: '#0891B2', order: 5 },
  { id: 'ready-to-upload', name: 'Ready to Upload', color: '#16A34A', order: 6 },
  { id: 'uploaded', name: 'Uploaded', color: '#0D9488', order: 7 },
];

export const DEFAULT_STORAGE_LINK_TYPES = [
  'Main Drive Folder', 'Raw Footage Folder', 'Edited Reels Folder',
  'Graphics Folder', 'Brand Kit Folder', 'Scripts Folder', 'Reports Folder',
  'Published Content Folder', 'Campaign Folder', 'Photography Folder', 'Website Assets Folder',
];

export const HEALTH_SCORE_LABELS = {
  high: { label: 'On Track', color: '#16A34A', min: 80 },
  medium: { label: 'Needs Attention', color: '#D97706', min: 60 },
  low: { label: 'Immediate Action', color: '#DC2626', min: 0 },
};
