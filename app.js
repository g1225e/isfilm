const SESSION_KEY = 'cinefilo_usuario_activo';
const usuarioActual = localStorage.getItem(SESSION_KEY);

// Guard de Navegación
if (!usuarioActual) {
    window.location.href = 'login.html';
}

const STORAGE_KEY = `cinefilo_peliculas_db_${usuarioActual}`;
let modalEstadisticasBS = null;

document.addEventListener('DOMContentLoaded', () => {
    const labelUser = document.getElementById('nombreUsuarioActivo');
    if (labelUser) labelUser.innerText = usuarioActual.toUpperCase();

    modalEstadisticasBS = new bootstrap.Modal(document.getElementById('modalEstadisticas'));
    document.getElementById('fechaVista').valueAsDate = new Date();
    document.getElementById('formularioPelicula').addEventListener('submit', guardarPelicula);
    cargarTabla();
});

function cerrarSesion() {
    if (confirm('¿Deseas cerrar tu sesión?')) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }
}

// --- PERSISTENCIA LOCALSTORAGE ---
function obtenerPeliculas() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function guardarPeliculasEnStorage(peliculas) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(peliculas));
}

// --- OPERACIONES CRUD ---
function guardarPelicula(e) {
    e.preventDefault();
    const id = document.getElementById('peliculaId').value;
    const peliculas = obtenerPeliculas();

    const nuevaPelicula = {
        id: id ? Number(id) : Date.now(),
        titulo: document.getElementById('titulo').value.trim(),
        anio: Number(document.getElementById('anio').value) || null,
        director: document.getElementById('director').value.trim(),
        generoPrincipal: document.getElementById('generoPrincipal').value.trim(),
        generosSecundarios: document.getElementById('generosSecundarios').value.trim(),
        categoria: document.getElementById('categoria').value,
        fechaVista: document.getElementById('fechaVista').value,
        calificacion: Number(document.getElementById('calificacion').value),
        esRecomendada: document.getElementById('esRecomendada').checked,
        quienRecomendo: document.getElementById('quienRecomendo').value.trim(),
        laRecomendaria: document.getElementById('laRecomendaria').checked,
        reseniaNotas: document.getElementById('reseniaNotas').value.trim(),
        ultimaActualizacion: new Date().toISOString()
    };

    if (id) {
        const index = peliculas.findIndex(p => p.id === Number(id));
        if (index !== -1) peliculas[index] = nuevaPelicula;
    } else {
        peliculas.push(nuevaPelicula);
    }

    guardarPeliculasEnStorage(peliculas);
    limpiarFormulario();
    cargarTabla();
}

