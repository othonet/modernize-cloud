/**
 * Script para gerar ícones do PWA
 * 
 * Instale as dependências necessárias:
 * npm install sharp --save-dev
 * 
 * Execute: node generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'images');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG do ícone (nuvem com seta para cima)
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#grad)"/>
  <g transform="translate(256, 256)">
    <!-- Nuvem -->
    <path d="M-80,-40 Q-100,-60 -120,-60 Q-140,-60 -160,-40 Q-180,-20 -180,0 Q-180,20 -160,40 Q-140,60 -120,60 Q-100,60 -80,40 Q-60,20 -60,0 Q-60,-20 -80,-40 Z" fill="white" opacity="0.9"/>
    <!-- Seta para cima -->
    <path d="M0,-100 L-20,-60 L-10,-60 L-10,-20 L10,-20 L10,-60 L20,-60 Z" fill="white"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Gerando ícones do PWA...\n');

  for (const size of sizes) {
    try {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(Buffer.from(iconSvg))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Gerado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✨ Ícones gerados com sucesso!');
}

// Verificar se sharp está instalado
try {
  generateIcons();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n❌ Erro: sharp não está instalado.');
    console.log('\n📦 Para instalar, execute:');
    console.log('   npm install sharp --save-dev\n');
    process.exit(1);
  } else {
    throw error;
  }
}

