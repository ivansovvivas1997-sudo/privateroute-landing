require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // evita el error SSL que da Windows al preferir IPv6

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ Falta la variable JWT_SECRET. Agrégala al archivo .env (y en Render).');
    process.exit(1);
}

const CATEGORIAS = ['Fitness', 'Arte', 'Fotografía', 'Lifestyle', 'Modelaje', 'Otro'];
const TIPOS = ['fan', 'creador'];

// Páginas desde las que se permite usar este backend.
// Si tu Live Server usa otro puerto distinto al 5500, agrégalo aquí.
const ORIGENES_PERMITIDOS = [
    'https://ivansovvivas1997-sudo.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5MB por foto
    fileFilter: (req, file, cb) => {
        cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    }
});

function subirACloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'privateroute' },
            (error, resultado) => {
                if (error) reject(error);
                else resolve(resultado);
            }
        );
        stream.end(buffer);
    });
}

const app = express();
const PORT = 3000;

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
let db;

async function conectarMongo() {
    try {
        await client.connect();
        db = client.db('privateroute');
        console.log('✅ Conectado a MongoDB correctamente');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
    }
}

conectarMongo();

app.use(cors({
    origin: function (origen, callback) {
        callback(null, !origen || ORIGENES_PERMITIDOS.includes(origen));
    }
}));
app.use(express.json({ limit: '100kb' }));

// ---------- Ayudas ----------

const esTexto = (valor) => typeof valor === 'string';

// Crea el "pase" firmado que el navegador enviará en cada acción protegida
function firmarSesion(usuario) {
    return jwt.sign(
        {
            id: String(usuario._id),
            correo: usuario.correo,
            nombre: usuario.nombre,
            tipo: usuario.tipo
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Verifica el pase. Si no es válido, corta la petición aquí.
function requerirSesion(req, res, next) {
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).send('Necesitas iniciar sesión.');
    }

    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).send('Tu sesión expiró. Inicia sesión de nuevo.');
    }
}

function soloCreadores(req, res, next) {
    if (req.usuario.tipo !== 'creador') {
        return res.status(403).send('Solo las cuentas de creador pueden hacer esto.');
    }
    next();
}

// ---------- Rutas públicas ----------

app.get('/', (req, res) => {
    res.send('¡El servidor de PrivateRoute está funcionando!');
});

app.post('/registro', async (req, res) => {
    try {
        const { nombre, correo, contrasena, tipo, mayorDeEdad, categoria, descripcion } = req.body;

        if (!esTexto(nombre) || !esTexto(correo) || !esTexto(contrasena)) {
            return res.status(400).send('Faltan datos obligatorios (nombre, correo o contraseña).');
        }

        const nombreLimpio = nombre.trim();
        const correoLimpio = correo.trim();

        if (!nombreLimpio || !correoLimpio || !contrasena) {
            return res.status(400).send('Faltan datos obligatorios (nombre, correo o contraseña).');
        }

        if (nombreLimpio.length > 40) {
            return res.status(400).send('El nombre de usuario no puede tener más de 40 caracteres.');
        }

        if (!/^\S+@\S+\.\S+$/.test(correoLimpio)) {
            return res.status(400).send('El correo no es válido.');
        }

        if (contrasena.length < 8) {
            return res.status(400).send('La contraseña debe tener al menos 8 caracteres.');
        }

        if (contrasena.length > 72) {
            return res.status(400).send('La contraseña no puede tener más de 72 caracteres.');
        }

        if (!TIPOS.includes(tipo)) {
            return res.status(400).send('Tipo de cuenta no válido.');
        }

        if (mayorDeEdad !== true) {
            return res.status(400).send('Debes confirmar que eres mayor de 18 años para registrarte.');
        }

        const usuarioExistente = await db.collection('usuarios').findOne({ correo: correoLimpio });
        if (usuarioExistente) {
            return res.status(409).send('Ya existe una cuenta registrada con ese correo.');
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
        const esCreador = tipo === 'creador';

        const nuevoUsuario = {
            nombre: nombreLimpio,
            correo: correoLimpio,
            contrasena: contrasenaEncriptada,
            tipo,
            categoria: esCreador ? (CATEGORIAS.includes(categoria) ? categoria : 'Otro') : null,
            descripcion: esCreador ? (esTexto(descripcion) ? descripcion.trim().slice(0, 300) : '') : null,
            fechaRegistro: new Date()
        };

        const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
        console.log('Usuario guardado con ID:', resultado.insertedId);
        res.send('¡Cuenta creada y guardada correctamente!');
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        res.status(500).send('Error al guardar el registro.');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!esTexto(correo) || !esTexto(contrasena)) {
            return res.status(400).send('Escribe tu correo y tu contraseña.');
        }

        const usuario = await db.collection('usuarios').findOne({ correo: correo.trim() });

        if (!usuario) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        res.json({
            token: firmarSesion(usuario),
            nombre: usuario.nombre,
            tipo: usuario.tipo,
            correo: usuario.correo
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).send('Error al iniciar sesión.');
    }
});

// Lista pública de creadores (sin correo ni contraseña)
app.get('/creadores', async (req, res) => {
    try {
        const creadores = await db.collection('usuarios')
            .find({ tipo: 'creador' })
            .project({ contrasena: 0, correo: 0 })
            .toArray();

        res.json(creadores);
    } catch (error) {
        console.error('Error al obtener creadores:', error);
        res.status(500).send('Error al obtener los creadores.');
    }
});

// Perfil público de un creador
app.get('/creadores/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(404).send('Creador no encontrado.');
        }

        const creador = await db.collection('usuarios').findOne(
            { _id: new ObjectId(req.params.id), tipo: 'creador' },
            { projection: { contrasena: 0, correo: 0 } }
        );

        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        res.json(creador);
    } catch (error) {
        console.error('Error al obtener creador:', error);
        res.status(500).send('Error al obtener el creador.');
    }
});

