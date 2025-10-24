// src/frontend/shared/components/LoadingSpinner.js
export class LoadingSpinner {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.currentMessage = 'Cargando...';
        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'loading-spinner hidden';
        this.element.innerHTML = \
            <div class=\"spinner-overlay\">
                <div class=\"spinner-container\">
                    <div class=\"spinner\"></div>
                    <div class=\"loading-text\">\</div>
                    <div class=\"loading-progress\"></div>
                </div>
            </div>
        \;
        
        document.body.appendChild(this.element);
        
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = \
            .loading-spinner {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: var(--font-family);
            }
            
            .loading-spinner.hidden {
                display: none;
            }
            
            .spinner-overlay {
                background: rgba(0, 0, 0, 0.7);
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(2px);
            }
            
            .spinner-container {
                background: var(--bg-white);
                padding: 2rem;
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow-lg);
                text-align: center;
                min-width: 200px;
                max-width: 300px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid var(--border-light);
                border-top: 4px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            .loading-text {
                color: var(--text-dark);
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: var(--font-size-md);
            }
            
            .loading-progress {
                height: 4px;
                background: var(--border-light);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .loading-progress::after {
                content: '';
                display: block;
                height: 100%;
                background: var(--primary-color);
                animation: progress 1.5s ease-in-out infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        \;
        
        document.head.appendChild(style);
    }

    show(message = 'Cargando...') {
        this.currentMessage = message;
        const textElement = this.element.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }
        
        this.element.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        this.element.classList.add('hidden');
        this.isVisible = false;
    }

    updateMessage(message) {
        this.currentMessage = message;
        const textElement = this.element.querySelector('.loading-text');
        if (textElement && this.isVisible) {
            textElement.textContent = message;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export const globalSpinner = new LoadingSpinner();
