require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express(); 
app.use(cors()); 
app.use(express.json()); 

// 1. Conexión a la Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// 2. LA RUTA DE REGISTRO
// ==========================================
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

// ==========================================
// 3. LA RUTA DE LOGIN
// ==========================================
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    res.status(200).json({ success: true, message: 'Inicio de sesión exitoso', token, user_id: user.id, username: user.username, display_name: user.display_name });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ==========================================
// RUTA PARA CREAR UN POST (SOLO TEXTO)
// ==========================================
app.post('/crear-post', async (req, res) => {
  const { author_id, content } = req.body;

  // Pequeña validación de seguridad en el backend
  if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'El contenido no puede estar vacío' });
  }

  try {
    const nuevoPost = await pool.query(
      'INSERT INTO posts (author_id, content) VALUES ($1, $2) RETURNING *',
      [author_id, content]
    );

    res.status(201).json({ 
      success: true, 
      message: '¡Publicación compartida en Niko-net!',
      post: nuevoPost.rows[0]
    });
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ==========================================
// RUTA PARA OBTENER TODAS LAS PUBLICACIONES
// ==========================================
app.get('/posts', async (req, res) => {
    try {
        /*Se realiza un join en la tabla de post de la BD para vincular (o unir) 
        los post realizados con el autor que le corresponde. Lo anterior se filtra con el is_deleted = FALSE */
        const query = `
            SELECT 
                p.id, 
                p.content, 
                p.created_at, 
                u.display_name, 
                u.username 
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.is_deleted = FALSE
            ORDER BY p.created_at DESC;
        `;
        
        /*Se ordenan de forma que el más reciente sea el primero*/
        const resultado = await pool.query(query);
        
        res.status(200).json({ 
            success: true, 
            posts: resultado.rows 
        });
    } catch (error) {
        console.error('Error al obtener posts:', error);
        res.status(500).json({ success: false, message: 'Error al cargar el muro' });
    }
});
// ==========================================
// 4. ENCIENDE EL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[SERVER] Niko-net Backend corriendo en http://localhost:${PORT}`);
});
