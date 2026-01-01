# 🚀 Configuração para Servidor 24/7

Este guia explica como configurar o servidor Private Cloud para ficar online 24/7 usando systemd.

## 📋 O que foi configurado

- **Serviço systemd**: O servidor será gerenciado pelo systemd do Linux
- **Inicialização automática**: O servidor inicia automaticamente quando o sistema liga
- **Reinício automático**: Se o servidor cair, ele reinicia automaticamente após 10 segundos
- **Logs centralizados**: Todos os logs são salvos no journalctl do systemd

## 🔧 Instalação

Execute o script de instalação com permissões de administrador:

```bash
sudo ./install-service.sh
```

O script irá:
1. Copiar o arquivo de serviço para `/etc/systemd/system/`
2. Detectar automaticamente o caminho do Node.js
3. Recarregar o systemd
4. Habilitar o serviço para iniciar automaticamente

## 🎮 Comandos de Gerenciamento

### Iniciar o serviço
```bash
sudo systemctl start private-cloud
```

### Parar o serviço
```bash
sudo systemctl stop private-cloud
```

### Reiniciar o serviço
```bash
sudo systemctl restart private-cloud
```

### Ver status do serviço
```bash
sudo systemctl status private-cloud
```

### Ver logs em tempo real
```bash
sudo journalctl -u private-cloud -f
```

### Ver últimas 100 linhas de log
```bash
sudo journalctl -u private-cloud -n 100
```

### Desabilitar inicialização automática
```bash
sudo systemctl disable private-cloud
```

### Desinstalar o serviço
```bash
sudo systemctl stop private-cloud
sudo systemctl disable private-cloud
sudo rm /etc/systemd/system/private-cloud.service
sudo systemctl daemon-reload
```

## ✅ Verificação

Após instalar e iniciar o serviço, verifique se está funcionando:

1. **Verificar status:**
   ```bash
   sudo systemctl status private-cloud
   ```
   Você deve ver `active (running)` em verde.

2. **Verificar se o servidor está respondendo:**
   ```bash
   curl http://localhost:3000
   ```
   (Ajuste a porta se necessário)

3. **Verificar logs:**
   ```bash
   sudo journalctl -u private-cloud -n 50
   ```

## 🔄 Reinício Automático

O serviço está configurado para:
- Reiniciar automaticamente se o processo cair
- Aguardar 10 segundos antes de reiniciar
- Reiniciar infinitamente (sem limite de tentativas)

## 📝 Notas Importantes

- O serviço roda como usuário `othon` (não como root, por segurança)
- Os logs são salvos no journalctl do systemd
- O servidor inicia automaticamente após reiniciar o sistema
- Certifique-se de que a porta configurada (padrão: 3000) está disponível

## 🐛 Solução de Problemas

### Serviço não inicia
1. Verifique os logs: `sudo journalctl -u private-cloud -n 50`
2. Verifique se o Node.js está instalado: `which node`
3. Verifique se a porta está em uso: `sudo netstat -tulpn | grep 3000`

### Serviço reinicia constantemente
1. Verifique os logs para erros: `sudo journalctl -u private-cloud -f`
2. Verifique se todas as dependências estão instaladas
3. Verifique se o arquivo `.env` existe e está configurado corretamente

### Permissões
Se houver problemas de permissão, verifique:
- O usuário `othon` tem acesso ao diretório do projeto
- O usuário `othon` tem permissão para escrever logs/arquivos necessários

