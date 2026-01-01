import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// Get sync events (for point-to-point sync)
router.get('/events', async (req, res) => {
  try {
    const { since } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(since ? {
        createdAt: {
          gt: new Date(since)
        }
      } : {})
    };

    const events = await prisma.syncEvent.findMany({
      where,
      include: {
        file: true,
        folder: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100
    });

    res.json(events);
  } catch (error) {
    console.error('Get sync events error:', error);
    res.status(500).json({ error: 'Erro ao buscar eventos de sincronização' });
  }
});

// Create sync event
router.post('/events', async (req, res) => {
  try {
    const { type, fileId, folderId, metadata } = req.body;

    const event = await prisma.syncEvent.create({
      data: {
        type,
        fileId: fileId || null,
        folderId: folderId || null,
        userId: req.user.id,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Emit to other connected clients
    const io = req.app.get('io');
    io.to(req.user.id).emit('sync:event', event);

    res.json({ success: true, event });
  } catch (error) {
    console.error('Create sync event error:', error);
    res.status(500).json({ error: 'Erro ao criar evento de sincronização' });
  }
});

export default router;

