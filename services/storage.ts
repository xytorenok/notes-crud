
import { User, Note } from '../types';

const STORAGE_KEY_NOTES = 'notekeeper_notes_db';
const STORAGE_KEY_USERS = 'notekeeper_users_db';
const SESSION_KEY = 'notekeeper_current_user';

// Mock DB helper
export const db = {
  // Authentication Logic
  users: {
    async findOne(email: string): Promise<User | null> {
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
      return users.find(u => u.email === email) || null;
    },
    async create(user: User): Promise<void> {
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
      users.push(user);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
  },

  // Notes CRUD logic
  notes: {
    async find(userId: string): Promise<Note[]> {
      const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '[]');
      return notes
        .filter(n => n.userId === userId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async create(note: Note): Promise<void> {
      const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '[]');
      notes.push(note);
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    },
    async update(id: string, content: string): Promise<void> {
      const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '[]');
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        notes[index].content = content;
        notes[index].updatedAt = Date.now();
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
      }
    },
    async delete(id: string): Promise<void> {
      const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '[]');
      const filtered = notes.filter(n => n.id !== id);
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(filtered));
    }
  },

  // Session Management
  session: {
    getUser(): User | null {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    setUser(user: User | null) {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }
};
