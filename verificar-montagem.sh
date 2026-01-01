#!/bin/bash
# Script para verificar se o HD externo está montado

echo "🔍 Verificando montagem do HD externo..."
echo ""

if mountpoint -q /mnt/nextcloud_data; then
    echo "✅ HD externo está montado em /mnt/nextcloud_data"
    echo ""
    echo "📊 Informações do HD:"
    df -h /mnt/nextcloud_data
    echo ""
    echo "📁 Diretório da Modernize Cloud:"
    ls -la /mnt/nextcloud_data/private-cloud/uploads/ 2>/dev/null || echo "Diretório ainda não foi criado (será criado no primeiro upload)"
else
    echo "❌ HD externo NÃO está montado!"
    echo ""
    echo "Tentando montar..."
    sudo mount /mnt/nextcloud_data
    if mountpoint -q /mnt/nextcloud_data; then
        echo "✅ Montado com sucesso!"
    else
        echo "❌ Erro ao montar. Verifique o fstab:"
        cat /etc/fstab | grep nextcloud_data
    fi
fi

