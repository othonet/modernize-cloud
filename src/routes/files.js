import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import prisma from '../config/database.js';

// Helper function to convert BigInt to Number for JSON serialization
function serializeFile(file) {
  if (!file) return file;
  return {
    ...file,
    size: typeof file.size === 'bigint' ? Number(file.size) : file.size
  };
}

function serializeFiles(files) {
  if (!Array.isArray(files)) return files;
  return files.map(serializeFile);
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const userDir = path.join(uploadDir, req.user.id);
    await fs.mkdir(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 * 1024 // 10GB default
  }
});

// Get user files
router.get('/', async (req, res) => {
  try {
    const { folderId, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(folderId ? { folderId } : { folderId: null }),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { originalName: { contains: search } }
        ]
      } : {})
    };

    const files = await prisma.file.findMany({
      where,
      include: {
        folder: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(serializeFiles(files));
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Erro ao buscar arquivos' });
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { folderId } = req.body;
    // Salvar caminho relativo para o banco, mas usar caminho absoluto para o arquivo
    const relativePath = `/uploads/${req.user.id}/${req.file.filename}`;
    const filePath = relativePath;
    
    // Calculate file hash
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Check if file already exists (same hash)
    const existingFile = await prisma.file.findFirst({
      where: {
        userId: req.user.id,
        hash,
        folderId: folderId || null
      }
    });

    let file;
    if (existingFile && existingFile.originalName === req.file.originalname) {
      // File already exists, create version instead
      const versionCount = await prisma.fileVersion.count({
        where: { fileId: existingFile.id }
      });

      await prisma.fileVersion.create({
        data: {
          fileId: existingFile.id,
          version: versionCount + 1,
          name: existingFile.name,
          originalName: existingFile.originalName,
          path: existingFile.path,
          size: existingFile.size,
          mimeType: existingFile.mimeType,
          hash: existingFile.hash
        }
      });

      // Update existing file
      file = await prisma.file.update({
        where: { id: existingFile.id },
        data: {
          updatedAt: new Date()
        }
      });
    } else {
      // Create new file
      file = await prisma.file.create({
        data: {
          name: req.file.filename,
          originalName: req.file.originalname,
          path: filePath,
          size: BigInt(req.file.size),
          mimeType: req.file.mimetype,
          folderId: folderId || null,
          userId: req.user.id,
          hash
        }
      });
    }

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:uploaded', serializeFile(file));

    res.json({ success: true, file: serializeFile(file) });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// Download file
router.get('/:id/download', async (req, res) => {
  try {
    // First, check if file belongs to user
    let file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    // If not found, check if file is shared with user
    if (!file) {
      const share = await prisma.fileShareUser.findFirst({
        where: {
          fileId: req.params.id,
          sharedWithUserId: req.user.id
        },
        include: {
          file: true
        }
      });

      if (share) {
        file = share.file;
      }
    }

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Usar UPLOAD_DIR do .env ou fallback para public/uploads
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    
    // Construir caminho correto do arquivo
    // O file.path salvo no banco é no formato: /uploads/userId/filename.ext
    // O multer salva em: uploadDir/userId/filename.ext
    // Precisamos remover /uploads/ e juntar com uploadDir
    let filePath;
    if (file.path.startsWith('/uploads/')) {
      // Remover /uploads/ do início e juntar com uploadDir
      const relativePath = file.path.replace(/^\/uploads\//, '');
      filePath = path.join(uploadDir, relativePath);
    } else if (file.path.startsWith('uploads/')) {
      // Remover uploads/ do início e juntar com uploadDir
      const relativePath = file.path.replace(/^uploads\//, '');
      filePath = path.join(uploadDir, relativePath);
    } else {
      // Se já é um caminho relativo direto (userId/filename.ext)
      filePath = path.join(uploadDir, file.path);
    }
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch (err) {
      console.error('File not found:', filePath);
      if (req.method === 'HEAD') {
        return res.status(404).end();
      }
      return res.status(404).json({ error: 'Arquivo físico não encontrado' });
    }
    
    // Para requisições HEAD, retornar apenas os headers
    if (req.method === 'HEAD') {
      const stats = await fs.stat(filePath);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      return res.status(200).end();
    }
    
    res.download(filePath, file.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro ao baixar arquivo' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo' });
  }
});

// Update file (rename)
router.put('/:id', async (req, res) => {
  try {
    const { originalName } = req.body;
    
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    if (!originalName || originalName === file.originalName) {
      return res.json({ success: true, file: serializeFile(file) });
    }

    // Create version before updating
    const versionCount = await prisma.fileVersion.count({
      where: { fileId: file.id }
    });

    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        version: versionCount + 1,
        name: file.name,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        hash: file.hash
      }
    });

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: { originalName }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:updated', serializeFile(updatedFile));

    res.json({ success: true, file: serializeFile(updatedFile) });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Erro ao renomear arquivo' });
  }
});

// Move file to another folder
router.post('/:id/move', async (req, res) => {
  try {
    const { folderId } = req.body; // null para raiz
    
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar se a pasta de destino existe e pertence ao usuário
    if (folderId) {
      const targetFolder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: req.user.id
        }
      });

      if (!targetFolder) {
        return res.status(404).json({ error: 'Pasta de destino não encontrada' });
      }
    }

    // Verificar se já existe arquivo com mesmo nome na pasta de destino
    const existingFile = await prisma.file.findFirst({
      where: {
        userId: req.user.id,
        folderId: folderId || null,
        originalName: file.originalName,
        id: { not: file.id }
      }
    });

    if (existingFile) {
      return res.status(400).json({ error: 'Já existe um arquivo com este nome na pasta de destino' });
    }

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: { folderId: folderId || null }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:updated', serializeFile(updatedFile));

    res.json({ success: true, file: serializeFile(updatedFile) });
  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({ error: 'Erro ao mover arquivo' });
  }
});

