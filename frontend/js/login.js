console.log("¡El script de login.js se ha cargado correctamente!");
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:4000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardamos el token JWT y la sesión activa en el localStorage
            localStorage.setItem("nikonet_token", data.token);
            localStorage.setItem("nikonet_session", "activa");
            localStorage.setItem("nikonet_userId", data.user_id);
            window.location.href = 'inicio.html';
        } else {
            messageDiv.textContent = data.message; // Mostrar error (ej: "Usuario no encontrado")
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = "Error de conexión al servidor";
    }
});