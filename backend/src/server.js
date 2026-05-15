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
// Obtener posts (Actualizado para Likes)
app.get('/posts', async (req, res) => {
    const orderParam = (req.query.order || '').toLowerCase();
    const order = orderParam === 'asc' ? 'ASC' : 'DESC';
    const filter = req.query.filter;
    const userId = req.query.user_id; // Ahora extraemos siempre el user_id
    const specificAuthorId = req.query.specific_author_id;

    if (filter === 'following' && !userId) {
        return res.status(400).json({ success: false, message: 'Se requiere la sesión del usuario' });
    }

    try {
        const values = [];
        let isLikedQuery = 'FALSE';

        // Si el usuario está logueado, preparamos la subconsulta para saber si dio like
        if (userId) {
            values.push(userId);
            isLikedQuery = `EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)`;
        }

        let query = `
            SELECT 
                p.id, 
                p.content, 
                p.author_id,
                p.created_at, 
                p.like_count, 
                u.display_name, 
                u.username,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.is_deleted = FALSE) AS comment_count,
                ${isLikedQuery} AS is_liked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.is_deleted = FALSE
        `;

        if (filter === 'following') {
            if (specificAuthorId) {
                values.push(specificAuthorId);
                query += ` AND p.author_id = $${values.length}`;
            } else {
                query += ` AND p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)`;
            }
        }

        if (req.query.date) {
            values.push(req.query.date);
            query += ` AND DATE(p.created_at AT TIME ZONE 'America/Mexico_City') = $${values.length}`;
        }

        query += ` ORDER BY p.created_at ${order};`;
        
        const resultado = await pool.query(query, values);
        res.status(200).json({ success: true, posts: resultado.rows });
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
// SISTEMA DE LIKES
// ==========================================
app.post('/posts/like', async (req, res) => {
  const { post_id, user_id } = req.body;

  if (!post_id || !user_id) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    // 1. Verificar si el usuario ya le dio like a este post
    const result = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2', 
      [post_id, user_id]
    );

    if (result.rows.length > 0) {
      // Ya tiene like -> Quitar el like (DELETE)
      await pool.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2', 
        [post_id, user_id]
      );
      // Restar 1 al contador en la tabla posts
      await pool.query(
        'UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1', 
        [post_id]
      );
      
      return res.status(200).json({ success: true, action: 'unliked' });
    } else {
      // No tiene like -> Agregar el like (INSERT)
      await pool.query(
        'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', 
        [post_id, user_id]
      );
      // Sumar 1 al contador en la tabla posts
      await pool.query(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = $1', 
        [post_id]
      );

      return res.status(200).json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error en /posts/like:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// ==========================================
// RQF14: MÓDULO DE COMENTARIOS
// ==========================================

// Crear un comentario en un post
app.post('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { author_id, content } = req.body;

  // Validar que se envió contenido
  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });
  }

  // Validar longitud máxima (500 chars según schema)
  if (content.length > 500) {
    return res.status(400).json({ success: false, message: 'El comentario no puede superar los 500 caracteres' });
  }

  try {
    // Verificar que el post existe y no está eliminado
    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    // Insertar el comentario
    const result = await pool.query(
      `INSERT INTO comments (post_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, author_id, content.trim()]
    );

    res.status(201).json({
      success: true,
      message: '¡Comentario publicado!',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener comentarios de un post
app.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.author_id,
              u.display_name, u.username
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1 AND c.is_deleted = FALSE
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.status(200).json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ success: false, message: 'Error al cargar comentarios' });
  }
});

// ==========================================
// RQF17: VISTA DE PERFIL AJENO
// ==========================================

// Obtener perfil completo de un usuario (con contadores reales)
app.get('/users/:username/profile', async (req, res) => {
  const { username } = req.params;

  try {
    // Datos básicos del usuario
    const userResult = await pool.query(
      'SELECT id, username, display_name, bio, created_at FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Contadores reales de seguidores, siguiendo y posts
    const [followersRes, followingRes, postsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM follows WHERE following_id = $1', [user.id]),
      pool.query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [user.id]),
      pool.query('SELECT COUNT(*) FROM posts WHERE author_id = $1 AND is_deleted = FALSE', [user.id])
    ]);

    res.status(200).json({
      success: true,
      user: {
        ...user,
        followers_count: parseInt(followersRes.rows[0].count),
        following_count: parseInt(followingRes.rows[0].count),
        posts_count: parseInt(postsRes.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error al cargar perfil' });
  }
});

// Obtener posts de un usuario específico (Actualizado para Likes)
app.get('/users/:username/posts', async (req, res) => {
  const { username } = req.params;
  const orderParam = (req.query.order || '').toLowerCase();
  const order = orderParam === 'asc' ? 'ASC' : 'DESC';
  const userId = req.query.user_id; // Necesitamos saber quién está viendo el perfil

  try {
    const values = [username];
    let isLikedQuery = 'FALSE';

    if (userId) {
        values.push(userId);
        isLikedQuery = `EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $2)`;
    }

    const result = await pool.query(
      `SELECT p.id, p.content, p.author_id, p.created_at, p.like_count,
              u.display_name, u.username,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.is_deleted = FALSE) AS comment_count,
              ${isLikedQuery} AS is_liked
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE u.username = $1 AND p.is_deleted = FALSE
       ORDER BY p.created_at ${order}`,
      values
    );

    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error('Error al obtener posts del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al cargar posts del usuario' });
  }
});

// Verificar si el usuario actual sigue a otro
app.get('/users/:username/is-following', async (req, res) => {
  const { username } = req.params;
  const followerId = req.query.follower_id;

  if (!followerId) {
    return res.status(400).json({ success: false, message: 'Se requiere follower_id' });
  }

  try {
    const targetUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const result = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUser.rows[0].id]
    );

    res.status(200).json({
      success: true,
      is_following: result.rows.length > 0
    });
  } catch (error) {
    console.error('Error al verificar follow:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Seguir / Dejar de seguir a un usuario
app.post('/users/:username/follow', async (req, res) => {
  const { username } = req.params;
  const { follower_id } = req.body;

  if (!follower_id) {
    return res.status(400).json({ success: false, message: 'Se requiere follower_id' });
  }

  try {
    const targetUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const targetId = targetUser.rows[0].id;

    if (parseInt(follower_id) === targetId) {
      return res.status(400).json({ success: false, message: 'No puedes seguirte a ti mismo' });
    }

    // Verificar si ya sigue
    const existing = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [follower_id, targetId]
    );

    if (existing.rows.length > 0) {
      // Dejar de seguir
      await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [follower_id, targetId]
      );
      res.status(200).json({ success: true, action: 'unfollowed', message: 'Has dejado de seguir a este usuario' });
    } else {
      // Seguir
      await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [follower_id, targetId]
      );
      res.status(200).json({ success: true, action: 'followed', message: '¡Ahora sigues a este usuario!' });
    }
  } catch (error) {
    console.error('Error al seguir/dejar de seguir:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Obtener la lista detallada de usuarios a los que sigue un usuario (RQF16 v2)
app.get('/users/:user_id/following-list', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name
       FROM users u
       JOIN follows f ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY u.display_name ASC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      following: result.rows
    });
  } catch (error) {
    console.error('Error al obtener la lista de seguidos:', error);
    res.status(500).json({ success: false, message: 'Error interno al cargar cuentas seguidas' });
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