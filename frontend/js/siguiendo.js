/* ==========================================================
   siguiendo.js — Lógica de la vista de "Siguiendo"
   ========================================================== */

// Gradientes de avatar (coincidente con inicio.js)
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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar info del usuario en el nav rail
    const displayName = localStorage.getItem('nikonet_displayName') || 'Usuario';
    const username = localStorage.getItem('nikonet_username') || 'usuario';
    const userId = localStorage.getItem('nikonet_userId');
    const token = localStorage.getItem('nikonet_token');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const avatar = displayName.charAt(0).toUpperCase();

    const navAvatarEl = document.getElementById('navAvatar');
    const navUserNameEl = document.getElementById('navUserName');
    const navUserHandleEl = document.getElementById('navUserHandle');

    if (navAvatarEl) navAvatarEl.textContent = avatar;
    if (navUserNameEl) navUserNameEl.textContent = displayName;
    if (navUserHandleEl) navUserHandleEl.textContent = '@' + username;

    const followingListContainer = document.getElementById('following-list');

    // 2. Cargar la lista de seguidos
    async function cargarListaSeguidos() {
        try {
            // El endpoint GET /users/:user_id/following-list fue creado en backend
            const response = await fetch(`http://localhost:4000/users/${userId}/following-list`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            followingListContainer.innerHTML = ''; // Limpiar estado de carga

            if (data.success) {
                if (data.following.length === 0) {
                    followingListContainer.innerHTML = '<div class="empty">Aún no sigues a nadie. ¡Explora la plataforma y encuentra nuevos creadores!</div>';
                    return;
                }

                data.following.forEach(user => {
                    const card = crearTarjetaUsuario(user);
                    followingListContainer.appendChild(card);
                });
            } else {
                followingListContainer.innerHTML = '<div class="empty">Error al cargar la lista de seguidos.</div>';
            }
        } catch (error) {
            console.error('Error al cargar seguidos:', error);
            followingListContainer.innerHTML = '<div class="empty">Error de conexión. ¿El servidor está encendido?</div>';
        }
    }

    // 3. Crear tarjeta de usuario
    function crearTarjetaUsuario(user) {
        const avatarLetter = (user.display_name || 'U').charAt(0).toUpperCase();
        
        const article = document.createElement('article');
        article.className = 'post'; // Reutilizamos estilos de tarjeta de post
        article.style.alignItems = 'center';
        article.style.cursor = 'pointer';
        article.dataset.username = user.username;

        article.innerHTML = `
            <div class="post-avatar" style="background:${getAvatarBg(user.id)}; font-size: 18px;">
                ${avatarLetter}
            </div>
            <div class="post-main" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div class="user-info">
                    <div class="post-name" style="font-size: 16px;">${escapeHtml(user.display_name) || 'Usuario'}</div>
                    <div class="post-handle">@${escapeHtml(user.username)}</div>
                </div>
                <button class="btn-secondary btn-pill btn-unfollow" data-username="${escapeHtml(user.username)}">
                    Dejar de seguir
                </button>
            </div>
        `;

        // Evento para navegar al perfil
        article.addEventListener('click', (e) => {
            // Ignorar clic si se hizo sobre el botón de dejar de seguir
            if (e.target.closest('.btn-unfollow')) return;
            window.location.href = `perfil-ajeno.html?username=${encodeURIComponent(user.username)}`;
        });

        // Evento para dejar de seguir
        const btnUnfollow = article.querySelector('.btn-unfollow');
        btnUnfollow.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evita que se dispare el evento click de la tarjeta
            
            // Confirmación opcional
            // if (!confirm(`¿Estás seguro de que quieres dejar de seguir a @${user.username}?`)) return;

            btnUnfollow.disabled = true;
            btnUnfollow.textContent = '...';

            try {
                const response = await fetch(`http://localhost:4000/users/${encodeURIComponent(user.username)}/follow`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ follower_id: userId })
                });

                const data = await response.json();

                if (data.success && data.action === 'unfollowed') {
                    // Animación simple antes de remover
                    article.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    article.style.opacity = '0';
                    article.style.transform = 'scale(0.95)';
                    
                    setTimeout(() => {
                        article.remove();
                        // Verificar si quedó vacía la lista
                        if (followingListContainer.querySelectorAll('.post').length === 0) {
                            followingListContainer.innerHTML = '<div class="empty">Aún no sigues a nadie. ¡Explora la plataforma y encuentra nuevos creadores!</div>';
                        }
                    }, 300);
                } else {
                    btnUnfollow.disabled = false;
                    btnUnfollow.textContent = 'Dejar de seguir';
                    alert(data.message || 'Hubo un problema al dejar de seguir al usuario.');
                }
            } catch (error) {
                console.error('Error en unfollow:', error);
                btnUnfollow.disabled = false;
                btnUnfollow.textContent = 'Dejar de seguir';
                alert('Error de conexión.');
            }
        });

        return article;
    }

    // Inicializar
    cargarListaSeguidos();
});
