require('dotenv').config();
const app = require('./app'); // 👈 IMPORTA app.js (con las rutas de perfil)
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==========================================
// CONEXIÓN DIRECTA A BD (para rutas que no están en app.js)
// ==========================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// RUTAS QUE NO ESTÁN EN app.js
// ==========================================

// Registro
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

// Login (reemplaza el que está en app.js para usar pool directo)
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
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Inicio de sesión exitoso', 
      token, 
      user_id: user.id, 
      username: user.username, 
      display_name: user.display_name 
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear post
app.post('/crear-post', async (req, res) => {
  const { author_id, content } = req.body;

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

// Obtener posts
app.get('/posts', async (req, res) => {
    // Validar el parámetro 'order' para evitar inyecciones SQL
    // Si no viene, por defecto será descendente (más recientes primero)
    const orderParam = (req.query.order || '').toLowerCase();
    const order = orderParam === 'asc' ? 'ASC' : 'DESC';

    try {
        /* Consulta base: JOIN entre posts y users, ignorando eliminados */
        let query = `
            SELECT 
                p.id, 
                p.content, 
                p.author_id,
                p.created_at, 
                u.display_name, 
                u.username 
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.is_deleted = FALSE
        `;
        const values = [];

        // Si el usuario envía una fecha específica, agregamos el filtro
        // Convertimos el timestamp a la zona horaria local (-06:00) para que las fechas coincidan correctamente
        if (req.query.date) {
            query += ` AND DATE(p.created_at AT TIME ZONE 'America/Mexico_City') = $1`;
            values.push(req.query.date);
        }

        // Finalmente concatenamos el ordenamiento dinámico
        query += ` ORDER BY p.created_at ${order};`;
        
        /* Ejecutar la consulta pasando los valores seguros */
        const resultado = await pool.query(query, values);
        
        res.status(200).json({ 
            success: true, 
            posts: resultado.rows 
        });
    } catch (error) {
        console.error('Error al obtener posts:', error);
        res.status(500).json({ success: false, message: 'Error al cargar el muro' });
    }
});

// Eliminar post (soft delete)
app.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  // Validar que se proporcionó el user_id
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Se requiere autenticación para eliminar publicaciones' 
    });
  }

  try {
    // Primero, verificar que el post existe y quién es el autor
    const postQuery = await pool.query(
      'SELECT author_id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [postId]
    );

    if (postQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Publicación no encontrada o ya fue eliminada' 
      });
    }

    const post = postQuery.rows[0];

    // Verificar que el usuario que intenta eliminar es el autor
    if (post.author_id !== parseInt(user_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para eliminar esta publicación' 
      });
    }

    // Soft delete: marcar como eliminado
    const deleteQuery = await pool.query(
      'UPDATE posts SET is_deleted = TRUE WHERE id = $1 RETURNING *',
      [postId]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Publicación eliminada exitosamente',
      post: deleteQuery.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al eliminar la publicación' 
    });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[SERVER] Niko-net Backend corriendo en http://localhost:${PORT}`);
  console.log(`📍 Perfil: http://localhost:${PORT}/api/v1/profile/:username`);
});