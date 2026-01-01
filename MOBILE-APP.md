# Modernize Cloud - Aplicativo Mobile

## 📱 Visão Geral

Aplicativo mobile nativo para Android e iOS que se conecta à sua cloud privada na rede local.

## 🎯 Tecnologias Recomendadas

### Opção 1: React Native (Recomendado)
- ✅ Uma base de código para Android e iOS
- ✅ Performance nativa
- ✅ Grande comunidade e bibliotecas
- ✅ Fácil integração com APIs REST
- ✅ Suporte a Socket.IO para sincronização em tempo real

### Opção 2: Flutter
- ✅ Performance excelente
- ✅ UI consistente entre plataformas
- ✅ Linguagem Dart

### Opção 3: Ionic/Capacitor
- ✅ Reutiliza código web
- ✅ Mais fácil se já conhece web
- ⚠️ Performance um pouco inferior

## 🚀 Estrutura do Projeto React Native

```
modernize-cloud-mobile/
├── src/
│   ├── api/
│   │   ├── client.js          # Cliente HTTP configurado
│   │   ├── auth.js            # Autenticação
│   │   ├── files.js           # Upload/download de arquivos
│   │   └── folders.js         # Gerenciamento de pastas
│   ├── components/
│   │   ├── FileItem.js
│   │   ├── FolderItem.js
│   │   ├── UploadButton.js
│   │   └── FileViewer.js
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── FilesScreen.js
│   │   └── UploadScreen.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── context/
│   │   └── AuthContext.js
│   └── utils/
│       ├── storage.js
│       └── config.js
├── App.js
└── package.json
```

## 📋 Funcionalidades

### ✅ Implementar
- [x] Login/Autenticação
- [x] Listar arquivos e pastas
- [x] Upload de arquivos
- [x] Download de arquivos
- [x] Criar/renomear/deletar pastas
- [x] Navegação entre pastas
- [x] Busca de arquivos
- [x] Sincronização em tempo real (Socket.IO)
- [x] Visualização de imagens
- [x] Compartilhamento de arquivos

### 🔮 Futuro
- [ ] Sincronização offline
- [ ] Upload em background
- [ ] Notificações push
- [ ] Compartilhamento de links
- [ ] Visualização de documentos (PDF, etc)

## 🔌 Integração com API

### Endpoints Disponíveis

**Autenticação:**
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

**Arquivos:**
- `GET /api/files` - Listar arquivos
- `POST /api/files/upload` - Upload
- `GET /api/files/:id/download` - Download
- `PUT /api/files/:id` - Renomear
- `DELETE /api/files/:id` - Deletar

**Pastas:**
- `GET /api/folders` - Listar pastas
- `POST /api/folders` - Criar pasta
- `PUT /api/folders/:id` - Renomear
- `DELETE /api/folders/:id` - Deletar

**Sincronização:**
- `GET /api/sync/events` - Eventos de sync
- Socket.IO para eventos em tempo real

## 🔐 Autenticação

O app mobile usará:
- Token de sessão (cookie ou header)
- Armazenamento seguro local (AsyncStorage/Keychain)
- Refresh automático de token

## 📡 Configuração de Rede

O app precisa:
- Detectar IP do servidor na rede local
- Permitir configuração manual do IP
- Suportar HTTP para desenvolvimento local
- Suportar HTTPS para produção

## 🛠️ Próximos Passos

1. Criar projeto React Native
2. Configurar navegação
3. Implementar autenticação
4. Integrar com API
5. Implementar upload/download
6. Adicionar Socket.IO para sync
7. Testar em dispositivos reais

