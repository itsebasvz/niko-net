/* ==========================================================
   inicio.js — Lógica del feed principal de Niko-net
   Incluye: carga de posts, composer, truncado de contenido,
   modal overlay para visualización de post completo,
   y ELIMINACIÓN DE POSTS (soft delete)
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
    const btnPreview = document.getElementById('btnPreview');
    const postModal = document.getElementById('postModal');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.getElementById('modalBody');
    const modalCard = document.getElementById('modalCard');

    // RQF10: referencias del modal de previsualización
    const previewModal = document.getElementById('previewModal');
    const previewClose = document.getElementById('previewClose');
    const previewBody = document.getElementById('previewBody');
    const previewCard = document.getElementById('previewCard');
    const previewEdit = document.getElementById('previewEdit');
    const previewPublish = document.getElementById('previewPublish');
    const feedDate = document.getElementById('feedDate');
    const clearDateBtn = document.getElementById('clearDateBtn');

    // Variables del Custom Dropdown
    const cdToggleBtn = document.getElementById('cdToggleBtn');
    const cdMenu = document.getElementById('cdMenu');
    const cdSelectedText = document.getElementById('cdSelectedText');
    const cdOptions = document.querySelectorAll('.cd-option');
    let currentOrderValue = 'desc';

    // RQF16: Variables de las pestañas de filtrado (Para ti / Siguiendo) y sub-filtro v2
    const feedTabs = document.querySelectorAll('.feed-tabs .tab');
    let currentFilterValue = 'all';
    const followingUserFilter = document.getElementById('followingUserFilter');
    const fufToggleBtn = document.getElementById('fufToggleBtn');
    const fufMenu = document.getElementById('fufMenu');
    const fufSelectedText = document.getElementById('fufSelectedText');
    let currentSpecificAuthorId = '';

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
        const hayContenido = contenidoPost.value.trim().length > 0 && remaining >= 0;
        btnPostear.disabled = !hayContenido;
        btnPreview.disabled = !hayContenido;
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

    // ---- FUNCIÓN: Escapar HTML para evitar XSS ----
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ---- FUNCIÓN: Renderizar un post en el feed (con botón eliminar) ----
    function renderPost(post, isNew) {
        const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
        const ts = tiempoRelativo(post.created_at);
        const truncado = post.content.length > TRUNCAR_EN;
        const contenidoVisible = truncado
            ? post.content.substring(0, TRUNCAR_EN) + '…'
            : post.content;
        
        // Verificar si el usuario actual es el autor del post
        const currentUserId = localStorage.getItem('nikonet_userId');
        const esMiPost = currentUserId && parseInt(currentUserId) === post.author_id;

        const article = document.createElement('article');
        article.className = 'post' + (isNew ? ' lit' : '');

        // Determinar URL del perfil (propio vs ajeno)
        // Nota: sin .html para evitar que serve haga 301 y pierda los query params
        const perfilUrl = esMiPost
            ? 'perfil'
            : `perfil-ajeno?username=${encodeURIComponent(post.username)}`;

        article.innerHTML = `
            <a href="${perfilUrl}" class="post-avatar post-profile-link" style="background:${getAvatarBg(post.id)}">
                ${avatarLetter}
            </a>
            <div class="post-main">
                <header class="post-head">
                    <a href="${perfilUrl}" class="post-name post-profile-link">${escapeHtml(post.display_name) || 'Usuario'}</a>
                    <a href="${perfilUrl}" class="post-handle post-profile-link">@${escapeHtml(post.username)}</a>
                    <span class="post-ts">· ${ts}</span>
                </header>
                <div class="post-body">
                    ${escapeHtml(contenidoVisible)}${truncado ? '<span class="ver-mas">Ver más</span>' : ''}
                </div>
                <footer class="post-actions">
                    <button class="act btn-comment-action" data-post-id="${post.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>${post.comment_count || 0}</span>
                    </button>
                    <button class="act">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        <span>0</span>
                    </button>
                    <button class="act">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span>0</span>
                    </button>
                    ${esMiPost ? `
                        <button class="act btn-eliminar-post" data-post-id="${post.id}" data-author-id="${post.author_id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            <span>Eliminar</span>
                        </button>
                    ` : ''}
                </footer>
            </div>
        `;

        // Click en botón de comentarios abre el modal directo a comentarios
        const btnComment = article.querySelector('.btn-comment-action');
        if (btnComment) {
            btnComment.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModal(post);
            });
        }

        // Click en el resto del post abre el modal (excepto links de perfil y botones)
        article.addEventListener('click', (e) => {
            if (e.target.closest('.act')) return;
            if (e.target.closest('.post-profile-link')) return;
            abrirModal(post);
        });

        return article;
    }

    // ---- FUNCIÓN: Abrir modal de post completo con comentarios (RQF10 + RQF14) ----
    async function abrirModal(post) {
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
                    <div class="modal-name">${escapeHtml(post.display_name) || 'Usuario'}</div>
                    <div class="modal-handle">@${escapeHtml(post.username)}</div>
                </div>
            </div>
            <div class="modal-post-content">${escapeHtml(post.content)}</div>
            <div class="modal-post-meta">${fechaCompleta}</div>

            <!-- RQF14: Sección de comentarios -->
            <div class="comments-section">
                <div class="comments-title">Comentarios</div>

                <!-- Formulario para escribir un comentario -->
                <div class="comment-form">
                    <div class="comment-form-avatar" style="background:${getAvatarBg(0)}">${avatar}</div>
                    <div class="comment-input-wrap">
                        <textarea id="commentInput" placeholder="Escribe un comentario…" rows="1" maxlength="500"></textarea>
                        <button class="btn-comment" id="btnSendComment" disabled title="Enviar comentario">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Lista de comentarios cargados del servidor -->
                <div class="comments-list" id="commentsList">
                    <div class="comments-empty">Cargando comentarios…</div>
                </div>
            </div>
        `;

        postModal.style.display = 'grid';
        document.body.style.overflow = 'hidden';

        // Configurar el formulario de comentarios
        const commentInput = document.getElementById('commentInput');
        const btnSendComment = document.getElementById('btnSendComment');
        const commentsList = document.getElementById('commentsList');

        // Habilitar/deshabilitar botón de envío
        commentInput.addEventListener('input', () => {
            btnSendComment.disabled = commentInput.value.trim().length === 0;
        });

        // Enviar comentario al hacer click en el botón
        btnSendComment.addEventListener('click', async () => {
            const content = commentInput.value.trim();
            const authorId = localStorage.getItem('nikonet_userId');
            if (!content || !authorId) return;

            btnSendComment.disabled = true;
            try {
                const resp = await fetch(`http://localhost:4000/posts/${post.id}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author_id: authorId, content })
                });
                const data = await resp.json();
                if (data.success) {
                    commentInput.value = '';
                    cargarComentarios(post.id, commentsList);
                    // Actualizar el contador de comentarios en el feed
                    actualizarContadorComentarios(post.id);
                } else {
                    mostrarToast(data.message || 'Error al comentar', true);
                }
            } catch (err) {
                console.error('Error al enviar comentario:', err);
                mostrarToast('Error de conexión al enviar comentario', true);
            }
        });

        // Enviar con Enter (Shift+Enter para nueva línea)
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!btnSendComment.disabled) btnSendComment.click();
            }
        });

        // Cargar los comentarios existentes
        cargarComentarios(post.id, commentsList);
    }

    // ---- RQF14: Cargar comentarios de un post ----
    async function cargarComentarios(postId, container) {
        try {
            const resp = await fetch(`http://localhost:4000/posts/${postId}/comments`);
            const data = await resp.json();

            if (data.success && data.comments.length > 0) {
                container.innerHTML = data.comments.map(c => {
                    const letra = (c.display_name || 'U').charAt(0).toUpperCase();
                    return `
                        <div class="comment">
                            <div class="comment-avatar" style="background:${getAvatarBg(c.author_id)}">${letra}</div>
                            <div class="comment-body">
                                <div class="comment-head">
                                    <span class="comment-name">${escapeHtml(c.display_name)}</span>
                                    <span class="comment-handle">@${escapeHtml(c.username)}</span>
                                    <span class="comment-ts">${tiempoRelativo(c.created_at)}</span>
                                </div>
                                <div class="comment-text">${escapeHtml(c.content)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="comments-empty">Sé el primero en comentar ✨</div>';
            }
        } catch (err) {
            console.error('Error al cargar comentarios:', err);
            container.innerHTML = '<div class="comments-empty">Error al cargar comentarios</div>';
        }
    }

    // ---- RQF14: Actualizar el contador de comentarios en el post del feed ----
    function actualizarContadorComentarios(postId) {
        // Recargar los posts para actualizar contadores
        cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
    }

    // ---- FUNCIÓN: Cerrar modal de post publicado ----
    function cerrarModal() {
        postModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', cerrarModal);
    postModal.addEventListener('click', (e) => {
        if (e.target === postModal) cerrarModal();
    });
    modalCard.addEventListener('click', (e) => e.stopPropagation());

    // ===========================================================
    // RQF10: PREVISUALIZACIÓN DE POST ANTES DE PUBLICAR
    // ===========================================================

    btnPreview.addEventListener('click', () => {
        const content = contenidoPost.value.trim();
        if (!content) return;

        previewBody.innerHTML = `
            <div class="preview-label">Así se verá tu post en el feed</div>
            <div class="preview-card">
                <article class="post">
                    <div class="post-avatar" style="background:${getAvatarBg(0)}">
                        ${avatar}
                    </div>
                    <div class="post-main">
                        <header class="post-head">
                            <span class="post-name">${escapeHtml(displayName)}</span>
                            <span class="post-handle">@${escapeHtml(username)}</span>
                            <span class="post-ts">· ahora</span>
                        </header>
                        <div class="post-body">${escapeHtml(content)}</div>
                        <footer class="post-actions">
                            <button class="act">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <span>0</span>
                            </button>
                            <button class="act">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                                <span>0</span>
                            </button>
                            <button class="act">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                <span>0</span>
                            </button>
                        </footer>
                    </div>
                </article>
            </div>
        `;

        previewModal.style.display = 'grid';
        document.body.style.overflow = 'hidden';
    });

    function cerrarPreview() {
        previewModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    previewClose.addEventListener('click', cerrarPreview);
    previewEdit.addEventListener('click', () => {
        cerrarPreview();
        contenidoPost.focus();
    });
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) cerrarPreview();
    });
    previewCard.addEventListener('click', (e) => e.stopPropagation());

    previewPublish.addEventListener('click', () => {
        cerrarPreview();
        formCrearPost.requestSubmit();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.style.display === 'grid') cerrarPreview();
            else if (postModal.style.display === 'grid') cerrarModal();
        }
    });

    // ---- FUNCIÓN: Cargar posts del servidor ----
    async function cargarPosts(order = 'desc', date = '') {
        try {
            const url = new URL('http://localhost:4000/posts');
            url.searchParams.append('order', order);
            if (date) {
                url.searchParams.append('date', date);
            }

            // RQF16: Inyectar filtro por cuentas seguidas si está activa la pestaña
            if (currentFilterValue === 'following') {
                const currentUserId = localStorage.getItem('nikonet_userId');
                url.searchParams.append('filter', 'following');
                if (currentUserId) {
                    url.searchParams.append('user_id', currentUserId);
                }
                if (currentSpecificAuthorId) {
                    url.searchParams.append('specific_author_id', currentSpecificAuthorId);
                }
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                muroPosts.innerHTML = '';

                if (data.posts.length === 0) {
                    if (currentFilterValue === 'following') {
                        muroPosts.innerHTML = '<div class="empty">Aún no hay publicaciones de las personas a las que sigues. ¡Explora y sigue a más creadores!</div>';
                    } else {
                        muroPosts.innerHTML = '<div class="empty">Aún no hay posts. ¿Qué tal si conjuras el primero?</div>';
                    }
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

    // ---- ELIMINAR POST (Soft Delete) con EVENT DELEGATION ----
    document.addEventListener('click', async (e) => {
        const btnEliminar = e.target.closest('.btn-eliminar-post');
        if (!btnEliminar) return;
        
        e.stopPropagation();
        
        const postId = btnEliminar.dataset.postId;
        const authorId = parseInt(btnEliminar.dataset.authorId);
        const currentUserId = parseInt(localStorage.getItem('nikonet_userId'));
        
        if (currentUserId !== authorId) {
            mostrarToast('❌ Solo puedes eliminar tus propias publicaciones', true);
            return;
        }
        
        const confirmar = confirm('¿Estás seguro de que quieres eliminar esta publicación?');
        if (!confirmar) return;
        
        try {
            const response = await fetch(`http://localhost:4000/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarToast('✅ Publicación eliminada exitosamente');
                cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
            } else {
                mostrarToast('❌ Error: ' + data.message, true);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarToast('❌ Error al eliminar la publicación', true);
        }
    });

    // RQF16: Event Listeners para las pestañas de filtrado del feed
    if (feedTabs && feedTabs.length > 0) {
        feedTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const esSiguiendo = tab.textContent.trim().toLowerCase() === 'siguiendo';
                
                if (esSiguiendo) {
                    const currentUserId = localStorage.getItem('nikonet_userId');
                    if (!currentUserId) {
                        // Redirigir a iniciar sesión si no hay usuario
                        window.location.href = 'login.html';
                        return;
                    }
                    currentFilterValue = 'following';
                    if (followingUserFilter) {
                        followingUserFilter.style.display = 'inline-block';
                        cargarListaSeguidos(currentUserId);
                    }
                } else {
                    currentFilterValue = 'all';
                    currentSpecificAuthorId = '';
                    if (followingUserFilter) followingUserFilter.style.display = 'none';
                    if (fufSelectedText) fufSelectedText.textContent = 'Todos los seguidos';
                }

                // Actualizar estado visual de las pestañas
                feedTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Recargar publicaciones con los filtros correspondientes
                cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
            });
        });
    }

    // RQF16 v2: Cargar dinámicamente la lista de seguidos en el sub-filtro
    async function cargarListaSeguidos(userId) {
        if (!fufMenu) return;
        try {
            const response = await fetch(`http://localhost:4000/users/${userId}/following-list`);
            const data = await response.json();

            if (data.success) {
                // Generar HTML interno con la opción predeterminada
                let html = `<div class="cd-option ${currentSpecificAuthorId === '' ? 'active' : ''}" data-value="">Todos los seguidos</div>`;
                
                data.following.forEach(user => {
                    const isActive = currentSpecificAuthorId === String(user.id) ? 'active' : '';
                    html += `<div class="cd-option ${isActive}" data-value="${user.id}">${user.display_name} (@${user.username})</div>`;
                });

                fufMenu.innerHTML = html;

                // Adjuntar listeners a las nuevas opciones
                const fufOptions = fufMenu.querySelectorAll('.cd-option');
                fufOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        fufOptions.forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                        
                        fufSelectedText.textContent = option.textContent.split(' (@')[0]; // Mostrar solo el nombre de visualización
                        currentSpecificAuthorId = option.getAttribute('data-value');
                        fufMenu.classList.remove('show');
                        
                        cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
                    });
                });
            }
        } catch (err) {
            console.error('Error al cargar lista de seguidos:', err);
        }
    }

    // Toggle para el menú de sub-filtro v2
    if (fufToggleBtn) {
        fufToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (fufMenu) fufMenu.classList.toggle('show');
            // Cerrar el otro si está abierto
            if (cdMenu && cdMenu.classList.contains('show')) cdMenu.classList.remove('show');
        });
    }

    // Cargar posts iniciales
    cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');

    // ---- LÓGICA DEL CUSTOM DROPDOWN ----
    if (cdToggleBtn) {
        cdToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cdMenu.classList.toggle('show');
            // Cerrar el sub-filtro de seguidos si está abierto
            if (fufMenu && fufMenu.classList.contains('show')) fufMenu.classList.remove('show');
        });

        document.addEventListener('click', () => {
            if (cdMenu && cdMenu.classList.contains('show')) cdMenu.classList.remove('show');
            if (fufMenu && fufMenu.classList.contains('show')) fufMenu.classList.remove('show');
        });

        cdOptions.forEach(option => {
            option.addEventListener('click', () => {
                cdOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                cdSelectedText.textContent = option.textContent;
                
                currentOrderValue = option.getAttribute('data-value');
                cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
            });
        });
    }

    // Flatpickr para el calendario
    let fpInstance = null;
    if (feedDate) {
        fpInstance = flatpickr(feedDate, {
            locale: "es",
            dateFormat: "Y-m-d",
            disableMobile: "true",
            monthSelectorType: "static",
            onChange: function(selectedDates, dateStr, instance) {
                if (dateStr) {
                    if (clearDateBtn) clearDateBtn.style.display = 'block';
                } else {
                    if (clearDateBtn) clearDateBtn.style.display = 'none';
                }
                cargarPosts(currentOrderValue, dateStr);
            }
        });
    }

    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', () => {
            if (fpInstance) fpInstance.clear();
        });
    }

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
                cargarPosts(currentOrderValue, feedDate ? feedDate.value : '');
                mostrarToast('¡Post conjurado con éxito!');
            } else {
                mostrarToast(data.message || 'Error al publicar', true);
            }
        } catch (error) {
            console.error('Error al publicar:', error);
            mostrarToast('No se pudo conectar con el servidor', true);
        } finally {
            btnPostear.disabled = false;
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