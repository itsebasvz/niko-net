/*Código para el registro de una cuenta de usuario */
document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const display_name = document.getElementById('display_name').value;
    const bio = document.getElementById('bio').value;

    try {
        const response = await fetch('http://localhost:3000/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos todos los campos al backend
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                display_name, 
                bio 
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(data.message); 
            document.getElementById('registroForm').reset();
        } else {
            // Si hay un error (como que el usuario ya existe), se muestra
            alert('Atención: ' + data.message); 
        }
    } catch (error) {
        console.error('Error al conectar con el servidor', error);
        alert('No se pudo conectar con el servidor. Revisa si está encendido.');
    }
});