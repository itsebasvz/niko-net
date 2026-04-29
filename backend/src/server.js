require('dotenv').config(); // Carga las variables de entorno
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express(); // Aquí declaramos 'app' una sola vez
app.use(cors()); // Permite que el HTML le hable a este servidor
app.use(express.json()); // Permite leer datos en formato JSON

// 1. Conexión a la Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 2. LA RUTA DE REGISTRO
app.post('/registro', async (req, res) => {
  const { username, email, password, display_name, bio } = req.body; 

  try {
    const usuarioExistente = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2', 
      [email, username]
    );
    
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo o el nombre de usuario ya están registrados' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, bio) VALUES ($1, $2, $3, $4, $5)',
      [username, email, password_hash, display_name, bio]
    );

    res.status(201).json({ success: true, message: '¡Usuario registrado exitosamente!' });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// 3. Enciende el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVER] Niko-net Backend corriendo en http://localhost:${PORT}`);
}); 