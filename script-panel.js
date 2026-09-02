const nombreUsuario = localStorage.getItem('nombreUsuario');
const tipoUsuario = localStorage.getItem('tipoUsuario');

if (!nombreUsuario) {
    window.location.href = 'login.html';
} else {
    document.getElementById('saludo-usuario').textContent = `Hola, ${nombreUsuario} 👋`;

    if (tipoUsuario === 'creador') {
        document.getElementById('subtitulo-panel').textContent = 'Este es tu espacio para gestionar tu contenido.';
        document.getElementById('panel-creador').style.display = 'block';
    } else {
        document.getElementById('subtitulo-panel').textContent = 'Explorá y disfrutá de contenido exclusivo.';
        document.getElementById('panel-fan').style.display = 'block';
    }
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('tipoUsuario');
    window.location.href = 'index.html';
});