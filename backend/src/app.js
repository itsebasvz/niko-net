const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas base
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'Niko-net API is running' });
});

// TODO: Importar rutas (auth, posts, users, etc.) y usarlas aquí

module.exports = app;

/*Código para el registro de una cuenta de usuario */
document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const email = document.getElementById('registroEmail').value;
    const password = document.getElementById('registroPassword').value;

    try {
        // Hacemos la petición a la nueva ruta /registro
        const response = await fetch('http://localhost:3000/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(data.message); // Muestra "¡Usuario registrado exitosamente!"
            // Aquí podrías limpiar el formulario o redirigir al usuario al Login
            document.getElementById('registroForm').reset();
        } else {
            alert(data.message); // Muestra si el correo ya existe
        }
    } catch (error) {
        console.error('Error al conectar con el servidor', error);
    }
});