// Fotos públicas de un creador
app.get('/creadores/:id/contenido', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(404).send('Creador no encontrado.');
        }

        const creador = await db.collection('usuarios').findOne({
            _id: new ObjectId(req.params.id),
            tipo: 'creador'
        });

        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        const contenido = await db.collection('contenido')
            .find({ correoCreador: creador.correo })
            .sort({ fecha: -1 })
            .project({ _id: 0, url: 1, fecha: 1 })
            .toArray();

        res.json(contenido);
    } catch (error) {
        console.error('Error al obtener contenido:', error);
        res.status(500).send('Error al obtener el contenido.');
    }
});

// ---------- Rutas protegidas (hay que haber iniciado sesión) ----------

app.get('/mi-perfil', requerirSesion, soloCreadores, async (req, res) => {
    try {
        const creador = await db.collection('usuarios').findOne(
            { correo: req.usuario.correo, tipo: 'creador' },
            { projection: { contrasena: 0 } }
        );

        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        res.json(creador);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).send('Error al obtener el perfil.');
    }
});

app.put('/mi-perfil', requerirSesion, soloCreadores, async (req, res) => {
    try {
        const { categoria, descripcion } = req.body;

        if (!CATEGORIAS.includes(categoria)) {
            return res.status(400).send('Categoría no válida.');
        }

        const descripcionLimpia = esTexto(descripcion) ? descripcion.trim().slice(0, 300) : '';

        const resultado = await db.collection('usuarios').updateOne(
            { correo: req.usuario.correo, tipo: 'creador' },
            { $set: { categoria, descripcion: descripcionLimpia } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).send('No se encontró el creador.');
        }

        res.send('Perfil actualizado correctamente.');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).send('Error al actualizar el perfil.');
    }
});

app.get('/mi-contenido', requerirSesion, soloCreadores, async (req, res) => {
    try {
        const contenido = await db.collection('contenido')
            .find({ correoCreador: req.usuario.correo })
            .sort({ fecha: -1 })
            .project({ _id: 0, url: 1, fecha: 1 })
            .toArray();

        res.json(contenido);
    } catch (error) {
        console.error('Error al obtener contenido:', error);
        res.status(500).send('Error al obtener el contenido.');
    }
});

app.post('/contenido', requerirSesion, soloCreadores, (req, res) => {
    upload.single('imagen')(req, res, async (errorSubida) => {
        if (errorSubida) {
            const mensaje = errorSubida.code === 'LIMIT_FILE_SIZE'
                ? 'La foto pesa más de 5 MB.'
                : 'No se pudo leer la imagen.';
            return res.status(400).send(mensaje);
        }

        if (!req.file) {
            return res.status(400).send('Sube una foto en formato JPG, PNG o WebP.');
        }

        try {
            const resultado = await subirACloudinary(req.file.buffer);

            await db.collection('contenido').insertOne({
                correoCreador: req.usuario.correo,
                url: resultado.secure_url,
                fecha: new Date()
            });

            res.send('¡Contenido subido correctamente!');
        } catch (error) {
            console.error('Error al subir contenido:', error);
            res.status(500).send('Error al subir el contenido.');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});