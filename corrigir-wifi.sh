#!/bin/bash

# Script para corrigir e conectar WiFi quando NetworkManager não gerencia automaticamente

echo "🔧 Corrigindo configuração WiFi..."
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo"
    echo "   Execute: sudo ./corrigir-wifi.sh"
    exit 1
fi

# Remover conexão existente se houver
if nmcli connection show "JR TELECOM - LINUX" &>/dev/null; then
    echo "🗑️  Removendo conexão existente..."
    nmcli connection delete "JR TELECOM - LINUX"
fi

# Verificar e corrigir configuração do NetworkManager
echo "🔍 Verificando configuração do NetworkManager..."
if [ -f /etc/NetworkManager/NetworkManager.conf ]; then
    # Verificar se há configuração que desabilita gerenciamento
    if grep -q "unmanaged-devices" /etc/NetworkManager/NetworkManager.conf; then
        echo "⚠️  Encontrada configuração que pode estar bloqueando o WiFi"
    fi
fi

# Forçar gerenciamento do wlan0
echo "🔧 Forçando gerenciamento do wlan0..."
nmcli device set wlan0 managed yes

# Reiniciar NetworkManager se necessário
echo "🔄 Reiniciando NetworkManager..."
systemctl restart NetworkManager
sleep 3

# Verificar status novamente
echo "📊 Status após correção:"
nmcli device status | grep wlan0

# Tentar criar conexão novamente
echo ""
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
    echo "✅ Conexão criada!"
    
    # Garantir que está associada ao wlan0
    nmcli connection modify "JR TELECOM - LINUX" connection.interface-name wlan0
    
    # Conectar
    echo "🔌 Conectando..."
    nmcli connection up "JR TELECOM - LINUX" ifname wlan0
    
    if [ $? -eq 0 ]; then
        echo "✅ Conectado com sucesso!"
        sleep 3
        echo ""
        echo "📊 Status final:"
        nmcli device status | grep wlan0
        echo ""
        ip addr show wlan0 | grep "inet " | awk '{print "🌐 IP: " $2}'
    else
        echo "❌ Erro ao conectar. Verificando redes disponíveis..."
        echo ""
        nmcli device wifi list | head -10
    fi
else
    echo "❌ Erro ao criar conexão"
fi

echo ""
echo "💡 Se ainda não funcionar, tente:"
echo "   1. Verificar se o WiFi está habilitado: rfkill list"
echo "   2. Habilitar WiFi: sudo rfkill unblock wifi"
echo "   3. Verificar se a rede está visível: nmcli device wifi list"
echo ""

