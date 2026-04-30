// js/auth-check.js
// Este script se ejecuta INMEDIATAMENTE al cargar la página

const sesionActiva = localStorage.getItem("nikonet_session");

// Si NO hay sesión activa, lo pateamos de vuelta al login
if (sesionActiva !== "activa") {
    alert("Acceso denegado. Por favor inicia sesión primero.");
    window.location.href = "login.html"; // Redirección de seguridad
}

// Función para cerrar sesión (la puedes conectar a un botón en tu dashboard)
function cerrarSesion() {
    localStorage.removeItem("nikonet_session"); // Rompemos el Flip-Flop
    window.location.href = "login.html"; // Lo mandamos afuera
}