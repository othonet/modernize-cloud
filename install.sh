#!/bin/bash

echo "🚀 Instalando Modernize Cloud..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Install dependencies
echo "📦 Instalando dependências..."
npm install

echo ""
echo "📝 Configurando banco de dados..."
echo ""
echo "Por favor, configure o arquivo .env com suas credenciais do MySQL:"
echo "  DATABASE_URL=\"mysql://usuario:senha@localhost:3306/private_cloud\""
echo ""
read -p "Pressione Enter após configurar o .env..."

# Generate Prisma client
echo ""
echo "🔧 Gerando cliente Prisma..."
npm run prisma:generate

# Run migrations
echo ""
echo "🗄️  Executando migrações do banco de dados..."
npm run prisma:migrate

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Em um terminal, execute: npm run build:css"
echo "2. Em outro terminal, execute: npm run dev"
echo "3. Acesse: http://localhost:3000"
echo ""

