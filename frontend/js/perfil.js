// Extraemos el 'username' de la URL (ej. perfil.html?user=AngelV)
const urlParams = new URLSearchParams(window.location.search);
let usernameDeLaURL = urlParams.get('user');

// Si no hay usuario en la URL, intentar cargar el usuario logueado
if (!usernameDeLaURL) {
    usernameDeLaURL = localStorage.getItem('nikonet_username');
    
    // Si tampoco hay usuario logueado, redirigir al login
    if (!usernameDeLaURL) {
        alert("No hay usuario especificado ni sesión activa");
        window.location.href = 'login.html';
    }
}

// La API usa el username para saber qué registro buscar
const API_URL = `http://localhost:4000/api/v1/profile/${usernameDeLaURL}`;

// Función para obtener el token usando el mismo nombre que tu login.js
function getAuthToken() {
    return localStorage.getItem('nikonet_token');
}

// Función para saber si es mi propio perfil
function esMiPerfil() {
    const usuarioLogueado = localStorage.getItem('nikonet_username');
    return usuarioLogueado === usernameDeLaURL;
}

async function cargarPerfil() {
    try {
        const res = await fetch(API_URL);
        
        if (!res.ok) {
            document.getElementById('lbl-username').innerText = "Usuario no encontrado";
            return;
        }

        const json = await res.json();
        const data = json.data;

        // Asignación correcta de campos
        document.getElementById('lbl-username').innerText = data.username;
        document.getElementById('lbl-nombre').innerText = data.display_name || 'Sin nombre';
        document.getElementById('lbl-bio').innerText = data.bio || 'Sin biografía';

        // Llenamos los inputs del formulario
        document.getElementById('input-nombre').value = data.display_name || '';
        document.getElementById('input-bio').value = data.bio || '';

        // Mostrar u ocultar botón de edición según si es mi perfil
        const btnEditar = document.getElementById('btn-activar-edicion');
        if (esMiPerfil()) {
            btnEditar.style.display = 'block';
        } else {
            btnEditar.style.display = 'none';
        }
        
    } catch (err) {
        console.error("Error al conectar con la API:", err);
        document.getElementById('lbl-username').innerText = "Error de conexión";
    }
}

// Lógica de botones para alternar vistas
const btnEditar = document.getElementById('btn-activar-edicion');
if (btnEditar) {
    btnEditar.onclick = () => {
        const token = getAuthToken();
        
        if (!token) {
            alert("Debes iniciar sesión para editar tu perfil");
            window.location.href = 'login.html';
            return;
        }
        
        if (!esMiPerfil()) {
            alert("No puedes editar un perfil que no es tuyo");
            return;
        }
        
        document.getElementById('vista-perfil').style.display = 'none';
        document.getElementById('form-edicion').style.display = 'block';
    };
}

const btnCancelar = document.getElementById('btn-cancelar');
if (btnCancelar) {
    btnCancelar.onclick = () => {
        document.getElementById('vista-perfil').style.display = 'block';
        document.getElementById('form-edicion').style.display = 'none';
    };
}

// Guardar cambios (PUT)
const perfilForm = document.getElementById('perfil-form');
if (perfilForm) {
    perfilForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const token = getAuthToken();
        if (!token) {
            alert("No hay sesión activa. Inicia sesión nuevamente.");
            window.location.href = 'login.html';
            return;
        }
        
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
                // Actualizar el display_name en localStorage si cambió
                if (actualizacion.display_name !== localStorage.getItem('nikonet_displayName')) {
                    localStorage.setItem('nikonet_displayName', actualizacion.display_name);
                }
                alert("✅ ¡Perfil actualizado!");
                location.reload();
            } else if (res.status === 401) {
                alert("❌ Sesión expirada. Inicia sesión nuevamente");
                localStorage.removeItem('nikonet_token');
                localStorage.removeItem('nikonet_username');
                localStorage.removeItem('nikonet_userId');
                localStorage.removeItem('nikonet_displayName');
                window.location.href = 'login.html';
            } else if (res.status === 403) {
                alert("❌ No tienes permiso para editar este perfil");
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.message || 'No se pudo actualizar'}`);
            }
        } catch (err) {
            alert("❌ Error de conexión al servidor");
            console.error(err);
        }
    };
}

// Cargar el perfil al iniciar
cargarPerfil();