// Copy file to another folder
router.post('/:id/copy', async (req, res) => {
  try {
    const { folderId } = req.body; // null para raiz
    
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar se a pasta de destino existe e pertence ao usuário
    if (folderId) {
      const targetFolder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: req.user.id
        }
      });

      if (!targetFolder) {
        return res.status(404).json({ error: 'Pasta de destino não encontrada' });
      }
    }

    // Ler arquivo do disco
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
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

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch (err) {
      return res.status(404).json({ error: 'Arquivo físico não encontrado' });
    }

    // Criar cópia do arquivo
    const newFileId = uuidv4();
    const fileExtension = path.extname(file.originalName);
    const newFileName = `${newFileId}${fileExtension}`;
    const userDir = path.join(uploadDir, req.user.id);
    const newFilePath = path.join(userDir, newFileName);

    // Copiar arquivo físico
    await fs.copyFile(filePath, newFilePath);

    // Ler arquivo para calcular hash
    const fileBuffer = await fs.readFile(newFilePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Criar registro no banco
    const relativePath = `/uploads/${req.user.id}/${newFileName}`;
    const newFile = await prisma.file.create({
      data: {
        id: newFileId,
        name: newFileName,
        originalName: file.originalName,
        path: relativePath,
        size: BigInt(fileBuffer.length),
        mimeType: file.mimeType,
        folderId: folderId || null,
        userId: req.user.id,
        hash
      }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:uploaded', serializeFile(newFile));

    res.json({ success: true, file: serializeFile(newFile) });
  } catch (error) {
    console.error('Copy file error:', error);
    res.status(500).json({ error: 'Erro ao copiar arquivo' });
  }
});

// Get file versions
router.get('/:id/versions', async (req, res) => {
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

    const versions = await prisma.fileVersion.findMany({
      where: { fileId: file.id },
      orderBy: { version: 'desc' }
    });

    res.json(versions.map(v => ({
      ...v,
      size: typeof v.size === 'bigint' ? Number(v.size) : v.size
    })));
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Erro ao buscar versões' });
  }
});

// Restore file version
router.post('/:id/versions/:versionId/restore', async (req, res) => {
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

    const version = await prisma.fileVersion.findFirst({
      where: {
        id: req.params.versionId,
        fileId: file.id
      }
    });

    if (!version) {
      return res.status(404).json({ error: 'Versão não encontrada' });
    }

    // Create new version from current file before restoring
    const currentVersionNumber = await prisma.fileVersion.count({
      where: { fileId: file.id }
    });

    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        version: currentVersionNumber + 1,
        name: file.name,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        hash: file.hash
      }
    });

    // Restore file from version
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    
    // Get version file path
    let versionFilePath;
    if (version.path.startsWith('/uploads/')) {
      const relativePath = version.path.replace(/^\/uploads\//, '');
      versionFilePath = path.join(uploadDir, relativePath);
    } else {
      versionFilePath = path.join(uploadDir, version.path);
    }

    // Get current file path
    let currentFilePath;
    if (file.path.startsWith('/uploads/')) {
      const relativePath = file.path.replace(/^\/uploads\//, '');
      currentFilePath = path.join(uploadDir, relativePath);
    } else {
      currentFilePath = path.join(uploadDir, file.path);
    }

    // Copy version file to current file location
    await fs.copyFile(versionFilePath, currentFilePath);

    // Update file metadata
    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: {
        originalName: version.originalName,
        hash: version.hash
      }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:updated', serializeFile(updatedFile));

    res.json({ success: true, file: serializeFile(updatedFile) });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ error: 'Erro ao restaurar versão' });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
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

    // Delete physical file
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    // Construir caminho do mesmo jeito que no download
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

    // Delete from database
    await prisma.file.delete({
      where: { id: file.id }
    });

    // Emit sync event
    const io = req.app.get('io');
    io.to(req.user.id).emit('file:deleted', { id: file.id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

// Get file info
router.get('/:id', async (req, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        folder: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.json(serializeFile(file));
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Erro ao buscar arquivo' });
  }
});

export default router;

