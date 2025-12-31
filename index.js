
// Frontend logic for NoteKeeper - Real Database Version
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const toggleAuthBtn = document.getElementById('toggle-auth');
const authError = document.getElementById('auth-error');
const notesList = document.getElementById('notes-list');
const noteText = document.getElementById('note-text');
const saveNoteBtn = document.getElementById('save-note');
const logoutBtn = document.getElementById('logout-btn');

let isLogin = true;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Initial state check
if (currentUser) {
    showApp();
}

// --- UI Toggle Logic ---
toggleAuthBtn.onclick = () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? 'Вход' : 'Регистрация';
    authSubmit.innerText = isLogin ? 'Войти' : 'Создать аккаунт';
    toggleAuthBtn.innerText = isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Вход';
    authError.innerText = '';
};

// --- Authentication ---
authForm.onsubmit = async (e) => {
    e.preventDefault();
    authError.innerText = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Произошла ошибка');
        }

        loginUser(data);
    } catch (err) {
        authError.innerText = err.message;
    }
};

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    showApp();
}

logoutBtn.onclick = () => {
    localStorage.removeItem('user');
    currentUser = null;
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
};

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    renderNotes();
}

// --- Notes CRUD ---
async function renderNotes() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/notes?userId=${currentUser.id || currentUser._id}`);
        const notes = await response.json();
        
        if (!Array.isArray(notes)) {
            notesList.innerHTML = '<div class="error-msg">Ошибка загрузки заметок</div>';
            return;
        }

        if (notes.length === 0) {
            notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 2rem;">Заметок пока нет...</div>';
            return;
        }

        notesList.innerHTML = notes.map(note => `
            <div class="note-card">
                <div class="note-content">${escapeHTML(note.content)}</div>
                <div class="note-footer">
                    <span>${note.date}</span>
                    <button class="delete-btn" onclick="deleteNote('${note._id}')">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

saveNoteBtn.onclick = async () => {
    const text = noteText.value.trim();
    if (!text) return;

    saveNoteBtn.disabled = true;
    saveNoteBtn.innerText = 'Сохранение...';

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id || currentUser._id,
                content: text
            })
        });

        if (response.ok) {
            noteText.value = '';
            await renderNotes();
        }
    } catch (err) {
        console.error("Save error:", err);
    } finally {
        saveNoteBtn.disabled = false;
        saveNoteBtn.innerText = 'Сохранить заметку';
    }
};

async function deleteNote(id) {
    if (!confirm('Удалить эту заметку?')) return;
    
    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            renderNotes();
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

// Exposed to global scope for the inline onclick handler
window.deleteNote = deleteNote;

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}
