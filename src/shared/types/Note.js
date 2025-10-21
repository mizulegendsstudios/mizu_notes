// core/Note.js
export class Note {
    constructor(id, title = '', content = '') {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
        this.version = 1;
        this.lastSynced = 0;
        this.isDeleted = false;
    }

    update(title, content) {
        this.title = title;
        this.content = content;
        this.updatedAt = Date.now();
        this.version++;
        return this;
    }

    getPreview() {
        return this.content.substring(0, 50) + (this.content.length > 50 ? '...' : '');
    }

    getWordCount() {
        return this.content.trim() ? this.content.trim().split(/\s+/).length : 0;
    }

    getCharacterCount() {
        return this.content.length;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            version: this.version,
            lastSynced: this.lastSynced,
            isDeleted: this.isDeleted
        };
    }

    static fromJSON(data) {
        const note = new Note(data.id, data.title, data.content);
        note.createdAt = data.createdAt || Date.now();
        note.updatedAt = data.updatedAt || Date.now();
        note.version = data.version || 1;
        note.lastSynced = data.lastSynced || 0;
        note.isDeleted = data.isDeleted || false;
        return note;
    }
}