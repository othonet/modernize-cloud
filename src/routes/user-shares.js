import express from 'express';
import prisma from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Share file with user
router.post('/files/:id/share-with-user', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar se usuário existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível compartilhar arquivo com você mesmo' });
    }

    // Verificar se já está compartilhado
    const existingShare = await prisma.fileShareUser.findUnique({
      where: {
        fileId_sharedWithUserId: {
          fileId: file.id,
          sharedWithUserId: userId
        }
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Arquivo já está compartilhado com este usuário' });
    }

    const share = await prisma.fileShareUser.create({
      data: {
        fileId: file.id,
        sharedWithUserId: userId,
        sharedByUserId: req.user.id
      },
      include: {
        sharedWith: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      share: {
        id: share.id,
        sharedWith: share.sharedWith,
        createdAt: share.createdAt
      }
    });
  } catch (error) {
    console.error('Share with user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Arquivo já está compartilhado com este usuário' });
    }
    res.status(500).json({ error: 'Erro ao compartilhar arquivo' });
  }
});

// Get users that file is shared with
router.get('/files/:id/shared-with', requireAuth, async (req, res) => {
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

    const shares = await prisma.fileShareUser.findMany({
      where: {
        fileId: file.id
      },
      include: {
        sharedWith: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(shares.map(share => ({
      id: share.id,
      user: share.sharedWith,
      createdAt: share.createdAt
    })));
  } catch (error) {
    console.error('Get shared with error:', error);
    res.status(500).json({ error: 'Erro ao buscar compartilhamentos' });
  }
});

// Remove share with user (can be called by file owner or by user who received the share)
router.delete('/files/:id/share-with-user/:shareId', requireAuth, async (req, res) => {
  try {
    const share = await prisma.fileShareUser.findUnique({
      where: { id: req.params.shareId },
      include: {
        file: true
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Compartilhamento não encontrado' });
    }

    // Verificar se o shareId corresponde ao fileId
    if (share.fileId !== req.params.id) {
      return res.status(404).json({ error: 'Compartilhamento não encontrado para este arquivo' });
    }

    // Verificar se o usuário é o dono do arquivo OU se recebeu o compartilhamento
    const isFileOwner = share.file.userId === req.user.id;
    const isShareReceiver = share.sharedWithUserId === req.user.id;

    if (!isFileOwner && !isShareReceiver) {
      return res.status(403).json({ error: 'Sem permissão para remover este compartilhamento' });
    }

    await prisma.fileShareUser.delete({
      where: { id: req.params.shareId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove share error:', error);
    res.status(500).json({ error: 'Erro ao remover compartilhamento' });
  }
});

// Get files shared with me
router.get('/shared-with-me', requireAuth, async (req, res) => {
  try {
    const shares = await prisma.fileShareUser.findMany({
      where: {
        sharedWithUserId: req.user.id
      },
      include: {
        file: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        sharedBy: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const files = shares.map(share => ({
      ...share.file,
      size: typeof share.file.size === 'bigint' ? Number(share.file.size) : share.file.size,
      sharedBy: share.sharedBy,
      shareId: share.id
    }));

    res.json(files);
  } catch (error) {
    console.error('Get shared with me error:', error);
    res.status(500).json({ error: 'Erro ao buscar arquivos compartilhados' });
  }
});

// Access shared file
router.get('/shared/:shareId/access', requireAuth, async (req, res) => {
  try {
    const share = await prisma.fileShareUser.findUnique({
      where: { id: req.params.shareId },
      include: {
        file: true
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Compartilhamento não encontrado' });
    }

    if (share.sharedWithUserId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para acessar este arquivo' });
    }

    // Redirect to download
    res.json({ 
      success: true, 
      downloadUrl: `/api/files/${share.fileId}/download`,
      file: {
        ...share.file,
        size: typeof share.file.size === 'bigint' ? Number(share.file.size) : share.file.size
      }
    });
  } catch (error) {
    console.error('Access shared file error:', error);
    res.status(500).json({ error: 'Erro ao acessar arquivo compartilhado' });
  }
});

// Get all users (for sharing)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id } // Excluir o próprio usuário
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true
      },
      orderBy: {
        username: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

export default router;

