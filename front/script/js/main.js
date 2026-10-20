document.addEventListener('DOMContentLoaded', async () => {
    const registration = document.querySelector('#register-form');
    const loginForm = document.querySelector('#login-form');
    const out = document.querySelector('#out');
    const logoutBtn = document.querySelector('#logout-btn');

    function showUser(user) {
        logoutBtn.hidden = !user;
        if (!user) {
            out.textContent = '';
            return;
        }
        out.textContent = 'привет, ' + user.login;
    }

    showUser(await apiMe());

    registration.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const login = registration.querySelector('[name="login"]').value.trim();
            const email = registration.querySelector('[name="email"]').value.trim().toLowerCase();
            const password = registration.querySelector('[name="password"]').value;
            const data = await apiRegister(login, email, password);
            out.textContent = '201 ' + JSON.stringify(data);
        } catch (err) {
            out.textContent = err.status + ' ' + err.message;
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = loginForm.querySelector('[name="email"]').value.trim().toLowerCase();
            const password = loginForm.querySelector('[name="password"]').value;
            const data = await apiLogin(email, password);
            localStorage.setItem('authToken', data.token);
            showUser(await apiMe());
        } catch (err) {
            out.textContent = err.status + ' ' + err.message;
        }
    });

    logoutBtn.addEventListener('click', ()=>{
        localStorage.removeItem('authToken');
        showUser(null);
    });
});