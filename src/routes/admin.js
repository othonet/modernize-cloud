import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';
import os from 'os';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const router = express.Router();

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Get statistics
    const totalUsers = await prisma.user.count();
    const totalFiles = await prisma.file.count();
    const totalFolders = await prisma.folder.count();
    const adminUsers = await prisma.user.count({ where: { isAdmin: true } });
    
    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true
      }
    });

    res.render('admin/dashboard', {
      title: 'Painel Administrativo',
      user: req.user,
      stats: {
        totalUsers,
        totalFiles,
        totalFolders,
        adminUsers
      },
      recentUsers
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar painel administrativo',
      error: {}
    });
  }
});

// List all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            files: true,
            folders: true
          }
        }
      }
    });

    res.render('admin/users', {
      title: 'Gerenciar Usuários',
      users,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar usuários',
      error: {}
    });
  }
});

// Create user page
router.get('/users/new', requireAdmin, (req, res) => {
  res.render('admin/user-form', {
    title: 'Novo Usuário',
    user: req.user,
    editingUser: null
  });
});

// Edit user page
router.get('/users/:id/edit', requireAdmin, async (req, res) => {
  try {
    const editingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        isAdmin: true
      }
    });

    if (!editingUser) {
      return res.status(404).render('error', {
        message: 'Usuário não encontrado',
        error: {}
      });
    }

    res.render('admin/user-form', {
      title: 'Editar Usuário',
      user: req.user,
      editingUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar usuário',
      error: {}
    });
  }
});

