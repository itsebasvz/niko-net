document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar info del usuario autenticado (para la barra de navegación)
    const storedUser = localStorage.getItem("niko_user");
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            document.getElementById("navUserName").textContent = u.display_name;
            document.getElementById("navUserHandle").textContent = "@" + u.username;
            if (u.display_name) {
                document.getElementById("navAvatar").textContent = u.display_name.charAt(0).toUpperCase();
            }
        } catch(e) {
            console.error("Error al leer usuario de localStorage", e);
        }
    }

    // 2. Extraer username de URLSearchParams
    const params = new URLSearchParams(window.location.search);
    const targetUsername = params.get('username');

    if (!targetUsername) {
        // Redirigir si no hay username en la URL
        window.location.href = 'inicio.html';
        return;
    }

    // Si el usuario es el mismo que está logueado, redirigir a su propio perfil
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            if (u.username === targetUsername) {
                window.location.href = 'perfil.html';
                return;
            }
        } catch(e) {}
    }

    // Configurar estado local del usuario ajeno
    let targetUser = {
        username: targetUsername,
        display_name: targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1),
        bio: `Esta es una biografía de ejemplo para @${targetUsername}. Me encanta programar y compartir ideas en niko-net.`,
        followers: Math.floor(Math.random() * 500) + 10,
        following: Math.floor(Math.random() * 200) + 5,
        is_following: false
    };

    let userPosts = [];

    // Renderizar información del usuario en el DOM
    function renderUserInfo() {
        document.getElementById("header-title").textContent = `Perfil de ${targetUser.display_name}`;
        document.getElementById("lbl-nombre").textContent = targetUser.display_name;
        document.getElementById("lbl-username").textContent = "@" + targetUser.username;
        document.getElementById("lbl-bio").textContent = targetUser.bio;
        document.getElementById("lbl-avatar").textContent = targetUser.display_name.charAt(0).toUpperCase();
        document.getElementById("lbl-seguidores").textContent = targetUser.followers;
        document.getElementById("lbl-siguiendo").textContent = targetUser.following;
        
        updateFollowButton();
    }

    // Actualizar apariencia del botón seguir
    function updateFollowButton() {
        const btn = document.getElementById("btn-seguir");
        if (targetUser.is_following) {
            btn.className = "btn-secondary btn-pill";
            btn.textContent = "Siguiendo";
        } else {
            btn.className = "btn-primary btn-pill";
            btn.textContent = "Seguir";
        }
    }

    // Event listener para el botón Seguir
    document.getElementById("btn-seguir").addEventListener("click", () => {
        targetUser.is_following = !targetUser.is_following;
        if (targetUser.is_following) {
            targetUser.followers += 1;
        } else {
            targetUser.followers -= 1;
        }
        document.getElementById("lbl-seguidores").textContent = targetUser.followers;
        updateFollowButton();
    });

    // Mock de posts
    function fetchMockPosts() {
        const mockData = [
            { id: 101, content: "Explorando las nuevas características de niko-net, me gusta mucho cómo se ve.", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() }, // Hace 5 min
            { id: 102, content: "JavaScript es increíble, pero a veces me da dolores de cabeza...", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }, // Hace 2 horas
            { id: 103, content: "Acabo de terminar mi proyecto de diseño web. ¡Listo para compartirlo!", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() }, // Hace 3 días
            { id: 104, content: "Pregunta rápida: ¿Alguien sabe cómo centrar un div en CSS?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() } // Hace 10 días
        ];
        userPosts = mockData;
        renderPosts();
    }

    // Renderizar posts basado en el orden actual
    function renderPosts() {
        const container = document.getElementById("muro-posts");
        container.innerHTML = "";

        const order = document.getElementById("feedOrderDropdown").getAttribute("data-value");
        
        let sortedPosts = [...userPosts];
        sortedPosts.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            if (order === "desc") {
                return timeB - timeA; // Más recientes primero
            } else {
                return timeA - timeB; // Más antiguos primero
            }
        });

        if (sortedPosts.length === 0) {
            container.innerHTML = `<div class="empty">Aún no hay posts de @${targetUser.username}.</div>`;
            return;
        }

        sortedPosts.forEach(post => {
            const div = document.createElement("div");
            div.className = "post";
            div.innerHTML = `
                <div class="post-avatar" style="background: linear-gradient(135deg, #f3c43b, #e07490);">
                    ${targetUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div class="post-body">
                    <div class="post-head">
                        <span class="post-name">${targetUser.display_name}</span>
                        <span class="post-handle">@${targetUser.username}</span>
                        <span style="color:var(--fg-3); margin:0 4px;">·</span>
                        <span class="post-ts">${formatTimeAgo(post.created_at)}</span>
                    </div>
                    <div style="font-size: 15px; line-height: 1.55; color: var(--fg-1); margin-top: 4px;">
                        ${post.content}
                    </div>
                    <div class="post-actions">
                        <button class="act">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            0
                        </button>
                        <button class="act">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                            0
                        </button>
                        <button class="act">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            0
                        </button>
                    </div>
                </div>
            `;
            // Modal on click
            div.addEventListener("click", (e) => {
                if (e.target.closest('.act')) return; // No abrir modal si se hace clic en botones de acción
                abrirModalPost(post);
            });
            container.appendChild(div);
        });
    }

    // Modal view
    const modalOverlay = document.getElementById("postModal");
    const modalClose = document.getElementById("modalClose");

    if (modalClose) {
        modalClose.addEventListener("click", () => {
            modalOverlay.style.display = "none";
        });
    }

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = "none";
        }
    });

    function abrirModalPost(post) {
        const modalBody = document.getElementById("modalBody");
        modalBody.innerHTML = `
            <div class="modal-post-head">
                <div class="modal-post-avatar" style="background: linear-gradient(135deg, #f3c43b, #e07490);">
                    ${targetUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div class="modal-post-author">
                    <div class="modal-name">${targetUser.display_name}</div>
                    <div class="modal-handle">@${targetUser.username}</div>
                </div>
            </div>
            <div class="modal-post-content">${post.content}</div>
            <div class="modal-post-meta">${new Date(post.created_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</div>
        `;
        modalOverlay.style.display = "grid";
    }

    // Inicializar dropdown de ordenamiento
    const dropdown = document.getElementById("feedOrderDropdown");
    const toggleBtn = document.getElementById("cdToggleBtn");
    const menu = document.getElementById("cdMenu");
    const selectedText = document.getElementById("cdSelectedText");
    const options = menu.querySelectorAll(".cd-option");

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });

    options.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            options.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            
            const value = opt.getAttribute("data-value");
            dropdown.setAttribute("data-value", value);
            selectedText.textContent = opt.textContent;
            menu.classList.remove("show");
            
            // Re-render posts with new sorting
            renderPosts();
        });
    });

    // Utilidades
    function formatTimeAgo(isoString) {
        const now = new Date();
        const past = new Date(isoString);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "ahora";
        if (diffMins < 60) return `${diffMins}min`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d`;
        
        return past.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }

    // Inicializar
    renderUserInfo();
    fetchMockPosts();
});
