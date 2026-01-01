#!/bin/bash

# Script para iniciar o servidor 24/7 usando systemd

echo "🚀 Configurando servidor para rodar 24/7..."
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo"
    echo "   Execute: sudo ./start-24-7.sh"
    exit 1
fi

# Detectar o caminho do Node.js
NODE_PATH=$(which node 2>/dev/null || /usr/bin/which node 2>/dev/null || command -v node 2>/dev/null)

if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

echo "✅ Node.js encontrado em: $NODE_PATH"

# Atualizar o caminho no arquivo de serviço se necessário
SERVICE_FILE="/etc/systemd/system/private-cloud.service"
if [ -f "$SERVICE_FILE" ]; then
    # Atualizar o caminho do Node.js no serviço
    sed -i "s|ExecStart=.*node|ExecStart=$NODE_PATH|" "$SERVICE_FILE"
    echo "✅ Arquivo de serviço atualizado"
fi

# Recarregar systemd
echo "🔄 Recarregando systemd..."
systemctl daemon-reload

# Habilitar o serviço para iniciar automaticamente
echo "✅ Habilitando inicialização automática..."
systemctl enable private-cloud.service

# Parar qualquer processo Node.js manual que esteja rodando
echo "🛑 Parando processos manuais..."
pkill -f "node.*server\.js" 2>/dev/null || true
sleep 2

# Iniciar o serviço
echo "🚀 Iniciando serviço..."
systemctl start private-cloud.service

# Aguardar um pouco e verificar status
sleep 2
echo ""
echo "📊 Status do serviço:"
systemctl status private-cloud.service --no-pager -l | head -15

echo ""
echo "✅ Servidor configurado para rodar 24/7!"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver status:          sudo systemctl status private-cloud"
echo "   Ver logs:            sudo journalctl -u private-cloud -f"
echo "   Reiniciar:           sudo systemctl restart private-cloud"
echo "   Parar:               sudo systemctl stop private-cloud"
echo ""

