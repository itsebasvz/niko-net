/* registro.js — Lógica de creación de cuenta */
const registroForm = document.getElementById('registroForm');
const messageDiv = document.getElementById('message');

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const display_name = document.getElementById('display_name').value;
    const bio = document.getElementById('bio').value;

    // Deshabilitar botón mientras procesa
    const btn = registroForm.querySelector('.btn-primary');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta…';

    try {
        const response = await fetch('http://localhost:4000/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, display_name, bio })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = '¡Cuenta creada! Redirigiendo al login…';
            messageDiv.className = 'auth-msg success';
            messageDiv.style.display = 'block';

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            messageDiv.textContent = data.message;
            messageDiv.className = 'auth-msg error';
            messageDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Crear cuenta';
        }
    } catch (error) {
        console.error('Error al conectar con el servidor', error);
        messageDiv.textContent = 'No se pudo conectar con el servidor. ¿Está encendido?';
        messageDiv.className = 'auth-msg error';
        messageDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    }
});