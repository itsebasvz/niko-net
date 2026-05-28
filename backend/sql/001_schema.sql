-- Eliminar tablas si existen en orden inverso a sus dependencias
-- Utilizamos CASCADE para asegurar que las dependencias asociadas se eliminen sin errores
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS: Cuentas de usuario
CREATE TABLE users (
    -- SERIAL genera un entero autoincremental, equivalente a AUTO_INCREMENT en MySQL
    id SERIAL PRIMARY KEY,
    -- UNIQUE asegura que no haya dos usuarios con el mismo nombre
    username VARCHAR(50) NOT NULL UNIQUE,
    -- UNIQUE asegura que el correo electrónico no esté duplicado
    email VARCHAR(255) NOT NULL UNIQUE,
    -- Almacena el hash bcrypt de la contraseña, nunca el texto plano por seguridad
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    -- TIMESTAMP WITH TIME ZONE guarda la fecha/hora y respeta la zona horaria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Cuentas de usuario';

-- POSTS: Publicaciones de texto (máx. 280 caracteres)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    -- ¡AQUÍ ESTÁN LAS DOS COLUMNAS NUEVAS! 👇
    file_url VARCHAR(255),
    file_name VARCHAR(255),
    like_count INT DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE posts IS 'Publicaciones de texto (máx. 280 caracteres)';

-- COMMENTS: Comentarios en posts
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    -- ON DELETE CASCADE: si se elimina el post original, todos sus comentarios desaparecen
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: si se elimina el autor, sus comentarios también se eliminan
    author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(500) NOT NULL,
    -- Soft delete para ocultar el comentario sin eliminar el registro físico
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE comments IS 'Comentarios en posts';

-- FOLLOWS: Relación seguidor/seguido
CREATE TABLE follows (
    -- ON DELETE CASCADE: si un usuario es borrado, se borran sus "follows" y "followers"
    follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Clave primaria compuesta: evita que un usuario siga al mismo usuario dos veces
    PRIMARY KEY (follower_id, following_id),
    -- Restricción para evitar que un usuario se siga a sí mismo
    CONSTRAINT no_auto_follow CHECK (follower_id <> following_id)
);
COMMENT ON TABLE follows IS 'Relación seguidor/seguido';

-- LIKES: Likes a posts (un like por usuario por post)
CREATE TABLE likes (
    -- ON DELETE CASCADE: si se elimina el usuario o el post, el like se elimina automáticamente
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Clave primaria compuesta: asegura que un usuario solo pueda dar un like a cada post
    PRIMARY KEY (user_id, post_id)
);
COMMENT ON TABLE likes IS 'Likes a posts (un like por usuario por post)';

-- NOTIFICATIONS: Notificaciones para usuarios
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    actor_display_name VARCHAR(100) NOT NULL,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE notifications IS 'Notificaciones recibidas por el usuario';

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- REFRESH_TOKENS: Tokens JWT de refresco
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    -- ON DELETE CASCADE: los tokens se invalidan y eliminan si el usuario es borrado
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- El token_hash debe ser único para evitar colisiones
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    -- Flag para invalidar manualmente un token si hay un problema de seguridad sin borrar el registro
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    -- Fecha de expiración obligatoria para control de vigencia del JWT
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE refresh_tokens IS 'Tokens JWT de refresco';

-- Índices requeridos
-- Optimizan la velocidad de las consultas frecuentes por claves foráneas
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_tokens_user_id ON refresh_tokens(user_id);

-- NOTIFICACIONES: Tabla para guardar alertas de likes, comentarios y follows
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    -- A quién le pertenece la notificación
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Tipo de notificación ('like', 'comment', 'follow')
    type VARCHAR(50) NOT NULL,
    -- Datos de la persona que hizo la acción
    actor_username VARCHAR(100) NOT NULL,
    actor_display_name VARCHAR(100) NOT NULL,
    -- El post relacionado (puede ser NULL si es un 'follow')
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    -- El mensaje a mostrar ("A Juan le gustó tu publicación")
    message TEXT NOT NULL,
    -- Saber si ya la vio o no
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE notifications IS 'Tabla de notificaciones para los usuarios';
