
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const PORT = process.env.PORT || 3000;

let db;

// Connect to Database
async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        // Use the specific database name as requested
        db = client.db("notes_app");
        console.log("Connected to MongoDB: notes_app");
    } catch (err) {
        console.error("DB connection error:", err);
        process.exit(1);
    }
}

// Helper to parse JSON body
function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('error', (err) => reject(err));
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (e) {
                resolve({});
            }
        });
    });
}

// Helper for JSON responses
function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Serve Static Files
    if (req.method === 'GET') {
        if (url.pathname === '/' || url.pathname === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
        }
        if (url.pathname === '/index.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            return res.end(fs.readFileSync(path.join(__dirname, 'index.js')));
        }
    }

    try {
        // API: Auth - Register
        if (url.pathname === '/api/auth/register' && req.method === 'POST') {
            const { email, password } = await getBody(req);
            if (!email || !password) return sendJSON(res, { error: "Missing fields" }, 400);

            const exists = await db.collection('users').findOne({ email });
            if (exists) return sendJSON(res, { error: "User already exists" }, 400);

            const result = await db.collection('users').insertOne({ email, password });
            return sendJSON(res, { id: result.insertedId, email }, 201);
        }

        // API: Auth - Login
        if (url.pathname === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = await getBody(req);
            const user = await db.collection('users').findOne({ email, password });
            if (!user) return sendJSON(res, { error: "Invalid credentials" }, 401);
            return sendJSON(res, { id: user._id, email: user.email });
        }

        // API: Notes - Get
        if (url.pathname === '/api/notes' && req.method === 'GET') {
            const userId = url.searchParams.get('userId');
            if (!userId) return sendJSON(res, { error: "Unauthorized" }, 401);
            const notes = await db.collection('notes').find({ userId }).sort({ _id: -1 }).toArray();
            return sendJSON(res, notes);
        }

        // API: Notes - Create
        if (url.pathname === '/api/notes' && req.method === 'POST') {
            const noteData = await getBody(req);
            if (!noteData.userId || !noteData.content) return sendJSON(res, { error: "Incomplete data" }, 400);
            
            const result = await db.collection('notes').insertOne({
                userId: noteData.userId,
                content: noteData.content,
                date: new Date().toLocaleString()
            });
            return sendJSON(res, { id: result.insertedId }, 201);
        }

        // API: Notes - Delete
        if (url.pathname.startsWith('/api/notes/') && req.method === 'DELETE') {
            const id = url.pathname.split('/').pop();
            await db.collection('notes').deleteOne({ _id: new ObjectId(id) });
            res.writeHead(204);
            return res.end();
        }

        // Default 404 for API
        if (url.pathname.startsWith('/api/')) {
            return sendJSON(res, { error: "Not Found" }, 404);
        }
    } catch (err) {
        console.error("Server Error:", err);
        return sendJSON(res, { error: "Internal Server Error" }, 500);
    }
});

connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
