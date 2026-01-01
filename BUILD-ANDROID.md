# 📱 Como Fazer o PWA Funcionar no Android

## 🎯 Opções Disponíveis

Você tem **duas opções** para usar o PWA no Android:

### 1. **PWA no Navegador** (Mais Simples)
- Instalar como PWA diretamente no Chrome/Edge
- Funciona sem compilar
- Funcionalidades web básicas

### 2. **App Nativo com Capacitor** (Recomendado)
- App nativo completo
- Funcionalidades nativas (câmera, galeria, etc.)
- Melhor performance
- Pode ser distribuído na Play Store

---

## 🚀 Opção 1: PWA no Navegador Android

### Passo a Passo:

1. **Acesse no Chrome/Edge do Android:**
   ```
   http://SEU_IP:3000
   ```
   (Substitua SEU_IP pelo IP do seu servidor)

2. **Instalar como PWA:**
   - Toque no menu (3 pontos) → "Adicionar à tela inicial"
   - Ou aparecerá um banner "Instalar app"

3. **Pronto!** O app aparecerá na tela inicial

### ⚠️ Limitações:
- Funcionalidades web apenas
- Sem acesso nativo à câmera/galeria
- Depende do navegador

---

## 🔧 Opção 2: App Nativo Android (Capacitor)

### Pré-requisitos:

1. **Java JDK 17+**
   ```bash
   # Verificar se tem Java
   java -version
   
   # Se não tiver, instale:
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Android Studio** (ou apenas Android SDK)
   - Baixe: https://developer.android.com/studio
   - Instale o Android SDK
   - Configure as variáveis de ambiente:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

3. **Gradle** (geralmente vem com Android Studio)

### Passo a Passo:

#### 1. **Sincronizar com Capacitor:**
```bash
cd /home/othon/private-cloud
npm run cap:sync
```

#### 2. **Abrir no Android Studio:**
```bash
npm run cap:android
```
Isso abrirá o Android Studio automaticamente.

#### 3. **Configurar o Servidor (Importante!)**

O app precisa saber onde está o servidor. Você tem duas opções:

##### **Opção A: Servidor Local (Desenvolvimento)**
Edite `capacitor.config.json`:
```json
{
  "server": {
    "url": "http://192.168.1.XXX:3000",
    "cleartext": true
  }
}
```
(Substitua `192.168.1.XXX` pelo IP do seu servidor)

##### **Opção B: Servidor Remoto (Produção)**
```json
{
  "server": {
    "url": "https://seu-dominio.com",
    "cleartext": false
  }
}
```

Depois de editar, execute:
```bash
npm run cap:sync
```

#### 4. **Configurar Permissões**

O `AndroidManifest.xml` já está configurado, mas verifique se tem:
- Internet
- Câmera
- Armazenamento

#### 5. **Build do APK:**

##### **Via Android Studio:**
1. Abra o projeto no Android Studio
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

##### **Via Linha de Comando:**
```bash
cd android
./gradlew assembleDebug
# APK em: app/build/outputs/apk/debug/app-debug.apk
```

#### 6. **Instalar no Dispositivo:**

##### **Via USB (ADB):**
```bash
# Conecte o dispositivo via USB
# Ative "Depuração USB" nas opções de desenvolvedor

adb devices  # Verificar se o dispositivo aparece
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

##### **Via Transferência de Arquivo:**
1. Copie o APK para o dispositivo
2. Abra o arquivo no dispositivo
3. Permita "Instalar de fontes desconhecidas" se necessário
4. Instale

---

## 🔍 Verificar Configuração Atual

### Ver IP do Servidor:
```bash
hostname -I
# ou
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Testar se o Servidor está Acessível:
No Android, abra o navegador e acesse:
```
http://SEU_IP:3000
```

### Verificar Capacitor:
```bash
npx cap doctor
```

---

## 🛠️ Troubleshooting

### Erro: "Could not find the android platform"
```bash
npm install @capacitor/android
npx cap add android
```

### Erro: "SDK location not found"
Configure o `ANDROID_HOME`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### App não conecta ao servidor
1. Verifique se o IP está correto no `capacitor.config.json`
2. Verifique se o servidor está rodando
3. Verifique se o firewall permite conexões na porta 3000
4. Teste no navegador do Android primeiro

### Permissões não funcionam
Verifique o `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

## 📋 Checklist Rápido

- [ ] Java JDK instalado
- [ ] Android Studio/SDK instalado
- [ ] `ANDROID_HOME` configurado
- [ ] Servidor rodando e acessível
- [ ] IP correto no `capacitor.config.json`
- [ ] `npm run cap:sync` executado
- [ ] Build do APK gerado
- [ ] APK instalado no dispositivo

---

## 🎯 Recomendação

Para **teste rápido**: Use a Opção 1 (PWA no navegador)

Para **uso completo**: Use a Opção 2 (App Nativo)

---

## 📚 Próximos Passos

Depois de funcionar:
- Adicionar ícone do app
- Configurar splash screen
- Assinar o APK para produção
- Publicar na Play Store (opcional)

---

## 💡 Dica

Se você estiver no mesmo Wi-Fi, use o IP local do servidor. Se estiver em redes diferentes, você precisará:
- Configurar port forwarding no roteador, ou
- Usar um serviço como ngrok para expor o servidor

