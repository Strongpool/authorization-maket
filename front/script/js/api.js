const API = 'http://127.0.0.1:3000';

async function parse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error || 'Ошибка запроса');
        err.status = res.status;
        throw err;
    }
    return data;
}

async function apiRegister(login, email, password) {
    const res = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, email, password })
    });
    return parse(res);
}

async function apiLogin(email, password) {
    const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return parse(res);
}

async function apiMe() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const res = await fetch(API + '/me', {
        headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) {
        localStorage.removeItem('authToken');
        return null;
    }
    const data = await res.json();
    return data.user;
}
