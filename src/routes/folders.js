import express from 'express';
import prisma from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = express.Router();

// Get folders
router.get('/', async (req, res) => {
  try {
    const { parentId, all } = req.query;
    
    // Se all=true, retornar todas as pastas do usuário (para árvore completa)
    if (all === 'true') {
      const folders = await prisma.folder.findMany({
        where: {
          userId: req.user.id
        },
        include: {
          _count: {
            select: {
              files: true,
              children: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return res.json(folders);
    }
    
    // Comportamento padrão: retornar apenas pastas do parentId especificado
    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: parentId || null
      },
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pastas' });
  }
});

// Get folder breadcrumb path
router.get('/breadcrumb/:id', async (req, res) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Build breadcrumb path by parsing the path
    const breadcrumbPath = [];
    const pathParts = folder.path.split('/').filter(p => p);
    
    // Get all folders in the path hierarchy
    if (pathParts.length > 0) {
      const pathQueries = pathParts.map((part, index) => {
        const pathToMatch = '/' + pathParts.slice(0, index + 1).join('/');
        return prisma.folder.findFirst({
          where: {
            userId: req.user.id,
            path: pathToMatch
          },
          select: {
            id: true,
            name: true,
            path: true,
            color: true
          }
        });
      });
      
      const foldersInPath = await Promise.all(pathQueries);
      breadcrumbPath.push(...foldersInPath.filter(f => f !== null));
    }

    res.json({ folder, breadcrumbPath });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ error: 'Erro ao buscar pasta' });
  }
});

// Create folder
router.post('/', async (req, res) => {
  try {
    const { name, parentId, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da pasta é obrigatório' });
    }

    // Build path
    let path = `/${name}`;
    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: req.user.id
        }
      });
      if (parent) {
        path = `${parent.path}/${name}`;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        path,
        parentId: parentId || null,
        userId: req.user.id,
        color: color || 'yellow-400'
      },
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('folder:created', folder);

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Create folder error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Pasta já existe neste local' });
    }
    res.status(500).json({ error: 'Erro ao criar pasta' });
  }
});

