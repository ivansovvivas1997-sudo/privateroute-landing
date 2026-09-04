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

// Cargamos los creadores reales desde el backend y armamos las tarjetas
// dinámicamente, en vez de mostrar los tres datos inventados de antes.
const gridCreadores = document.getElementById('grid-creadores');

if (gridCreadores) {
    fetch('https://privateroute-backend.onrender.com/creadores')
        .then(respuesta => respuesta.json())
        .then(creadores => {
            if (creadores.length === 0) {
                gridCreadores.innerHTML = '<p class="cargando-creadores">Todavía no hay creadores registrados. ¡Sé el primero!</p>';
                return;
            }

            gridCreadores.innerHTML = '';

            creadores.forEach(creador => {
                const inicial = creador.nombre ? creador.nombre.charAt(0).toUpperCase() : '?';
                const descripcion = creador.descripcion || 'Este creador todavía no agregó una descripción.';

                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-creador';
                tarjeta.innerHTML = `
                    <div class="portada"></div>
                    <div class="info-creador">
                        <div class="avatar">${inicial}</div>
                        <h3>${creador.nombre}</h3>
                        <p class="categoria">${creador.categoria || 'Sin categoría'}</p>
                        <p class="bio-creador">${descripcion}</p>
                    </div>
                `;
                gridCreadores.appendChild(tarjeta);
            });
        })
        .catch(error => {
            gridCreadores.innerHTML = '<p class="cargando-creadores">No se pudieron cargar los creadores. Intenta de nuevo más tarde.</p>';
            console.error(error);
        });
}