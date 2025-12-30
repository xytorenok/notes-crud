
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/storage';
import { Note, User } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    const data = await db.notes.find(user.id);
    setNotes(data);
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      userId: user.id,
      content: newNoteContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.notes.create(newNote);
    setNewNoteContent('');
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    await db.notes.delete(id);
    fetchNotes();
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleUpdate = async () => {
    if (editingId && editContent.trim()) {
      await db.notes.update(editingId, editContent);
      setEditingId(null);
      fetchNotes();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">NoteKeeper</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{user.email}</span>
            <button
              onClick={onLogout}
              className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Create Note Form */}
        <section className="mb-12">
          <form onSubmit={handleCreateNote} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <textarea
              className="w-full p-2 text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none min-h-[100px]"
              placeholder="Write a new note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
            />
            <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Create Note
              </button>
            </div>
          </form>
        </section>

        {/* Notes List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Your Notes</h2>
            <span className="text-sm text-slate-500">{notes.length} notes</span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading your notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500">No notes yet. Start by writing something above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                  {editingId === note.id ? (
                    <div className="flex-1">
                      <textarea
                        autoFocus
                        className="w-full text-slate-800 border-b border-indigo-200 focus:border-indigo-500 focus:outline-none resize-none mb-3 p-1"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(note)}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-xs font-semibold text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} NoteKeeper. All data is persisted to your local browser storage.
      </footer>
    </div>
  );
};

export default Dashboard;
