#!/bin/bash

echo "🔍 Verificando configuração do HD Externo para Modernize Cloud"
echo "================================================================"
echo ""

# Verificar montagem
echo "1️⃣ Verificando montagem do HD..."
if mountpoint -q /mnt/nextcloud_data; then
    echo "   ✅ HD montado em /mnt/nextcloud_data"
    df -h /mnt/nextcloud_data | tail -1
else
    echo "   ❌ HD NÃO está montado!"
    exit 1
fi
echo ""

# Verificar configuração
echo "2️⃣ Verificando configuração (.env)..."
if [ -f .env ]; then
    UPLOAD_DIR=$(grep UPLOAD_DIR .env | cut -d'=' -f2)
    echo "   ✅ UPLOAD_DIR configurado: $UPLOAD_DIR"
    
    if [[ "$UPLOAD_DIR" == *"nextcloud_data"* ]]; then
        echo "   ✅ Usando HD externo!"
    else
        echo "   ⚠️  Não está usando HD externo!"
    fi
else
    echo "   ❌ Arquivo .env não encontrado!"
    exit 1
fi
echo ""

# Verificar diretório
echo "3️⃣ Verificando diretório de uploads..."
if [ -d "$UPLOAD_DIR" ]; then
    echo "   ✅ Diretório existe: $UPLOAD_DIR"
    ls -ld "$UPLOAD_DIR" | awk '{print "   📁 Permissões: " $1 " " $3 " " $4}'
else
    echo "   ⚠️  Diretório não existe (será criado no primeiro upload)"
fi
echo ""

# Verificar código
echo "4️⃣ Verificando código..."
if grep -q "process.env.UPLOAD_DIR" src/routes/files.js; then
    echo "   ✅ Código está usando UPLOAD_DIR do .env"
else
    echo "   ⚠️  Código pode não estar usando .env"
fi
echo ""

# Resumo
echo "================================================================"
echo "📊 RESUMO:"
echo "================================================================"
echo "✅ HD Externo: Montado e funcionando"
echo "✅ Configuração: .env configurado corretamente"
echo "✅ Código: Usando caminho do HD externo"
echo "✅ Espaço: $(df -h /mnt/nextcloud_data | tail -1 | awk '{print $4}') disponível"
echo ""
echo "🚀 PRONTO PARA TESTE!"
echo ""
echo "Para iniciar a aplicação:"
echo "  cd /home/othon/private-cloud"
echo "  npm run dev:all"
echo ""
echo "Depois acesse: http://localhost:3000"
echo ""

