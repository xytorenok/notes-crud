
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// КОНФИГУРАЦИЯ (Вставь свою строку подключения от MongoDB Atlas в переменные окружения)
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/notes_db";
const PORT = process.env.PORT || 3000;

let db;

// Подключение к БД
async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("DB connection error:", err);
    }
}

// Помощник для чтения JSON из запроса
function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(JSON.parse(body || '{}')));
    });
}

const server = http.createServer(async (req, res) => {
    // Статические файлы (Frontend)
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    if (req.url === '/index.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        return res.end(fs.readFileSync(path.join(__dirname, 'index.js')));
    }

    // API Эндпоинты
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Auth: Регистрация
    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
        const { email, password } = await getBody(req);
        const exists = await db.collection('users').findOne({ email });
        if (exists) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "User already exists" }));
        }
        const result = await db.collection('users').insertOne({ email, password });
        res.writeHead(201);
        return res.end(JSON.stringify({ id: result.insertedId, email }));
    }

    // Notes: Получение
    if (url.pathname === '/api/notes' && req.method === 'GET') {
        const userId = url.searchParams.get('userId');
        const notes = await db.collection('notes').find({ userId }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(notes));
    }

    // Notes: Создание
    if (url.pathname === '/api/notes' && req.method === 'POST') {
        const note = await getBody(req);
        const result = await db.collection('notes').insertOne({
            ...note,
            date: new Date().toLocaleString()
        });
        res.writeHead(201);
        return res.end(JSON.stringify({ id: result.insertedId }));
    }

    // Notes: Удаление
    if (url.pathname.startsWith('/api/notes/') && req.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await db.collection('notes').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(204);
        return res.end();
    }

    // 404
    res.writeHead(404);
    res.end("Not Found");
});

connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