// Update folder (rename or change color)
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    const updateData = {};
    if (name && name !== folder.name) {
      // Update path if name changed
      const pathParts = folder.path.split('/').filter(p => p);
      pathParts[pathParts.length - 1] = name;
      updateData.name = name;
      updateData.path = '/' + pathParts.join('/');
    }
    if (color) {
      updateData.color = color;
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({ success: true, folder });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: updateData,
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('folder:updated', updatedFolder);

    res.json({ success: true, folder: updatedFolder });
  } catch (error) {
    console.error('Update folder error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe uma pasta com este nome neste local' });
    }
    res.status(500).json({ error: 'Erro ao atualizar pasta' });
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const { force } = req.query; // force=true para deletar recursivamente
    
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        files: true,
        children: true
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    const filesCount = folder.files.length;
    const childrenCount = folder.children.length;

    // Check if folder has files or subfolders
    if ((filesCount > 0 || childrenCount > 0) && force !== 'true') {
      const errorMessage = `Pasta não está vazia. Contém ${filesCount} arquivo(s) e ${childrenCount} subpasta(s). Use force=true para deletar recursivamente.`;
      console.log(`⚠️ Tentativa de deletar pasta não vazia: ${folder.name} (${filesCount} arquivos, ${childrenCount} subpastas)`);
      return res.status(400).json({ 
        error: errorMessage,
        filesCount,
        childrenCount,
        requiresForce: true
      });
    }

    // Se force=true, deletar recursivamente
    if (force === 'true' && (filesCount > 0 || childrenCount > 0)) {
      console.log(`🗑️ Deletando pasta recursivamente: ${folder.name} (${filesCount} arquivos, ${childrenCount} subpastas)`);
      
      // Deletar todos os arquivos da pasta
      if (filesCount > 0) {
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
        
        for (const file of folder.files) {
          // Deletar arquivo físico
          let filePath;
          if (file.path.startsWith('/uploads/')) {
            const relativePath = file.path.replace(/^\/uploads\//, '');
            filePath = path.join(uploadDir, relativePath);
          } else if (file.path.startsWith('uploads/')) {
            const relativePath = file.path.replace(/^uploads\//, '');
            filePath = path.join(uploadDir, relativePath);
          } else {
            filePath = path.join(uploadDir, file.path);
          }
          
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.warn('File not found on disk:', err);
          }
        }
        
        // Deletar arquivos do banco (cascade vai deletar automaticamente, mas vamos garantir)
        await prisma.file.deleteMany({
          where: { folderId: folder.id }
        });
      }
      
      // Deletar subpastas recursivamente
      if (childrenCount > 0) {
        // Função auxiliar para deletar subpasta recursivamente
        const deleteSubfolderRecursive = async (subfolderId) => {
          const subfolder = await prisma.folder.findUnique({
            where: { id: subfolderId },
            include: {
              files: true,
              children: true
            }
          });
          
          if (!subfolder) return;
          
          const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
          
          // Deletar arquivos da subpasta
          if (subfolder.files.length > 0) {
            for (const file of subfolder.files) {
              let filePath;
              if (file.path.startsWith('/uploads/')) {
                const relativePath = file.path.replace(/^\/uploads\//, '');
                filePath = path.join(uploadDir, relativePath);
              } else if (file.path.startsWith('uploads/')) {
                const relativePath = file.path.replace(/^uploads\//, '');
                filePath = path.join(uploadDir, relativePath);
              } else {
                filePath = path.join(uploadDir, file.path);
              }
              
              try {
                await fs.unlink(filePath);
              } catch (err) {
                console.warn('File not found on disk:', err);
              }
            }
            
            await prisma.file.deleteMany({
              where: { folderId: subfolder.id }
            });
          }
          
          // Deletar subpastas recursivamente
          if (subfolder.children.length > 0) {
            for (const child of subfolder.children) {
              await deleteSubfolderRecursive(child.id);
            }
          }
          
          // Deletar a subpasta
          await prisma.folder.delete({
            where: { id: subfolder.id }
          });
        };
        
        for (const child of folder.children) {
          await deleteSubfolderRecursive(child.id);
        }
      }
    }

    // Deletar a pasta
    await prisma.folder.delete({
      where: { id: folder.id }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('folder:deleted', { id: folder.id });

    res.json({ success: true, deletedFiles: filesCount, deletedFolders: childrenCount });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Erro ao deletar pasta' });
  }
});

// Move folder to another parent
router.post('/:id/move', async (req, res) => {
  try {
    const { parentId } = req.body; // null para raiz
    
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Não permitir mover pasta para dentro de si mesma ou de suas subpastas
    if (parentId) {
      const targetFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: req.user.id
        },
        include: {
          children: true
        }
      });

      if (!targetFolder) {
        return res.status(404).json({ error: 'Pasta de destino não encontrada' });
      }

      // Verificar se está tentando mover para dentro de si mesma
      if (parentId === folder.id) {
        return res.status(400).json({ error: 'Não é possível mover uma pasta para dentro de si mesma' });
      }

      // Verificar se está tentando mover para dentro de uma subpasta
      const isDescendant = await checkIfDescendant(folder.id, parentId, req.user.id);
      if (isDescendant) {
        return res.status(400).json({ error: 'Não é possível mover uma pasta para dentro de suas subpastas' });
      }

      // Verificar se já existe pasta com mesmo nome no destino
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          parentId: parentId,
          name: folder.name,
          id: { not: folder.id }
        }
      });

      if (existingFolder) {
        return res.status(400).json({ error: 'Já existe uma pasta com este nome na pasta de destino' });
      }
    } else {
      // Verificar se já existe pasta com mesmo nome na raiz
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          parentId: null,
          name: folder.name,
          id: { not: folder.id }
        }
      });

      if (existingFolder) {
        return res.status(400).json({ error: 'Já existe uma pasta com este nome na raiz' });
      }
    }

    // Atualizar parentId e path
    let newPath;
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId: req.user.id }
      });
      newPath = parentFolder.path ? `${parentFolder.path}/${folder.name}` : folder.name;
    } else {
      newPath = folder.name;
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: { 
        parentId: parentId || null,
        path: newPath
      }
    });

    // Atualizar paths de todas as subpastas recursivamente
    await updateFolderPathsRecursive(folder.id, newPath, req.user.id);

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('folder:updated', updatedFolder);

    res.json({ success: true, folder: updatedFolder });
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ error: 'Erro ao mover pasta' });
  }
});

