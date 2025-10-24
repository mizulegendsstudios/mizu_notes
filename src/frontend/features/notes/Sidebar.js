// src/frontend/features/notes/Sidebar.js
export class Sidebar {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.elements = {};
        this.searchTerm = '';
        
        this.initializeElements();
        this.setupEventListeners();
        this.update(); // Actualizar inmediatamente
    }

    initializeElements() {
        this.elements = {
            notesList: document.getElementById('notesList'),
            searchInput: document.getElementById('searchInput'),
            totalNotes: document.getElementById('totalNotes'),
            totalChars: document.getElementById('totalChars')
        };
    }

    setupEventListeners() {
        // Búsqueda
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.update();
        });

        // Suscribirse a cambios del administrador de notas - EVENTOS CORREGIDOS
        this.notesManager.subscribe('notesUpdated', () => this.update());
        this.notesManager.subscribe('noteCreated', () => this.update());
        this.notesManager.subscribe('noteUpdated', () => this.update());
        this.notesManager.subscribe('noteDeleted', () => this.update());
        this.notesManager.subscribe('noteSelected', () => this.update());
        this.notesManager.subscribe('notesCleared', () => this.update());
    }

    update() {
        this.renderNotesList();
        this.updateStats();
    }

    renderNotesList() {
        // USAR searchNotes EN LUGAR DE getFilteredNotes
        const filteredNotes = this.notesManager.searchNotes(this.searchTerm);
        
        if (filteredNotes.length === 0) {
            this.showEmptyState();
            return;
        }

        this.elements.notesList.innerHTML = filteredNotes
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(note => this.createNoteItem(note))
            .join('');
    }

    createNoteItem(note) {
        const isActive = note.id === this.notesManager.currentNoteId;
        const title = this.escapeHtml(note.title) || 'Sin título';
        
        // PREVIEW CORREGIDO - funciona con o sin getPreview()
        let preview = '';
        if (note.getPreview && typeof note.getPreview === 'function') {
            preview = this.escapeHtml(note.getPreview());
        } else {
            // Fallback seguro
            const content = note.content || '';
            preview = this.escapeHtml(content.substring(0, 50)) + 
                     (content.length > 50 ? '...' : '');
        }
        
        const date = new Date(note.updatedAt).toLocaleDateString();
        
        return `
            <div class="note-item ${isActive ? 'active' : ''}" 
                 data-note-id="${note.id}"
                 onclick="app.sidebar.selectNote('${note.id}')">
                <div class="note-title">${title}</div>
                <div class="note-preview">${preview}</div>
                <div class="note-date">${date}</div>
            </div>
        `;
    }

    showEmptyState() {
        if (this.searchTerm) {
            this.elements.notesList.innerHTML = 
                '<div style="text-align: center; color: var(--text-light); padding: 20px;">No se encontraron notas</div>';
        } else {
            this.elements.notesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>No hay notas aún</div>
                    <div style="font-size: 0.8rem; margin-top: 10px;">Crea tu primera nota</div>
                </div>
            `;
        }
    }

    updateStats() {
        const stats = this.notesManager.getStats();
        if (this.elements.totalNotes) {
            this.elements.totalNotes.textContent = stats.totalNotes;
        }
        if (this.elements.totalChars) {
            this.elements.totalChars.textContent = stats.totalChars.toLocaleString();
        }
    }

    selectNote(noteId) {
        console.log(`Sidebar: Seleccionando nota ${noteId}`);
        this.notesManager.setCurrentNote(noteId);
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        this.searchTerm = '';
        this.update();
    }

    // Método para limpiar y resetear
    destroy() {
        // Limpiar event listeners si es necesario
        this.elements = {};
    }
}