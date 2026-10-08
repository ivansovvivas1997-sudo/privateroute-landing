// Si abres la página con Live Server (en tu computadora), habla con tu backend local.
// Si la abres desde GitHub Pages, habla con el backend de Render.
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

const nombreUsuario = localStorage.getItem('nombreUsuario');
const tipoUsuario = localStorage.getItem('tipoUsuario');
const token = localStorage.getItem('tokenUsuario');

function borrarSesion() {
    localStorage.removeItem('tokenUsuario');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('tipoUsuario');
    localStorage.removeItem('correoUsuario');
}

// Si el servidor responde 401, la sesión no es válida o expiró
function sesionExpirada(respuesta) {
    if (respuesta.status === 401) {
        borrarSesion();
        alert('Tu sesión expiró. Inicia sesión de nuevo.');
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

if (!nombreUsuario || !token) {
    borrarSesion();
    window.location.href = 'login.html';
} else {
    document.getElementById('saludo-usuario').textContent = `Hola, ${nombreUsuario} 👋`;

    if (tipoUsuario === 'creador') {
        document.getElementById('subtitulo-panel').textContent = 'Este es tu espacio para gestionar tu contenido.';
        document.getElementById('panel-creador').style.display = 'block';

        const autorizacion = { 'Authorization': `Bearer ${token}` };

        // Datos actuales del creador, para precargar el formulario de edición
        fetch(`${API}/mi-perfil`, { headers: autorizacion })
            .then(respuesta => {
                if (sesionExpirada(respuesta)) return null;
                if (!respuesta.ok) throw new Error('No se pudo cargar el perfil.');
                return respuesta.json();
            })
            .then(creador => {
                if (!creador) return;
                document.getElementById('categoria-editar').value = creador.categoria || 'Otro';
                document.getElementById('descripcion-editar').value = creador.descripcion || '';
            })
            .catch(error => console.error('No se pudo cargar el perfil actual:', error));

        // Fotos que el creador ya subió
        const cargarContenidoPanel = function() {
            fetch(`${API}/mi-contenido`, { headers: autorizacion })
                .then(respuesta => {
                    if (sesionExpirada(respuesta)) return null;
                    if (!respuesta.ok) throw new Error('No se pudo cargar el contenido.');
                    return respuesta.json();
                })
                .then(lista => {
                    if (!lista) return;
                    const grid = document.getElementById('grid-contenido-panel');
                    grid.innerHTML = '';
                    lista.forEach(item => {
                        const img = document.createElement('img');
                        img.src = item.url;
                        img.className = 'miniatura-contenido';
                        grid.appendChild(img);
                    });
                })
                .catch(error => console.error('No se pudo cargar el contenido:', error));
        };

        cargarContenidoPanel();

        // Subir una foto
        document.getElementById('formulario-subir-contenido').addEventListener('submit', function(evento) {
            evento.preventDefault();

            const archivo = document.getElementById('imagen-contenido').files[0];
            if (!archivo) {
                alert('Elige una foto primero.');
                return;
            }

            const formData = new FormData();
            formData.append('imagen', archivo);

            fetch(`${API}/contenido`, {
                method: 'POST',
                headers: autorizacion,
                body: formData
            })
            .then(async respuesta => {
                if (sesionExpirada(respuesta)) return null;
                const mensaje = await respuesta.text();
                if (!respuesta.ok) {
                    throw new Error(mensaje);
                }
                return mensaje;
            })
            .then(mensaje => {
                if (mensaje === null) return;
                alert(mensaje);
                document.getElementById('formulario-subir-contenido').reset();
                cargarContenidoPanel();
            })
            .catch(error => {
                alert(error.message || 'Error al subir la foto.');
                console.error(error);
            });
        });

        // Guardar cambios del perfil
        document.getElementById('formulario-editar-perfil').addEventListener('submit', function(evento) {
            evento.preventDefault();

            const datos = {
                categoria: document.getElementById('categoria-editar').value,
                descripcion: document.getElementById('descripcion-editar').value
            };

            fetch(`${API}/mi-perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            })
            .then(async respuesta => {
                if (sesionExpirada(respuesta)) return null;
                const mensaje = await respuesta.text();
                if (!respuesta.ok) {
                    throw new Error(mensaje);
                }
                return mensaje;
            })
            .then(mensaje => {
                if (mensaje === null) return;
                alert(mensaje);
            })
            .catch(error => {
                alert(error.message || 'Error al guardar los cambios.');
                console.error(error);
            });
        });
    } else {
        document.getElementById('subtitulo-panel').textContent = 'Explora y disfruta de contenido exclusivo.';
        document.getElementById('panel-fan').style.display = 'block';
    }
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    borrarSesion();
    window.location.href = 'index.html';
});