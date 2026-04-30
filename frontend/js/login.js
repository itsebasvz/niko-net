console.log("¡El script de login.js se ha cargado correctamente!");
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = 'prueba.html'; // Redirigir a prueba.html si es correcto
        } else {
            messageDiv.textContent = data.message; // Mostrar error (ej: "Usuario no encontrado")
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = "Error de conexión al servidor";
    }
});