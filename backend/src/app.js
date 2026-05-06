const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas base
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'Niko-net API is running' });
});

// Importamos middlewares
const { verifyUserExists } = require('./middleware');

// ============================================================
// MIDDLEWARE VERIFY TOKEN
// ============================================================
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Token no proporcionado' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto_para_desarrollo');
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Token inválido o expirado' 
        });
    }
}

// ============================================================
// RUTAS DE PERFIL
// ============================================================

app.get('/api/v1/profile/:username', verifyUserExists, async (req, res) => {
    const { username } = req.params;
    const db = require('./config/db');

    try {
        const query = 'SELECT username, display_name, bio FROM users WHERE username = $1';
        const result = await db.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Usuario no existe' });
        }

        res.json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.put('/api/v1/profile/:username', verifyToken, verifyUserExists, async(req, res) => { 
    const { display_name, bio } = req.body;
    const { username } = req.params;
    const db = require("./config/db");

    if (req.username !== username) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'No tienes permiso para editar este perfil' 
        });
    }

    try {
        const query = `
            UPDATE users 
            SET display_name = $1, bio = $2
            WHERE username = $3
            RETURNING username, display_name, bio;
        `;
        const values = [display_name, bio, username];
        const result = await db.query(query, values);

        res.json({
            status: 'success',
            message: 'Perfil actualizado correctamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar perfil', error);
        res.status(500).json({
            status: 'error',
            message: 'Error en la base de datos'
        });
    }
});

// Ruta de prueba
app.get('/api/v1/users/:username', verifyUserExists, (req, res) => {
    res.json({ 
        status: 'success', 
        message: `El usuario '${req.params.username}' ha sido validado correctamente.`,
        userId: req.userId 
    });
});

module.exports = app;