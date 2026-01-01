import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import exphbs from 'express-handlebars';
import helmet from 'helmet';

// Import routes
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import folderRoutes from './routes/folders.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import shareRoutes from './routes/shares.js';
import userShareRoutes from './routes/user-shares.js';

// Import middleware
import { requireAuth } from './middleware/auth.js';

// Import socket handler
import { setupSocketIO } from './services/socketService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// View engine setup
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
      eq: (a, b) => a === b,
      neq: (a, b) => a !== b,
      substr: (str, start, len) => {
        if (!str) return '';
        return str.substring(start, start + len);
      },
      formatBytes: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      },
      formatDate: (date) => {
        return new Date(date).toLocaleString('pt-BR');
      }
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views/pages'));

// Security middleware - Helmet.js
// Configuração de segurança para proteger contra vulnerabilidades comuns
// CSP mais permissivo para permitir funcionamento da aplicação
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP por enquanto para evitar problemas com a interface
  crossOriginEmbedderPolicy: false, // Necessário para Socket.IO
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos de diferentes origens
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' }, // Proteção contra clickjacking
  noSniff: true, // Prevenir MIME type sniffing
  xssFilter: false, // Desabilitar filtro XSS do navegador (pode causar problemas)
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginOpenerPolicy: false, // Permitir Socket.IO funcionar
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Não usar nome padrão 'connect.sid' por segurança
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    httpOnly: true, // Prevenir acesso via JavaScript (proteção XSS)
    maxAge: 30 * 60 * 1000, // 30 minutos
    sameSite: 'strict' // Proteção CSRF
  }
}));

// Make io available to routes
app.set('io', io);

// Routes (ANTES dos arquivos estáticos para garantir que as rotas tenham prioridade)
app.use('/auth', authRoutes);
app.use('/api/files', requireAuth, fileRoutes);
app.use('/api/folders', requireAuth, folderRoutes);
app.use('/api/sync', requireAuth, syncRoutes);
app.use('/api/shares', shareRoutes);
app.use('/share', shareRoutes);
app.use('/api/user-shares', userShareRoutes);
app.use('/admin', adminRoutes);

// Home route (deve vir antes dos arquivos estáticos)
app.get('/', requireAuth, (req, res) => {
  res.render('dashboard', {
    user: req.user,
    title: 'Dashboard'
  });
});

// Static files (depois das rotas para não sobrescrever)
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// Setup Socket.IO
setupSocketIO(io);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Página não encontrada',
    error: {}
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso.`);
    console.error(`   Execute: lsof -ti:3000 | xargs kill -9`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
});

