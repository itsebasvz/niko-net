const urlParams = new URLSearchParams(window.location.search);
let usernameDeLaURL = urlParams.get('user');

if (!usernameDeLaURL) {
    usernameDeLaURL = localStorage.getItem('nikonet_username');
    if (!usernameDeLaURL) {
        window.location.href = 'login.html';
    }
}

const API_URL = `http://localhost:4000/api/v1/profile/${usernameDeLaURL}`;

function getAuthToken() {
    return localStorage.getItem('nikonet_token');
}

function esMiPerfil() {
    const usuarioLogueado = localStorage.getItem('nikonet_username');
    return usuarioLogueado === usernameDeLaURL;
}

// ACTUALIZACIÓN CRÍTICA: Forzar el renderizado de avatares en toda la vista
function actualizarInterfazUsuario(data) {
    // Usamos el username para la inicial (esto es más estable que el nombre display)
    const inicial = data.username ? data.username.charAt(0).toUpperCase() : '?';
    
    // 1. Avatar central del perfil
    const lblAvatar = document.getElementById('lbl-avatar');
    if (lblAvatar) lblAvatar.innerText = inicial;

    // 2. Avatar y nombres en la barra lateral (Nav Rail)
    const navAvatar = document.getElementById('navAvatar');
    const navUserName = document.getElementById('navUserName');
    
    if (navAvatar) navAvatar.innerText = inicial;
    if (navUserName) navUserName.innerText = data.display_name || data.username;
}

async function cargarPerfil() {
    try {
        // Obtenemos los datos con los contadores de followers desde el endpoint completo
        const resCompleta = await fetch(`http://localhost:4000/users/${usernameDeLaURL}/profile`);
        if (!resCompleta.ok) return;

        const jsonCompleto = await resCompleta.json();
        const data = jsonCompleto.user;

        // Renderizado de textos
        document.getElementById('lbl-username').innerText = `@${data.username}`;
        document.getElementById('lbl-nombre').innerText = data.display_name || 'Sin nombre';
        document.getElementById('lbl-bio').innerText = data.bio || 'Sin biografía';
        
        // Renderizado de contadores
        const lblSiguiendo = document.getElementById('lbl-siguiendo');
        const lblSeguidores = document.getElementById('lbl-seguidores');
        if (lblSiguiendo) lblSiguiendo.innerText = data.following_count || 0;
        if (lblSeguidores) lblSeguidores.innerText = data.followers_count || 0;

        // Sincronizar inputs
        document.getElementById('input-nombre').value = data.display_name || '';
        document.getElementById('input-bio').value = data.bio || '';

        // Actualizar avatares visuales
        actualizarInterfazUsuario(data);

        const btnEditar = document.getElementById('btn-activar-edicion');
        if (btnEditar) btnEditar.style.display = esMiPerfil() ? 'inline-flex' : 'none';
        
    } catch (err) {
        console.error("Error al cargar:", err);
    }
}

// Manejo de visibilidad de formularios
const btnEditar = document.getElementById('btn-activar-edicion');
if (btnEditar) {
    btnEditar.onclick = () => {
        document.getElementById('vista-perfil').style.display = 'none';
        document.getElementById('form-edicion').style.display = 'grid';
    };
}

const btnCancelar = document.getElementById('btn-cancelar');
if (btnCancelar) {
    btnCancelar.onclick = () => {
        document.getElementById('vista-perfil').style.display = 'grid';
        document.getElementById('form-edicion').style.display = 'none';
    };
}

// GUARDAR CAMBIOS (Sincronización Total)
const perfilForm = document.getElementById('perfil-form');
if (perfilForm) {
    perfilForm.onsubmit = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        
        const actualizacion = {
            display_name: document.getElementById('input-nombre').value,
            bio: document.getElementById('input-bio').value
        };

        try {
            const res = await fetch(API_URL, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(actualizacion)
            });

            if (res.ok) {
                // 1. Actualizar el almacenamiento local de inmediato
                localStorage.setItem('nikonet_displayName', actualizacion.display_name);
                
                // 2. Refrescar la UI sin esperar a la recarga
                actualizarInterfazUsuario({
                    username: usernameDeLaURL,
                    display_name: actualizacion.display_name
                });

                // 3. Recarga limpia para asegurar consistencia con el servidor
                window.location.reload();
            } else {
                alert("No se pudo actualizar el perfil");
            }
        } catch (err) {
            console.error(err);
        }
    };
}

