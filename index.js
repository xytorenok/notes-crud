
// Frontend logic for NoteKeeper
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
if (currentUser) showApp();

// --- Auth UI Logic ---
toggleAuthBtn.onclick = () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? 'Вход' : 'Регистрация';
    authSubmit.innerText = isLogin ? 'Войти' : 'Создать аккаунт';
    toggleAuthBtn.innerText = isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Вход';
    authError.innerText = '';
};

authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // В демо-режиме (песочнице) имитируем сервер через LocalStorage
    // В реальности здесь будет fetch('/api/auth/...')
    try {
        if (!isLogin) {
            // Регистрация
            let users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            if (users.find(u => u.email === email)) throw new Error('Пользователь уже существует');
            const newUser = { id: Date.now().toString(), email, password };
            users.push(newUser);
            localStorage.setItem('mock_users', JSON.stringify(users));
            loginUser(newUser);
        } else {
            // Вход
            let users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) throw new Error('Неверный логин или пароль');
            loginUser(user);
        }
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
};

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    renderNotes();
}

// --- Notes CRUD Logic ---
saveNoteBtn.onclick = () => {
    const text = noteText.value.trim();
    if (!text) return;

    const notes = JSON.parse(localStorage.getItem('mock_notes') || '[]');
    const newNote = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: text,
        date: new Date().toLocaleString()
    };
    
    notes.push(newNote);
    localStorage.setItem('mock_notes', JSON.stringify(notes));
    noteText.value = '';
    renderNotes();
};

function deleteNote(id) {
    let notes = JSON.parse(localStorage.getItem('mock_notes') || '[]');
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('mock_notes', JSON.stringify(notes));
    renderNotes();
}

window.deleteNote = deleteNote; // Make it global for inline onclick

function renderNotes() {
    const notes = JSON.parse(localStorage.getItem('mock_notes') || '[]')
        .filter(n => n.userId === currentUser.id)
        .reverse();

    notesList.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-content">${escapeHTML(note.content)}</div>
            <div class="note-footer">
                <span>${note.date}</span>
                <button class="delete-btn" onclick="deleteNote('${note.id}')">Удалить</button>
            </div>
        </div>
    `).join('');
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}
