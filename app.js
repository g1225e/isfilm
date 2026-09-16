import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
    getDoc, getDocs, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAifRBdl7eQZ78kkX0NZW7bH7Ph__pfcdI",
  authDomain: "gestor-cinefilo-web.firebaseapp.com",
  projectId: "gestor-cinefilo-web",
  storageBucket: "gestor-cinefilo-web.firebasestorage.app",
  messagingSenderId: "1004373304427",
  appId: "1:1004373304427:web:e5b438395f54817613bd2e",
  measurementId: "G-X9RRQ8GCJM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioActual = null;
let peliculasCache = [];
let peliculaSeleccionadaParaRec = null;
let modalRecomendarBS, modalBuzonBS, modalEstadisticasBS;

// Verificar sesión
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    usuarioActual = user;

    // Obtener nombre de usuario
    const uDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (uDoc.exists()) {
        document.getElementById('nombreUsuarioActivo').innerText = uDoc.data().nombre.toUpperCase();
    }

    inicializarModales();
    escucharPeliculasEnTiempoReal();
    escucharRecomendacionesEnTiempoReal();
});

document.getElementById('btnCerrarSesion').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) signOut(auth);
});

// Modales Bootstrap
function inicializarModales() {
    modalRecomendarBS = new bootstrap.Modal(document.getElementById('modalRecomendar'));
    modalBuzonBS = new bootstrap.Modal(document.getElementById('modalBuzon'));
    modalEstadisticasBS = new bootstrap.Modal(document.getElementById('modalEstadisticas'));
    document.getElementById('fechaVista').valueAsDate = new Date();
    document.getElementById('formularioPelicula').addEventListener('submit', guardarPelicula);
}

