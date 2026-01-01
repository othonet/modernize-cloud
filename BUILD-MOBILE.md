# 📱 Como Compilar o App Mobile

## ✅ Tudo Pronto!

O app está configurado e pronto para compilar. A versão desktop continua funcionando normalmente!

## 🚀 Compilar para Android

### Pré-requisitos
- Android Studio instalado
- JDK 17+
- Android SDK configurado

### Passos

1. **Sincronizar Capacitor:**
```bash
npm run cap:sync
```

2. **Abrir Android Studio:**
```bash
npm run cap:android
```

3. **No Android Studio:**
   - Aguarde o Gradle sync
   - Conecte um dispositivo Android ou inicie um emulador
   - Clique em "Run" (▶️) ou pressione Shift+F10

4. **Gerar APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - O APK estará em `android/app/build/outputs/apk/`

## 🍎 Compilar para iOS

### Pré-requisitos
- macOS com Xcode instalado
- CocoaPods instalado: `sudo gem install cocoapods`

### Passos

1. **Sincronizar Capacitor:**
```bash
npm run cap:sync
```

2. **Instalar dependências iOS:**
```bash
cd ios/App
pod install
cd ../..
```

3. **Abrir Xcode:**
```bash
npm run cap:ios
```

4. **No Xcode:**
   - Selecione um dispositivo ou simulador
   - Clique em "Run" (▶️) ou pressione Cmd+R

5. **Gerar IPA:**
   - Product → Archive
   - Distribuir App

## 🔧 Configuração de Rede Local

### Para o app acessar o servidor na rede local:

1. **Descubra o IP do servidor:**
```bash
hostname -I
# Exemplo: 192.168.1.6
```

2. **Configure no app:**
   - Edite `capacitor.config.json`
   - Adicione `server.url` com o IP do servidor
   - Ou configure dinamicamente no app

3. **Alternativa - Configuração Dinâmica:**
   - O app pode detectar automaticamente
   - Ou permitir que o usuário configure o IP

## 📋 Checklist de Build

### Android
- [ ] Android Studio instalado
- [ ] Dispositivo/Emulador conectado
- [ ] `npm run cap:sync` executado
- [ ] Permissões configuradas no AndroidManifest.xml
- [ ] APK gerado e testado

### iOS
- [ ] Xcode instalado (macOS)
- [ ] CocoaPods instalado
- [ ] `pod install` executado
- [ ] Certificado de desenvolvimento configurado
- [ ] App testado no simulador/dispositivo

## 🎯 Funcionalidades Testadas

Após compilar, teste:
- [ ] Login funciona
- [ ] Listar arquivos
- [ ] Upload de arquivo
- [ ] Upload via câmera (mobile)
- [ ] Upload via galeria (mobile)
- [ ] Download de arquivo
- [ ] Criar pasta
- [ ] Navegar entre pastas
- [ ] Buscar arquivos
- [ ] Compartilhar arquivo (mobile)

## 🐛 Troubleshooting

### Erro: "Web assets not found"
```bash
npm run cap:sync
```

### Erro: "Plugin not found"
```bash
npm install
npm run cap:sync
```

### Android: Permissões não funcionam
- Verifique `android/app/src/main/AndroidManifest.xml`
- Adicione permissões se necessário

### iOS: Build falha
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

## 📱 Distribuição

### Android (APK)
- Compile o APK
- Distribua via:
  - Google Play Store
  - Download direto
  - F-Droid

### iOS (IPA)
- Requer conta de desenvolvedor Apple ($99/ano)
- Distribua via:
  - App Store
  - TestFlight (beta)
  - Enterprise distribution

## 🔐 Segurança

- ✅ HTTPS recomendado para produção
- ✅ Validação de certificados SSL
- ✅ Permissões mínimas necessárias
- ✅ Armazenamento seguro de tokens

## 💡 Dicas

1. **Desenvolvimento**: Use `npm run dev` e acesse no navegador
2. **Teste Mobile**: Compile e teste em dispositivo real
3. **Debug**: Use Chrome DevTools (Android) ou Safari Web Inspector (iOS)
4. **Performance**: Monitore com React DevTools ou Flipper