// Create user
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { email, username, password, name, isAdmin } = req.body;

    // Validate
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    // Validar formato de username
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({ error: 'Username deve conter apenas letras, números, underscore (_) ou hífen (-)' });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username já existe' });
    }

    // Check if email already exists (only if email is provided)
    if (email && email.trim() !== '') {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'Email já existe' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email && email.trim() !== '' ? email : null,
        username,
        password: hashedPassword,
        name: name || username,
        isAdmin: isAdmin === 'on' || isAdmin === true
      }
    });

    res.json({ success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { email, username, password, name, isAdmin } = req.body;
    const userId = req.params.id;

    // Validate username
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username é obrigatório' });
    }

    // Validar formato de username
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({ error: 'Username deve conter apenas letras, números, underscore (_) ou hífen (-)' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if username is already taken by another user
    const duplicateUsername = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          { username }
        ]
      }
    });

    if (duplicateUsername) {
      return res.status(400).json({ error: 'Username já está em uso' });
    }

    // Check if email is already taken by another user (only if email is provided)
    if (email && email.trim() !== '') {
      const duplicateEmail = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { email }
          ]
        }
      });

      if (duplicateEmail) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    // Prepare update data
    const updateData = {
      email: email && email.trim() !== '' ? email : null,
      username,
      name: name || username,
      isAdmin: isAdmin === 'on' || isAdmin === true
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({ success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Metrics page
router.get('/metrics', requireAdmin, (req, res) => {
  res.render('admin/metrics', {
    title: 'Métricas do Sistema',
    user: req.user
  });
});

// Get system metrics API (Raspberry Pi)
router.get('/metrics/api', requireAdmin, async (req, res) => {
  try {
    const metrics = {
      temperature: null,
      cpu: {
        usage: null,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      storage: {
        external: null
      },
      timestamp: new Date().toISOString()
    };

    // Get CPU temperature (Raspberry Pi)
    try {
      const tempPath = '/sys/class/thermal/thermal_zone0/temp';
      const tempData = await fs.readFile(tempPath, 'utf-8');
      const tempCelsius = parseInt(tempData.trim()) / 1000;
      metrics.temperature = {
        celsius: tempCelsius.toFixed(2),
        fahrenheit: ((tempCelsius * 9/5) + 32).toFixed(2)
      };
    } catch (error) {
      console.warn('Could not read temperature:', error.message);
      metrics.temperature = { error: 'Não disponível' };
    }

    // Get CPU usage (requires two measurements, so we'll get a snapshot)
    try {
      // First measurement
      const cpus1 = os.cpus();
      const times1 = cpus1.map(cpu => ({
        user: cpu.times.user,
        nice: cpu.times.nice,
        sys: cpu.times.sys,
        idle: cpu.times.idle,
        irq: cpu.times.irq
      }));

      // Wait a bit for second measurement
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second measurement
      const cpus2 = os.cpus();
      const times2 = cpus2.map(cpu => ({
        user: cpu.times.user,
        nice: cpu.times.nice,
        sys: cpu.times.sys,
        idle: cpu.times.idle,
        irq: cpu.times.irq
      }));

      // Calculate usage
      let totalUsage = 0;
      for (let i = 0; i < cpus1.length; i++) {
        const t1 = times1[i];
        const t2 = times2[i];
        
        const total1 = t1.user + t1.nice + t1.sys + t1.idle + t1.irq;
        const total2 = t2.user + t2.nice + t2.sys + t2.idle + t2.irq;
        
        const totalDiff = total2 - total1;
        const idleDiff = t2.idle - t1.idle;
        
        if (totalDiff > 0) {
          const usage = 100 - (100 * idleDiff / totalDiff);
          totalUsage += usage;
        }
      }
      
      metrics.cpu.usage = (totalUsage / cpus1.length).toFixed(2);
    } catch (error) {
      console.warn('Could not calculate CPU usage:', error.message);
      metrics.cpu.usage = null;
    }

    // Get external storage (HD Externo)
    try {
      const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
      
      // Try to get storage info using df command for more accurate external drive info
      try {
        const { stdout } = await execAsync(`df -h "${uploadDir}" | tail -1`);
        const parts = stdout.trim().split(/\s+/);
        
        if (parts.length >= 5) {
          const total = parts[1];
          const used = parts[2];
          const available = parts[3];
          const percentage = parts[4].replace('%', '');
          const mountPoint = parts[5] || uploadDir;

          metrics.storage.external = {
            total,
            used,
            available,
            percentage: parseFloat(percentage),
            mountPoint,
            totalBytes: null,
            usedBytes: null,
            freeBytes: null
          };

          // Try to get exact bytes using statfs
          try {
            const { stdout: dfOutput } = await execAsync(`df -B1 "${uploadDir}" | tail -1`);
            const dfParts = dfOutput.trim().split(/\s+/);
            if (dfParts.length >= 4) {
              metrics.storage.external.totalBytes = parseInt(dfParts[1]);
              metrics.storage.external.usedBytes = parseInt(dfParts[2]);
              metrics.storage.external.freeBytes = parseInt(dfParts[3]);
            }
          } catch (err) {
            // Fallback: use fs.statfs if available (Node.js 18+)
            try {
              const stats = await fs.statfs(uploadDir);
              metrics.storage.external.totalBytes = stats.blocks * stats.bsize;
              metrics.storage.external.freeBytes = stats.bavail * stats.bsize;
              metrics.storage.external.usedBytes = metrics.storage.external.totalBytes - metrics.storage.external.freeBytes;
            } catch (statfsError) {
              console.warn('Could not get exact storage bytes:', statfsError.message);
            }
          }
        }
      } catch (dfError) {
        // Fallback: try to use fs.statfs directly
        try {
          const stats = await fs.statfs(uploadDir);
          const totalBytes = stats.blocks * stats.bsize;
          const freeBytes = stats.bavail * stats.bsize;
          const usedBytes = totalBytes - freeBytes;
          const percentage = ((usedBytes / totalBytes) * 100).toFixed(2);

          const formatBytes = (bytes) => {
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
          };

          metrics.storage.external = {
            total: formatBytes(totalBytes),
            used: formatBytes(usedBytes),
            available: formatBytes(freeBytes),
            percentage: parseFloat(percentage),
            mountPoint: uploadDir,
            totalBytes,
            usedBytes,
            freeBytes
          };
        } catch (statfsError) {
          console.warn('Could not get storage info:', statfsError.message);
          metrics.storage.external = { error: 'Não disponível' };
        }
      }
    } catch (error) {
      console.warn('Could not get external storage:', error.message);
      metrics.storage.external = { error: 'Não disponível' };
    }

    // Format memory values
    const formatBytes = (bytes) => {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 B';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    };

    metrics.memory.totalFormatted = formatBytes(metrics.memory.total);
    metrics.memory.freeFormatted = formatBytes(metrics.memory.free);
    metrics.memory.usedFormatted = formatBytes(metrics.memory.used);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Erro ao obter métricas do sistema' });
  }
});

export default router;

