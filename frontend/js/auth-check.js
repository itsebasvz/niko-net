/* auth-check.js — Guarda de seguridad para páginas protegidas */

const sesionActiva = localStorage.getItem('nikonet_session');

// Si NO hay sesión activa, redireccionamos al login silenciosamente
if (sesionActiva !== 'activa') {
    window.location.href = 'login.html';
}

// Función para cerrar sesión (conectada al botón de logout en el nav rail)
function cerrarSesion() {
    localStorage.removeItem('nikonet_session');
    localStorage.removeItem('nikonet_token');
    localStorage.removeItem('nikonet_userId');
    localStorage.removeItem('nikonet_displayName');
    localStorage.removeItem('nikonet_username');
    window.location.href = 'login.html';
}