// Copy folder to another parent
router.post('/:id/copy', async (req, res) => {
  try {
    const { parentId } = req.body; // null para raiz
    
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        files: true,
        children: true
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Verificar se a pasta de destino existe
    if (parentId) {
      const targetFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: req.user.id
        }
      });

      if (!targetFolder) {
        return res.status(404).json({ error: 'Pasta de destino não encontrada' });
      }

      // Verificar se já existe pasta com mesmo nome
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          parentId: parentId,
          name: folder.name
        }
      });

      if (existingFolder) {
        return res.status(400).json({ error: 'Já existe uma pasta com este nome na pasta de destino' });
      }
    }

    // Copiar pasta recursivamente
    const newFolder = await copyFolderRecursive(folder, parentId, req.user.id);

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('folder:created', newFolder);

    res.json({ success: true, folder: newFolder });
  } catch (error) {
    console.error('Copy folder error:', error);
    res.status(500).json({ error: 'Erro ao copiar pasta' });
  }
});

// Helper function to check if a folder is a descendant
async function checkIfDescendant(folderId, potentialParentId, userId) {
  if (!potentialParentId) return false;
  
  let currentId = potentialParentId;
  const visited = new Set();
  
  while (currentId) {
    if (visited.has(currentId)) break; // Evitar loops
    visited.add(currentId);
    
    if (currentId === folderId) {
      return true; // Encontrou a pasta como ancestral
    }
    
    const folder = await prisma.folder.findFirst({
      where: { id: currentId, userId },
      select: { parentId: true }
    });
    
    if (!folder || !folder.parentId) {
      break;
    }
    
    currentId = folder.parentId;
  }
  
  return false;
}

// Helper function to update folder paths recursively
async function updateFolderPathsRecursive(folderId, basePath, userId) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    include: { children: true }
  });

  if (!folder) return;

  for (const child of folder.children) {
    const childPath = `${basePath}/${child.name}`;
    await prisma.folder.update({
      where: { id: child.id },
      data: { path: childPath }
    });
    await updateFolderPathsRecursive(child.id, childPath, userId);
  }
}

// Helper function to copy folder recursively
async function copyFolderRecursive(folder, newParentId, userId) {
  // Criar nova pasta
  let newPath;
  if (newParentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: { id: newParentId, userId }
    });
    newPath = parentFolder.path ? `${parentFolder.path}/${folder.name}` : folder.name;
  } else {
    newPath = folder.name;
  }

  const newFolder = await prisma.folder.create({
    data: {
      name: folder.name,
      path: newPath,
      parentId: newParentId || null,
      userId: userId,
      color: folder.color
    }
  });

  // Copiar arquivos
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
  for (const file of folder.files) {
    // Ler arquivo original
    let filePath;
    if (file.path.startsWith('/uploads/')) {
      const relativePath = file.path.replace(/^\/uploads\//, '');
      filePath = path.join(uploadDir, relativePath);
    } else if (file.path.startsWith('uploads/')) {
      const relativePath = file.path.replace(/^uploads\//, '');
      filePath = path.join(uploadDir, relativePath);
    } else {
      filePath = path.join(uploadDir, file.path);
    }

    try {
      await fs.access(filePath);
      
      // Criar cópia
      const newFileId = uuidv4();
      const fileExtension = path.extname(file.originalName);
      const newFileName = `${newFileId}${fileExtension}`;
      const userDir = path.join(uploadDir, userId);
      const newFilePath = path.join(userDir, newFileName);

      await fs.copyFile(filePath, newFilePath);

      const fileBuffer = await fs.readFile(newFilePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const relativePath = `/uploads/${userId}/${newFileName}`;
      await prisma.file.create({
        data: {
          id: newFileId,
          name: newFileName,
          originalName: file.originalName,
          path: relativePath,
          size: BigInt(fileBuffer.length),
          mimeType: file.mimeType,
          folderId: newFolder.id,
          userId: userId,
          hash
        }
      });
    } catch (err) {
      console.warn('File not found, skipping:', file.originalName);
    }
  }

  // Copiar subpastas recursivamente
  const children = await prisma.folder.findMany({
    where: { parentId: folder.id, userId }
  });

  for (const child of children) {
    await copyFolderRecursive(child, newFolder.id, userId);
  }

  return newFolder;
}

export default router;

