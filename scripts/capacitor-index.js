#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const indexFile = path.join(publicDir, 'index.html');
const capacitorIndexFile = path.join(rootDir, '.capacitor-index.html');

const command = process.argv[2];

if (command === 'create') {
  // Criar index.html para o Capacitor
  if (fs.existsSync(capacitorIndexFile)) {
    fs.copyFileSync(capacitorIndexFile, indexFile);
    console.log('✅ index.html criado para o Capacitor');
  } else {
    // Criar um index.html básico
    fs.writeFileSync(indexFile, `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modernize Cloud</title>
</head>
<body>
    <!-- Arquivo temporário para o Capacitor -->
</body>
</html>`);
    console.log('✅ index.html criado para o Capacitor');
  }
} else if (command === 'remove') {
  // Remover index.html após o sync
  if (fs.existsSync(indexFile)) {
    fs.unlinkSync(indexFile);
    console.log('✅ index.html removido (não é necessário para o servidor Express)');
  }
} else {
  console.log('Uso: node scripts/capacitor-index.js [create|remove]');
  process.exit(1);
}

