# 🚀 Início Rápido - PWA no Android

## ⚡ Opção Mais Rápida: PWA no Navegador

### 1. No seu Android, abra o Chrome/Edge e acesse:
```
http://192.168.1.6:3000
```

### 2. Instalar como PWA:
- Toque no menu (⋮) → **"Adicionar à tela inicial"**
- Ou aguarde o banner "Instalar app"

### 3. Pronto! ✅
O app aparecerá na tela inicial como um app normal.

---

## 🔧 Opção Completa: App Nativo

### Pré-requisitos:
1. **Java JDK 17+**
   ```bash
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Android Studio** (ou Android SDK)
   - Baixe: https://developer.android.com/studio
   - Configure `ANDROID_HOME`:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

### Passos:

#### 1. Sincronizar:
```bash
npm run cap:sync
```

#### 2. Abrir Android Studio:
```bash
npm run cap:android
```

#### 3. Build APK:
No Android Studio:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 4. Instalar no dispositivo:
```bash
# Via USB:
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou copie o APK para o dispositivo e instale manualmente
```

---

## ⚙️ Configuração Atual

- **IP do Servidor**: `192.168.1.6:3000`
- **Permissões**: Internet, Câmera, Armazenamento
- **Status**: Pronto para build

---

## 🔍 Verificar se Funciona

1. **Servidor acessível?**
   No Android, abra: `http://192.168.1.6:3000`
   Deve mostrar a tela de login.

2. **Mesmo Wi-Fi?**
   O dispositivo Android precisa estar na mesma rede Wi-Fi.

3. **Firewall?**
   Certifique-se que a porta 3000 está aberta.

---

## 📱 Teste Rápido

1. Abra o navegador no Android
2. Acesse: `http://192.168.1.6:3000`
3. Se funcionar, instale como PWA
4. Se quiser funcionalidades nativas, compile o app

---

## 💡 Dica

Para **teste rápido**: Use PWA no navegador  
Para **funcionalidades completas**: Compile o app nativo

