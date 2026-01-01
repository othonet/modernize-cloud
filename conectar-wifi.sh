#!/bin/bash

# Script para conectar o Raspberry Pi à rede WiFi "JR TELECOM - LINUX"

echo "📶 Configurando conexão WiFi: JR TELECOM - LINUX"
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo"
    echo "   Execute: sudo ./conectar-wifi.sh"
    exit 1
fi

# Habilitar gerenciamento do wlan0 pelo NetworkManager
echo "🔧 Habilitando gerenciamento do WiFi pelo NetworkManager..."
nmcli device set wlan0 managed yes

# Aguardar um pouco para o NetworkManager processar
sleep 2

# Verificar se o dispositivo está sendo gerenciado
DEVICE_STATE=$(nmcli device status | grep wlan0 | awk '{print $3}')
if [ "$DEVICE_STATE" = "unmanaged" ]; then
    echo "⚠️  Dispositivo ainda não gerenciado. Tentando reiniciar NetworkManager..."
    systemctl restart NetworkManager
    sleep 3
    nmcli device set wlan0 managed yes
    sleep 2
fi

# Verificar se a conexão já existe
if nmcli connection show "JR TELECOM - LINUX" &>/dev/null; then
    echo "⚠️  Conexão já existe. Removendo para recriar..."
    nmcli connection delete "JR TELECOM - LINUX"
    sleep 1
fi

# Verificar se wlan0 está disponível e gerenciado
WLAN_STATE=$(nmcli device status | grep wlan0 | awk '{print $3}')
if [ "$WLAN_STATE" = "unmanaged" ]; then
    echo "❌ Erro: wlan0 não está sendo gerenciado pelo NetworkManager"
    echo "   Tentando forçar gerenciamento..."
    nmcli device set wlan0 managed yes
    sleep 2
fi

# Criar nova conexão WiFi
echo "📡 Criando conexão WiFi..."
nmcli connection add \
    type wifi \
    con-name "JR TELECOM - LINUX" \
    ifname wlan0 \
    ssid "JR TELECOM - LINUX" \
    wifi-sec.key-mgmt wpa-psk \
    wifi-sec.psk "linux2024@#" \
    connection.autoconnect yes

if [ $? -eq 0 ]; then
    echo "✅ Conexão criada com sucesso!"
    
    # Verificar se a conexão está associada ao dispositivo correto
    echo "🔍 Verificando associação da conexão..."
    CONN_IFACE=$(nmcli connection show "JR TELECOM - LINUX" | grep "connection.interface-name" | awk '{print $2}')
    if [ "$CONN_IFACE" != "wlan0" ]; then
        echo "⚠️  Corrigindo interface da conexão..."
        nmcli connection modify "JR TELECOM - LINUX" connection.interface-name wlan0
    fi
    
    # Conectar à rede
    echo "🔌 Conectando à rede..."
    nmcli connection up "JR TELECOM - LINUX" ifname wlan0
    
    if [ $? -eq 0 ]; then
        echo "✅ Conectado com sucesso!"
        echo ""
        echo "📊 Status da conexão:"
        sleep 2
        nmcli device status | grep wlan0
        echo ""
        echo "🌐 IP atribuído:"
        ip addr show wlan0 | grep "inet " | awk '{print $2}'
        echo ""
        echo "📡 Informações da rede:"
        nmcli connection show "JR TELECOM - LINUX" | grep -E "802-11-wireless.ssid|802-11-wireless-security.key-mgmt|ipv4.method"
    else
        echo "❌ Erro ao conectar. Verifique a senha e se a rede está disponível."
        echo ""
        echo "Para verificar redes disponíveis:"
        echo "   nmcli device wifi list"
    fi
else
    echo "❌ Erro ao criar conexão WiFi"
    exit 1
fi

echo ""
echo "📝 Comandos úteis:"
echo "   Ver status:        nmcli device status"
echo "   Ver conexões:      nmcli connection show"
echo "   Desconectar:       nmcli connection down 'JR TELECOM - LINUX'"
echo "   Conectar:          nmcli connection up 'JR TELECOM - LINUX'"
echo "   Ver redes:         nmcli device wifi list"
echo ""

