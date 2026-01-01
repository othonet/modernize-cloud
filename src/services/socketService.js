import prisma from '../config/database.js';

export const setupSocketIO = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('sessionToken=')[1]?.split(';')[0];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid or expired session'));
      }

      // Verificar inatividade (10 minutos = 600000 ms)
      const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
      const now = new Date();
      const lastActivity = session.lastActivity || session.createdAt;
      const timeSinceLastActivity = now.getTime() - new Date(lastActivity).getTime();

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Sessão expirada por inatividade
        await prisma.session.deleteMany({
          where: { token }
        });
        return next(new Error('Session expired due to inactivity'));
      }

      // Atualizar lastActivity quando há conexão via socket
      await prisma.session.update({
        where: { token },
        data: { lastActivity: now }
      });

      socket.userId = session.userId;
      socket.user = session.user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Cliente conectado: ${socket.user.username} (${socket.userId})`);

    // Join user's room for sync
    socket.join(socket.userId);

    // Handle file sync
    socket.on('sync:request', async (data) => {
      try {
        const { lastSync } = data;
        
        // Get files and folders that changed since last sync
        const files = await prisma.file.findMany({
          where: {
            userId: socket.userId,
            updatedAt: {
              gt: lastSync ? new Date(lastSync) : new Date(0)
            }
          }
        });

        const folders = await prisma.folder.findMany({
          where: {
            userId: socket.userId,
            updatedAt: {
              gt: lastSync ? new Date(lastSync) : new Date(0)
            }
          }
        });

        socket.emit('sync:response', {
          files,
          folders,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Sync request error:', error);
        socket.emit('sync:error', { message: 'Erro ao sincronizar' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.user.username}`);
    });
  });
};

