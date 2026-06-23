// ============================================================
// CREATIVE UNIVERSE — Toast Notification System
// ============================================================

/**
 * Ensures the #toast-container div exists in the DOM.
 * @returns {HTMLElement}
 */
function getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Returns the SVG icon markup for each toast type.
 * @param {'success'|'error'|'info'} type
 * @returns {string}
 */
function getIcon(type) {
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="var(--color-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="var(--color-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="var(--color-blue)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`,
  };
  return icons[type] || icons.info;
}

/**
 * Shows a toast notification.
 *
 * @param {string} message   - The message to display.
 * @param {'success'|'error'|'info'} [type='success'] - Toast variant.
 * @param {number} [duration=3000] - Auto-dismiss after this many ms.
 */
export function showToast(message, type = 'success', duration = 3000) {
  const container = getContainer();

  // Create the toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.animation = 'slideIn 0.3s ease';

  toast.innerHTML = `
    <span class="toast-icon" style="flex-shrink:0;display:flex;align-items:center;">${getIcon(type)}</span>
    <span class="toast-message" style="flex:1;line-height:1.45;">${message}</span>
    <button class="toast-close" aria-label="Dismiss" style="
      flex-shrink:0; display:flex; align-items:center; justify-content:center;
      width:20px; height:20px; border-radius:4px;
      color:var(--text-muted); transition:var(--transition);
      background:none; border:none; cursor:pointer; padding:0;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Hover effect on close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'var(--bg-card)';
    closeBtn.style.color = 'var(--text-primary)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = 'var(--text-muted)';
  });

  /**
   * Animates the toast out and removes it from the DOM.
   */
  function dismiss() {
    if (toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(timer);

    // Fade out animation
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(24px)';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 320);
  }

  closeBtn.addEventListener('click', dismiss);

  // Pause auto-dismiss on hover
  let timer = setTimeout(dismiss, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    timer = setTimeout(dismiss, 1200);
  });

  container.appendChild(toast);

  // Return dismiss function for external control
  return dismiss;
}

export default showToast;
