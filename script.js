const botonExplorar = document.querySelector('.btn-explorar');

botonExplorar.addEventListener('click', function() {
    document.querySelector('.creadores').scrollIntoView({ behavior: 'smooth' });
});

// Si ya hay una sesión activa, cambiamos los botones del nav
// para reflejar eso, en vez de mostrar "Iniciar sesión"/"Registrarse"
// como si nadie hubiera entrado (esto es lo que causaba que pareciera
// que la sesión se cerraba al usar el botón "atrás" del navegador).
const nombreUsuario = localStorage.getItem('nombreUsuario');

if (nombreUsuario) {
    const navLogin = document.getElementById('nav-login');
    const navRegistro = document.getElementById('nav-registro');

    navLogin.textContent = 'Mi panel';
    navLogin.href = 'panel.html';

    navRegistro.textContent = 'Cerrar sesión';
    navRegistro.href = '#';
    navRegistro.addEventListener('click', function(evento) {
        evento.preventDefault();
        localStorage.removeItem('nombreUsuario');
        localStorage.removeItem('tipoUsuario');
        window.location.reload();
    });
}