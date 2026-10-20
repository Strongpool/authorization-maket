const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const jwt = require('jsonwebtoken');
const SECRET = 'aboba';
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(express.json());

function readUsers() {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function nextId(users) {
    const withId = users.filter(u => u.id !== undefined);
    return withId.length ? Math.max(...withId.map(u => Number(u.id))) + 1 : 1;
}

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.post('/register', async (req, res) => {
    const login = String(req.body.login || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const passwordHash = await bcrypt.hash(password, 10);

    if (!login || !email || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ error: 'Пароль слишком короткий' });
    }

    const users = readUsers();
    if (users.some(u => u.email === email)) {
        return res.status(409).json({ error: 'Почта занята' });
    }
    if (users.some(u => u.login === login)) {
        return res.status(409).json({ error: 'Логин занят' });
    }

    const user = {
        id: nextId(users),
        login,
        email,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    writeUsers(users);

    return res.status(201).json({
        user: { id: user.id, login: user.login, email: user.email }
    });
});

app.post('/login', async (req, res) =>{
    const email = String(req.body.email).trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if(!user){
        return res.status(401).json({error: 'Неправильный email или пароль'});
    }

    const passCorrect = await bcrypt.compare(password, user.passwordHash);
    if(!passCorrect){
        return res.status(401).json({error: 'Неправильный email или пароль'});
    }

    const token = jwt.sign(
        {sub: user.id, login: user.login},
        SECRET,
        { expiresIn: '2h' }
    );

    return res.status(200).json({
        token,
        user: { sub: user.id, login: user.login, email: user.email }
    });
});

app.get('/me', (req, res) =>{
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if(!token){
        return res.status(401).json({ error: 'Нет токена' });
    }

    try{
        const payload = jwt.verify(token, SECRET);
        const users = readUsers();
        const user = users.find(u => Number(u.id) === Number(payload.sub));
        if (!user) {
            return res.status(401).json({ error: 'Нет пользователя' });
        }
        return res.json({
            user: { sub: user.id, login: user.login, email: user.email }
        });
    } catch (err) {
        return res.status(401).json({ error: 'Токен битый' });
    }
});

app.listen(3000, () => {
    console.log('http://127.0.0.1:3000');
});