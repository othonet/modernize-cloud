# Modernize Cloud Mobile App

Aplicativo mobile React Native para acessar sua cloud privada.

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS - apenas macOS)

### Passo a Passo

1. **Criar o projeto:**
```bash
cd ..
./private-cloud/mobile-app-setup.sh
```

2. **Instalar dependências:**
```bash
cd modernize-cloud-mobile
npm install
```

3. **Instalar dependências específicas:**
```bash
npm install axios socket.io-client
npm install @react-navigation/native @react-navigation/stack
npm install @react-native-async-storage/async-storage
npm install react-native-document-picker
npm install react-native-fs
npm install react-native-image-viewing
npm install react-native-share
```

4. **Para Android:**
```bash
cd android
./gradlew clean
cd ..
```

5. **Para iOS:**
```bash
cd ios
pod install
cd ..
```

## ⚙️ Configuração

1. **Configurar IP do servidor:**
   - Edite `src/utils/config.js`
   - Altere `SERVER_IP` para o IP do seu servidor na rede local

2. **Configurar API:**
   - Os arquivos de exemplo estão em `src/api/*.example.js`
   - Renomeie para `.js` e ajuste conforme necessário

## 🏃 Executar

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## 📱 Funcionalidades

- ✅ Login/Autenticação
- ✅ Listar arquivos e pastas
- ✅ Upload de arquivos
- ✅ Download de arquivos
- ✅ Navegação entre pastas
- ✅ Busca
- ✅ Sincronização em tempo real

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
src/
├── api/          # Clientes HTTP e APIs
├── components/    # Componentes reutilizáveis
├── screens/       # Telas do app
├── navigation/    # Configuração de navegação
├── context/       # Context API (Auth, etc)
└── utils/         # Utilitários e helpers
```

## 📡 Conectando na Rede Local

O app precisa estar na mesma rede Wi-Fi do servidor.

1. Descubra o IP do servidor:
```bash
hostname -I
# ou
ip addr show
```

2. Configure no app em `src/utils/config.js`

3. Teste a conexão:
```bash
# No celular, teste se consegue acessar:
http://SEU_IP:3000
```

## 🐛 Troubleshooting

**Erro de conexão:**
- Verifique se o servidor está rodando
- Verifique se o IP está correto
- Verifique se estão na mesma rede Wi-Fi
- Desative firewall temporariamente para teste

**Erro de build Android:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Erro de build iOS:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

