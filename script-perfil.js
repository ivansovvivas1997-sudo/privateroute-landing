// Si abres la página con Live Server (en tu computadora), habla con tu backend local.
// Si la abres desde GitHub Pages, habla con el backend de Render.
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

// Leemos el ID del creador desde la URL (ej: perfil.html?id=abc123)
const parametros = new URLSearchParams(window.location.search);
const idCreador = parametros.get('id');
const contenedorPerfil = document.getElementById('perfil-creador');
const galeria = document.getElementById('galeria-perfil');

// Si ya hay una sesión activa, cambiamos el nav igual que en las demás páginas
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

function mostrarMensaje(texto) {
    contenedorPerfil.innerHTML = '';
    const mensaje = document.createElement('p');
    mensaje.className = 'cargando-creadores';
    mensaje.textContent = texto;
    contenedorPerfil.appendChild(mensaje);
}

// Arma el perfil con los datos como TEXTO (textContent), nunca como código HTML.
function mostrarPerfil(creador) {
    const inicial = creador.nombre ? creador.nombre.charAt(0).toUpperCase() : '?';

    document.title = `${creador.nombre} - PrivateRoute`;
    contenedorPerfil.innerHTML = '';

    const portada = document.createElement('div');
    portada.className = 'portada-perfil';

    const avatar = document.createElement('div');
    avatar.className = 'avatar-perfil';
    avatar.textContent = inicial;

    const titulo = document.createElement('h1');
    titulo.textContent = creador.nombre;

    const categoria = document.createElement('p');
    categoria.className = 'categoria-perfil';
    categoria.textContent = creador.categoria || 'Sin categoría';

    const bio = document.createElement('p');
    bio.className = 'bio-perfil';
    bio.textContent = creador.descripcion || 'Este creador todavía no agregó una descripción.';

    const boton = document.createElement('button');
    boton.className = 'btn-suscribir';
    boton.textContent = 'Suscribirse';
    boton.addEventListener('click', function() {
        alert('Las suscripciones todavía no están disponibles. ¡Pronto vamos a habilitar los pagos!');
    });

    const nota = document.createElement('p');
    nota.className = 'nota-perfil';
    nota.textContent = 'Los pagos y suscripciones todavía no están disponibles — ¡muy pronto!';

    contenedorPerfil.append(portada, avatar, titulo, categoria, bio, boton, nota);
}

function cargarGaleria() {
    fetch(`${API}/creadores/${encodeURIComponent(idCreador)}/contenido`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error('No se pudo cargar la galería.');
            }
            return respuesta.json();
        })
        .then(lista => {
            lista.forEach(item => {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = 'Foto del creador';
                img.className = 'miniatura-contenido';
                galeria.appendChild(img);
            });
        })
        .catch(error => console.error('No se pudo cargar la galería:', error));
}

if (!idCreador) {
    mostrarMensaje('No se especificó ningún creador.');
} else {
    fetch(`${API}/creadores/${encodeURIComponent(idCreador)}`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error('No se pudo encontrar este creador.');
            }
            return respuesta.json();
        })
        .then(creador => {
            mostrarPerfil(creador);
            cargarGaleria();
        })
        .catch(error => {
            mostrarMensaje('No se pudo cargar este perfil. Puede que el creador ya no exista.');
            console.error(error);
        });
}