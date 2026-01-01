#!/bin/bash

# Script para instalar e configurar o serviço systemd do Private Cloud

echo "🔧 Instalando serviço systemd do Private Cloud..."

# Copiar arquivo de serviço
sudo cp /home/othon/private-cloud/private-cloud.service /etc/systemd/system/

# Recarregar systemd
sudo systemctl daemon-reload

# Parar qualquer processo manual que esteja rodando
echo "🛑 Parando processos manuais..."
pkill -f "node.*server.js" || true
sleep 2

# Iniciar serviço
echo "🚀 Iniciando serviço..."
sudo systemctl restart private-cloud.service

# Habilitar para iniciar automaticamente no boot
sudo systemctl enable private-cloud.service

# Aguardar um pouco e verificar status
sleep 3
echo ""
echo "📊 Status do serviço:"
sudo systemctl status private-cloud.service --no-pager -l | head -20

echo ""
echo "✅ Serviço instalado e configurado!"
echo ""
echo "Comandos úteis:"
echo "  - Ver status: sudo systemctl status private-cloud.service"
echo "  - Ver logs: sudo journalctl -u private-cloud.service -f"
echo "  - Reiniciar: sudo systemctl restart private-cloud.service"
echo "  - Parar: sudo systemctl stop private-cloud.service"
echo "  - Iniciar: sudo systemctl start private-cloud.service"
