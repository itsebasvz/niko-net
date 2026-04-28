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

// Importamos la función verifyUserExists desde nuestro archivo middleware.js
const { verifyUserExists } = require('./middleware');

// Definimos una ruta GET de prueba para validar que el usuario exista (RQF03)
// Interceptamos la petición con el middleware 'verifyUserExists' antes de procesar la respuesta
app.get('/api/v1/users/:username', verifyUserExists, (req, res) => {
    // Si el middleware no bloqueó la petición, enviamos un JSON como respuesta al cliente
    res.json({ 
        // Indicamos que la operación fue un éxito
        status: 'success', 
        // Enviamos un mensaje confirmando el nombre de usuario que se recibió en la URL
        message: `El usuario '${req.params.username}' ha sido validado correctamente.`,
        // Devolvemos el ID del usuario que el middleware extrajo de la base de datos y guardó en req
        userId: req.userId 
    });
});

// Exportamos la app para que pueda ser utilizada por el servidor principal (server.js)
module.exports = app;
