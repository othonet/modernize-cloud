import prisma from '../config/database.js';

export const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.session?.token || req.cookies?.sessionToken;
    
    if (!sessionToken) {
      return res.redirect('/auth/login');
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      req.session.destroy();
      res.clearCookie('sessionToken');
      return res.redirect('/auth/login');
    }

    // Verificar inatividade (30 minutos = 1800000 ms)
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    const now = new Date();
    const lastActivity = session.lastActivity || session.createdAt;
    const timeSinceLastActivity = now.getTime() - new Date(lastActivity).getTime();

    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      // Sessão expirada por inatividade
      await prisma.session.deleteMany({
        where: { token: sessionToken }
      });
      req.session.destroy();
      res.clearCookie('sessionToken');
      return res.redirect('/auth/login');
    }

    // Atualizar lastActivity a cada requisição autenticada
    await prisma.session.update({
      where: { token: sessionToken },
      data: { lastActivity: now }
    });

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/auth/login');
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.session?.token || req.cookies?.sessionToken;
    
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });

      if (session && session.expiresAt > new Date()) {
        req.user = session.user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const sessionToken = req.session?.token || req.cookies?.sessionToken;
    
    if (!sessionToken) {
      return res.redirect('/auth/login');
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      req.session.destroy();
      res.clearCookie('sessionToken');
      return res.redirect('/auth/login');
    }

    // Verificar inatividade (30 minutos = 1800000 ms)
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    const now = new Date();
    const lastActivity = session.lastActivity || session.createdAt;
    const timeSinceLastActivity = now.getTime() - new Date(lastActivity).getTime();

    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      // Sessão expirada por inatividade
      await prisma.session.deleteMany({
        where: { token: sessionToken }
      });
      req.session.destroy();
      res.clearCookie('sessionToken');
      return res.redirect('/auth/login');
    }

    // Atualizar lastActivity a cada requisição autenticada
    await prisma.session.update({
      where: { token: sessionToken },
      data: { lastActivity: now }
    });

    if (!session.user.isAdmin) {
      return res.status(403).render('error', {
        message: 'Acesso negado. Você precisa ser administrador para acessar esta área.',
        error: {}
      });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.redirect('/auth/login');
  }
};

