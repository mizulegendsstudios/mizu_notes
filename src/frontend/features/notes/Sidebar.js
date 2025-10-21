// ui/Sidebar.js
export class Sidebar {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.elements = {};
        this.searchTerm = '';
        
        this.initializeElements();
        this.setupEventListeners();
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

        // Suscribirse a cambios del administrador de notas
        this.notesManager.subscribe('notesLoaded', () => this.update());
        this.notesManager.subscribe('noteCreated', () => this.update());
        this.notesManager.subscribe('noteUpdated', () => this.update());
        this.notesManager.subscribe('noteDeleted', () => this.update());
        this.notesManager.subscribe('currentNoteChanged', () => this.update());
        this.notesManager.subscribe('notesChanged', () => this.update());
    }

    update() {
        this.renderNotesList();
        this.updateStats();
    }

    renderNotesList() {
        const filteredNotes = this.notesManager.getFilteredNotes(this.searchTerm);
        
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
        const preview = this.escapeHtml(note.getPreview());
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
        this.elements.totalNotes.textContent = stats.totalNotes;
        this.elements.totalChars.textContent = stats.totalChars.toLocaleString();
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
        this.elements.searchInput.value = '';
        this.searchTerm = '';
        this.update();
    }
}