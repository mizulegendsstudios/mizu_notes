// src/frontend/core/services/LoadingService.js
export class LoadingService {
    constructor() {
        this.loadingStates = new Map();
        this.listeners = new Map();
        this.globalLoaders = new Set();
    }

    startLoading(operation, isGlobal = false) {
        this.loadingStates.set(operation, {
            startTime: Date.now(),
            isComplete: false,
            isGlobal: isGlobal
        });
        
        if (isGlobal) {
            this.globalLoaders.add(operation);
        }
        
        this.emit('loadingStarted', operation);
        this.emit('loadingStateChanged', this.getGlobalLoadingState());
    }

    completeLoading(operation) {
        const state = this.loadingStates.get(operation);
        if (state) {
            state.isComplete = true;
            state.duration = Date.now() - state.startTime;
            
            if (state.isGlobal) {
                this.globalLoaders.delete(operation);
            }
            
            this.emit('loadingCompleted', operation, state.duration);
            this.emit('loadingStateChanged', this.getGlobalLoadingState());
        }
    }

    errorLoading(operation, error) {
        const state = this.loadingStates.get(operation);
        if (state) {
            state.error = error;
            state.isComplete = true;
            
            if (state.isGlobal) {
                this.globalLoaders.delete(operation);
            }
            
            this.emit('loadingError', operation, error);
            this.emit('loadingStateChanged', this.getGlobalLoadingState());
        }
    }

    isLoading(operation = null) {
        if (operation) {
            const state = this.loadingStates.get(operation);
            return state && !state.isComplete;
        }
        return this.getGlobalLoadingState();
    }

    getGlobalLoadingState() {
        return this.globalLoaders.size > 0;
    }

    getLoadingProgress() {
        const total = this.loadingStates.size;
        const completed = Array.from(this.loadingStates.values())
            .filter(state => state.isComplete).length;
        return total > 0 ? (completed / total) * 100 : 0;
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error('Error en loading listener:', error);
                }
            });
        }
    }

    // Métodos de conveniencia para operaciones comunes
    startGlobalLoading(operation) {
        this.startLoading(operation, true);
    }

    async withLoading(operation, asyncFn, isGlobal = false) {
        this.startLoading(operation, isGlobal);
        try {
            const result = await asyncFn();
            this.completeLoading(operation);
            return result;
        } catch (error) {
            this.errorLoading(operation, error);
            throw error;
        }
    }
}

export const loadingService = new LoadingService();
