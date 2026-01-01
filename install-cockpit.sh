#!/bin/bash

# Script para instalar o Cockpit - Painel de Gerenciamento Web

echo "🚀 Instalando Cockpit - Painel de Gerenciamento Web"
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo"
    echo "   Execute: sudo ./install-cockpit.sh"
    exit 1
fi

# Atualizar repositórios
echo "📦 Atualizando repositórios..."
apt update

# Instalar Cockpit e módulos principais
echo "🔧 Instalando Cockpit e módulos..."
apt install -y cockpit cockpit-system cockpit-networkmanager cockpit-storaged

# Instalar módulos opcionais úteis
echo "📦 Instalando módulos opcionais..."
apt install -y cockpit-docker cockpit-sosreport 2>/dev/null || echo "   (Alguns módulos opcionais não disponíveis, continuando...)"

# Habilitar e iniciar o Cockpit
echo "🚀 Habilitando e iniciando Cockpit..."
systemctl enable cockpit.socket
systemctl start cockpit.socket

# Aguardar um pouco para o serviço iniciar
sleep 2

# Verificar status
echo ""
echo "📊 Status do Cockpit:"
systemctl status cockpit.socket --no-pager -l | head -15

# Obter IP do servidor
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Cockpit instalado com sucesso!"
echo ""
echo "🌐 Acesse o Cockpit em:"
echo "   https://${IP}:9090"
echo "   ou"
echo "   https://localhost:9090"
echo ""
echo "🔐 Use suas credenciais de usuário do sistema Linux para fazer login"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver status:     sudo systemctl status cockpit.socket"
echo "   Ver logs:       sudo journalctl -u cockpit.socket -f"
echo "   Reiniciar:      sudo systemctl restart cockpit.socket"
echo "   Parar:          sudo systemctl stop cockpit.socket"
echo ""
echo "🎯 No Cockpit, você poderá:"
echo "   - Gerenciar o serviço private-cloud (iniciar/parar/reiniciar)"
echo "   - Ver logs do sistema e serviços"
echo "   - Monitorar CPU, memória, disco e rede"
echo "   - Gerenciar usuários e permissões"
echo ""

