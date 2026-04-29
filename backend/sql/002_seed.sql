-- Contraseñas en texto plano para los seeds: "password123"
-- El hash corresponde a esa contraseña usando bcrypt.
-- En un entorno real, las contraseñas jamás deben guardarse ni verse en texto plano.
INSERT INTO users (id, username, email, password_hash, display_name, bio) VALUES 
(1, 'sebas', 'sebas@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'Sebastián VZ', 'Creador de niko-net! Apasionado por el backend.'),
(2, 'maria_dev', 'maria@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'María DB', 'Desarrolladora Fullstack | Amante del código y de PostgreSQL'),
(3, 'test_user', 'test@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'Test User', 'Solo probando la app y buscando bugs.')
-- ON CONFLICT DO NOTHING evita errores si el script se corre múltiples veces. 
-- Ignora la inserción si el ID ya existe en la tabla.
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de users para que las inserciones automáticas tomen el siguiente número disponible
-- Esto previene errores de "duplicate key" al crear nuevos usuarios orgánicamente después del seed.
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insertando posts iniciales para los usuarios creados
INSERT INTO posts (id, author_id, content) VALUES 
(1, 1, '¡Bienvenidos a niko-net! La primera versión está en el aire 🚀 Preparando los endpoints.'),
(2, 2, 'Viendo el código fuente y me gusta cómo está estructurado. #CleanCode en Node.js'),
(3, 1, '¿Qué framework frontend deberíamos aprender a continuación? ¿React o Vue?'),
(4, 3, 'Hola mundo! Esto es un post de prueba para validar el soft delete.'),
(5, 2, 'Docker Compose es magia pura. Levantar bases de datos nunca fue tan fácil 🐳')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de posts
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));

-- Insertando comentarios en los posts para simular interacciones
INSERT INTO comments (id, post_id, author_id, content) VALUES
(1, 1, 2, '¡Felicidades por el lanzamiento!'),
(2, 3, 3, 'Yo voto por React, la comunidad es enorme.'),
(3, 5, 1, 'Totalmente de acuerdo, nos salvó mucho tiempo en el setup.')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de comments
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- Insertando relaciones de seguidor (quién sigue a quién)
INSERT INTO follows (follower_id, following_id) VALUES 
(2, 1),
(3, 1),
(1, 2)
-- Para claves compuestas, el conflicto se evalúa en ambas columnas simultáneamente.
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Insertando "likes" a los posts
INSERT INTO likes (user_id, post_id) VALUES 
(2, 1),
(3, 1),
(1, 2),
(1, 5),
(3, 5)
ON CONFLICT (user_id, post_id) DO NOTHING;
