// Si abres la página con Live Server (en tu computadora), habla con tu backend local.
// Si la abres desde GitHub Pages, habla con el backend de Render.
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

const botonExplorar = document.querySelector('.btn-explorar');

botonExplorar.addEventListener('click', function() {
    document.querySelector('.creadores').scrollIntoView({ behavior: 'smooth' });
});

// Si ya hay una sesión activa, cambiamos los botones del nav
// para mostrar "Mi panel" y "Cerrar sesión".
const nombreUsuario = localStorage.getItem('nombreUsuario');
const tokenUsuario = localStorage.getItem('tokenUsuario');

if (nombreUsuario && tokenUsuario) {
    const navLogin = document.getElementById('nav-login');
    const navRegistro = document.getElementById('nav-registro');

    navLogin.textContent = 'Mi panel';
    navLogin.href = 'panel.html';

    navRegistro.textContent = 'Cerrar sesión';
    navRegistro.href = '#';
    navRegistro.addEventListener('click', function(evento) {
        evento.preventDefault();
        localStorage.removeItem('tokenUsuario');
        localStorage.removeItem('nombreUsuario');
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('correoUsuario');
        window.location.reload();
    });
}

// Arma la tarjeta de un creador. Los datos se insertan como TEXTO (textContent),
// nunca como código HTML, para que nadie pueda colar código malicioso.
function crearTarjetaCreador(creador) {
    const inicial = creador.nombre ? creador.nombre.charAt(0).toUpperCase() : '?';

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-creador';
    tarjeta.style.cursor = 'pointer';

    const portada = document.createElement('div');
    portada.className = 'portada';

    const info = document.createElement('div');
    info.className = 'info-creador';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = inicial;

    const nombre = document.createElement('h3');
    nombre.textContent = creador.nombre;

    const categoria = document.createElement('p');
    categoria.className = 'categoria';
    categoria.textContent = creador.categoria || 'Sin categoría';

    const bio = document.createElement('p');
    bio.className = 'bio-creador';
    bio.textContent = creador.descripcion || 'Este creador todavía no agregó una descripción.';

    info.append(avatar, nombre, categoria, bio);
    tarjeta.append(portada, info);

    tarjeta.addEventListener('click', function() {
        window.location.href = `perfil.html?id=${encodeURIComponent(creador._id)}`;
    });

    return tarjeta;
}

function mostrarMensaje(contenedor, texto) {
    contenedor.innerHTML = '';
    const mensaje = document.createElement('p');
    mensaje.className = 'cargando-creadores';
    mensaje.textContent = texto;
    contenedor.appendChild(mensaje);
}

// Cargamos los creadores reales desde el backend
const gridCreadores = document.getElementById('grid-creadores');

if (gridCreadores) {
    fetch(`${API}/creadores`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los creadores.');
            }
            return respuesta.json();
        })
        .then(creadores => {
            if (creadores.length === 0) {
                mostrarMensaje(gridCreadores, 'Todavía no hay creadores registrados. ¡Sé el primero!');
                return;
            }

            gridCreadores.innerHTML = '';
            creadores.forEach(creador => {
                gridCreadores.appendChild(crearTarjetaCreador(creador));
            });
        })
        .catch(error => {
            mostrarMensaje(gridCreadores, 'No se pudieron cargar los creadores. Intenta de nuevo más tarde.');
            console.error(error);
        });
}