// script-perfil.js - Perfil público de un creador en PrivateRoute

// Si la página corre en local usa el backend local; si no, el de Render
const API_URL = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

const seccionPerfil = document.getElementById('perfil-creador');
const seccionGaleria = document.getElementById('galeria-perfil');

// --- Barra de navegación según haya sesión o no ---
function ajustarNavegacion() {
    const token = localStorage.getItem('tokenUsuario');
    const enlaceLogin = document.getElementById('nav-login');
    const enlaceRegistro = document.getElementById('nav-registro');
    if (!token || !enlaceLogin || !enlaceRegistro) return;

    enlaceLogin.textContent = 'Mi panel';
    enlaceLogin.href = 'panel.html';

    enlaceRegistro.textContent = 'Cerrar sesión';
    enlaceRegistro.href = '#';
    enlaceRegistro.addEventListener('click', function (evento) {
        evento.preventDefault();
        localStorage.removeItem('tokenUsuario');
        localStorage.removeItem('nombreUsuario');
        localStorage.removeItem('tipoUsuario');
        window.location.href = 'index.html';
    });
}

// --- Muestra un mensaje dentro de una sección ---
function mostrarMensaje(contenedor, texto) {
    contenedor.textContent = '';
    const parrafo = document.createElement('p');
    parrafo.className = 'cargando-creadores';
    parrafo.textContent = texto;
    contenedor.appendChild(parrafo);
}

// --- Visor para ver una foto en grande ---
const visor = document.createElement('div');
visor.className = 'visor-imagen';

const botonCerrarVisor = document.createElement('button');
botonCerrarVisor.className = 'visor-cerrar';
botonCerrarVisor.textContent = '×';
botonCerrarVisor.setAttribute('aria-label', 'Cerrar');

const imagenVisor = document.createElement('img');
imagenVisor.alt = 'Foto en grande';

visor.appendChild(botonCerrarVisor);
visor.appendChild(imagenVisor);
document.body.appendChild(visor);

function abrirVisor(direccion) {
    imagenVisor.src = direccion;
    visor.classList.add('abierto');
    document.body.style.overflow = 'hidden'; // evita que la página se mueva detrás
}

function cerrarVisor() {
    visor.classList.remove('abierto');
    imagenVisor.src = '';
    document.body.style.overflow = '';
}

// Se cierra con la X, tocando el fondo oscuro o con la tecla Esc
botonCerrarVisor.addEventListener('click', cerrarVisor);
visor.addEventListener('click', function (evento) {
    if (evento.target === visor) cerrarVisor();
});
document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') cerrarVisor();
});

// --- Datos del creador ---
function mostrarPerfil(creador) {
    seccionPerfil.textContent = '';

    const nombre = document.createElement('h1');
    nombre.className = 'perfil-nombre';
    nombre.textContent = creador.nombre || 'Creador';
    seccionPerfil.appendChild(nombre);

    if (creador.categoria) {
        const categoria = document.createElement('p');
        categoria.className = 'perfil-categoria';
        categoria.textContent = creador.categoria;
        seccionPerfil.appendChild(categoria);
    }

    const descripcion = document.createElement('p');
    descripcion.className = 'perfil-descripcion';
    descripcion.textContent = creador.descripcion || 'Este creador todavía no ha escrito una descripción.';
    seccionPerfil.appendChild(descripcion);

    const boton = document.createElement('button');
    boton.className = 'btn-registro btn-suscribirse';
    boton.textContent = 'Suscribirse';
    seccionPerfil.appendChild(boton);

    const aviso = document.createElement('p');
    aviso.className = 'perfil-aviso';
    seccionPerfil.appendChild(aviso);

    boton.addEventListener('click', function () {
        aviso.textContent = 'Los pagos y suscripciones todavía no están disponibles — ¡muy pronto!';
    });

    document.title = (creador.nombre || 'Creador') + ' - PrivateRoute';
}

// --- Galería de fotos ---
function mostrarGaleria(fotos) {
    seccionGaleria.textContent = '';

    if (fotos.length === 0) {
        mostrarMensaje(seccionGaleria, 'Este creador todavía no ha subido contenido.');
        return;
    }

    fotos.forEach(function (foto) {
        const direccion = foto.url || foto.urlImagen || foto.imagen || foto.secure_url;
        if (!direccion) return;

        const imagen = document.createElement('img');
        imagen.src = direccion;
        imagen.alt = 'Foto del creador';
        imagen.loading = 'lazy';
        imagen.addEventListener('click', function () {
            abrirVisor(direccion);
        });
        seccionGaleria.appendChild(imagen);
    });
}

// --- Carga todo desde el servidor ---
async function cargarPerfil() {
    const id = new URLSearchParams(location.search).get('id');

    if (!id) {
        mostrarMensaje(seccionPerfil, 'No se indicó ningún creador. Vuelve a la página principal y elige uno.');
        return;
    }

    try {
        const respuesta = await fetch(API_URL + '/creadores/' + encodeURIComponent(id));
        if (!respuesta.ok) {
            mostrarMensaje(seccionPerfil, 'No encontramos este creador.');
            return;
        }
        const datos = await respuesta.json();
        mostrarPerfil(datos.creador || datos);
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        mostrarMensaje(seccionPerfil, 'No se pudo conectar con el servidor. Espera un minuto y recarga la página.');
        return;
    }

    try {
        const respuesta = await fetch(API_URL + '/creadores/' + encodeURIComponent(id) + '/contenido');
        if (!respuesta.ok) {
            mostrarMensaje(seccionGaleria, 'No se pudo cargar el contenido.');
            return;
        }
        const datos = await respuesta.json();
        const fotos = Array.isArray(datos) ? datos : (datos.contenido || []);
        mostrarGaleria(fotos);
    } catch (error) {
        console.error('Error al cargar el contenido:', error);
        mostrarMensaje(seccionGaleria, 'No se pudo cargar el contenido.');
    }
}

ajustarNavegacion();
cargarPerfil();

// FIN DE script-perfil.js