// --- ESCUCHAR FIRESTORE EN TIEMPO REAL ---
function escucharPeliculasEnTiempoReal() {
    const q = query(collection(db, "peliculas"), where("uid", "==", usuarioActual.uid));
    onSnapshot(q, (snapshot) => {
        peliculasCache = [];
        snapshot.forEach(docSnap => {
            peliculasCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        cargarTabla(peliculasCache);
    });
}

function escucharRecomendacionesEnTiempoReal() {
    const q = query(collection(db, "recomendaciones"), where("paraUid", "==", usuarioActual.uid));
    onSnapshot(q, (snapshot) => {
        const badge = document.getElementById('badgeNotificaciones');
        const count = snapshot.docs.filter(d => !d.data().leida).length;
        if (count > 0) {
            badge.innerText = count;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    });
}

// --- CRUD ---
async function guardarPelicula(e) {
    e.preventDefault();
    const id = document.getElementById('peliculaId').value;

    const data = {
        uid: usuarioActual.uid,
        titulo: document.getElementById('titulo').value.trim(),
        anio: Number(document.getElementById('anio').value) || null,
        director: document.getElementById('director').value.trim(),
        generoPrincipal: document.getElementById('generoPrincipal').value.trim(),
        categoria: document.getElementById('categoria').value,
        fechaVista: document.getElementById('fechaVista').value,
        calificacion: Number(document.getElementById('calificacion').value),
        reseniaNotas: document.getElementById('reseniaNotas').value.trim()
    };

    if (id) {
        await updateDoc(doc(db, "peliculas", id), data);
    } else {
        await addDoc(collection(db, "peliculas"), data);
    }

    limpiarFormulario();
}

function cargarTabla(lista) {
    const cuerpo = document.getElementById('cuerpoTabla');
    const contador = document.getElementById('contadorPeliculas');
    cuerpo.innerHTML = '';
    
    if (contador) contador.innerText = `${lista.length} películas`;

    if (lista.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-cloud-slash fs-1 d-block mb-2"></i>No tienes películas registradas en la nube.</td></tr>`;
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
                <button class="btn btn-sm btn-outline-warning me-1 border-0" onclick="window.prepararRecomendacion('${p.id}')" title="Recomendar a un amigo"><i class="bi bi-send-fill"></i></button>
                <button class="btn btn-sm btn-outline-light me-1 border-0" onclick="window.editarPelicula('${p.id}')"><i class="bi bi-pencil-fill text-warning"></i></button>
                <button class="btn btn-sm btn-outline-light border-0" onclick="window.eliminarPelicula('${p.id}')"><i class="bi bi-trash-fill text-danger"></i></button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

window.editarPelicula = (id) => {
    const p = peliculasCache.find(item => item.id === id);
    if (!p) return;

    document.getElementById('peliculaId').value = p.id;
    document.getElementById('titulo').value = p.titulo;
    document.getElementById('anio').value = p.anio || '';
    document.getElementById('director').value = p.director || '';
    document.getElementById('generoPrincipal').value = p.generoPrincipal || '';
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('fechaVista').value = p.fechaVista || '';
    document.getElementById('calificacion').value = p.calificacion;
    document.getElementById('valCalificacion').innerText = p.calificacion;
    document.getElementById('reseniaNotas').value = p.reseniaNotas || '';
};

window.eliminarPelicula = async (id) => {
    if (confirm('¿Eliminar esta película de la nube?')) {
        await deleteDoc(doc(db, "peliculas", id));
    }
};

window.filtrarTabla = () => {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtradas = peliculasCache.filter(p => 
        p.titulo.toLowerCase().includes(texto) ||
        (p.director && p.director.toLowerCase().includes(texto))
    );
    cargarTabla(filtradas);
};

window.limpiarFormulario = () => {
    document.getElementById('formularioPelicula').reset();
    document.getElementById('peliculaId').value = '';
    document.getElementById('valCalificacion').innerText = '5';
    document.getElementById('fechaVista').valueAsDate = new Date();
};

// --- RECOMENDACIONES ENTRE USUARIOS ---
window.prepararRecomendacion = async (peliculaId) => {
    peliculaSeleccionadaParaRec = peliculasCache.find(p => p.id === peliculaId);
    if (!peliculaSeleccionadaParaRec) return;

    document.getElementById('recTituloPelicula').innerText = peliculaSeleccionadaParaRec.titulo;

    // Cargar usuarios
    const select = document.getElementById('selectUsuarioDestino');
    select.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    querySnapshot.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.uid !== usuarioActual.uid) {
            select.innerHTML += `<option value="${u.uid}">${u.nombre} (${u.email})</option>`;
        }
    });

    if (select.children.length === 0) {
        alert("Aún no hay otros usuarios registrados para enviar recomendaciones.");
        return;
    }

    modalRecomendarBS.show();
};

window.enviarRecomendacion = async () => {
    const paraUid = document.getElementById('selectUsuarioDestino').value;
    const msg = document.getElementById('msgRecomendacion').value.trim();

    const uDoc = await getDoc(doc(db, "usuarios", usuarioActual.uid));

    await addDoc(collection(db, "recomendaciones"), {
        deUid: usuarioActual.uid,
        deNombre: uDoc.data().nombre,
        paraUid: paraUid,
        pelicula: peliculaSeleccionadaParaRec,
        mensaje: msg,
        leida: false,
        fecha: new Date().toISOString()
    });

    modalRecomendarBS.hide();
    alert('¡Recomendación enviada con éxito!');
};

window.abrirModalBuzon = async () => {
    const contenedor = document.getElementById('listaRecomendaciones');
    contenedor.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-warning" role="status"></div></div>';
    modalBuzonBS.show();

    const q = query(collection(db, "recomendaciones"), where("paraUid", "==", usuarioActual.uid));
    const snap = await getDocs(q);

    if (snap.empty) {
        contenedor.innerHTML = '<p class="text-muted text-center py-3">No has recibido recomendaciones todavía.</p>';
        return;
    }

    contenedor.innerHTML = '';
    snap.forEach(d => {
        const r = d.data();
        const card = document.createElement('div');
        card.className = "card card-cine mb-3 p-3";
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="fw-bold mb-1"><i class="bi bi-person-fill text-danger me-1"></i> ${r.deNombre} te recomendó:</h6>
                    <h5 class="text-warning fw-bold mb-2">🎬 ${r.pelicula.titulo} (${r.pelicula.anio || 'Año N/A'})</h5>
                    <p class="small text-muted mb-2">"${r.mensaje || 'Sin mensaje'}"</p>
                </div>
                <button class="btn btn-sm btn-success" onclick="window.aceptarRecomendacion('${r.pelicula.titulo}', '${r.pelicula.director || ''}', '${r.pelicula.generoPrincipal || ''}', '${r.pelicula.categoria}')"><i class="bi bi-plus-circle"></i> Agregar a mi lista</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
};

window.aceptarRecomendacion = async (titulo, director, genero, categoria) => {
    await addDoc(collection(db, "peliculas"), {
        uid: usuarioActual.uid,
        titulo: titulo,
        director: director,
        generoPrincipal: genero,
        categoria: categoria,
        calificacion: 5,
        fechaVista: new Date().toISOString().split('T')[0],
        reseniaNotas: 'Agregada desde recomendación.'
    });
    alert(`¡${titulo} agregada a tu catálogo!`);
};

// --- ESTADÍSTICAS ---
window.abrirModalEstadisticas = () => {
    const contenedor = document.getElementById('contenidoEstadisticas');
    if (peliculasCache.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center py-3">No hay datos en la nube.</p>`;
    } else {
        const total = peliculasCache.length;
        const promedio = (peliculasCache.reduce((acc, p) => acc + p.calificacion, 0) / total).toFixed(2);
        contenedor.innerHTML = `
            <ul class="list-group list-group-flush bg-transparent">
                <li class="list-group-item bg-transparent text-white border-secondary"><strong>Total películas en tu nube:</strong> ${total}</li>
                <li class="list-group-item bg-transparent text-white border-secondary"><strong>Calificación promedio:</strong> ★ ${promedio} / 10</li>
            </ul>
        `;
    }
    modalEstadisticasBS.show();
};