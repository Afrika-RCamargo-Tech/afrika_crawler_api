/**
 * Afrika Crawler - Toast Notification System
 * Beautiful, customizable toast notifications
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.title - Toast title
     * @param {string} options.message - Toast message
     * @param {string} options.type - Toast type (success, error, warning, info)
     * @param {number} options.duration - Duration in ms (default: 4000)
     * @param {boolean} options.dismissible - Can be dismissed (default: true)
     */
    show(options = {}) {
        const {
            title = '',
            message = '',
            type = 'info',
            duration = 4000,
            dismissible = true
        } = options;

        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${icons[type]}" style="width: 24px; height: 24px;"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            ${dismissible ? `
                <button class="toast-close" aria-label="Fechar">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            ` : ''}
            <div class="toast-progress"></div>
        `;

        // Add styles for the toast
        toast.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            min-width: 320px;
            max-width: 420px;
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: relative;
            overflow: hidden;
        `;

        // Add progress bar styles
        const progress = toast.querySelector('.toast-progress');
        if (progress) {
            progress.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: ${this.getTypeColor(type)};
                width: 100%;
                transform-origin: left;
                animation: toast-progress ${duration}ms linear;
            `;
        }

        // Add close button styles
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                color: var(--text-muted);
                border-radius: 6px;
                transition: all 0.2s;
                margin-left: auto;
            `;
            closeBtn.addEventListener('click', () => this.dismiss(toast));
        }

        this.container.appendChild(toast);
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [toast] });
        }

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }

        this.toasts.push(toast);
        return toast;
    }

    getTypeColor(type) {
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    dismiss(toast) {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 400);
    }

    // Convenience methods
    success(message, title = 'Sucesso') {
        return this.show({ title, message, type: 'success' });
    }

    error(message, title = 'Erro') {
        return this.show({ title, message, type: 'error' });
    }

    warning(message, title = 'Atenção') {
        return this.show({ title, message, type: 'warning' });
    }

    info(message, title = 'Informação') {
        return this.show({ title, message, type: 'info' });
    }

    // Clear all toasts
    clear() {
        this.toasts.forEach(toast => this.dismiss(toast));
    }
}

// Add keyframes for progress bar animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toast-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
    }
`;
document.head.appendChild(style);

// Create global instance
window.Toast = new ToastManager();
