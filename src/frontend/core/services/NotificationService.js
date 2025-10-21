// src/frontend/core/services/NotificationService.js
export class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Set();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        document.head.appendChild(style);
        
        document.body.appendChild(this.container);
    }

    getStyles() {
        return `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }
            
            .notification {
                background: var(--bg-white);
                color: var(--text-dark);
                padding: 12px 16px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                border-left: 4px solid var(--primary-color);
                animation: notificationSlideIn 0.3s ease-out;
                transition: all 0.3s ease;
            }
            
            .notification-success {
                border-left-color: var(--success-color);
            }
            
            .notification-error {
                border-left-color: var(--error-color);
            }
            
            .notification-warning {
                border-left-color: var(--warning-color);
            }
            
            .notification-info {
                border-left-color: var(--info-color, var(--primary-color));
            }
            
            .notification-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
                font-size: var(--font-size-sm);
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-light);
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .notification-close:hover {
                background: var(--border-light);
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                animation: notificationProgress linear;
            }
            
            @keyframes notificationSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes notificationSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes notificationProgress {
                from {
                    width: 100%;
                }
                to {
                    width: 0%;
                }
            }
        `;
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close" title="Cerrar">×</button>
            ${duration > 0 ? `<div class="notification-progress" style="animation-duration: ${duration}ms"></div>` : ''}
        `;

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        this.container.appendChild(notification);
        this.notifications.add(notification);

        let timeoutId;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        // Retornar métodos para controlar la notificación
        return {
            close: () => this.removeNotification(notification),
            update: (newMessage, newType) => this.updateNotification(notification, newMessage, newType),
            element: notification
        };
    }

    removeNotification(notification) {
        if (!this.notifications.has(notification)) return;
        
        notification.style.animation = 'notificationSlideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(notification);
        }, 300);
    }

    updateNotification(notification, message, type) {
        const content = notification.querySelector('.notification-content');
        const icon = notification.querySelector('.notification-icon');
        
        if (content) content.textContent = message;
        
        if (type) {
            notification.className = `notification notification-${type}`;
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
            if (icon) icon.textContent = icons[type] || icons.info;
        }
    }

    // Métodos de conveniencia
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    // Notificación de operación exitosa
    operationSuccess(operationName) {
        return this.success(`${operationName} completado correctamente`);
    }

    // Notificación de error con detalles
    operationError(operationName, error) {
        const message = error?.message || error || 'Error desconocido';
        return this.error(`Error en ${operationName}: ${message}`);
    }

    // Limpiar todas las notificaciones
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }
}

export const notificationService = new NotificationService();
