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
        const res = await fetch(API_URL);
        if (!res.ok) return;

        const json = await res.json();
        const data = json.data;

        // Renderizado de textos
        document.getElementById('lbl-username').innerText = `@${data.username}`;
        document.getElementById('lbl-nombre').innerText = data.display_name || 'Sin nombre';
        document.getElementById('lbl-bio').innerText = data.bio || 'Sin biografía';

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

cargarPerfil();