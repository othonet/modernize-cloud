// Modern Alert System with Glassmorphism

class AlertSystem {
    constructor() {
        this.container = document.getElementById('alertContainer');
        this.alerts = [];
        this.maxAlerts = 5;
    }

    show(message, type = 'info', duration = 5000) {
        const alert = this.createAlert(message, type, duration);
        this.container.appendChild(alert);
        this.alerts.push(alert);

        // Animate in
        setTimeout(() => {
            alert.classList.add('alert-show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(alert);
            }, duration);
        }

        // Limit number of alerts
        if (this.alerts.length > this.maxAlerts) {
            this.remove(this.alerts[0]);
        }

        return alert;
    }

    createAlert(message, type, duration) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} backdrop-blur-xl bg-gray-900/90 backdrop-saturate-150 rounded-xl shadow-2xl border border-gray-700/50 p-4 mb-3 transform transition-all duration-300 ease-out opacity-0 translate-x-full pointer-events-auto`;

        const icons = {
            success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        };

        const colors = {
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-yellow-400',
            info: 'text-blue-400'
        };

        const bgColors = {
            success: 'bg-green-500/10',
            error: 'bg-red-500/10',
            warning: 'bg-yellow-500/10',
            info: 'bg-blue-500/10'
        };

        alert.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 ${colors[type]}">
                    ${icons[type]}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-200">${this.escapeHtml(message)}</p>
                </div>
                <button class="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors" onclick="window.alertSystem.remove(this.closest('.alert'))">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        return alert;
    }

    remove(alert) {
        if (!alert || !alert.parentNode) return;

        alert.classList.remove('alert-show');
        alert.classList.add('alert-hide');

        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
            const index = this.alerts.indexOf(alert);
            if (index > -1) {
                this.alerts.splice(index, 1);
            }
        }, 300);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    // Confirm dialog
    confirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4';
        
        const dialog = document.createElement('div');
        dialog.className = 'backdrop-blur-xl bg-gray-900/90 backdrop-saturate-150 rounded-xl shadow-2xl border border-gray-700/50 p-6 max-w-md w-full transform transition-all duration-300 scale-95 opacity-0';
        
        dialog.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0 text-yellow-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-200 mb-2">Confirmar ação</h3>
                    <p class="text-sm text-gray-300 mb-4">${this.escapeHtml(message)}</p>
                    <div class="flex space-x-3 justify-end">
                        <button class="btn-secondary px-4 py-2 text-sm" data-action="cancel">Cancelar</button>
                        <button class="btn-primary px-4 py-2 text-sm" data-action="confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            dialog.classList.remove('scale-95', 'opacity-0');
            dialog.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        const close = () => {
            dialog.classList.remove('scale-100', 'opacity-100');
            dialog.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        };
        
        dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });
        
        dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                if (onCancel) onCancel();
            }
        });
    }
}

// Initialize alert system
window.alertSystem = new AlertSystem();

// Global helper functions
window.showAlert = (message, type = 'info', duration = 5000) => {
    return window.alertSystem.show(message, type, duration);
};

window.showSuccess = (message, duration = 5000) => {
    return window.alertSystem.success(message, duration);
};

window.showError = (message, duration = 5000) => {
    return window.alertSystem.error(message, duration);
};

window.showWarning = (message, duration = 5000) => {
    return window.alertSystem.warning(message, duration);
};

window.showInfo = (message, duration = 5000) => {
    return window.alertSystem.info(message, duration);
};

window.showConfirm = (message, onConfirm, onCancel) => {
    return window.alertSystem.confirm(message, onConfirm, onCancel);
};

