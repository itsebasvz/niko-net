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
