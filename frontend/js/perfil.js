document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (!username) {
        document.getElementById('posts-container').innerHTML = '<p>Error: Usuario no especificado.</p>';
        document.querySelector('.profile-header').style.display = 'none';
        return;
    }

    cargarPerfil(username);
    cargarPosts(username);
    configurarBotonSeguir();
});

async function cargarPerfil(username) {
    try {
        // TODO: Reemplazar con fetch real al backend cuando esté listo
        // const response = await fetch(`http://localhost:3000/api/v1/users/${username}`);
        // if (!response.ok) throw new Error('Usuario no encontrado');
        // const user = await response.json();
        
        // Simulación de fetch (Mock) temporal
        const mockUsers = {
            'dev_maria': {
                username: 'dev_maria',
                display_name: 'María DB',
                bio: 'Desarrolladora Fullstack | Amante del código y de PostgreSQL',
                followers: 120,
                following: 45
            },
            'sebas': {
                username: 'sebas',
                display_name: 'Sebastián VZ',
                bio: 'Creador de niko-net! Apasionado por el backend.',
                followers: 340,
                following: 12
            }
        };

        const user = mockUsers[username] || {
            username: username,
            display_name: username,
            bio: 'Hola, estoy usando niko-net.',
            followers: 0,
            following: 0
        };

        renderizarPerfil(user);
    } catch (error) {
        document.querySelector('.profile-info-container').innerHTML = '<h2>Usuario no encontrado</h2>';
        console.error('Error al cargar perfil:', error);
    }
}

function renderizarPerfil(user) {
    document.getElementById('profile-name').textContent = user.display_name;
    document.getElementById('profile-handle').textContent = `@${user.username}`;
    document.getElementById('profile-bio').textContent = user.bio || '';
    document.getElementById('count-followers').textContent = user.followers;
    document.getElementById('count-following').textContent = user.following;

    // Inicial para el avatar (fallback)
    const inicial = user.display_name ? user.display_name.charAt(0).toUpperCase() : '?';
    document.getElementById('profile-avatar').textContent = inicial;
}

async function cargarPosts(username) {
    try {
        // TODO: Reemplazar con fetch real al backend cuando esté listo
        // const response = await fetch(`http://localhost:3000/api/v1/users/${username}/posts`);
        // const posts = await response.json();

        // Fetch mockeado de posts
        let mockPosts = [];
        if (username === 'dev_maria') {
            mockPosts = [
                { id: 1, author_name: 'María DB', author_username: username, content: 'Docker Compose es magia pura. Levantar bases de datos nunca fue tan fácil 🐳', date: 'Hace 2 horas' },
                { id: 2, author_name: 'María DB', author_username: username, content: 'Viendo el código fuente y me gusta cómo está estructurado. #CleanCode en Node.js', date: 'Ayer' }
            ];
        } else if (username === 'sebas') {
            mockPosts = [
                { id: 3, author_name: 'Sebastián VZ', author_username: username, content: '¡Bienvenidos a niko-net! La primera versión está en el aire 🚀', date: 'Hace 3 días' },
                { id: 4, author_name: 'Sebastián VZ', author_username: username, content: '¿Qué framework frontend deberíamos aprender a continuación? ¿React o Vue?', date: 'Hace 1 día' }
            ];
        }

        const container = document.getElementById('posts-container');
        container.innerHTML = ''; // Limpiar mensaje de carga
        
        if (mockPosts.length === 0) {
            container.innerHTML = '<p>Este usuario aún no tiene publicaciones.</p>';
            return;
        }

        mockPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <h4>${post.author_name} <span style="color: #657786; font-size: 0.9em; font-weight: normal;">@${post.author_username} · ${post.date}</span></h4>
                <p>${post.content}</p>
            `;
            container.appendChild(postElement);
        });
    } catch (error) {
        document.getElementById('posts-container').innerHTML = '<p>Error al cargar las publicaciones.</p>';
        console.error('Error al cargar posts:', error);
    }
}

function configurarBotonSeguir() {
    const btn = document.getElementById('follow-btn');
    let siguiendo = false; // Estado inicial falso

    btn.addEventListener('click', () => {
        siguiendo = !siguiendo;
        
        const countElement = document.getElementById('count-followers');
        let count = parseInt(countElement.textContent);

        if (siguiendo) {
            btn.textContent = 'Siguiendo';
            btn.classList.add('btn-siguiendo');
            // TODO: fetch POST /api/follows
            countElement.textContent = count + 1;
        } else {
            btn.textContent = 'Seguir';
            btn.classList.remove('btn-siguiendo');
            // TODO: fetch DELETE /api/follows
            countElement.textContent = count - 1;
        }
    });
}
