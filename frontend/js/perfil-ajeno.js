/* ==========================================================
   perfil-ajeno.js — Vista de perfil de otro usuario (RQF17)
   Conectado al backend real: perfil, posts, follow/unfollow
   ========================================================== */

// Gradientes de avatar (consistente con inicio.js)
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #f3c43b, #e07490)',
    'linear-gradient(135deg, #5e3490, #c8526b)',
    'linear-gradient(135deg, #59ee99, #5e3490)',
    'linear-gradient(135deg, #c8526b, #f3c43b)',
    'linear-gradient(135deg, #9c6dd1, #59ee99)',
];

document.addEventListener("DOMContentLoaded", () => {

    // ---- Datos del usuario autenticado (desde localStorage) ----
    const displayName = localStorage.getItem('nikonet_displayName') || 'Usuario';
    const myUsername = localStorage.getItem('nikonet_username') || 'usuario';
    const myUserId = localStorage.getItem('nikonet_userId');
    const avatar = displayName.charAt(0).toUpperCase();

    // Cargar info del nav rail
    document.getElementById("navAvatar").textContent = avatar;
    document.getElementById("navUserName").textContent = displayName;
    document.getElementById("navUserHandle").textContent = "@" + myUsername;

    // ---- Extraer username del perfil a visitar desde la URL ----
    const params = new URLSearchParams(window.location.search);
    const targetUsername = params.get('username');

    if (!targetUsername) {
        window.location.href = 'inicio';
        return;
    }

    // Si es mi propio perfil, redirigir a perfil.html
    if (targetUsername === myUsername) {
        window.location.href = 'perfil';
        return;
    }

    // Estado de ordenamiento
    let currentOrder = 'desc';

    // ---- Obtener gradiente de avatar por ID ----
    function getAvatarBg(id) {
        return AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];
    }

    // ---- Escapar HTML para evitar XSS ----
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ---- Formatear timestamp relativo ----
    function tiempoRelativo(fecha) {
        const ahora = new Date();
        const diff = ahora - new Date(fecha);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'ahora';
        if (mins < 60) return `hace ${mins} min`;
        const horas = Math.floor(mins / 60);
        if (horas < 24) return `hace ${horas} h`;
        const dias = Math.floor(horas / 24);
        if (dias < 7) return `hace ${dias} d`;
        return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }

    // ---- Toast ----
    function mostrarToast(msg, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast ' + (isError ? 't-err' : 't-ok');
        toast.innerHTML = `<div class="ic"></div><span>${msg}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ===========================================================
    // CARGAR PERFIL DESDE EL BACKEND
    // ===========================================================
    async function cargarPerfil() {
        try {
            const resp = await fetch(`http://localhost:4000/users/${targetUsername}/profile`);
            const data = await resp.json();

            if (!data.success) {
                document.getElementById("header-title").textContent = 'Usuario no encontrado';
                document.getElementById("lbl-nombre").textContent = '???';
                document.getElementById("lbl-username").textContent = '@???';
                document.getElementById("lbl-bio").textContent = 'Este usuario no existe.';
                return;
            }

            const user = data.user;

            // Renderizar info del perfil
            document.getElementById("header-title").textContent = `Perfil de ${user.display_name || user.username}`;
            document.getElementById("lbl-nombre").textContent = user.display_name || user.username;
            document.getElementById("lbl-username").textContent = "@" + user.username;
            document.getElementById("lbl-bio").textContent = user.bio || 'Sin biografía.';
            document.getElementById("lbl-avatar").textContent = (user.display_name || user.username).charAt(0).toUpperCase();
            document.getElementById("lbl-seguidores").textContent = user.followers_count;
            document.getElementById("lbl-siguiendo").textContent = user.following_count;

        } catch (err) {
            console.error('Error al cargar perfil:', err);
            document.getElementById("lbl-bio").textContent = 'Error al cargar el perfil.';
        }
    }

    // ===========================================================
    // VERIFICAR SI YA SIGO A ESTE USUARIO
    // ===========================================================
    async function verificarFollow() {
        if (!myUserId) return;

        try {
            const resp = await fetch(`http://localhost:4000/users/${targetUsername}/is-following?follower_id=${myUserId}`);
            const data = await resp.json();
            if (data.success) {
                actualizarBotonFollow(data.is_following);
            }
        } catch (err) {
            console.error('Error al verificar follow:', err);
        }
    }

    // ---- Actualizar apariencia del botón seguir ----
    function actualizarBotonFollow(isFollowing) {
        const btn = document.getElementById("btn-seguir");
        if (isFollowing) {
            btn.className = "btn-secondary btn-pill";
            btn.textContent = "Siguiendo";
        } else {
            btn.className = "btn-primary btn-pill";
            btn.textContent = "Seguir";
        }
        btn.dataset.following = isFollowing ? 'true' : 'false';
    }

    // ---- Evento: Seguir / Dejar de seguir ----
    document.getElementById("btn-seguir").addEventListener("click", async () => {
        if (!myUserId) {
            mostrarToast('Inicia sesión para seguir usuarios', true);
            return;
        }

        const btn = document.getElementById("btn-seguir");
        btn.disabled = true;

        try {
            const resp = await fetch(`http://localhost:4000/users/${targetUsername}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ follower_id: myUserId })
            });
            const data = await resp.json();

            if (data.success) {
                actualizarBotonFollow(data.action === 'followed');
                mostrarToast(data.message);
                // Recargar perfil para actualizar contadores
                cargarPerfil();
            } else {
                mostrarToast(data.message || 'Error', true);
            }
        } catch (err) {
            console.error('Error al seguir/dejar de seguir:', err);
            mostrarToast('Error de conexión', true);
        } finally {
            btn.disabled = false;
        }
    });

    // ===========================================================
    // CARGAR POSTS DEL USUARIO DESDE EL BACKEND
    // ===========================================================
    async function cargarPosts(order) {
        const container = document.getElementById("muro-posts");

        // Obtener el ID del usuario actual (logueado)
        const myUserId = localStorage.getItem('nikonet_userId');

        try {
            // Añadir parámetro user_id a la URL
            let url = `http://localhost:4000/users/${targetUsername}/posts?order=${order}`;
            if (myUserId) {
                url += `&user_id=${myUserId}`;
            }

            const resp = await fetch(url);
            const data = await resp.json();

            if (!data.success) {
                container.innerHTML = '<div class="empty">Error al cargar posts.</div>';
                return;
            }

            if (data.posts.length === 0) {
                container.innerHTML = `<div class="empty">@${escapeHtml(targetUsername)} aún no ha publicado nada.</div>`;
                return;
            }

            container.innerHTML = '';
            data.posts.forEach(post => {
                container.appendChild(renderPost(post));
            });

        } catch (err) {
            console.error('Error al cargar posts:', err);
            container.innerHTML = '<div class="empty">Error de conexión al cargar posts.</div>';
        }
    }

    // ---- Renderizar un post ----
    function renderPost(post) {
    const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
    const ts = tiempoRelativo(post.created_at);
    const TRUNCAR_EN = 140;
    const truncado = post.content.length > TRUNCAR_EN;
    const contenidoVisible = truncado
        ? post.content.substring(0, TRUNCAR_EN) + '…'
        : post.content;

    // ---- Generar HTML del archivo adjunto (imagen o enlace) ----
    let htmlArchivo = '';
    if (post.file_url) {
        if (post.file_name && post.file_name.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            htmlArchivo = `<img src="http://localhost:4000${post.file_url}" alt="Imagen adjunta" style="max-width: 100%; border-radius: 8px; margin-top: 10px; display: block;">`;
        } else {
            htmlArchivo = `
                <div style="margin-top: 10px; padding: 10px; border: 1px solid var(--border-strong); border-radius: 8px;">
                    📎 <strong>${escapeHtml(post.file_name)}</strong><br>
                    <a href="http://localhost:4000${post.file_url}" target="_blank" class="btn-primary" style="display: inline-block; margin-top: 5px; padding: 5px 10px; text-decoration: none;">Ver / Descargar</a>
                </div>
            `;
        }
    }

    const article = document.createElement('article');
    article.className = 'post';
    article.innerHTML = `
        <div class="post-avatar" style="background:${getAvatarBg(post.author_id)}">${avatarLetter}</div>
        <div class="post-main">
            <header class="post-head">
                <span class="post-name">${escapeHtml(post.display_name) || 'Usuario'}</span>
                <span class="post-handle">@${escapeHtml(post.username)}</span>
                <span class="post-ts">· ${ts}</span>
            </header>
            <div class="post-body">
                ${escapeHtml(contenidoVisible)}${truncado ? '<span class="ver-mas">Ver más</span>' : ''}
                ${htmlArchivo}
            </div>
            <footer class="post-actions">
                <button class="act">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>${post.comment_count || 0}</span>
                </button>
                <button class="act">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    <span>0</span>
                </button>
                <button class="act btn-like-post" data-post-id="${post.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" 
                         fill="${post.is_liked ? '#e07490' : 'none'}" 
                         stroke="${post.is_liked ? '#e07490' : 'currentColor'}" 
                         stroke-width="2" class="like-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span class="like-count">${post.like_count || 0}</span>
                </button>
            </footer>
        </div>
    `;

    // Click en post abre modal
    article.addEventListener('click', (e) => {
        if (e.target.closest('.act')) return;
        abrirModal(post);
    });

    return article;
}

    // ===========================================================
    // DAR/QUITAR LIKE EN PERFIL AJENO
    // ===========================================================
    document.addEventListener('click', async (e) => {
        const btnLike = e.target.closest('.btn-like-post');
        if (btnLike) {
            e.stopPropagation();
            const postId = btnLike.dataset.postId;
            
            // Ya tienes myUserId declarado arriba en este archivo
            if (!myUserId) {
                mostrarToast('Inicia sesión para dar like', true);
                return;
            }

            try {
                const response = await fetch(`http://localhost:4000/posts/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_id: postId, user_id: myUserId })
                });

                const data = await response.json();

                if (data.success) {
                    const svg = btnLike.querySelector('svg');
                    const spanCount = btnLike.querySelector('.like-count');
                    
                    if (data.action === 'liked') {
                        svg.setAttribute('fill', '#e07490');
                        svg.setAttribute('stroke', '#e07490');
                        spanCount.textContent = parseInt(spanCount.textContent) + 1;
                    } else if (data.action === 'unliked') {
                        svg.setAttribute('fill', 'none');
                        svg.setAttribute('stroke', 'currentColor');
                        spanCount.textContent = Math.max(0, parseInt(spanCount.textContent) - 1);
                    }
                }
            } catch (error) {
                console.error('Error procesando el like:', error);
            }
        }
    });

    // ===========================================================
    // MODAL DE POST COMPLETO
    // ===========================================================
    const modalOverlay = document.getElementById("postModal");
    const modalClose = document.getElementById("modalClose");
    const modalCard = document.getElementById("modalCard");

    function abrirModal(post) {
        const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
        const fechaCompleta = new Date(post.created_at).toLocaleString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        document.getElementById("modalBody").innerHTML = `
            <div class="modal-post-head">
                <div class="modal-post-avatar" style="background:${getAvatarBg(post.author_id)}">${avatarLetter}</div>
                <div class="modal-post-author">
                    <div class="modal-name">${escapeHtml(post.display_name) || 'Usuario'}</div>
                    <div class="modal-handle">@${escapeHtml(post.username)}</div>
                </div>
            </div>
            <div class="modal-post-content">${escapeHtml(post.content)}</div>
            <div class="modal-post-meta">${fechaCompleta}</div>
        `;

        modalOverlay.style.display = 'grid';
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) cerrarModal(); });
    modalCard.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

    // ===========================================================
    // DROPDOWN DE ORDENAMIENTO
    // ===========================================================
    const toggleBtn = document.getElementById("cdToggleBtn");
    const menu = document.getElementById("cdMenu");
    const selectedText = document.getElementById("cdSelectedText");
    const options = menu.querySelectorAll(".cd-option");

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    document.addEventListener("click", () => menu.classList.remove("show"));

    options.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            options.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            currentOrder = opt.getAttribute("data-value");
            selectedText.textContent = opt.textContent;
            menu.classList.remove("show");
            cargarPosts(currentOrder);
        });
    });

    // ===========================================================
    // RQF22: MODAL DE SEGUIDORES Y SIGUIENDO
    // ===========================================================
    const followersModal = document.getElementById("followersModal");
    const followersModalClose = document.getElementById("followersModalClose");
    const followersModalBody = document.getElementById("followersModalBody");
    const btnVerSeguidores = document.getElementById("btn-ver-seguidores");
    const btnVerSiguiendo = document.getElementById("btn-ver-siguiendo");

    async function abrirModalLista(tipo) {
        const isSeguidores = tipo === 'seguidores';
        const titulo = isSeguidores ? 'Seguidores' : 'Siguiendo';
        const endpoint = isSeguidores ? 'followers-list' : 'following-list-by-username';
        const arrayName = isSeguidores ? 'followers' : 'following';
        const emptyMsg = isSeguidores ? 'Este usuario aún no tiene seguidores.' : 'Este usuario aún no sigue a nadie.';

        document.querySelector('#followersModal .modal-title').textContent = titulo;
        followersModalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--fg-2);">Cargando...</div>';
        followersModal.style.display = 'grid';
        document.body.style.overflow = 'hidden';

        try {
            const resp = await fetch(`http://localhost:4000/users/${targetUsername}/${endpoint}`);
            const data = await resp.json();

            if (!data.success) {
                followersModalBody.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--fg-2);">Error al cargar ${titulo.toLowerCase()}.</div>`;
                return;
            }

            const lista = data[arrayName];
            if (!lista || lista.length === 0) {
                followersModalBody.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--fg-2);">${emptyMsg}</div>`;
                return;
            }

            followersModalBody.innerHTML = lista.map(u => {
                const letra = (u.display_name || u.username).charAt(0).toUpperCase();
                const bg = getAvatarBg(u.id);
                return `
                    <a href="perfil-ajeno.html?username=${encodeURIComponent(u.username)}" class="search-result-item" style="padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);">
                        <div class="search-result-avatar" style="background:${bg}">${letra}</div>
                        <div class="search-result-info">
                            <span class="search-result-name">${escapeHtml(u.display_name || u.username)}</span>
                            <span class="search-result-handle">@${escapeHtml(u.username)}</span>
                        </div>
                    </a>
                `;
            }).join('');
        } catch (err) {
            console.error(`Error al cargar ${titulo}:`, err);
            followersModalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--fg-2);">Error de conexión.</div>';
        }
    }

    if (followersModal) {
        if (btnVerSeguidores) btnVerSeguidores.addEventListener("click", () => abrirModalLista('seguidores'));
        if (btnVerSiguiendo) btnVerSiguiendo.addEventListener("click", () => abrirModalLista('siguiendo'));

        function cerrarFollowersModal() {
            followersModal.style.display = 'none';
            document.body.style.overflow = '';
        }

        followersModalClose.addEventListener('click', cerrarFollowersModal);
        followersModal.addEventListener('click', (e) => { if (e.target === followersModal) cerrarFollowersModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && followersModal.style.display === 'grid') cerrarFollowersModal(); });
    }

    // ===========================================================
    // INICIALIZAR
    // ===========================================================
    cargarPerfil();
    verificarFollow();
    cargarPosts(currentOrder);

    // ===========================================================
    // RQNF01: BUSCADOR DE USUARIOS
    // ===========================================================
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout = null;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResults.classList.remove('open');
                searchResults.innerHTML = '';
                return;
            }
            searchTimeout = setTimeout(() => buscarUsuarios(query), 300);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.rr-search')) {
                searchResults.classList.remove('open');
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && searchResults.innerHTML) {
                searchResults.classList.add('open');
            }
        });
    }

    async function buscarUsuarios(query) {
        try {
            const resp = await fetch(`http://localhost:4000/users/search?q=${encodeURIComponent(query)}&exclude_id=${myUserId || ''}`);
            const data = await resp.json();

            if (!data.success || data.users.length === 0) {
                searchResults.innerHTML = '<div class="search-empty">No se encontraron usuarios</div>';
                searchResults.classList.add('open');
                return;
            }

            searchResults.innerHTML = data.users.map(u => {
                const letra = (u.display_name || u.username).charAt(0).toUpperCase();
                const bg = getAvatarBg(u.id);
                return `
                    <a href="perfil-ajeno.html?username=${encodeURIComponent(u.username)}" class="search-result-item">
                        <div class="search-result-avatar" style="background:${bg}">${letra}</div>
                        <div class="search-result-info">
                            <span class="search-result-name">${escapeHtml(u.display_name || u.username)}</span>
                            <span class="search-result-handle">@${escapeHtml(u.username)}</span>
                        </div>
                    </a>
                `;
            }).join('');

            searchResults.classList.add('open');
        } catch (err) {
            console.error('Error al buscar usuarios:', err);
        }
    }
});

// Función global para cerrar sesión (usada por el botón del nav rail)
function cerrarSesion() {
    localStorage.removeItem('nikonet_token');
    localStorage.removeItem('nikonet_userId');
    localStorage.removeItem('nikonet_username');
    localStorage.removeItem('nikonet_displayName');
    window.location.href = 'login.html';
}