function cargarTabla(lista = obtenerPeliculas()) {
    const cuerpo = document.getElementById('cuerpoTabla');
    const contador = document.getElementById('contadorPeliculas');
    cuerpo.innerHTML = '';
    
    if (contador) contador.innerText = `${lista.length} películas`;

    if (lista.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-film fs-1 d-block mb-2"></i>No hay películas en tu catálogo.</td></tr>`;
        return;
    }

    lista.forEach(p => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>
                <div class="fw-bold fs-6">${p.titulo}</div>
                <div class="small text-muted">${p.anio || 'Año N/A'}</div>
            </td>
            <td>${p.director || '<span class="text-muted">-</span>'}</td>
            <td><span class="badge bg-dark border border-secondary">${p.generoPrincipal || 'N/A'}</span></td>
            <td><span class="badge badge-categoria">${p.categoria}</span></td>
            <td><span class="badge-calificacion">★ ${p.calificacion}/10</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light me-1 border-0" onclick="editarPelicula(${p.id})"><i class="bi bi-pencil-fill text-warning"></i></button>
                <button class="btn btn-sm btn-outline-light border-0" onclick="eliminarPelicula(${p.id})"><i class="bi bi-trash-fill text-danger"></i></button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

function editarPelicula(id) {
    const peliculas = obtenerPeliculas();
    const p = peliculas.find(item => item.id === id);
    if (!p) return;

    document.getElementById('peliculaId').value = p.id;
    document.getElementById('titulo').value = p.titulo;
    document.getElementById('anio').value = p.anio || '';
    document.getElementById('director').value = p.director || '';
    document.getElementById('generoPrincipal').value = p.generoPrincipal || '';
    document.getElementById('generosSecundarios').value = p.generosSecundarios || '';
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('fechaVista').value = p.fechaVista || '';
    document.getElementById('calificacion').value = p.calificacion;
    document.getElementById('valCalificacion').innerText = p.calificacion;
    document.getElementById('esRecomendada').checked = p.esRecomendada;
    document.getElementById('quienRecomendo').disabled = !p.esRecomendada;
    document.getElementById('quienRecomendo').value = p.quienRecomendo || '';
    document.getElementById('laRecomendaria').checked = p.laRecomendaria;
    document.getElementById('reseniaNotas').value = p.reseniaNotas || '';
}

function eliminarPelicula(id) {
    if (confirm('¿Seguro que deseas eliminar esta película?')) {
        let peliculas = obtenerPeliculas();
        peliculas = peliculas.filter(p => p.id !== id);
        guardarPeliculasEnStorage(peliculas);
        cargarTabla();
    }
}

function filtrarTabla() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const peliculas = obtenerPeliculas();
    const filtradas = peliculas.filter(p => 
        p.titulo.toLowerCase().includes(texto) ||
        (p.director && p.director.toLowerCase().includes(texto)) ||
        (p.generoPrincipal && p.generoPrincipal.toLowerCase().includes(texto))
    );
    cargarTabla(filtradas);
}

function toggleQuienRecomendo() {
    const chk = document.getElementById('esRecomendada');
    const txt = document.getElementById('quienRecomendo');
    txt.disabled = !chk.checked;
    if (!chk.checked) txt.value = '';
}

function limpiarFormulario() {
    document.getElementById('formularioPelicula').reset();
    document.getElementById('peliculaId').value = '';
    document.getElementById('valCalificacion').innerText = '5';
    document.getElementById('quienRecomendo').disabled = true;
    document.getElementById('fechaVista').valueAsDate = new Date();
}

// --- ESTADÍSTICAS ---
function abrirModalEstadisticas() {
    const peliculas = obtenerPeliculas();
    const contenedor = document.getElementById('contenidoEstadisticas');

    if (peliculas.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center py-3">No hay suficientes datos para generar estadísticas.</p>`;
        modalEstadisticasBS.show();
        return;
    }

    const total = peliculas.length;
    const promedio = (peliculas.reduce((acc, p) => acc + p.calificacion, 0) / total).toFixed(2);
    const recomendadas = peliculas.filter(p => p.laRecomendaria).length;

    const directores = {};
    peliculas.forEach(p => { if (p.director) directores[p.director] = (directores[p.director] || 0) + 1; });
    const topDirector = Object.entries(directores).sort((a, b) => b[1] - a[1])[0];

    contenedor.innerHTML = `
        <ul class="list-group list-group-flush bg-transparent">
            <li class="list-group-item bg-transparent text-white border-secondary"><strong>Total películas vistas:</strong> ${total}</li>
            <li class="list-group-item bg-transparent text-white border-secondary"><strong>Calificación promedio:</strong> ★ ${promedio} / 10</li>
            <li class="list-group-item bg-transparent text-white border-secondary"><strong>Películas que recomendarías:</strong> ${recomendadas} (${((recomendadas/total)*100).toFixed(1)}%)</li>
            <li class="list-group-item bg-transparent text-white border-secondary"><strong>Director más registrado:</strong> ${topDirector ? `${topDirector[0]} (${topDirector[1]} película/s)` : 'N/A'}</li>
        </ul>
    `;
    modalEstadisticasBS.show();
}

// --- EXPORTACIÓN ---
function descargarArchivo(contenido, nombre, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarJSON() {
    const data = JSON.stringify(obtenerPeliculas(), null, 2);
    descargarArchivo(data, `catalogo_${usuarioActual}.json`, 'application/json');
}

function exportarCSV() {
    const peliculas = obtenerPeliculas();
    if (peliculas.length === 0) return alert('No hay datos para exportar.');
    
    let csv = 'ID;Título;Año;Director;Género Principal;Categoría;Calificación;Fecha Vista\n';
    peliculas.forEach(p => {
        csv += `${p.id};"${p.titulo}";${p.anio || ''};"${p.director || ''}";"${p.generoPrincipal || ''}";"${p.categoria}";${p.calificacion};"${p.fechaVista || ''}"\n`;
    });
    
    descargarArchivo(csv, `catalogo_${usuarioActual}.csv`, 'text/csv');
}