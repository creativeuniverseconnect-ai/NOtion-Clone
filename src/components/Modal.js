// ============================================================
// CREATIVE UNIVERSE — Modal System
// ============================================================

/** @type {HTMLElement|null} - the currently rendered overlay */
let _overlay = null;

/** @type {Function|null} - resolve callback for the current promise */
let _resolve = null;

/** @type {Function|null} - the bound ESC key handler */
let _escHandler = null;

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Returns the footer HTML string, handling both null and string/element input.
 * @param {string|HTMLElement|null} footer
 * @returns {string}
 */
function buildFooterHtml(footer) {
  if (!footer) return '';
  if (typeof footer === 'string') return `<div class="modal-footer">${footer}</div>`;
  // HTMLElement
  const wrap = document.createElement('div');
  wrap.className = 'modal-footer';
  wrap.appendChild(footer.cloneNode ? footer.cloneNode(true) : footer);
  return wrap.outerHTML;
}

/**
 * Converts a body value (HTML string or HTMLElement) to an HTML string.
 * @param {string|HTMLElement} body
 * @returns {string}
 */
function bodyToHtml(body) {
  if (typeof body === 'string') return body;
  if (body instanceof HTMLElement) return body.outerHTML;
  return String(body);
}

// ─── PUBLIC API ───────────────────────────────────────────────

/**
 * Opens a modal dialog.
 *
 * @param {{
 *   title: string,
 *   body: string|HTMLElement,
 *   size?: ''|'lg'|'xl',
 *   footer?: string|HTMLElement|null,
 *   onClose?: function,
 * }} config
 * @returns {Promise<void>} Resolves when the modal is closed.
 */
export function openModal(config) {
  const { title = '', body = '', size = '', footer = null, onClose } = config;

  // Close any existing modal first
  if (_overlay) {
    _closeInternal(false);
  }

  return new Promise((resolve) => {
    _resolve = resolve;

    // ── Build the modal markup ────────────────────────────────
    const sizeClass = size === 'xl' ? 'modal-xl' : size === 'lg' ? 'modal-lg' : '';
    const footerHtml = buildFooterHtml(footer);
    const bodyHtml = bodyToHtml(body);

    const overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', title);

    overlayEl.innerHTML = `
      <div class="modal ${sizeClass}" role="document">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
        ${footerHtml}
      </div>
    `;

    // ── Event: click X button ────────────────────────────────
    overlayEl.querySelector('.modal-close').addEventListener('click', () => {
      closeModal();
    });

    // ── Event: click overlay backdrop ────────────────────────
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) {
        closeModal();
      }
    });

    // ── Event: ESC key ────────────────────────────────────────
    _escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', _escHandler);

    // ── Store reference & mount ──────────────────────────────
    _overlay = overlayEl;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlayEl);

    // Focus trap: focus first focusable element in modal
    requestAnimationFrame(() => {
      const focusable = overlayEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 1) {
        // Focus second element (first is close button, second is more useful content)
        focusable[focusable.length > 1 ? 1 : 0].focus();
      } else if (focusable.length) {
        focusable[0].focus();
      }
    });

    // Store onClose callback on the element for later retrieval
    if (typeof onClose === 'function') {
      overlayEl._onClose = onClose;
    }
  });
}

/**
 * Closes the currently open modal.
 */
export function closeModal() {
  _closeInternal(true);
}

/**
 * Internal close logic.
 * @param {boolean} animate - Whether to animate out.
 */
function _closeInternal(animate) {
  if (!_overlay) return;

  const overlay = _overlay;
  const resolve = _resolve;
  const onClose = overlay._onClose;

  // Remove ESC listener
  if (_escHandler) {
    document.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }

  _overlay = null;
  _resolve = null;

  if (animate) {
    // Animate overlay + modal out
    const modal = overlay.querySelector('.modal');
    overlay.style.animation = 'none';
    overlay.style.transition = 'opacity 0.2s ease';
    overlay.style.opacity = '1';

    if (modal) {
      modal.style.animation = 'none';
      modal.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    }

    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(16px)';
      }
    });

    setTimeout(() => {
      _removeOverlay(overlay);
      if (typeof onClose === 'function') onClose();
      if (typeof resolve === 'function') resolve();
    }, 220);
  } else {
    _removeOverlay(overlay);
    if (typeof onClose === 'function') onClose();
    if (typeof resolve === 'function') resolve();
  }
}

/**
 * Physically removes the overlay element and restores body scroll.
 * @param {HTMLElement} overlay
 */
function _removeOverlay(overlay) {
  if (overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  // Only restore scroll if no other modals remain
  if (!document.querySelector('.modal-overlay')) {
    document.body.style.overflow = '';
  }
}

/**
 * Returns whether a modal is currently open.
 * @returns {boolean}
 */
export function isModalOpen() {
  return _overlay !== null;
}

export default { openModal, closeModal, isModalOpen };
