-- Contraseñas en texto plano para los seeds: "password123"
-- El hash corresponde a esa contraseña usando bcrypt
INSERT INTO users (username, email, password_hash, bio) VALUES 
('sebas', 'sebas@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'Creador de niko-net!'),
('maria_dev', 'maria@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'Desarrolladora Fullstack | Amante del código'),
('test_user', 'test@nikonet.com', '$2b$10$tZ2.L29ZfH08nE7Z/t.b2u4Hj.1LhY82Uv/iLz49rA2u5j8A08qC6', 'Solo probando la app');

INSERT INTO posts (author_id, content) VALUES 
(1, '¡Bienvenidos a niko-net! La primera versión está en el aire 🚀'),
(2, 'Viendo el código fuente y me gusta cómo está estructurado. #CleanCode'),
(1, '¿Qué framework frontend deberíamos aprender a continuación?'),
(3, 'Hola mundo! Esto es un post de prueba.');

INSERT INTO follows (follower_id, following_id) VALUES 
(2, 1),
(3, 1),
(1, 2);

INSERT INTO likes (user_id, post_id) VALUES 
(2, 1),
(3, 1),
(1, 2);
