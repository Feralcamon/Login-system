const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use((req, res, next) => {
    console.log('Sesión actual:', req.session);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'tu_secreto_aqui_mas_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '18163457',
    database: 'login',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    console.log('Sesión en /dashboard:', req.session);
    if (!req.session.loggedin) {
      console.log('Redirigiendo al login');  
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.post('/login', async (req, res) => {
    console.log('Datos recibidos:', req.body);
    const { usuario, clave } = req.body;
    
    if (!usuario || !clave) {
        return res.status(400).json({ 
            success: false, 
            message: 'Por favor complete todos los campos' 
        });
    }
    
    try {
        const [results] = await connection.query(
            "SELECT * FROM usuarios WHERE usuario = ? AND clave = ?", 
            [usuario, clave]
        );
        
        console.log('Resultados de la consulta:', results);

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.usuario = usuario;
            return res.json({ 
                success: true, 
                message: 'Inicio de sesión correcto' 
            });
        }
        
        console.log('Resultados de la consulta:', results); 

        res.status(401).json({ 
            success: false, 
            message: 'Usuario o contraseña incorrectos' 
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

app.get('/logout', (req, res) => {
    console.log('Sesión antes de destruir:', req.session);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al destruir sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        console.log('Sesión destruida exitosamente');
        res.redirect('/');
    });
});

async function testConnection() {
    try {
        const conn = await connection.getConnection();
        await conn.query("SELECT 1");
        conn.release();
        console.log('Conexión a MySQL establecida correctamente');
    } catch (err) {
        console.error('Error conectando a MySQL:', err);
    }
}

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    testConnection();
});