// ===========================================================
// RQF22: MODAL DE SEGUIDORES Y SIGUIENDO
// ===========================================================
const followersModal = document.getElementById("followersModal");
const followersModalClose = document.getElementById("followersModalClose");
const followersModalBody = document.getElementById("followersModalBody");
const btnVerSeguidores = document.getElementById("btn-ver-seguidores");
const btnVerSiguiendo = document.getElementById("btn-ver-siguiendo");

// Gradientes de avatar (consistente con inicio.js)
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #f3c43b, #e07490)',
    'linear-gradient(135deg, #5e3490, #c8526b)',
    'linear-gradient(135deg, #59ee99, #5e3490)',
    'linear-gradient(135deg, #c8526b, #f3c43b)',
    'linear-gradient(135deg, #9c6dd1, #59ee99)',
];
function getAvatarBg(id) {
    return AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function abrirModalLista(tipo) {
    const isSeguidores = tipo === 'seguidores';
    const titulo = isSeguidores ? 'Seguidores' : 'Siguiendo';
    const endpoint = isSeguidores ? 'followers-list' : 'following-list-by-username';
    const arrayName = isSeguidores ? 'followers' : 'following';
    const emptyMsg = isSeguidores ? 'Aún no tienes seguidores.' : 'Aún no sigues a nadie.';

    document.querySelector('#followersModal .modal-title').textContent = titulo;
    followersModalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--fg-2);">Cargando...</div>';
    followersModal.style.display = 'grid';
    document.body.style.overflow = 'hidden';

    try {
        const resp = await fetch(`http://localhost:4000/users/${usernameDeLaURL}/${endpoint}`);
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
                <a href="perfil-ajeno.html?username=${encodeURIComponent(u.username)}" style="text-decoration: none; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--fg-1);">
                    <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; background:${bg}">${letra}</div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 15px;">${escapeHtml(u.display_name || u.username)}</span>
                        <span style="color: var(--fg-2); font-size: 13px;">@${escapeHtml(u.username)}</span>
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
// CARGA Y RENDERIZADO DEL FEED DE POSTS PROPIOS
// ===========================================================
let currentOrder = 'desc';

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

async function cargarPosts(order) {
    const container = document.getElementById("muro-posts");
    const myUserId = localStorage.getItem('nikonet_userId');

    try {
        let url = `http://localhost:4000/users/${usernameDeLaURL}/posts?order=${order}`;
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
            container.innerHTML = `<div class="empty">Aún no has publicado nada.</div>`;
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

function renderPost(post) {
    const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
    const ts = tiempoRelativo(post.created_at);
    const TRUNCAR_EN = 140;
    const truncado = post.content.length > TRUNCAR_EN;
    const contenidoVisible = truncado ? post.content.substring(0, TRUNCAR_EN) + '…' : post.content;

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

    article.addEventListener('click', (e) => {
        if (e.target.closest('.act')) return;
        abrirModalPost(post);
    });

    return article;
}

const postModal = document.getElementById("postModal");
const modalClose = document.getElementById("modalClose");
const modalCard = document.getElementById("modalCard");
const modalBody = document.getElementById("modalBody");

function abrirModalPost(post) {
    const avatarLetter = (post.display_name || 'U').charAt(0).toUpperCase();
    const fechaCompleta = new Date(post.created_at).toLocaleString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    modalBody.innerHTML = `
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

    postModal.style.display = 'grid';
    document.body.style.overflow = 'hidden';
}

function cerrarModalPost() {
    postModal.style.display = 'none';
    document.body.style.overflow = '';
}

if (postModal) {
    modalClose.addEventListener('click', cerrarModalPost);
    postModal.addEventListener('click', (e) => { if (e.target === postModal) cerrarModalPost(); });
    modalCard.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && postModal.style.display === 'grid') cerrarModalPost(); });
}

// Lógica de "Likes"
document.addEventListener('click', async (e) => {
    const btnLike = e.target.closest('.btn-like-post');
    if (btnLike) {
        e.stopPropagation();
        const postId = btnLike.dataset.postId;
        const myUserId = localStorage.getItem('nikonet_userId');
        
        if (!myUserId) return;

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

// Dropdown de ordenamiento
const toggleBtn = document.getElementById("cdToggleBtn");
const menu = document.getElementById("cdMenu");
const selectedText = document.getElementById("cdSelectedText");
if (menu) {
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
}

cargarPerfil();
cargarPosts(currentOrder);