import express from 'express';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Create share link for file
router.post('/files/:id/share', requireAuth, async (req, res) => {
  try {
    const { password, expiresInDays, maxDownloads } = req.body;
    
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      // Garantir que a senha seja tratada da mesma forma que na verificação
      const cleanPassword = password.trim();
      hashedPassword = await bcrypt.hash(cleanPassword, 10);
    }

    const share = await prisma.fileShare.create({
      data: {
        fileId: file.id,
        token,
        password: hashedPassword,
        expiresAt,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        downloadCount: 0
      }
    });

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;

    res.json({ 
      success: true, 
      share: {
        id: share.id,
        token: share.token,
        url: shareUrl,
        expiresAt: share.expiresAt,
        maxDownloads: share.maxDownloads,
        hasPassword: !!share.password
      }
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Erro ao criar compartilhamento' });
  }
});

// Get file shares
router.get('/files/:id/shares', requireAuth, async (req, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const shares = await prisma.fileShare.findMany({
      where: {
        fileId: file.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const sharesWithUrls = shares.map(share => ({
      id: share.id,
      token: share.token,
      url: `${req.protocol}://${req.get('host')}/share/${share.token}`,
      expiresAt: share.expiresAt,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount,
      hasPassword: !!share.password,
      createdAt: share.createdAt
    }));

    res.json(sharesWithUrls);
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({ error: 'Erro ao buscar compartilhamentos' });
  }
});

// Delete share
router.delete('/shares/:id', requireAuth, async (req, res) => {
  try {
    const share = await prisma.fileShare.findUnique({
      where: { id: req.params.id },
      include: { file: true }
    });

    if (!share) {
      return res.status(404).json({ error: 'Compartilhamento não encontrado' });
    }

    if (share.file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este compartilhamento' });
    }

    await prisma.fileShare.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ error: 'Erro ao deletar compartilhamento' });
  }
});

// Access shared file (public route, no auth required)
router.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const share = await prisma.fileShare.findUnique({
      where: { token },
      include: { file: true }
    });

    if (!share) {
      return res.status(404).render('error', {
        message: 'Link de compartilhamento não encontrado',
        error: {}
      });
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).render('error', {
        message: 'Este link de compartilhamento expirou',
        error: {}
      });
    }

    // Check max downloads
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      return res.status(410).render('error', {
        message: 'Limite de downloads atingido para este link',
        error: {}
      });
    }

    // Check password
    if (share.password) {
      if (!password) {
        // Show password form
        return res.render('share/password', {
          title: 'Senha necessária',
          token: token
        });
      }

      const passwordMatch = await bcrypt.compare(password, share.password);
      if (!passwordMatch) {
        return res.render('share/password', {
          title: 'Senha necessária',
          token: token,
          error: 'Senha incorreta'
        });
      }
    }

    // Increment download count
    await prisma.fileShare.update({
      where: { id: share.id },
      data: { downloadCount: share.downloadCount + 1 }
    });

    // Redirect to download
    res.redirect(`/api/files/${share.fileId}/download`);
  } catch (error) {
    console.error('Access share error:', error);
    res.status(500).render('error', {
      message: 'Erro ao acessar arquivo compartilhado',
      error: {}
    });
  }
});

export default router;

