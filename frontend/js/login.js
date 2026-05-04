/* login.js — Lógica de inicio de sesión */
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Deshabilitar botón mientras procesa
    const btn = loginForm.querySelector('.btn-primary');
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    try {
        const response = await fetch('http://localhost:4000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardamos token JWT, sesión, y datos del usuario
            localStorage.setItem('nikonet_token', data.token);
            localStorage.setItem('nikonet_session', 'activa');
            localStorage.setItem('nikonet_userId', data.user_id);
            localStorage.setItem('nikonet_username', data.username);
            localStorage.setItem('nikonet_displayName', data.display_name);
            window.location.href = 'inicio.html';
        } else {
            messageDiv.textContent = data.message;
            messageDiv.className = 'auth-msg error';
            messageDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Error de conexión al servidor';
        messageDiv.className = 'auth-msg error';
        messageDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
});