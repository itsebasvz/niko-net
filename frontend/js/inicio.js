/* ==========================================================
   inicio.js — Lógica del feed principal de Niko-net
   Incluye: carga de posts, composer, truncado de contenido,
   y modal overlay para visualización de post completo (RQF10).
   ========================================================== */

// Longitud máxima visible en el feed antes de truncar
const TRUNCAR_EN = 140;

// Gradientes de avatar por defecto (se asigna según ID del autor)
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #f3c43b, #e07490)',
    'linear-gradient(135deg, #5e3490, #c8526b)',
    'linear-gradient(135deg, #59ee99, #5e3490)',
    'linear-gradient(135deg, #c8526b, #f3c43b)',
    'linear-gradient(135deg, #9c6dd1, #59ee99)',
];

document.addEventListener('DOMContentLoaded', () => {

    const formCrearPost = document.getElementById('formCrearPost');
    const muroPosts = document.getElementById('muro-posts');
    const contenidoPost = document.getElementById('contenidoPost');
    const charCount = document.getElementById('charCount');
    const btnPostear = document.getElementById('btnPostear');
    const postModal = document.getElementById('postModal');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.getElementById('modalBody');
    const modalCard = document.getElementById('modalCard');

    // Cargar info del usuario en el nav rail
    const displayName = localStorage.getItem('nikonet_displayName') || 'Usuario';
    const username = localStorage.getItem('nikonet_username') || 'usuario';
    const avatar = displayName.charAt(0).toUpperCase();

    document.getElementById('navAvatar').textContent = avatar;
    document.getElementById('navUserName').textContent = displayName;
    document.getElementById('navUserHandle').textContent = '@' + username;
    document.getElementById('composerAvatar').textContent = avatar;

    // ---- COMPOSER: contador de caracteres ----
    contenidoPost.addEventListener('input', () => {
        const remaining = 280 - contenidoPost.value.length;
        charCount.textContent = remaining;
        charCount.classList.toggle('danger', remaining < 20);
        btnPostear.disabled = contenidoPost.value.trim().length === 0 || remaining < 0;
    });

    // ---- FUNCIÓN: Formatear timestamp relativo ----
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

    // ---- FUNCIÓN: Obtener gradiente de avatar ----
    function getAvatarBg(id) {
        return AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];
    }

    // ---- FUNCIÓN: Renderizar un post en el feed ----
    function renderPost(post, isNew) {
        const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
        const ts = tiempoRelativo(post.created_at);
        const truncado = post.content.length > TRUNCAR_EN;
        const contenidoVisible = truncado
            ? post.content.substring(0, TRUNCAR_EN) + '…'
            : post.content;

        const article = document.createElement('article');
        article.className = 'post' + (isNew ? ' lit' : '');
        article.innerHTML = `
            <div class="post-avatar" style="background:${getAvatarBg(post.id)}">
                ${avatarLetter}
            </div>
            <div class="post-main">
                <header class="post-head">
                    <span class="post-name">${post.display_name || 'Usuario'}</span>
                    <span class="post-handle">@${post.username}</span>
                    <span class="post-ts">· ${ts}</span>
                </header>
                <div class="post-body">
                    ${contenidoVisible}${truncado ? '<span class="ver-mas">Ver más</span>' : ''}
                </div>
                <footer class="post-actions">
                    <button class="act">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>0</span>
                    </button>
                    <button class="act">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        <span>0</span>
                    </button>
                    <button class="act">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span>0</span>
                    </button>
                </footer>
            </div>
        `;

        // RQF10: Click en el post abre el modal con la publicación completa
        article.addEventListener('click', (e) => {
            // No abrir modal si se hizo click en un botón de acción
            if (e.target.closest('.act')) return;
            abrirModal(post);
        });

        return article;
    }

    // ---- FUNCIÓN: Abrir modal de post completo (RQF10) ----
    function abrirModal(post) {
        const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
        const fechaCompleta = new Date(post.created_at).toLocaleString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        modalBody.innerHTML = `
            <div class="modal-post-head">
                <div class="modal-post-avatar" style="background:${getAvatarBg(post.id)}">
                    ${avatarLetter}
                </div>
                <div class="modal-post-author">
                    <div class="modal-name">${post.display_name || 'Usuario'}</div>
                    <div class="modal-handle">@${post.username}</div>
                </div>
            </div>
            <div class="modal-post-content">${post.content}</div>
            <div class="modal-post-meta">${fechaCompleta}</div>
        `;

        postModal.style.display = 'grid';
        document.body.style.overflow = 'hidden';
    }

    // ---- FUNCIÓN: Cerrar modal ----
    function cerrarModal() {
        postModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', cerrarModal);
    postModal.addEventListener('click', (e) => {
        if (e.target === postModal) cerrarModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && postModal.style.display === 'grid') cerrarModal();
    });
    // Evitar que click dentro del modal card lo cierre
    modalCard.addEventListener('click', (e) => e.stopPropagation());

    // ---- FUNCIÓN: Cargar posts del servidor ----
    async function cargarPosts() {
        try {
            const response = await fetch('http://localhost:4000/posts');
            const data = await response.json();

            if (data.success) {
                muroPosts.innerHTML = '';

                if (data.posts.length === 0) {
                    muroPosts.innerHTML = '<div class="empty">Aún no hay posts. ¿Qué tal si conjuras el primero?</div>';
                    return;
                }

                data.posts.forEach((post, i) => {
                    muroPosts.appendChild(renderPost(post, false));
                });
            }
        } catch (error) {
            console.error('Error al cargar el muro:', error);
            muroPosts.innerHTML = '<div class="empty">Error al cargar las publicaciones. ¿El servidor está encendido?</div>';
        }
    }

    cargarPosts();

    // ---- CREAR POST ----
    formCrearPost.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = contenidoPost.value.trim();
        const authorId = localStorage.getItem('nikonet_userId');

        if (!authorId) {
            alert('Error de sesión: No se pudo identificar al autor. Inicia sesión de nuevo.');
            return;
        }
        if (!content) return;

        btnPostear.disabled = true;
        try {
            const response = await fetch('http://localhost:4000/crear-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author_id: authorId, content: content })
            });
            const data = await response.json();

            if (response.ok) {
                formCrearPost.reset();
                charCount.textContent = '280';
                charCount.classList.remove('danger');
                cargarPosts();
                mostrarToast('¡Post conjurado con éxito!');
            } else {
                mostrarToast(data.message || 'Error al publicar', true);
            }
        } catch (error) {
            console.error('Error al publicar:', error);
            mostrarToast('No se pudo conectar con el servidor', true);
        }
    });

    // ---- TOAST ----
    function mostrarToast(msg, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast ' + (isError ? 't-err' : 't-ok');
        toast.innerHTML = `<div class="ic"></div><span>${msg}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});