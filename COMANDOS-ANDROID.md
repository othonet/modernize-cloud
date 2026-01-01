# 📱 Comandos Úteis - Android

## 🔧 Comandos Principais

### Sincronizar Capacitor
```bash
npm run cap:sync
```
Sincroniza o código web com o projeto Android.

### Abrir Android Studio
```bash
npm run cap:android
```
Abre o projeto Android no Android Studio.

### Build Completo
```bash
npm run cap:build
```
Compila CSS e sincroniza com Capacitor.

---

## 🛠️ Comandos Android Studio

### Build APK (Debug)
No Android Studio:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

Ou via linha de comando:
```bash
cd android
./gradlew assembleDebug
```

### Build APK (Release)
```bash
cd android
./gradlew assembleRelease
```

### Limpar Build
```bash
cd android
./gradlew clean
```

---

## 📲 Instalação no Dispositivo

### Via USB (ADB)
```bash
# Verificar dispositivos conectados
adb devices

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Reinstalar (se já estiver instalado)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Desinstalar
adb uninstall com.modernize.cloud
```

### Via Transferência
1. Copie o APK para o dispositivo
2. Abra o arquivo no dispositivo
3. Permita "Instalar de fontes desconhecidas"
4. Instale

---

## 🔍 Verificações

### Verificar IP do Servidor
```bash
hostname -I
```

### Testar Servidor
```bash
curl http://localhost:3000
```

### Verificar Capacitor
```bash
npx cap doctor
```

### Verificar Java
```bash
java -version
```

### Verificar Android SDK
```bash
echo $ANDROID_HOME
```

---

## 🐛 Troubleshooting

### Porta 3000 em uso
```bash
lsof -ti:3000 | xargs kill -9
```

### Limpar cache do Capacitor
```bash
rm -rf android/app/src/main/assets/public
npm run cap:sync
```

### Reinstalar dependências
```bash
rm -rf node_modules package-lock.json
npm install
npm run cap:sync
```

### Ver logs do Android
```bash
adb logcat | grep -i "capacitor\|modernize"
```

---

## 📋 Scripts NPM Disponíveis

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desenvolvimento (watch)
npm run cap:sync       # Sincronizar Capacitor
npm run cap:android    # Abrir Android Studio
npm run cap:ios        # Abrir Xcode (macOS)
npm run cap:build      # Build completo
npm run build:css      # Compilar CSS
```

---

## 🎯 Fluxo de Trabalho

### Desenvolvimento
```bash
# 1. Fazer alterações no código
# 2. Compilar CSS (se necessário)
npm run build:css

# 3. Sincronizar com Capacitor
npm run cap:sync

# 4. Abrir Android Studio
npm run cap:android

# 5. Build e testar
```

### Teste Rápido (PWA)
```bash
# 1. Iniciar servidor
npm start

# 2. No Android, acesse:
# http://192.168.1.6:3000

# 3. Instale como PWA
```

---

## 💡 Dicas

1. **Desenvolvimento**: Use PWA no navegador para testes rápidos
2. **Produção**: Compile o app nativo para funcionalidades completas
3. **IP Dinâmico**: Se o IP mudar, atualize `capacitor.config.json`
4. **Hot Reload**: Use `npm run dev` para desenvolvimento com auto-reload

