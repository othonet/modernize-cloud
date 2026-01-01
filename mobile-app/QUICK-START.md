# 🚀 Guia Rápido - App Mobile

## Opções de Desenvolvimento

### 1️⃣ React Native (Recomendado)
**Vantagens:**
- ✅ Uma base de código para Android e iOS
- ✅ Performance nativa
- ✅ Grande comunidade
- ✅ Fácil integração com sua API

**Como começar:**
```bash
# 1. Instalar React Native CLI
npm install -g react-native-cli

# 2. Criar projeto (no diretório pai)
cd ..
npx react-native init ModernizeCloudMobile

# 3. Instalar dependências
cd ModernizeCloudMobile
npm install axios socket.io-client
npm install @react-navigation/native @react-navigation/stack
npm install @react-native-async-storage/async-storage
npm install react-native-document-picker react-native-fs
```

### 2️⃣ Flutter
**Vantagens:**
- ✅ Performance excelente
- ✅ UI consistente
- ✅ Linguagem Dart

**Como começar:**
```bash
# 1. Instalar Flutter
# https://flutter.dev/docs/get-started/install

# 2. Criar projeto
flutter create modernize_cloud_mobile

# 3. Adicionar dependências no pubspec.yaml
# http, socket_io_client, shared_preferences, file_picker
```

### 3️⃣ PWA Melhorado (Mais Rápido)
**Vantagens:**
- ✅ Já temos o PWA funcionando!
- ✅ Apenas melhorar para mobile
- ✅ Não precisa compilar

**O que fazer:**
- Melhorar responsividade mobile
- Adicionar funcionalidades nativas via Capacitor
- Instalar como app nativo

## 📋 Checklist de Implementação

### Fase 1: Setup Básico
- [ ] Criar projeto React Native/Flutter
- [ ] Configurar navegação
- [ ] Configurar cliente HTTP
- [ ] Configurar armazenamento local

### Fase 2: Autenticação
- [ ] Tela de login
- [ ] Integração com API `/auth/login`
- [ ] Armazenar token
- [ ] Verificar autenticação ao iniciar

### Fase 3: Arquivos
- [ ] Listar arquivos (`GET /api/files`)
- [ ] Upload (`POST /api/files/upload`)
- [ ] Download (`GET /api/files/:id/download`)
- [ ] Deletar arquivo

### Fase 4: Pastas
- [ ] Listar pastas
- [ ] Criar pasta
- [ ] Navegar entre pastas
- [ ] Renomear/deletar

### Fase 5: Funcionalidades Avançadas
- [ ] Socket.IO para sync em tempo real
- [ ] Busca de arquivos
- [ ] Visualização de imagens
- [ ] Compartilhamento

## 🔌 Endpoints da API

Sua API já está pronta! Use estes endpoints:

```
POST   /auth/login              # Login
POST   /auth/logout             # Logout
GET    /api/files               # Listar arquivos
POST   /api/files/upload        # Upload (multipart/form-data)
GET    /api/files/:id/download  # Download
PUT    /api/files/:id           # Renomear
DELETE /api/files/:id           # Deletar
GET    /api/folders             # Listar pastas
POST   /api/folders             # Criar pasta
PUT    /api/folders/:id         # Renomear
DELETE /api/folders/:id         # Deletar
```

## 📱 Exemplo de Código

### Login Screen (React Native)
```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authAPI } from '../api/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const result = await authAPI.login(email, password);
      if (result.success) {
        navigation.replace('Dashboard');
      }
    } catch (error) {
      Alert.alert('Erro', error);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}
```

## 🌐 Configuração de Rede

### Descobrir IP do Servidor
```bash
# No servidor
hostname -I
# Retorna: 192.168.1.6
```

### Configurar no App
```javascript
// src/utils/config.js
const SERVER_IP = '192.168.1.6'; // Seu IP
const SERVER_PORT = '3000';
export const API_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
```

## 🎯 Próximos Passos

1. **Escolha a tecnologia** (React Native recomendado)
2. **Crie o projeto** usando os scripts fornecidos
3. **Implemente autenticação** primeiro
4. **Teste na rede local** com seu servidor
5. **Adicione funcionalidades** gradualmente

## 💡 Dica

Comece simples! Implemente login e listagem de arquivos primeiro. Depois adicione upload/download. Por último, adicione as funcionalidades avançadas.

