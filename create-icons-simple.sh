#!/bin/bash

# Script simples para criar ícones básicos do PWA
# Requer ImageMagick: sudo apt-get install imagemagick

echo "🎨 Criando ícones do PWA..."

# Criar diretório se não existir
mkdir -p public/images

# Tamanhos dos ícones
sizes=(72 96 128 144 152 192 384 512)

# Criar um ícone SVG simples
cat > /tmp/icon.svg << 'EOF'
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
EOF

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick não está instalado."
    echo "📦 Para instalar no Ubuntu/Debian:"
    echo "   sudo apt-get install imagemagick"
    echo ""
    echo "📦 Ou use o script Node.js:"
    echo "   npm install sharp --save-dev"
    echo "   node generate-icons.js"
    exit 1
fi

# Gerar ícones em diferentes tamanhos
for size in "${sizes[@]}"; do
    convert /tmp/icon.svg -resize ${size}x${size} public/images/icon-${size}x${size}.png
    echo "✅ Gerado: icon-${size}x${size}.png"
done

# Limpar arquivo temporário
rm /tmp/icon.svg

echo ""
echo "✨ Ícones criados com sucesso em public/images/"

