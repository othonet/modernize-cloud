# Configuração do HD Externo

## ✅ Montagem Automática Configurada

O HD externo está configurado para montar automaticamente na inicialização do sistema.

### Configuração Atual

- **UUID**: `78A7-4532`
- **Ponto de Montagem**: `/mnt/nextcloud_data`
- **Sistema de Arquivos**: exFAT
- **Permissões**: uid=1001 (othon), gid=1001 (othon)
- **Tamanho**: ~932GB

### Entrada no /etc/fstab

```
UUID=78A7-4532 /mnt/nextcloud_data exfat defaults,uid=1001,gid=1001,umask=000 0 0
```

### Verificar Montagem

Para verificar se o HD está montado:

```bash
./verificar-montagem.sh
```

Ou manualmente:

```bash
mountpoint /mnt/nextcloud_data
df -h /mnt/nextcloud_data
```

### Testar Montagem Automática

Para testar se a montagem automática funciona:

```bash
# Desmontar
sudo umount /mnt/nextcloud_data

# Testar montagem automática
sudo mount -a

# Verificar
mountpoint /mnt/nextcloud_data
```

### Diretório de Uploads

Os arquivos da Modernize Cloud são salvos em:
```
/mnt/nextcloud_data/private-cloud/uploads/{user_id}/
```

### Importante

- O HD externo será montado automaticamente na inicialização do sistema
- Se o HD não estiver conectado na inicialização, a montagem falhará silenciosamente
- Para garantir que o HD está montado antes de iniciar a aplicação, use o script `verificar-montagem.sh`

### Solução de Problemas

**HD não monta automaticamente:**
1. Verifique se o UUID está correto: `lsblk -f`
2. Verifique as permissões do diretório: `ls -la /mnt/`
3. Teste a montagem manual: `sudo mount /mnt/nextcloud_data`

**Permissões incorretas:**
- O fstab está configurado para uid=1001 (othon)
- Se precisar mudar, edite `/etc/fstab` e execute `sudo mount -a`

