import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Login page
router.get('/login', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Login' });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Username ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username ou senha inválidos' });
    }

    // Create session
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 30 * 60 * 1000); // 30 minutos
    const now = new Date();

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        lastActivity: now
      }
    });

    req.session.token = token;
    res.cookie('sessionToken', token, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000 // 30 minutos
    });

    res.json({ success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.session?.token || req.cookies?.sessionToken;
    
    if (token) {
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    req.session.destroy();
    res.clearCookie('sessionToken');
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

export default router;

