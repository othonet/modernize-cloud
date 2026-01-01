# 📶 Configurar WiFi pelo Menu do DietPi

O DietPi tem um menu de configuração integrado que facilita muito a configuração do WiFi.

## 🎯 Método 1: Menu Interativo do DietPi (Recomendado)

### Acessar o Menu

Execute no terminal:

```bash
sudo dietpi-config
```

### Navegar até a Configuração WiFi

1. No menu principal, selecione:
   - **Network Options: Adapters** (Opções de Rede: Adaptadores)
   - ou
   - **Network Options: WiFi** (Opções de Rede: WiFi)

2. Selecione **wlan0** como interface WiFi

3. Escolha uma das opções:
   - **Scan for WiFi networks** (Escanear redes WiFi)
   - **Enter WiFi SSID manually** (Inserir SSID WiFi manualmente)

4. Se escolher escanear:
   - Aguarde a lista de redes aparecer
   - Selecione **"JR TELECOM - LINUX"**

5. Se escolher inserir manualmente:
   - Digite: `JR TELECOM - LINUX`

6. Quando solicitado, digite a senha:
   - `linux2024@#`

7. Confirme as configurações

8. O DietPi irá:
   - Salvar a configuração
   - Tentar conectar automaticamente
   - Configurar para conectar automaticamente no boot

## 🎯 Método 2: Via Arquivo de Configuração

O DietPi também permite configurar via arquivo `/boot/dietpi.txt`:

```bash
sudo nano /boot/dietpi.txt
```

Procure pelas linhas relacionadas a WiFi e configure:

```
aWIFI_SSID[0]='JR TELECOM - LINUX'
aWIFI_KEY[0]='linux2024@#'
aWIFI_COUNTRY_CODE='BR'
```

Depois, execute:

```bash
sudo dietpi-config
```

E selecione **"Apply DietPi settings"** ou reinicie o sistema.

## 🎯 Método 3: Via dietpi-wifi

Alguns sistemas DietPi têm um utilitário específico:

```bash
sudo dietpi-wifi
```

Este comando abre um menu específico para configuração WiFi.

## ✅ Verificar Conexão

Após configurar, verifique:

```bash
# Ver status da conexão
nmcli device status

# Ver IP atribuído
ip addr show wlan0

# Testar conectividade
ping -c 3 8.8.8.8
```

## 🔄 Reiniciar Serviço de Rede (se necessário)

Se a conexão não funcionar imediatamente:

```bash
sudo systemctl restart NetworkManager
# ou
sudo ifdown wlan0 && sudo ifup wlan0
```

## 📝 Notas Importantes

- O menu `dietpi-config` é a forma mais segura e recomendada
- As configurações são salvas automaticamente
- A conexão será restaurada automaticamente no boot
- Você pode manter o cabo ethernet conectado - o sistema usará a melhor conexão disponível

## 🆘 Solução de Problemas

Se o WiFi não conectar após configurar:

1. Verifique se o WiFi está habilitado:
   ```bash
   sudo dietpi-config
   # Vá em: Advanced Options > WiFi
   ```

2. Verifique se a senha está correta (especialmente caracteres especiais)

3. Verifique se a rede está no alcance:
   ```bash
   sudo iwlist wlan0 scan | grep -i "JR.*LINUX"
   ```

4. Reinicie o NetworkManager:
   ```bash
   sudo systemctl restart NetworkManager
   ```

